import { getConfig } from './config';
import type { Env } from './env';
import { getSecret } from './secrets';

export type ProviderName = 'stripe' | 'creem' | 'paypal';
export type PaymentOrderType = 'one_time' | 'subscription';

export type CheckoutInput = {
  orderNo: string;
  userId: string;
  description: string;
  amountMinor: number;
  currency: string;
  orderType: PaymentOrderType;
  successUrl: string;
  cancelUrl: string;
  providerProductId?: string;
  intervalUnit?: 'month' | 'year';
  intervalCount?: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export type ProviderCheckout = {
  provider: ProviderName;
  sessionId: string;
  checkoutUrl: string;
  providerCustomerId?: string;
  raw: unknown;
};

export type ProviderPayment = {
  provider: ProviderName;
  sessionId: string;
  status: string;
  amountMinor?: number;
  currency?: string;
  transactionId?: string;
  subscriptionId?: string;
  customerId?: string;
  raw: unknown;
};

export type VerifiedProviderEvent = {
  provider: ProviderName;
  eventId: string;
  eventType: string;
  object: unknown;
  rawBody: string;
};

type JsonRecord = Record<string, unknown>;

const encoder = new TextEncoder();
const STRIPE_API = 'https://api.stripe.com/v1';
const CREEM_PRODUCTION_API = 'https://api.creem.io';
const CREEM_SANDBOX_API = 'https://test-api.creem.io';
const PAYPAL_PRODUCTION_API = 'https://api-m.paypal.com';
const PAYPAL_SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const MAX_AMOUNT_MINOR = 1_000_000_000_000;

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const asString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value : undefined
);

const requiredString = (value: unknown, message: string): string => {
  const result = asString(value);
  if (!result) throw new Error(message);
  return result;
};

const safeProviderError = (provider: ProviderName, status: number): Error => (
  new Error(`${provider} payment request failed (HTTP ${status}).`)
);

const parseJsonResponse = async (
  response: Response,
  provider: ProviderName,
): Promise<JsonRecord> => {
  if (!response.ok) throw safeProviderError(provider, response.status);
  const result: unknown = await response.json().catch(() => null);
  if (!isRecord(result)) throw new Error(`${provider} returned an invalid response.`);
  return result;
};

const requestJson = async (
  provider: ProviderName,
  url: string,
  init: RequestInit,
): Promise<JsonRecord> => parseJsonResponse(await fetch(url, init), provider);

const normalizeProvider = (provider: string): ProviderName => {
  if (provider === 'stripe' || provider === 'creem' || provider === 'paypal') {
    return provider;
  }
  throw new Error('Unsupported payment provider.');
};

