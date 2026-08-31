import { hasPermission, writeAdminAudit } from './access';
import { getConfigs, setConfig } from './config';
import { consumeCredits, CreditError, grantCredits } from './credits';
import type { Env } from './env';
import { apiError, apiJson } from './http';
import {
  deleteSecret,
  getSecretStates,
  secretNames,
  setSecret,
  type SecretName,
} from './secrets';
import { isBoundedText, isRecord, isTrustedWriteOrigin, readJsonBody } from './validation';

type AdminPermission =
  | 'admin.access'
  | 'admin.users.read'
  | 'admin.users.write'
  | 'admin.commerce.read'
  | 'admin.commerce.write'
  | 'admin.credits.write'
  | 'admin.ai.read'
  | 'admin.settings.write';

type ProductInput = {
  id?: string;
  name: string;
  description?: string;
  kind: 'free' | 'subscription' | 'credit_pack';
  status?: 'inactive' | 'active' | 'archived';
  currency?: string;
  amountMinor?: number;
  intervalUnit?: 'month' | 'year' | null;
  intervalCount?: number | null;
  creditAmount?: number;
  creditValidDays?: number | null;
  providerProductIds?: Record<string, string>;
  metadata?: Record<string, string>;
};

const configAllowlist = [
  'payment_enabled',
  'default_payment_provider',
  'creem_environment',
  'paypal_environment',
  'mail_from',
  'initial_credits_enabled',
  'initial_credits_amount',
  'initial_credits_valid_days',
  'ai_chat_credits',
  'ai_image_credits',
  'ai_video_credits',
  'ai_music_credits',
  'ai_enabled',
  'ai_models_json',
  'openrouter_base_url',
] as const;

const validRoles = ['user', 'admin', 'super_admin'] as const;
const maxPageSize = 100;
const now = (): number => Date.now();

const requirePermission = async (
  env: Env,
  userId: string,
  permission: AdminPermission,
): Promise<Response | null> => (
  await hasPermission(env, userId, permission)
    ? null
    : apiError('forbidden', 'Administrator permission is required.', 403)
);

const isSuperAdmin = async (env: Env, userId: string): Promise<boolean> => {
  const row = await env.DB.prepare(
    `SELECT 1 AS allowed FROM user_role ur
     JOIN role r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.name = 'super_admin' LIMIT 1`,
  )
    .bind(userId)
    .first<{ allowed: number }>();
  return row?.allowed === 1;
};

const getPage = (url: URL): { page: number; limit: number } | null => {
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '30');
  return Number.isInteger(page) && page >= 1 && Number.isInteger(limit) && limit >= 1 && limit <= maxPageSize
    ? { page, limit }
    : null;
};

const idIsValid = (value: string): boolean => /^[A-Za-z0-9:_-]{1,160}$/.test(value);

const isSafeIntegerInRange = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is number => (
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value >= minimum
  && value <= maximum
);

const jsonStrings = (value: unknown, maxEntries = 30): Record<string, string> | null => {
  if (!isRecord(value) || Object.keys(value).length > maxEntries) return null;
  const entries = Object.entries(value);
  if (entries.some(([key, item]) => !isBoundedText(key, 80) || !isBoundedText(item, 320))) return null;
  return Object.fromEntries(entries) as Record<string, string>;
};

const getUserRoles = async (env: Env, userId: string): Promise<string[]> => {
  const rows = await env.DB.prepare(
    `SELECT r.name FROM user_role ur JOIN role r ON r.id = ur.role_id
     WHERE ur.user_id = ? ORDER BY r.name`,
  )
    .bind(userId)
    .all<{ name: string }>();
  return rows.results.map((row) => row.name);
};

const dashboard = async (env: Env): Promise<Response> => {
  const result = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS value FROM user'),
    env.DB.prepare("SELECT COUNT(*) AS value FROM payment_order WHERE status = 'paid'"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM billing_subscription WHERE status IN ('active', 'trialing')"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM ai_task WHERE status IN ('created', 'queued', 'running')"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM email_delivery WHERE status = 'failed'"),
  ]);
  const values = result.map((item) => {
    const row = item.results[0] as { value?: number } | undefined;
    return row?.value ?? 0;
  });
  return apiJson({
    data: {
      users: values[0],
      paidOrders: values[1],
      activeSubscriptions: values[2],
      runningAiTasks: values[3],
      failedEmails: values[4],
    },
  });
};

