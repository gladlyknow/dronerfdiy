import { getConfig } from './config';
import { grantCredits } from './credits';
import type { Env } from './env';
import { apiError, apiJson } from './http';
import {
  cancelProviderSubscription,
  createProviderBillingPortal,
  createProviderCheckout,
  retrieveProviderPayment,
  type PaymentOrderType,
  type ProviderName,
  verifyProviderWebhook,
} from './payment-providers';
import { isBoundedText, isRecord, isTrustedWriteOrigin, readJsonBody } from './validation';

type ProductKind = 'free' | 'subscription' | 'credit_pack';
type Product = {
  id: string;
  name: string;
  description: string;
  kind: ProductKind;
  status: 'inactive' | 'active' | 'archived';
  currency: string;
  amount_minor: number;
  interval_unit: 'month' | 'year' | null;
  interval_count: number | null;
  credit_amount: number;
  credit_valid_days: number | null;
  provider_product_ids_json: string;
  metadata_json: string;
};

type Order = {
  id: string;
  order_no: string;
  user_id: string;
  product_id: string | null;
  provider: ProviderName | 'manual';
  provider_session_id: string | null;
  provider_transaction_id: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';
  amount_minor: number;
  currency: string;
  order_type: 'one_time' | 'subscription' | 'credit_pack';
  checkout_url: string | null;
  provider_product_id: string | null;
  description: string;
  payment_email: string | null;
  credits_amount: number;
  credits_valid_days: number | null;
  idempotency_key: string;
  paid_at: number | null;
  created_at: number;
  updated_at: number;
};

type Subscription = {
  id: string;
  user_id: string;
  product_id: string | null;
  provider: ProviderName | 'manual';
  provider_subscription_id: string;
  status: string;
  amount_minor: number;
  currency: string;
  interval_unit: 'month' | 'year';
  interval_count: number;
  cancel_at_period_end: number;
  current_period_end: number | null;
};

type VerifiedEvent = Awaited<ReturnType<typeof verifyProviderWebhook>>;
type SubscriptionPayment = {
  subscriptionId: string | null;
  transactionId: string;
  periodStart: number | null;
  periodEnd: number | null;
};

const providers = ['stripe', 'creem', 'paypal'] as const;
const now = (): number => Date.now();

const timestampValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value < 10_000_000_000 ? value * 1_000 : value);
  }
  if (typeof value !== 'string' || value.length > 100) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nestedRecord = (value: unknown, key: string): Record<string, unknown> | null => (
  isRecord(value) && isRecord(value[key]) ? value[key] : null
);

const deepString = (value: unknown, keys: ReadonlySet<string>): string | null => {
  const queue: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let visited = 0;
  while (queue.length > 0 && visited < 300) {
    const current = queue.shift();
    if (!current || current.depth > 6 || !isRecord(current.value)) continue;
    visited += 1;
    for (const [key, item] of Object.entries(current.value)) {
      if (keys.has(key) && typeof item === 'string' && item.length > 0 && item.length <= 320) {
        return item;
      }
      if (keys.has(key) && isRecord(item) && typeof item.id === 'string') return item.id;
      if (isRecord(item)) queue.push({ value: item, depth: current.depth + 1 });
      if (Array.isArray(item)) {
        for (const child of item.slice(0, 100)) {
          if (isRecord(child)) queue.push({ value: child, depth: current.depth + 1 });
        }
      }
    }
  }
  return null;
};