const validateUrl = (value: string, name: string): string => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${name} must be an HTTP(S) URL.`);
  }
};

const validateInput = (input: CheckoutInput): CheckoutInput => {
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(input.orderNo)) {
    throw new Error('Invalid payment order number.');
  }
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(input.userId)) {
    throw new Error('Invalid payment user identifier.');
  }
  if (!input.description.trim() || input.description.length > 500) {
    throw new Error('Payment description is invalid.');
  }
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Payment currency must be ISO 4217 format.');
  if (!Number.isSafeInteger(input.amountMinor)
    || input.amountMinor <= 0
    || input.amountMinor > MAX_AMOUNT_MINOR) {
    throw new Error('Payment amount is invalid.');
  }
  if (input.orderType !== 'one_time' && input.orderType !== 'subscription') {
    throw new Error('Payment order type is invalid.');
  }
  if (input.providerProductId && input.providerProductId.length > 320) {
    throw new Error('Provider product identifier is too long.');
  }
  if (input.intervalUnit && input.intervalUnit !== 'month' && input.intervalUnit !== 'year') {
    throw new Error('Subscription interval is invalid.');
  }
  if (input.intervalCount !== undefined
    && (!Number.isInteger(input.intervalCount) || input.intervalCount < 1 || input.intervalCount > 12)) {
    throw new Error('Subscription interval count is invalid.');
  }
  return {
    ...input,
    currency,
    description: input.description.trim(),
    successUrl: validateUrl(input.successUrl, 'successUrl'),
    cancelUrl: validateUrl(input.cancelUrl, 'cancelUrl'),
  };
};

const checkoutMetadata = (input: CheckoutInput): Record<string, string> => ({
  ...(input.metadata ?? {}),
  order_no: input.orderNo,
  user_id: input.userId,
});

const metadataJson = (input: CheckoutInput): string => JSON.stringify(checkoutMetadata(input));

const minorAsDecimal = (minor: number): string => {
  const integer = Math.floor(minor / 100);
  const fraction = String(minor % 100).padStart(2, '0');
  return `${integer}.${fraction}`;
};

const hmacSha256Hex = async (secret: string, content: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(content));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const constantTimeHexEqual = (left: string, right: string): boolean => {
  if (!/^[a-fA-F0-9]+$/.test(left) || !/^[a-fA-F0-9]+$/.test(right) || left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const requireSecret = async (
  env: Env,
  name: Parameters<typeof getSecret>[1],
  provider: ProviderName,
): Promise<string> => {
  const value = await getSecret(env, name);
  if (!value) throw new Error(`${provider} payment service is not configured.`);
  return value;
};

const getEnvironment = async (
  env: Env,
  provider: 'creem' | 'paypal',
): Promise<'sandbox' | 'production'> => {
  const configured = (await getConfig(env, `${provider}_environment`, 'sandbox')).trim().toLowerCase();
  return configured === 'production' ? 'production' : 'sandbox';
};

const getCreemApi = async (env: Env): Promise<string> => (
  (await getEnvironment(env, 'creem')) === 'production'
    ? CREEM_PRODUCTION_API
    : CREEM_SANDBOX_API
);

const getPaypalApi = async (env: Env): Promise<string> => (
  (await getEnvironment(env, 'paypal')) === 'production'
    ? PAYPAL_PRODUCTION_API
    : PAYPAL_SANDBOX_API
);

const stripeCheckout = async (env: Env, input: CheckoutInput): Promise<ProviderCheckout> => {
  const secret = await requireSecret(env, 'stripe_secret_key', 'stripe');
  const params = new URLSearchParams({
    mode: input.orderType === 'subscription' ? 'subscription' : 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    'line_items[0][quantity]': '1',
  });
  const metadata = checkoutMetadata(input);
  for (const [key, value] of Object.entries(metadata)) {
    params.set(`metadata[${key}]`, value);
    if (input.orderType === 'subscription') params.set(`subscription_data[metadata][${key}]`, value);
  }
  if (input.customerEmail) params.set('customer_email', input.customerEmail.trim());

  if (input.providerProductId) {
    params.set('line_items[0][price]', input.providerProductId);
  } else {
    params.set('line_items[0][price_data][currency]', input.currency.toLowerCase());
    params.set('line_items[0][price_data][unit_amount]', String(input.amountMinor));
    params.set('line_items[0][price_data][product_data][name]', input.description);
    if (input.orderType === 'subscription') {
      params.set('line_items[0][price_data][recurring][interval]', input.intervalUnit ?? 'month');
      if (input.intervalCount && input.intervalCount !== 1) {
        params.set('line_items[0][price_data][recurring][interval_count]', String(input.intervalCount));
      }
    }
  }
  const result = await requestJson('stripe', `${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  return {
    provider: 'stripe',
    sessionId: requiredString(result.id, 'Stripe checkout identifier is missing.'),
    checkoutUrl: requiredString(result.url, 'Stripe checkout URL is missing.'),
    providerCustomerId: asString(result.customer),
    raw: result,
  };
};

const stripePayment = async (
  env: Env,
  sessionId: string,
): Promise<ProviderPayment> => {
  const secret = await requireSecret(env, 'stripe_secret_key', 'stripe');
  const result = await requestJson(
    'stripe',
    `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=payment_intent&expand[]=subscription`,
    { headers: { authorization: `Bearer ${secret}` } },
  );
  const paymentIntent = isRecord(result.payment_intent) ? result.payment_intent : undefined;
  const subscription = isRecord(result.subscription) ? result.subscription : undefined;
  return {
    provider: 'stripe',
    sessionId: requiredString(result.id, 'Stripe checkout identifier is missing.'),
    status: asString(result.payment_status) ?? asString(result.status) ?? 'unknown',
    amountMinor: typeof result.amount_total === 'number' ? result.amount_total : undefined,
    currency: asString(result.currency)?.toUpperCase(),
    transactionId: asString(paymentIntent?.id),
    subscriptionId: asString(subscription?.id) ?? asString(result.subscription),
    customerId: asString(result.customer),
    raw: result,
  };
};