const listUsers = async (env: Env, url: URL): Promise<Response> => {
  const pagination = getPage(url);
  if (!pagination) return apiError('invalid_pagination', 'page and limit are invalid.', 400);
  const search = url.searchParams.get('search')?.trim() ?? '';
  if (search.length > 120) return apiError('invalid_search', 'Search query is too long.', 400);
  const pattern = `%${search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
  const [users, total] = await Promise.all([
    env.DB.prepare(
      `SELECT u.id, u.name, u.email, u.emailVerified, u.createdAt, u.updatedAt,
              COALESCE(GROUP_CONCAT(r.name), '') AS roles
       FROM user u
       LEFT JOIN user_role ur ON ur.user_id = u.id
       LEFT JOIN role r ON r.id = ur.role_id
       WHERE u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\'
       GROUP BY u.id ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`,
    )
      .bind(pattern, pattern, pagination.limit, (pagination.page - 1) * pagination.limit)
      .all<{ id: string; name: string; email: string; emailVerified: number; createdAt: number; updatedAt: number; roles: string }>(),
    env.DB.prepare(
      "SELECT COUNT(*) AS value FROM user WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\'",
    )
      .bind(pattern, pattern)
      .first<{ value: number }>(),
  ]);
  return apiJson({
    data: {
      page: pagination.page,
      limit: pagination.limit,
      total: total?.value ?? 0,
      users: users.results.map((user) => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : [],
      })),
    },
  });
};

const updateRoles = async (
  env: Env,
  actorId: string,
  targetUserId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const rolesInput = payload.roles;
  if (!Array.isArray(rolesInput)
    || rolesInput.length === 0
    || rolesInput.some((role) => typeof role !== 'string' || !validRoles.includes(role as typeof validRoles[number]))) {
    return apiError('invalid_roles', 'Roles are invalid.', 400);
  }
  const roles = [...new Set(rolesInput as string[])];
  if (!roles.includes('user')) roles.unshift('user');
  const target = await env.DB.prepare('SELECT id FROM user WHERE id = ?').bind(targetUserId).first<{ id: string }>();
  if (!target) return apiError('not_found', 'User was not found.', 404);
  const actorSuper = await isSuperAdmin(env, actorId);
  const currentRoles = await getUserRoles(env, targetUserId);
  const currentSuper = currentRoles.includes('super_admin');
  const nextSuper = roles.includes('super_admin');
  if (!actorSuper && (currentSuper || nextSuper)) {
    return apiError('forbidden', 'Only a super administrator can manage super administrators.', 403);
  }
  if (currentSuper && !nextSuper) {
    const count = await env.DB.prepare(
      `SELECT COUNT(*) AS value FROM user_role ur
       JOIN role r ON r.id = ur.role_id WHERE r.name = 'super_admin'`,
    ).first<{ value: number }>();
    if ((count?.value ?? 0) <= 1) return apiError('last_super_admin', 'The last super administrator cannot be removed.', 409);
  }
  const rolesToRemove = currentRoles.filter((role) => !roles.includes(role));
  const removingSuper = currentSuper && !nextSuper;
  await env.DB.batch([
    ...rolesToRemove.map((role) => env.DB.prepare(
      `DELETE FROM user_role
       WHERE user_id = ? AND role_id = ?
         AND (? = 0 OR (
           SELECT COUNT(*) FROM user_role WHERE role_id = 'super_admin'
         ) > 1)`,
    ).bind(targetUserId, role, removingSuper ? 1 : 0)),
    ...roles.map((role) => env.DB.prepare(
      'INSERT OR IGNORE INTO user_role (user_id, role_id) SELECT ?, id FROM role WHERE name = ?',
    ).bind(targetUserId, role)),
  ]);
  const persistedRoles = await getUserRoles(env, targetUserId);
  if (!nextSuper && persistedRoles.includes('super_admin')) {
    return apiError('last_super_admin', 'The last super administrator cannot be removed.', 409);
  }
  await writeAdminAudit(env, {
    actorUserId: actorId,
    action: 'user.roles.update',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { roles },
  });
  return apiJson({ data: { userId: targetUserId, roles: persistedRoles } });
};

const parseProduct = (payload: Record<string, unknown>, requireId: boolean): ProductInput | null => {
  const name = payload.name;
  const kind = payload.kind;
  const id = payload.id;
  if ((!requireId && id !== undefined && (!isBoundedText(id, 160) || !idIsValid(id)))
    || (requireId && id !== undefined && (!isBoundedText(id, 160) || !idIsValid(id)))
    || !isBoundedText(name, 160)
    || (kind !== 'free' && kind !== 'subscription' && kind !== 'credit_pack')) return null;
  const status = payload.status;
  if (status !== undefined && status !== 'inactive' && status !== 'active' && status !== 'archived') return null;
  const normalizedStatus: 'inactive' | 'active' | 'archived' = status === 'active' || status === 'archived'
    ? status
    : 'inactive';
  const currency = typeof payload.currency === 'string' ? payload.currency.toUpperCase() : 'USD';
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  const amountMinor = payload.amountMinor === undefined ? 0 : payload.amountMinor;
  const creditAmount = payload.creditAmount === undefined ? 0 : payload.creditAmount;
  const intervalUnit = payload.intervalUnit === undefined ? null : payload.intervalUnit;
  const intervalCount = payload.intervalCount === undefined ? null : payload.intervalCount;
  const creditValidDays = payload.creditValidDays === undefined ? null : payload.creditValidDays;
  if (!isSafeIntegerInRange(amountMinor, 0, 1_000_000_000_000)
    || !isSafeIntegerInRange(creditAmount, 0, 1_000_000_000)
    || (intervalUnit !== null && intervalUnit !== 'month' && intervalUnit !== 'year')
    || (intervalCount !== null && !isSafeIntegerInRange(intervalCount, 1, 24))
    || (creditValidDays !== null && !isSafeIntegerInRange(creditValidDays, 1, 3_650))) return null;
  if (kind === 'subscription' && !intervalUnit) return null;
  if (normalizedStatus === 'active' && kind !== 'free' && amountMinor <= 0) return null;
  const normalizedIntervalUnit: 'month' | 'year' | null = intervalUnit === 'month' || intervalUnit === 'year'
    ? intervalUnit
    : null;
  const normalizedIntervalCount: number | null = typeof intervalCount === 'number' ? intervalCount : null;
  const normalizedCreditValidDays: number | null = typeof creditValidDays === 'number' ? creditValidDays : null;
  const providerProductIds = payload.providerProductIds === undefined ? {} : jsonStrings(payload.providerProductIds);
  const metadata = payload.metadata === undefined ? {} : jsonStrings(payload.metadata);
  if (!providerProductIds || !metadata) return null;
  return {
    id: typeof id === 'string' ? id : undefined,
    name,
    description: typeof payload.description === 'string' ? payload.description.slice(0, 2_000) : '',
    kind,
    status: normalizedStatus,
    currency,
    amountMinor,
    intervalUnit: normalizedIntervalUnit,
    intervalCount: normalizedIntervalCount,
    creditAmount,
    creditValidDays: normalizedCreditValidDays,
    providerProductIds,
    metadata,
  };
};

const listProducts = async (env: Env, url: URL): Promise<Response> => {
  const pagination = getPage(url);
  if (!pagination) return apiError('invalid_pagination', 'page and limit are invalid.', 400);
  const result = await env.DB.prepare(
    `SELECT id, name, description, kind, status, currency, amount_minor, interval_unit,
            interval_count, credit_amount, credit_valid_days, provider_product_ids_json,
            metadata_json, created_at, updated_at
     FROM catalog_product ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(pagination.limit, (pagination.page - 1) * pagination.limit)
    .all<Record<string, unknown>>();
  return apiJson({ data: { page: pagination.page, limit: pagination.limit, products: result.results } });
};