const subscriptionPayment = (
  provider: ProviderName,
  event: VerifiedEvent,
): SubscriptionPayment | null => {
  const object = isRecord(event.object) ? event.object : null;
  if (!object) return null;
  if (provider === 'stripe') {
    if (event.eventType !== 'invoice.paid') return null;
    const billingReason = typeof object.billing_reason === 'string' ? object.billing_reason : '';
    if (billingReason !== 'subscription_create' && billingReason !== 'subscription_cycle') return null;
    if (typeof object.id !== 'string') return null;
    return {
      subscriptionId: deepString(object, new Set(['subscription', 'subscription_id'])),
      transactionId: object.id,
      periodStart: timestampValue(object.period_start),
      periodEnd: timestampValue(object.period_end),
    };
  }
  if (provider === 'creem') {
    if (event.eventType.toLowerCase() !== 'subscription.paid') return null;
    const subscription = nestedRecord(object, 'subscription')
      ?? (object.object === 'subscription' ? object : null);
    const transactionId = deepString(object, new Set(['last_transaction_id', 'transaction_id']));
    const subscriptionId = subscription && typeof subscription.id === 'string'
      ? subscription.id
      : deepString(object, new Set(['subscription_id']));
    if (!transactionId) return null;
    return {
      subscriptionId,
      transactionId,
      periodStart: timestampValue(subscription?.current_period_start_date),
      periodEnd: timestampValue(subscription?.current_period_end_date),
    };
  }
  if (event.eventType !== 'PAYMENT.SALE.COMPLETED' || typeof object.id !== 'string') return null;
  return {
    subscriptionId: deepString(object, new Set(['billing_agreement_id', 'subscription_id'])),
    transactionId: object.id,
    periodStart: null,
    periodEnd: null,
  };
};

const eventOperationId = async (provider: ProviderName, eventId: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${provider}:${eventId}`),
  );
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `subscription:${provider}:${hex}`;
};

const isProvider = (value: unknown): value is ProviderName => (
  typeof value === 'string' && providers.includes(value as ProviderName)
);

const requestIdIsValid = (value: unknown): value is string => (
  typeof value === 'string' && /^[A-Za-z0-9:_-]{8,160}$/.test(value)
);

const parseJsonObject = (value: string): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => (
      typeof entry[1] === 'string' && entry[1].length <= 320
    )));
  } catch {
    return {};
  }
};

const paymentStatusIsSuccessful = (status: string): boolean => (
  ['paid', 'complete', 'completed', 'success', 'succeeded', 'active', 'approved'].includes(status.toLowerCase())
);

const queryLimit = (url: URL, defaultValue = 30, max = 100): number | null => {
  const value = Number(url.searchParams.get('limit') ?? String(defaultValue));
  return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
};

const publicProduct = (product: Product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  kind: product.kind,
  currency: product.currency,
  amountMinor: product.amount_minor,
  intervalUnit: product.interval_unit,
  intervalCount: product.interval_count,
  creditAmount: product.credit_amount,
  creditValidDays: product.credit_valid_days,
});

const findProduct = async (env: Env, productId: string): Promise<Product | null> => (
  env.DB.prepare(
    `SELECT id, name, description, kind, status, currency, amount_minor,
            interval_unit, interval_count, credit_amount, credit_valid_days,
            provider_product_ids_json, metadata_json
     FROM catalog_product WHERE id = ? AND status = 'active'`,
  )
    .bind(productId)
    .first<Product>()
);

const findProductForSettlement = async (env: Env, productId: string): Promise<Product | null> => (
  env.DB.prepare(
    `SELECT id, name, description, kind, status, currency, amount_minor,
            interval_unit, interval_count, credit_amount, credit_valid_days,
            provider_product_ids_json, metadata_json
     FROM catalog_product WHERE id = ?`,
  )
    .bind(productId)
    .first<Product>()
);

const getOrderByIdempotency = async (
  env: Env,
  userId: string,
  idempotencyKey: string,
): Promise<Order | null> => (
  env.DB.prepare('SELECT * FROM payment_order WHERE user_id = ? AND idempotency_key = ?')
    .bind(userId, idempotencyKey)
    .first<Order>()
);

const getOrderByProviderSession = async (
  env: Env,
  provider: ProviderName,
  providerSessionId: string,
): Promise<Order | null> => (
  env.DB.prepare('SELECT * FROM payment_order WHERE provider = ? AND provider_session_id = ?')
    .bind(provider, providerSessionId)
    .first<Order>()
);

const getOrderByProviderSubscription = async (
  env: Env,
  provider: ProviderName,
  providerSubscriptionId: string,
): Promise<Order | null> => (
  env.DB.prepare(
    `SELECT * FROM payment_order
     WHERE provider = ? AND provider_subscription_id = ?
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(provider, providerSubscriptionId)
    .first<Order>()
);

const sanitizeOrder = (order: Order) => ({
  id: order.id,
  orderNo: order.order_no,
  productId: order.product_id,
  provider: order.provider,
  status: order.status,
  amountMinor: order.amount_minor,
  currency: order.currency,
  orderType: order.order_type,
  checkoutUrl: order.checkout_url,
  creditsAmount: order.credits_amount,
  paidAt: order.paid_at,
  createdAt: order.created_at,
});