const stripeWebhook = async (env: Env, request: Request): Promise<VerifiedProviderEvent> => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) throw new Error('Stripe webhook signature is missing.');
  const rawBody = await request.text();
  const timestampPart = signature.split(',').find((part) => part.startsWith('t='));
  const signatures = signature.split(',')
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  const timestamp = Number(timestampPart?.slice(2));
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1_000) - timestamp) > 300) {
    throw new Error('Stripe webhook timestamp is invalid or expired.');
  }
  const secret = await requireSecret(env, 'stripe_webhook_secret', 'stripe');
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  if (!signatures.some((candidate) => constantTimeHexEqual(candidate, expected))) {
    throw new Error('Stripe webhook signature is invalid.');
  }
  const event: unknown = JSON.parse(rawBody);
  if (!isRecord(event)) throw new Error('Stripe webhook body is invalid.');
  const data = isRecord(event.data) ? event.data : undefined;
  return {
    provider: 'stripe',
    eventId: requiredString(event.id, 'Stripe webhook event ID is missing.'),
    eventType: requiredString(event.type, 'Stripe webhook event type is missing.'),
    object: data?.object ?? event,
    rawBody,
  };
};

const creemCheckout = async (env: Env, input: CheckoutInput): Promise<ProviderCheckout> => {
  if (!input.providerProductId) throw new Error('Creem checkout requires a provider product identifier.');
  const [apiKey, api] = await Promise.all([
    requireSecret(env, 'creem_api_key', 'creem'),
    getCreemApi(env),
  ]);
  const result = await requestJson('creem', `${api}/v1/checkouts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      product_id: input.providerProductId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: checkoutMetadata(input),
      customer: input.customerEmail ? { email: input.customerEmail.trim() } : undefined,
    }),
  });
  return {
    provider: 'creem',
    sessionId: requiredString(result.id, 'Creem checkout identifier is missing.'),
    checkoutUrl: requiredString(result.checkout_url ?? result.url, 'Creem checkout URL is missing.'),
    providerCustomerId: asString(result.customer_id),
    raw: result,
  };
};

const creemPayment = async (env: Env, sessionId: string): Promise<ProviderPayment> => {
  const [apiKey, api] = await Promise.all([
    requireSecret(env, 'creem_api_key', 'creem'),
    getCreemApi(env),
  ]);
  const result = await requestJson(
    'creem',
    `${api}/v1/checkouts?checkout_id=${encodeURIComponent(sessionId)}`,
    { headers: { 'x-api-key': apiKey } },
  );
  const checkout = Array.isArray(result.items) && isRecord(result.items[0]) ? result.items[0] : result;
  return {
    provider: 'creem',
    sessionId: requiredString(checkout.id, 'Creem checkout identifier is missing.'),
    status: asString(checkout.status) ?? 'unknown',
    amountMinor: typeof checkout.amount === 'number' ? checkout.amount : undefined,
    currency: asString(checkout.currency)?.toUpperCase(),
    transactionId: asString(checkout.order_id) ?? asString(checkout.id),
    subscriptionId: asString(checkout.subscription_id),
    customerId: asString(checkout.customer_id),
    raw: checkout,
  };
};

const creemWebhook = async (env: Env, request: Request): Promise<VerifiedProviderEvent> => {
  const signature = request.headers.get('creem-signature')?.replace(/^sha256=/i, '');
  if (!signature) throw new Error('Creem webhook signature is missing.');
  const rawBody = await request.text();
  const secret = await requireSecret(env, 'creem_webhook_secret', 'creem');
  const expected = await hmacSha256Hex(secret, rawBody);
  if (!constantTimeHexEqual(signature, expected)) throw new Error('Creem webhook signature is invalid.');
  const event: unknown = JSON.parse(rawBody);
  if (!isRecord(event)) throw new Error('Creem webhook body is invalid.');
  return {
    provider: 'creem',
    eventId: requiredString(event.id, 'Creem webhook event ID is missing.'),
    eventType: requiredString(event.eventType ?? event.event_type ?? event.type, 'Creem webhook event type is missing.'),
    object: event.data ?? event.object ?? event,
    rawBody,
  };
};

type PaypalCredentials = { api: string; clientId: string; clientSecret: string };

const paypalCredentials = async (env: Env): Promise<PaypalCredentials> => {
  const [clientId, clientSecret, api] = await Promise.all([
    requireSecret(env, 'paypal_client_id', 'paypal'),
    requireSecret(env, 'paypal_client_secret', 'paypal'),
    getPaypalApi(env),
  ]);
  return { api, clientId, clientSecret };
};

const paypalToken = async (credentials: PaypalCredentials): Promise<string> => {
  const encoded = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
  const result = await requestJson('paypal', `${credentials.api}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${encoded}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  return requiredString(result.access_token, 'PayPal access token is missing.');
};

const paypalRequest = async (
  credentials: PaypalCredentials,
  method: string,
  path: string,
  body?: JsonRecord,
): Promise<JsonRecord> => {
  const token = await paypalToken(credentials);
  return requestJson('paypal', `${credentials.api}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
};

const paypalApprovalUrl = (result: JsonRecord): string => {
  const links = Array.isArray(result.links) ? result.links : [];
  const approval = links.find((link) => isRecord(link) && asString(link.rel) === 'approve');
  if (!isRecord(approval)) throw new Error('PayPal checkout approval URL is missing.');
  return requiredString(approval.href, 'PayPal checkout approval URL is missing.');
};

const paypalCheckout = async (env: Env, input: CheckoutInput): Promise<ProviderCheckout> => {
  const credentials = await paypalCredentials(env);
  const metadata = metadataJson(input);
  if (input.orderType === 'subscription') {
    if (!input.providerProductId) {
      throw new Error('PayPal subscriptions require a provider product identifier.');
    }
    const result = await paypalRequest(credentials, 'POST', '/v1/billing/subscriptions', {
      plan_id: input.providerProductId,
      custom_id: metadata,
      application_context: {
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        user_action: 'SUBSCRIBE_NOW',
      },
    });
    return {
      provider: 'paypal',
      sessionId: requiredString(result.id, 'PayPal subscription identifier is missing.'),
      checkoutUrl: paypalApprovalUrl(result),
      raw: result,
    };
  }
  const result = await paypalRequest(credentials, 'POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: input.orderNo,
      custom_id: metadata,
      description: input.description,
      amount: { currency_code: input.currency, value: minorAsDecimal(input.amountMinor) },
    }],
    application_context: {
      return_url: input.successUrl,
      cancel_url: input.cancelUrl,
      user_action: 'PAY_NOW',
    },
  });
  return {
    provider: 'paypal',
    sessionId: requiredString(result.id, 'PayPal order identifier is missing.'),
    checkoutUrl: paypalApprovalUrl(result),
    raw: result,
  };
};

const paypalPayment = async (
  env: Env,
  sessionId: string,
  orderType: PaymentOrderType,
): Promise<ProviderPayment> => {
  const credentials = await paypalCredentials(env);
  if (orderType === 'subscription') {
    const result = await paypalRequest(
      credentials,
      'GET',
      `/v1/billing/subscriptions/${encodeURIComponent(sessionId)}`,
    );
    return {
      provider: 'paypal',
      sessionId: requiredString(result.id, 'PayPal subscription identifier is missing.'),
      status: asString(result.status) ?? 'unknown',
      subscriptionId: asString(result.id),
      customerId: asString(result.subscriber_id),
      raw: result,
    };
  }
  let result = await paypalRequest(
    credentials,
    'GET',
    `/v2/checkout/orders/${encodeURIComponent(sessionId)}`,
  );
  if (asString(result.status) === 'APPROVED') {
    result = await paypalRequest(
      credentials,
      'POST',
      `/v2/checkout/orders/${encodeURIComponent(sessionId)}/capture`,
      {},
    );
  }
  const purchaseUnits = Array.isArray(result.purchase_units) ? result.purchase_units : [];
  const unit = purchaseUnits.find(isRecord);
  const amount = isRecord(unit?.amount) ? unit.amount : undefined;
  const captures = isRecord(unit?.payments) && Array.isArray(unit.payments.captures)
    ? unit.payments.captures
    : [];
  const capture = captures.find(isRecord);
  return {
    provider: 'paypal',
    sessionId: requiredString(result.id, 'PayPal order identifier is missing.'),
    status: asString(result.status) ?? 'unknown',
    amountMinor: amount && typeof amount.value === 'string'
      ? Math.round(Number(amount.value) * 100)
      : undefined,
    currency: asString(amount?.currency_code),
    transactionId: asString(capture?.id),
    raw: result,
  };
};

const paypalWebhook = async (env: Env, request: Request): Promise<VerifiedProviderEvent> => {
  const headers = {
    authAlgo: request.headers.get('paypal-auth-algo'),
    certUrl: request.headers.get('paypal-cert-url'),
    transmissionId: request.headers.get('paypal-transmission-id'),
    transmissionSignature: request.headers.get('paypal-transmission-sig'),
    transmissionTime: request.headers.get('paypal-transmission-time'),
  };
  if (Object.values(headers).some((value) => !value)) {
    throw new Error('PayPal webhook verification headers are missing.');
  }
  const rawBody = await request.text();
  const event: unknown = JSON.parse(rawBody);
  if (!isRecord(event)) throw new Error('PayPal webhook body is invalid.');
  const [credentials, webhookId] = await Promise.all([
    paypalCredentials(env),
    requireSecret(env, 'paypal_webhook_id', 'paypal'),
  ]);
  const token = await paypalToken(credentials);
  const verification = await requestJson('paypal', `${credentials.api}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSignature,
      transmission_time: headers.transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  if (asString(verification.verification_status) !== 'SUCCESS') {
    throw new Error('PayPal webhook signature is invalid.');
  }
  return {
    provider: 'paypal',
    eventId: requiredString(event.id, 'PayPal webhook event ID is missing.'),
    eventType: requiredString(event.event_type, 'PayPal webhook event type is missing.'),
    object: event.resource ?? event,
    rawBody,
  };
};

export async function createProviderCheckout(
  env: Env,
  provider: ProviderName,
  checkout: CheckoutInput,
): Promise<ProviderCheckout> {
  const input = validateInput(checkout);
  switch (normalizeProvider(provider)) {
    case 'stripe': return stripeCheckout(env, input);
    case 'creem': return creemCheckout(env, input);
    case 'paypal': return paypalCheckout(env, input);
  }
}

export async function retrieveProviderPayment(
  env: Env,
  provider: ProviderName,
  sessionId: string,
  orderType: PaymentOrderType,
): Promise<ProviderPayment> {
  if (!/^[A-Za-z0-9_:-]{1,320}$/.test(sessionId)) throw new Error('Invalid provider session identifier.');
  if (orderType !== 'one_time' && orderType !== 'subscription') throw new Error('Payment order type is invalid.');
  switch (normalizeProvider(provider)) {
    case 'stripe': return stripePayment(env, sessionId);
    case 'creem': return creemPayment(env, sessionId);
    case 'paypal': return paypalPayment(env, sessionId, orderType);
  }
}

export async function verifyProviderWebhook(
  request: Request,
  env: Env,
  provider: ProviderName,
): Promise<VerifiedProviderEvent> {
  switch (normalizeProvider(provider)) {
    case 'stripe': return stripeWebhook(env, request);
    case 'creem': return creemWebhook(env, request);
    case 'paypal': return paypalWebhook(env, request);
  }
}

export async function cancelProviderSubscription(
  env: Env,
  provider: ProviderName,
  subscriptionId: string,
): Promise<void> {
  if (!/^[A-Za-z0-9_:-]{1,320}$/.test(subscriptionId)) {
    throw new Error('Invalid provider subscription identifier.');
  }
  switch (normalizeProvider(provider)) {
    case 'stripe': {
      const secret = await requireSecret(env, 'stripe_secret_key', 'stripe');
      await requestJson('stripe', `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${secret}` },
      });
      return;
    }
    case 'creem': {
      const [apiKey, api] = await Promise.all([
        requireSecret(env, 'creem_api_key', 'creem'),
        getCreemApi(env),
      ]);
      await requestJson('creem', `${api}/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
      });
      return;
    }
    case 'paypal': {
      const credentials = await paypalCredentials(env);
      await paypalRequest(
        credentials,
        'POST',
        `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
        { reason: 'Canceled by customer request.' },
      );
    }
  }
}

export async function createProviderBillingPortal(
  env: Env,
  provider: ProviderName,
  customerId: string,
  returnUrl: string,
): Promise<string | null> {
  if (!/^[A-Za-z0-9_:-]{1,320}$/.test(customerId)) {
    throw new Error('Invalid provider customer identifier.');
  }
  if (normalizeProvider(provider) !== 'stripe') return null;
  const secret = await requireSecret(env, 'stripe_secret_key', 'stripe');
  const result = await requestJson('stripe', `${STRIPE_API}/billing_portal/sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ customer: customerId, return_url: validateUrl(returnUrl, 'returnUrl') }),
  });
  return requiredString(result.url, 'Stripe billing portal URL is missing.');
}