const saveProduct = async (
  env: Env,
  actorId: string,
  payload: Record<string, unknown>,
  productId?: string,
): Promise<Response> => {
  const input = parseProduct({ ...payload, ...(productId ? { id: productId } : {}) }, Boolean(productId));
  if (!input) return apiError('invalid_product', 'Product data is invalid.', 400);
  const id = productId ?? input.id ?? crypto.randomUUID();
  const timestamp = now();
  if (productId) {
    const result = await env.DB.prepare(
      `UPDATE catalog_product SET name = ?, description = ?, kind = ?, status = ?, currency = ?,
       amount_minor = ?, interval_unit = ?, interval_count = ?, credit_amount = ?, credit_valid_days = ?,
       provider_product_ids_json = ?, metadata_json = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(input.name, input.description, input.kind, input.status, input.currency, input.amountMinor,
        input.intervalUnit, input.intervalCount, input.creditAmount, input.creditValidDays,
        JSON.stringify(input.providerProductIds), JSON.stringify(input.metadata), timestamp, id)
      .run();
    if (result.meta.changes !== 1) return apiError('not_found', 'Product was not found.', 404);
  } else {
    await env.DB.prepare(
      `INSERT INTO catalog_product
       (id, name, description, kind, status, currency, amount_minor, interval_unit, interval_count,
        credit_amount, credit_valid_days, provider_product_ids_json, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, input.name, input.description, input.kind, input.status, input.currency, input.amountMinor,
        input.intervalUnit, input.intervalCount, input.creditAmount, input.creditValidDays,
        JSON.stringify(input.providerProductIds), JSON.stringify(input.metadata), timestamp, timestamp)
      .run();
  }
  await writeAdminAudit(env, {
    actorUserId: actorId,
    action: productId ? 'catalog.product.update' : 'catalog.product.create',
    targetType: 'catalog_product',
    targetId: id,
    metadata: { status: input.status, kind: input.kind },
  });
  return apiJson({ data: { id } }, productId ? 200 : 201);
};

const updateProductStatus = async (
  env: Env,
  actorId: string,
  productId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const status = payload.status;
  if (status !== 'inactive' && status !== 'active' && status !== 'archived') {
    return apiError('invalid_status', 'Product status is invalid.', 400);
  }
  const result = await env.DB.prepare('UPDATE catalog_product SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now(), productId)
    .run();
  if (result.meta.changes !== 1) return apiError('not_found', 'Product was not found.', 404);
  await writeAdminAudit(env, {
    actorUserId: actorId,
    action: 'catalog.product.status',
    targetType: 'catalog_product',
    targetId: productId,
    metadata: { status },
  });
  return apiJson({ data: { id: productId, status } });
};

const getConfigApi = async (env: Env): Promise<Response> => {
  const values = await getConfigs(env, configAllowlist);
  return apiJson({ data: { values, allowedKeys: configAllowlist } });
};

const updateConfigApi = async (
  env: Env,
  actorId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const values = payload.values;
  if (!isRecord(values) || Object.keys(values).length > configAllowlist.length) {
    return apiError('invalid_config', 'Configuration values are invalid.', 400);
  }
  const normalized: Record<string, string> = {};
  const booleanKeys = new Set(['payment_enabled', 'initial_credits_enabled', 'ai_enabled']);
  const integerKeys = new Set([
    'initial_credits_amount', 'initial_credits_valid_days', 'ai_chat_credits',
    'ai_image_credits', 'ai_video_credits', 'ai_music_credits',
  ]);
  for (const [key, value] of Object.entries(values)) {
    if (!configAllowlist.includes(key as typeof configAllowlist[number]) || typeof value !== 'string') {
      return apiError('invalid_config', 'Configuration values are invalid.', 400);
    }
    if (booleanKeys.has(key) && value !== 'true' && value !== 'false') {
      return apiError('invalid_config', `${key} must be true or false.`, 400);
    }
    if (integerKeys.has(key)) {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 0 || number > 1_000_000_000) {
        return apiError('invalid_config', `${key} must be a non-negative integer.`, 400);
      }
    }
    if (key === 'default_payment_provider' && !['stripe', 'creem', 'paypal'].includes(value)) {
      return apiError('invalid_config', 'Default payment provider is invalid.', 400);
    }
    if ((key === 'creem_environment' || key === 'paypal_environment') && !['sandbox', 'production'].includes(value)) {
      return apiError('invalid_config', `${key} must be sandbox or production.`, 400);
    }
    if (key === 'openrouter_base_url') {
      try {
        if (new URL(value).protocol !== 'https:') throw new Error();
      } catch {
        return apiError('invalid_config', 'OpenRouter base URL must be a valid HTTPS URL.', 400);
      }
    }
    if (key === 'ai_models_json') {
      if (value.length > 16_384) return apiError('invalid_config', 'AI model configuration is too large.', 400);
      try {
        const models: unknown = JSON.parse(value);
        if (!Array.isArray(models) || models.length > 50 || models.some((model) => !isRecord(model))) throw new Error();
      } catch {
        return apiError('invalid_config', 'AI model configuration must be a JSON array.', 400);
      }
    } else if (value.length > 2_000) {
      return apiError('invalid_config', `${key} is too long.`, 400);
    }
    normalized[key] = value;
  }
  await Promise.all(Object.entries(normalized).map(([key, value]) => setConfig(env, key, value)));
  await writeAdminAudit(env, {
    actorUserId: actorId,
    action: 'config.update',
    targetType: 'app_config',
    metadata: { keys: Object.keys(normalized) },
  });
  return apiJson({ data: { values: await getConfigs(env, configAllowlist) } });
};

const listSafeRows = async (
  env: Env,
  table: 'payment_order' | 'billing_subscription' | 'ai_task' | 'email_delivery' | 'admin_audit_log',
  columns: string,
  url: URL,
): Promise<Response> => {
  const pagination = getPage(url);
  if (!pagination) return apiError('invalid_pagination', 'page and limit are invalid.', 400);
  const rows = await env.DB.prepare(
    `SELECT ${columns} FROM ${table} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(pagination.limit, (pagination.page - 1) * pagination.limit)
    .all<Record<string, unknown>>();
  return apiJson({ data: { page: pagination.page, limit: pagination.limit, entries: rows.results } });
};

const adjustCredits = async (
  env: Env,
  actorId: string,
  targetUserId: string,
  payload: Record<string, unknown>,
): Promise<Response> => {
  const amount = payload.amount;
  const requestId = payload.requestId;
  const reason = payload.reason;
  if (!isSafeIntegerInRange(amount, -1_000_000_000, 1_000_000_000) || amount === 0
    || !isBoundedText(requestId, 160) || !/^[A-Za-z0-9:_-]{8,160}$/.test(requestId)
    || !isBoundedText(reason, 500)) {
    return apiError('invalid_credit_adjustment', 'Credit adjustment data is invalid.', 400);
  }
  const user = await env.DB.prepare('SELECT id FROM user WHERE id = ?').bind(targetUserId).first<{ id: string }>();
  if (!user) return apiError('not_found', 'User was not found.', 404);
  try {
    const operation = {
      userId: targetUserId,
      amount: Math.abs(amount),
      operationId: `admin:${requestId}`,
      transactionNo: `admin:${requestId}`,
      sourceType: 'admin' as const,
      sourceId: actorId,
      metadataJson: JSON.stringify({ reason }),
    };
    const entry = amount > 0
      ? await grantCredits(env, operation)
      : await consumeCredits(env, operation);
    await writeAdminAudit(env, {
      actorUserId: actorId,
      action: 'credits.adjust',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { amount, requestId, reason },
    });
    return apiJson({ data: { operationId: entry.operation_id, balanceAfter: entry.balance_after } });
  } catch (error) {
    if (error instanceof CreditError) return apiError(error.code, error.message, error.status);
    return apiError('credit_adjustment_failed', 'Credit adjustment failed.', 409);
  }
};

export async function handleAdminApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (!isTrustedWriteOrigin(request)) return apiError('invalid_origin', 'Request origin is not allowed.', 403);
  const path = url.pathname;
  const permissionFor = async (permission: AdminPermission): Promise<Response | null> => requirePermission(env, userId, permission);
  if (path === '/api/v1/admin/dashboard' && request.method === 'GET') {
    const forbidden = await permissionFor('admin.access');
    return forbidden ?? dashboard(env);
  }
  if (path === '/api/v1/admin/users' && request.method === 'GET') {
    const forbidden = await permissionFor('admin.users.read');
    return forbidden ?? listUsers(env, url);
  }
  const roleMatch = /^\/api\/v1\/admin\/users\/([^/]+)\/roles$/.exec(path);
  if (roleMatch && request.method === 'GET') {
    const forbidden = await permissionFor('admin.users.read');
    return forbidden ?? apiJson({ data: { userId: roleMatch[1], roles: await getUserRoles(env, roleMatch[1]) } });
  }
  if (roleMatch && request.method === 'PUT') {
    const forbidden = await permissionFor('admin.users.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? updateRoles(env, userId, roleMatch[1], payload)
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  if (path === '/api/v1/admin/products' && request.method === 'GET') {
    const forbidden = await permissionFor('admin.commerce.read');
    return forbidden ?? listProducts(env, url);
  }
  if (path === '/api/v1/admin/products' && request.method === 'POST') {
    const forbidden = await permissionFor('admin.commerce.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? saveProduct(env, userId, payload)
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  const productMatch = /^\/api\/v1\/admin\/products\/([^/]+)$/.exec(path);
  if (productMatch && request.method === 'PUT') {
    const forbidden = await permissionFor('admin.commerce.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? saveProduct(env, userId, payload, productMatch[1])
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  const productStatusMatch = /^\/api\/v1\/admin\/products\/([^/]+)\/status$/.exec(path);
  if (productStatusMatch && request.method === 'PATCH') {
    const forbidden = await permissionFor('admin.commerce.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? updateProductStatus(env, userId, productStatusMatch[1], payload)
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  if (path === '/api/v1/admin/config' && request.method === 'GET') {
    const forbidden = await permissionFor('admin.settings.write');
    return forbidden ?? getConfigApi(env);
  }
  if (path === '/api/v1/admin/config' && request.method === 'PUT') {
    const forbidden = await permissionFor('admin.settings.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? updateConfigApi(env, userId, payload)
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  if (path === '/api/v1/admin/secrets' && request.method === 'GET') {
    const forbidden = await permissionFor('admin.settings.write');
    return forbidden ?? apiJson({ data: { states: await getSecretStates(env) } });
  }
  const secretMatch = /^\/api\/v1\/admin\/secrets\/([^/]+)$/.exec(path);
  if (secretMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const forbidden = await permissionFor('admin.settings.write');
    if (forbidden) return forbidden;
    const name = secretMatch[1] as SecretName;
    if (!secretNames.includes(name)) return apiError('invalid_secret', 'Secret name is invalid.', 400);
    if (request.method === 'DELETE') {
      await deleteSecret(env, name);
    } else {
      const payload = await readJsonBody(request);
      if (payload instanceof Response) return payload;
      if (!isRecord(payload) || !isBoundedText(payload.value, 16_384)) {
        return apiError('invalid_secret', 'Secret value is invalid.', 400);
      }
      await setSecret(env, name, payload.value);
    }
    await writeAdminAudit(env, {
      actorUserId: userId,
      action: request.method === 'DELETE' ? 'secret.delete' : 'secret.set',
      targetType: 'app_secret',
      targetId: name,
    });
    return apiJson({ data: { name, state: (await getSecretStates(env))[name] } });
  }
  const readOnlyLogs: Array<[string, AdminPermission, Parameters<typeof listSafeRows>[2]]> = [
    ['/api/v1/admin/orders', 'admin.commerce.read', 'id, order_no, user_id, product_id, provider, status, amount_minor, currency, order_type, paid_at, created_at, updated_at'],
    ['/api/v1/admin/subscriptions', 'admin.commerce.read', 'id, user_id, product_id, provider, provider_subscription_id, status, amount_minor, currency, interval_unit, interval_count, current_period_end, cancel_at_period_end, created_at, updated_at'],
    ['/api/v1/admin/ai-tasks', 'admin.ai.read', 'id, user_id, provider, model, task_type, status, provider_task_id, credit_operation_id, error_message, created_at, updated_at, completed_at'],
    ['/api/v1/admin/emails', 'admin.users.read', 'id, user_id, provider, kind, recipient, subject, provider_message_id, status, created_at, updated_at, sent_at'],
    ['/api/v1/admin/audit', 'admin.access', 'id, actor_user_id, action, target_type, target_id, request_id, ip_address, metadata, created_at'],
  ];
  for (const [route, permission, columns] of readOnlyLogs) {
    if (path === route && request.method === 'GET') {
      const forbidden = await permissionFor(permission);
      if (forbidden) return forbidden;
      const table = route.endsWith('orders') ? 'payment_order'
        : route.endsWith('subscriptions') ? 'billing_subscription'
          : route.endsWith('ai-tasks') ? 'ai_task'
            : route.endsWith('emails') ? 'email_delivery'
              : 'admin_audit_log';
      return listSafeRows(env, table, columns, url);
    }
  }
  const creditsMatch = /^\/api\/v1\/admin\/credits\/([^/]+)$/.exec(path);
  if (creditsMatch && request.method === 'POST') {
    const forbidden = await permissionFor('admin.credits.write');
    if (forbidden) return forbidden;
    const payload = await readJsonBody(request);
    return payload instanceof Response
      ? payload
      : isRecord(payload)
        ? adjustCredits(env, userId, creditsMatch[1], payload)
        : apiError('invalid_body', 'Body must be an object.', 400);
  }
  return apiError('not_found', 'Unknown admin route.', 404);
}