const getSubscriptionStatus = (value: unknown): Subscription['status'] => {
  if (typeof value !== 'string') return 'active';
  const normalized = value.toLowerCase();
  if (normalized.includes('cancel')) return 'canceled';
  if (normalized.includes('past_due') || normalized.includes('suspend')) return 'past_due';
  if (normalized.includes('pause')) return 'paused';
  if (normalized.includes('expire')) return 'expired';
  if (normalized.includes('trial')) return 'trialing';
  return 'active';
};

const persistSubscription = async (
  env: Env,
  order: Order,
  subscriptionId: string,
  providerStatus: string,
  providerData: unknown,
): Promise<void> => {
  const product = order.product_id ? await findProductForSettlement(env, order.product_id) : null;
  if (!product || product.kind !== 'subscription' || !product.interval_unit) return;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO billing_subscription
      (id, user_id, product_id, provider, provider_subscription_id, status,
       amount_minor, currency, interval_unit, interval_count, provider_data_json,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, provider_subscription_id) DO UPDATE SET
       status = excluded.status,
       provider_data_json = excluded.provider_data_json,
       updated_at = excluded.updated_at`,
  )
    .bind(
      crypto.randomUUID(),
      order.user_id,
      order.product_id,
      order.provider,
      subscriptionId,
      getSubscriptionStatus(providerStatus),
      order.amount_minor,
      order.currency,
      product.interval_unit,
      product.interval_count ?? 1,
      JSON.stringify(providerData),
      timestamp,
      timestamp,
    )
    .run();
};

const grantOrderCredits = async (env: Env, order: Order): Promise<void> => {
  if (order.credits_amount <= 0) return;
  const expiresAt = order.credits_valid_days && order.credits_valid_days > 0
    ? now() + order.credits_valid_days * 86_400_000
    : null;
  await grantCredits(env, {
    userId: order.user_id,
    amount: order.credits_amount,
    operationId: `payment:${order.id}`,
    transactionNo: `payment:${order.order_no}`,
    sourceType: order.order_type === 'subscription' ? 'subscription' : 'payment',
    sourceId: order.id,
    expiresAt,
    metadataJson: JSON.stringify({ orderNo: order.order_no, productId: order.product_id }),
  });
};

const settleSubscriptionPayment = async (
  env: Env,
  order: Order,
  provider: ProviderName,
  event: VerifiedEvent,
): Promise<void> => {
  if (order.order_type !== 'subscription') return;
  const payment = subscriptionPayment(provider, event);
  if (!payment) return;
  const subscriptionId = payment.subscriptionId ?? order.provider_subscription_id;
  if (!subscriptionId) throw new Error('Subscription payment is missing its subscription identifier.');
  if (order.provider_subscription_id && order.provider_subscription_id !== subscriptionId) {
    throw new Error('Subscription payment does not match the order.');
  }
  const updatedAt = now();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE payment_order
       SET provider_subscription_id = COALESCE(provider_subscription_id, ?), updated_at = ?
       WHERE id = ? AND user_id = ? AND order_type = 'subscription'`,
    ).bind(subscriptionId, updatedAt, order.id, order.user_id),
    env.DB.prepare(
      `UPDATE billing_subscription
       SET status = 'active',
           current_period_start = COALESCE(?, current_period_start),
           current_period_end = COALESCE(?, current_period_end),
           provider_data_json = ?, updated_at = ?
       WHERE provider = ? AND provider_subscription_id = ? AND user_id = ?`,
    ).bind(
      payment.periodStart,
      payment.periodEnd,
      JSON.stringify(event.object),
      updatedAt,
      provider,
      subscriptionId,
      order.user_id,
    ),
  ]);
  if (order.credits_amount <= 0) return;
  const operationId = await eventOperationId(provider, event.eventId);
  const expiresAt = order.credits_valid_days && order.credits_valid_days > 0
    ? updatedAt + order.credits_valid_days * 86_400_000
    : null;
  await grantCredits(env, {
    userId: order.user_id,
    amount: order.credits_amount,
    operationId,
    transactionNo: `txn:${operationId}`,
    sourceType: 'subscription',
    sourceId: subscriptionId,
    expiresAt,
    metadataJson: JSON.stringify({
      eventId: event.eventId,
      provider,
      transactionId: payment.transactionId,
      subscriptionId,
      orderNo: order.order_no,
      productId: order.product_id,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
    }),
  });
};

const synchronizeOrderPayment = async (
  env: Env,
  order: Order,
  sessionId = order.provider_session_id,
): Promise<Order> => {
  if (!sessionId || order.provider === 'manual') return order;
  const payment = await retrieveProviderPayment(
    env,
    order.provider,
    sessionId,
    order.order_type === 'subscription' ? 'subscription' : 'one_time',
  );
  if (payment.amountMinor !== undefined && payment.amountMinor !== order.amount_minor) {
    throw new Error('Provider payment amount does not match the order.');
  }
  if (payment.currency && payment.currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw new Error('Provider payment currency does not match the order.');
  }
  const timestamp = now();
  const successful = paymentStatusIsSuccessful(payment.status);
  const normalizedStatus = payment.status.toLowerCase();
  const nextStatus: Order['status'] = successful
    ? 'paid'
    : normalizedStatus === 'refunded'
      ? 'refunded'
      : ['canceled', 'cancelled'].includes(normalizedStatus)
        ? 'canceled'
        : normalizedStatus === 'failed'
          ? 'failed'
          : 'pending';
  await env.DB.prepare(
    `UPDATE payment_order
     SET status = CASE WHEN status = 'refunded' THEN status ELSE ? END,
         provider_transaction_id = COALESCE(?, provider_transaction_id),
         provider_subscription_id = COALESCE(?, provider_subscription_id),
         provider_customer_id = COALESCE(?, provider_customer_id),
         provider_result_json = ?,
         paid_amount_minor = CASE WHEN ? THEN ? ELSE paid_amount_minor END,
         paid_currency = CASE WHEN ? THEN ? ELSE paid_currency END,
         paid_at = CASE WHEN ? THEN COALESCE(paid_at, ?) ELSE paid_at END,
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      nextStatus,
      payment.transactionId ?? null,
      payment.subscriptionId ?? null,
      payment.customerId ?? null,
      JSON.stringify(payment.raw),
      successful ? 1 : 0,
      payment.amountMinor ?? order.amount_minor,
      successful ? 1 : 0,
      payment.currency ?? order.currency,
      successful ? 1 : 0,
      timestamp,
      timestamp,
      order.id,
    )
    .run();
  const refreshed = await env.DB.prepare('SELECT * FROM payment_order WHERE id = ?').bind(order.id).first<Order>();
  if (!refreshed) throw new Error('Payment order could not be reloaded.');
  if (successful) {
    if (payment.subscriptionId) {
      await persistSubscription(env, refreshed, payment.subscriptionId, payment.status, payment.raw);
    }
    if (refreshed.order_type !== 'subscription') await grantOrderCredits(env, refreshed);
  }
  return refreshed;
};

const createCheckout = async (
  env: Env,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const productId = payload.productId;
  const requestedProvider = payload.provider;
  const requestId = payload.requestId;
  if (!isBoundedText(productId, 160) || !requestIdIsValid(requestId)) {
    return apiError('invalid_request', 'productId and requestId are required.', 400);
  }
  const enabled = await getConfig(env, 'payment_enabled', 'false');
  if (enabled !== 'true') return apiError('payments_disabled', 'Payments are not enabled.', 503);
  const product = await findProduct(env, productId);
  if (!product || product.kind === 'free') return apiError('product_unavailable', 'Product is unavailable.', 404);
  const configuredProvider = await getConfig(env, 'default_payment_provider', 'stripe');
  const provider = isProvider(requestedProvider) ? requestedProvider : isProvider(configuredProvider)
    ? configuredProvider
    : 'stripe';
  if (requestedProvider !== undefined && !isProvider(requestedProvider)) {
    return apiError('invalid_provider', 'Payment provider is invalid.', 400);
  }
  const existing = await getOrderByIdempotency(env, userId, requestId);
  if (existing) return apiJson({ data: { order: sanitizeOrder(existing), checkoutUrl: existing.checkout_url } });

  const providerProductId = parseJsonObject(product.provider_product_ids_json)[provider];
  const orderType: Order['order_type'] = product.kind === 'subscription' ? 'subscription' : 'credit_pack';
  const order: Order = {
    id: crypto.randomUUID(),
    order_no: `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    user_id: userId,
    product_id: product.id,
    provider,
    provider_session_id: null,
    provider_transaction_id: null,
    provider_subscription_id: null,
    provider_customer_id: null,
    status: 'created',
    amount_minor: product.amount_minor,
    currency: product.currency.toUpperCase(),
    order_type: orderType,
    checkout_url: null,
    provider_product_id: providerProductId ?? null,
    description: product.description || product.name,
    payment_email: null,
    credits_amount: product.credit_amount,
    credits_valid_days: product.credit_valid_days,
    idempotency_key: requestId,
    paid_at: null,
    created_at: now(),
    updated_at: now(),
  };
  try {
    await env.DB.prepare(
      `INSERT INTO payment_order
        (id, order_no, user_id, product_id, provider, status, amount_minor, currency,
         order_type, provider_product_id, description, credits_amount, credits_valid_days,
         idempotency_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        order.id, order.order_no, order.user_id, order.product_id, order.provider, order.status,
        order.amount_minor, order.currency, order.order_type, order.provider_product_id,
        order.description, order.credits_amount, order.credits_valid_days, order.idempotency_key,
        order.created_at, order.updated_at,
      )
      .run();
  } catch {
    const retry = await getOrderByIdempotency(env, userId, requestId);
    if (retry) return apiJson({ data: { order: sanitizeOrder(retry), checkoutUrl: retry.checkout_url } });
    return apiError('checkout_conflict', 'Checkout could not be created; retry with the same requestId.', 409);
  }
  try {
    const origin = new URL(env.BETTER_AUTH_URL).origin;
    const callbackBase = `${origin}/api/v1/payments/callback/${provider}?order_no=${encodeURIComponent(order.order_no)}`;
    const successUrl = provider === 'stripe'
      ? `${callbackBase}&session_id={CHECKOUT_SESSION_ID}`
      : callbackBase;
    const cancelUrl = `${callbackBase}&canceled=1`;
    const checkout = await createProviderCheckout(env, provider, {
      orderNo: order.order_no,
      userId,
      description: order.description,
      amountMinor: order.amount_minor,
      currency: order.currency,
      orderType: orderType === 'subscription' ? 'subscription' : 'one_time',
      successUrl,
      cancelUrl,
      providerProductId,
      intervalUnit: product.interval_unit ?? undefined,
      intervalCount: product.interval_count ?? undefined,
    });
    await env.DB.prepare(
      `UPDATE payment_order
       SET status = 'pending', provider_session_id = ?, checkout_url = ?, checkout_json = ?,
           callback_url = ?, updated_at = ?
       WHERE id = ? AND status = 'created'`,
    )
      .bind(checkout.sessionId, checkout.checkoutUrl, JSON.stringify(checkout.raw), successUrl, now(), order.id)
      .run();
    const persisted = await env.DB.prepare('SELECT * FROM payment_order WHERE id = ?').bind(order.id).first<Order>();
    return apiJson({ data: { order: persisted ? sanitizeOrder(persisted) : sanitizeOrder(order), checkoutUrl: checkout.checkoutUrl } }, 201);
  } catch (error) {
    await env.DB.prepare(
      "UPDATE payment_order SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'created'",
    )
      .bind(now(), order.id)
      .run();
    return apiError('checkout_failed', error instanceof Error ? error.message : 'Checkout could not be created.', 502);
  }
};

const listOrders = async (env: Env, userId: string, url: URL): Promise<Response> => {
  const limit = queryLimit(url);
  if (!limit) return apiError('invalid_limit', 'Limit must be an integer between 1 and 100.', 400);
  const rows = await env.DB.prepare(
    'SELECT * FROM payment_order WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
  )
    .bind(userId, limit)
    .all<Order>();
  return apiJson({ data: { orders: rows.results.map(sanitizeOrder) } });
};

const listSubscriptions = async (env: Env, userId: string, url: URL): Promise<Response> => {
  const limit = queryLimit(url);
  if (!limit) return apiError('invalid_limit', 'Limit must be an integer between 1 and 100.', 400);
  const rows = await env.DB.prepare(
    `SELECT id, user_id, product_id, provider, provider_subscription_id, status,
            amount_minor, currency, interval_unit, interval_count,
            cancel_at_period_end, current_period_end
     FROM billing_subscription WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?`,
  )
    .bind(userId, limit)
    .all<Subscription>();
  return apiJson({ data: { subscriptions: rows.results } });
};

const cancelSubscription = async (
  env: Env,
  userId: string,
  subscriptionId: string,
): Promise<Response> => {
  const subscription = await env.DB.prepare('SELECT * FROM billing_subscription WHERE id = ? AND user_id = ?')
    .bind(subscriptionId, userId)
    .first<Subscription>();
  if (!subscription) return apiError('not_found', 'Subscription was not found.', 404);
  if (!isProvider(subscription.provider)) return apiError('unsupported_provider', 'Subscription provider is unavailable.', 409);
  try {
    await cancelProviderSubscription(env, subscription.provider, subscription.provider_subscription_id);
    await env.DB.prepare(
      `UPDATE billing_subscription
       SET status = 'canceled', cancel_at_period_end = 0, canceled_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(now(), now(), subscription.id, userId)
      .run();
    return apiJson({ data: { canceled: true } });
  } catch (error) {
    return apiError('subscription_cancel_failed', error instanceof Error ? error.message : 'Subscription could not be canceled.', 502);
  }
};

const billingPortal = async (
  env: Env,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const subscriptionId = payload.subscriptionId;
  if (!isBoundedText(subscriptionId, 160)) {
    return apiError('invalid_request', 'subscriptionId is required.', 400);
  }
  const subscription = await env.DB.prepare('SELECT * FROM billing_subscription WHERE id = ? AND user_id = ?')
    .bind(subscriptionId, userId)
    .first<Subscription>();
  if (!subscription || !isProvider(subscription.provider)) return apiError('not_found', 'Subscription was not found.', 404);
  const order = await env.DB.prepare(
    `SELECT * FROM payment_order
     WHERE user_id = ? AND provider = ? AND provider_subscription_id = ?
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(userId, subscription.provider, subscription.provider_subscription_id)
    .first<Order>();
  if (!order?.provider_customer_id) return apiJson({ data: { url: null } });
  try {
    const returnUrl = new URL('/account/?section=billing', env.BETTER_AUTH_URL).toString();
    const url = await createProviderBillingPortal(env, subscription.provider, order.provider_customer_id, returnUrl);
    return apiJson({ data: { url } });
  } catch (error) {
    return apiError('billing_portal_failed', error instanceof Error ? error.message : 'Billing portal is unavailable.', 502);
  }
};

const callbackOrder = async (env: Env, url: URL): Promise<Response> => {
  const providerPart = url.pathname.split('/').pop();
  if (!isProvider(providerPart)) return apiError('invalid_provider', 'Payment provider is invalid.', 400);
  const sessionId = url.searchParams.get('session_id') ?? url.searchParams.get('token') ?? url.searchParams.get('checkout_id');
  const orderNo = url.searchParams.get('order_no');
  const order = sessionId
    ? await getOrderByProviderSession(env, providerPart, sessionId)
    : orderNo
      ? await env.DB.prepare('SELECT * FROM payment_order WHERE provider = ? AND order_no = ?')
        .bind(providerPart, orderNo)
        .first<Order>()
      : null;
  if (!order) return apiError('not_found', 'Payment order was not found.', 404);
  try {
    const synced = await synchronizeOrderPayment(env, order, sessionId ?? order.provider_session_id);
    return apiJson({ data: { order: sanitizeOrder(synced) } });
  } catch (error) {
    return apiError('payment_sync_failed', error instanceof Error ? error.message : 'Payment status could not be synchronized.', 502);
  }
};

const webhookReferences = (object: unknown): { orderNo: string | null; ids: string[] } => {
  const ids = new Set<string>();
  const queue: Array<{ value: unknown; depth: number }> = [{ value: object, depth: 0 }];
  let orderNo: string | null = null;
  let visited = 0;
  while (queue.length > 0 && visited < 500) {
    const current = queue.shift();
    if (!current || current.depth > 6 || !isRecord(current.value)) continue;
    visited += 1;
    for (const [key, value] of Object.entries(current.value)) {
      if (
        ['id', 'checkout_id', 'session_id', 'order_id', 'subscription', 'subscription_id',
          'billing_agreement_id', 'payment_intent', 'transaction_id', 'last_transaction_id'].includes(key)
        && typeof value === 'string'
        && value.length > 0
        && value.length <= 320
      ) ids.add(value);
      if (key === 'order_no' && typeof value === 'string' && value.length <= 160) orderNo ??= value;
      if (key === 'custom_id' && typeof value === 'string') {
        orderNo ??= parseJsonObject(value).order_no ?? null;
      }
      if (isRecord(value)) queue.push({ value, depth: current.depth + 1 });
      if (Array.isArray(value)) {
        for (const item of value.slice(0, 100)) {
          if (isRecord(item)) queue.push({ value: item, depth: current.depth + 1 });
        }
      }
    }
  }
  return { orderNo, ids: [...ids] };
};

const findOrderForWebhook = async (
  env: Env,
  provider: ProviderName,
  object: unknown,
): Promise<Order | null> => {
  const references = webhookReferences(object);
  if (references.orderNo) {
    const order = await env.DB.prepare(
      'SELECT * FROM payment_order WHERE order_no = ? AND provider = ?',
    )
      .bind(references.orderNo, provider)
      .first<Order>();
    if (order) return order;
  }
  for (const id of references.ids) {
    const order = await getOrderByProviderSession(env, provider, id)
      ?? await getOrderByProviderSubscription(env, provider, id)
      ?? await env.DB.prepare(
        'SELECT * FROM payment_order WHERE provider = ? AND provider_transaction_id = ?',
      )
        .bind(provider, id)
        .first<Order>();
    if (order) return order;
  }
  return null;
};

const processWebhook = async (
  env: Env,
  request: Request,
  provider: ProviderName,
): Promise<Response> => {
  let event;
  try {
    event = await verifyProviderWebhook(request, env, provider);
  } catch (error) {
    return apiError('invalid_webhook', error instanceof Error ? error.message : 'Webhook verification failed.', 400);
  }
  const receivedAt = now();
  const insert = await env.DB.prepare(
    `INSERT OR IGNORE INTO payment_webhook_event
      (id, provider, event_id, event_type, payload_json, signature_valid, processing_status, received_at)
     VALUES (?, ?, ?, ?, ?, 1, 'received', ?)`,
  )
    .bind(crypto.randomUUID(), provider, event.eventId, event.eventType, event.rawBody, receivedAt)
    .run();
  if (insert.meta.changes === 0) {
    const existing = await env.DB.prepare(
      `SELECT processing_status FROM payment_webhook_event
       WHERE provider = ? AND event_id = ?`,
    )
      .bind(provider, event.eventId)
      .first<{ processing_status: string }>();
    if (existing?.processing_status !== 'failed') {
      return apiJson({ data: { received: true, duplicate: true } });
    }
    const reclaimed = await env.DB.prepare(
      `UPDATE payment_webhook_event
       SET processing_status = 'received', processing_error = NULL, processed_at = NULL
       WHERE provider = ? AND event_id = ? AND processing_status = 'failed'`,
    )
      .bind(provider, event.eventId)
      .run();
    if (reclaimed.meta.changes !== 1) {
      return apiJson({ data: { received: true, duplicate: true } });
    }
  }
  try {
    const order = await findOrderForWebhook(env, provider, event.object);
    if (!order) {
      await env.DB.prepare(
        `UPDATE payment_webhook_event SET processing_status = 'ignored', processed_at = ?
         WHERE provider = ? AND event_id = ?`,
      )
        .bind(now(), provider, event.eventId)
        .run();
      return apiJson({ data: { received: true, matched: false } });
    }
    const canceled = /refund|chargeback/i.test(event.eventType);
    if (canceled) {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE payment_order SET status = 'refunded', updated_at = ?
           WHERE id = ? AND status IN ('paid', 'pending')`,
        ).bind(now(), order.id),
        env.DB.prepare(
          `UPDATE billing_subscription SET status = 'canceled', canceled_at = ?, updated_at = ?
           WHERE provider = ? AND provider_subscription_id = ?`,
        ).bind(now(), now(), provider, order.provider_subscription_id ?? ''),
      ]);
    } else if (/cancel/i.test(event.eventType)) {
      await env.DB.prepare(
        `UPDATE billing_subscription SET status = 'canceled', canceled_at = ?, updated_at = ?
         WHERE provider = ? AND provider_subscription_id = ?`,
      )
        .bind(now(), now(), provider, order.provider_subscription_id ?? '')
        .run();
    } else {
      const synchronized = await synchronizeOrderPayment(env, order, order.provider_session_id);
      await settleSubscriptionPayment(env, synchronized, provider, event);
    }
    await env.DB.prepare(
      `UPDATE payment_webhook_event SET order_id = ?, processing_status = 'processed', processed_at = ?
       WHERE provider = ? AND event_id = ?`,
    )
      .bind(order.id, now(), provider, event.eventId)
      .run();
    return apiJson({ data: { received: true } });
  } catch (error) {
    await env.DB.prepare(
      `UPDATE payment_webhook_event SET processing_status = 'failed', processing_error = ?, processed_at = ?
       WHERE provider = ? AND event_id = ?`,
    )
      .bind(error instanceof Error ? error.message.slice(0, 500) : 'Webhook processing failed.', now(), provider, event.eventId)
      .run();
    return apiError('webhook_processing_failed', 'Webhook was verified but processing failed.', 500);
  }
};

export async function handleCommercePublicApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (url.pathname !== '/api/v1/products' || request.method !== 'GET') {
    return apiError('not_found', 'Unknown public commerce route.', 404);
  }
  const rows = await env.DB.prepare(
    `SELECT id, name, description, kind, status, currency, amount_minor,
            interval_unit, interval_count, credit_amount, credit_valid_days,
            provider_product_ids_json, metadata_json
     FROM catalog_product WHERE status = 'active' ORDER BY amount_minor, name`,
  )
    .all<Product>();
  return apiJson({ data: { products: rows.results.map(publicProduct) } });
}

export async function handleCommerceCallback(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== 'GET') return apiError('method_not_allowed', 'Use GET.', 405);
  const response = await callbackOrder(env, url);
  const destination = new URL('/account/', env.BETTER_AUTH_URL);
  if (response.ok) {
    const payload = await response.clone().json().catch(() => null) as {
      data?: { order?: { status?: string; id?: string } };
    } | null;
    destination.searchParams.set('billing', payload?.data?.order?.status ?? 'pending');
    if (payload?.data?.order?.id) destination.searchParams.set('order', payload.data.order.id);
  } else {
    destination.searchParams.set('billing', 'sync_failed');
  }
  return Response.redirect(destination.toString(), 303);
}

export async function handleCommerceWebhook(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== 'POST') return apiError('method_not_allowed', 'Use POST.', 405);
  const provider = url.pathname.split('/').pop();
  if (!isProvider(provider)) return apiError('invalid_provider', 'Payment provider is invalid.', 400);
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > 1_048_576) {
    return apiError('payload_too_large', 'Webhook payload is too large.', 413);
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 1_048_576) return apiError('payload_too_large', 'Webhook payload is too large.', 413);
  return processWebhook(env, new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: bytes,
  }), provider);
}

export async function handleCommerceApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (!isTrustedWriteOrigin(request)) return apiError('invalid_origin', 'Request origin is not allowed.', 403);
  if (url.pathname === '/api/v1/checkout' && request.method === 'POST') {
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    return isRecord(payload) ? createCheckout(env, userId, payload) : apiError('invalid_body', 'Body must be an object.', 400);
  }
  if (url.pathname === '/api/v1/orders' && request.method === 'GET') return listOrders(env, userId, url);
  if (url.pathname === '/api/v1/subscriptions' && request.method === 'GET') return listSubscriptions(env, userId, url);
  if (url.pathname === '/api/v1/billing-portal' && request.method === 'POST') {
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    return isRecord(payload) ? billingPortal(env, userId, payload) : apiError('invalid_body', 'Body must be an object.', 400);
  }
  const cancelMatch = /^\/api\/v1\/subscriptions\/([^/]+)\/cancel$/.exec(url.pathname);
  if (cancelMatch && request.method === 'POST') {
    return cancelSubscription(env, userId, decodeURIComponent(cancelMatch[1]));
  }
  return apiError('not_found', 'Unknown commerce route.', 404);
}
