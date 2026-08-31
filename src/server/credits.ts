import type { Env } from './env';
import { apiError, apiJson } from './http';

export type CreditDirection = 'grant' | 'consume' | 'expire';

export type CreditOperation = {
  userId: string;
  amount: number;
  operationId: string;
  transactionNo: string;
  sourceType: 'signup' | 'payment' | 'subscription' | 'admin' | 'ai' | 'manual';
  sourceId?: string;
  metadataJson?: string;
  expiresAt?: number | null;
};

export type CreditLedgerEntry = {
  operation_id: string;
  transaction_no: string;
  direction: CreditDirection;
  amount: number;
  balance_after: number;
  created_at: number;
};

type Wallet = {
  balance: number;
  version: number;
  last_operation_id: string | null;
};

type GrantLot = {
  id: string;
  remaining_amount: number;
  expires_at: number | null;
};

export class CreditError extends Error {
  readonly code: 'insufficient_credits' | 'invalid_credit_operation' | 'credit_conflict';
  readonly status: number;

  constructor(
    code: CreditError['code'],
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'CreditError';
    this.code = code;
    this.status = status;
  }
}

const maxAttempts = 3;
const now = () => Date.now();

const isPositiveInteger = (value: number): boolean =>
  Number.isInteger(value) && value > 0 && value <= 1_000_000_000;

const isOperationId = (value: string): boolean =>
  /^[A-Za-z0-9:_-]{8,160}$/.test(value);

const validateOperation = (operation: CreditOperation): void => {
  if (
    !operation.userId ||
    !isPositiveInteger(operation.amount) ||
    !isOperationId(operation.operationId) ||
    !isOperationId(operation.transactionNo) ||
    (operation.expiresAt !== undefined && operation.expiresAt !== null && (!Number.isInteger(operation.expiresAt) || operation.expiresAt < 0))
  ) {
    throw new CreditError('invalid_credit_operation', 'Invalid credit operation.', 400);
  }
};

const findLedger = async (
  env: Env,
  operationId: string,
): Promise<CreditLedgerEntry | null> =>
  env.DB.prepare(
    `SELECT operation_id, transaction_no, direction, amount, balance_after, created_at
     FROM credit_ledger WHERE operation_id = ?`,
  )
    .bind(operationId)
    .first<CreditLedgerEntry>();

const ensureWallet = async (env: Env, userId: string): Promise<void> => {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO credit_wallet
      (user_id, balance, version, last_operation_id, updated_at)
     VALUES (?, 0, 0, NULL, ?)`,
  )
    .bind(userId, now())
    .run();
};

const getWallet = async (env: Env, userId: string): Promise<Wallet> => {
  await ensureWallet(env, userId);
  const wallet = await env.DB.prepare(
    'SELECT balance, version, last_operation_id FROM credit_wallet WHERE user_id = ?',
  )
    .bind(userId)
    .first<Wallet>();
  if (!wallet) throw new CreditError('credit_conflict', 'Credit wallet is unavailable.', 409);
  return wallet;
};

const expireCredits = async (env: Env, userId: string): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const expired = await env.DB.prepare(
      `SELECT id, remaining_amount, expires_at
       FROM credit_ledger
       WHERE user_id = ? AND direction = 'grant' AND remaining_amount > 0
         AND expires_at IS NOT NULL AND expires_at <= ?
       ORDER BY expires_at ASC, created_at ASC LIMIT 500`,
    )
      .bind(userId, now())
      .all<GrantLot>();
    if (expired.results.length === 0) return;
    const wallet = await getWallet(env, userId);
    const amount = expired.results.reduce((sum, item) => sum + item.remaining_amount, 0);
    if (amount <= 0) return;
    const operationId = `expire:${crypto.randomUUID()}`;
    const transactionNo = `expire:${crypto.randomUUID()}`;
    const createdAt = now();
    const balanceAfter = wallet.balance - amount;
    if (balanceAfter < 0) {
      throw new CreditError('credit_conflict', 'Credit wallet needs reconciliation.', 409);
    }
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `UPDATE credit_wallet
         SET balance = ?, version = version + 1, last_operation_id = ?, updated_at = ?
         WHERE user_id = ? AND version = ? AND balance >= ?`,
      ).bind(balanceAfter, operationId, createdAt, userId, wallet.version, amount),
    ];
    for (const grant of expired.results) {
      statements.push(env.DB.prepare(
        `UPDATE credit_ledger SET remaining_amount = 0
         WHERE id = ? AND remaining_amount = ?
           AND EXISTS (
             SELECT 1 FROM credit_wallet
             WHERE user_id = ? AND version = ? AND last_operation_id = ?
           )`,
      ).bind(grant.id, grant.remaining_amount, userId, wallet.version + 1, operationId));
    }
    statements.push(env.DB.prepare(
      `INSERT INTO credit_ledger
        (id, user_id, wallet_version, operation_id, transaction_no, direction,
         amount, remaining_amount, balance_after, source_type, source_id,
         expires_at, metadata_json, created_at)
       SELECT ?, ?, ?, ?, ?, 'expire', ?, 0, ?, 'system', NULL, NULL, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM credit_wallet
         WHERE user_id = ? AND version = ? AND last_operation_id = ? AND balance = ?
       )`,
    ).bind(
      crypto.randomUUID(),
      userId,
      wallet.version + 1,
      operationId,
      transactionNo,
      -amount,
      balanceAfter,
      JSON.stringify({ grants: expired.results.map((item) => item.id) }),
      createdAt,
      userId,
      wallet.version + 1,
      operationId,
      balanceAfter,
    ));
    const results = await env.DB.batch(statements);
    if (results[0].meta.changes === 1) continue;
  }
  throw new CreditError('credit_conflict', 'Expired credits could not be reconciled.', 409);
};

export async function getCreditBalance(env: Env, userId: string): Promise<number> {
  await expireCredits(env, userId);
  const wallet = await getWallet(env, userId);
  return wallet.balance;
}

const applyOperation = async (
  env: Env,
  operation: CreditOperation,
  direction: CreditDirection,
): Promise<CreditLedgerEntry> => {
  validateOperation(operation);
  const existing = await findLedger(env, operation.operationId);
  if (existing) return existing;

  const signedAmount = direction === 'grant' ? operation.amount : -operation.amount;
  if (direction === 'consume') await expireCredits(env, operation.userId);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const wallet = await getWallet(env, operation.userId);
    if (direction === 'consume' && wallet.balance < operation.amount) {
      throw new CreditError('insufficient_credits', 'Insufficient credit balance.', 409);
    }
    const balanceAfter = wallet.balance + signedAmount;
    const createdAt = now();
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `UPDATE credit_wallet
         SET balance = ?, version = version + 1, last_operation_id = ?, updated_at = ?
         WHERE user_id = ? AND version = ? AND balance + ? >= 0
           AND (last_operation_id IS NULL OR last_operation_id <> ?)`,
      ).bind(
        balanceAfter,
        operation.operationId,
        createdAt,
        operation.userId,
        wallet.version,
        signedAmount,
        operation.operationId,
      ),
    ];

    const allocations: Array<{ grant: GrantLot; amount: number }> = [];
    if (direction === 'consume') {
      const grants = await env.DB.prepare(
        `SELECT id, remaining_amount, expires_at
         FROM credit_ledger
         WHERE user_id = ? AND direction = 'grant' AND remaining_amount > 0
           AND (expires_at IS NULL OR expires_at > ?)
         ORDER BY CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END,
                  expires_at ASC, created_at ASC
         LIMIT 500`,
      )
        .bind(operation.userId, createdAt)
        .all<GrantLot>();
      let remaining = operation.amount;
      for (const grant of grants.results) {
        if (remaining <= 0) break;
        const amount = Math.min(remaining, grant.remaining_amount);
        allocations.push({ grant, amount });
        remaining -= amount;
      }
      if (remaining > 0) {
        throw new CreditError('credit_conflict', 'Credit grants need reconciliation.', 409);
      }
      for (const allocation of allocations) {
        statements.push(env.DB.prepare(
          `UPDATE credit_ledger
           SET remaining_amount = remaining_amount - ?
           WHERE id = ? AND remaining_amount = ?
             AND EXISTS (
               SELECT 1 FROM credit_wallet
               WHERE user_id = ? AND version = ? AND last_operation_id = ?
             )`,
        ).bind(
          allocation.amount,
          allocation.grant.id,
          allocation.grant.remaining_amount,
          operation.userId,
          wallet.version + 1,
          operation.operationId,
        ));
      }
    }

    statements.push(
      env.DB.prepare(
        `INSERT INTO credit_ledger
          (id, user_id, wallet_version, operation_id, transaction_no, direction,
           amount, remaining_amount, balance_after, source_type, source_id,
           expires_at, metadata_json, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM credit_wallet
           WHERE user_id = ? AND version = ? AND last_operation_id = ? AND balance = ?
         )`,
      ).bind(
        crypto.randomUUID(),
        operation.userId,
        wallet.version + 1,
        operation.operationId,
        operation.transactionNo,
        direction,
        signedAmount,
        direction === 'grant' ? operation.amount : 0,
        balanceAfter,
        operation.sourceType,
        operation.sourceId ?? null,
        operation.expiresAt ?? null,
        operation.metadataJson ?? '{}',
        createdAt,
        operation.userId,
        wallet.version + 1,
        operation.operationId,
        balanceAfter,
      ),
    );

    try {
      const results = await env.DB.batch(statements);
      const walletUpdate = results[0];
      const ledger = await findLedger(env, operation.operationId);
      const allocationResults = results.slice(1, 1 + allocations.length);
      const allocationsApplied = allocationResults.every((result) => result.meta.changes === 1);
      if (walletUpdate.meta.changes === 1 && allocationsApplied && ledger) return ledger;
      if (ledger) return ledger;
    } catch {
      const ledger = await findLedger(env, operation.operationId);
      if (ledger) return ledger;
    }
  }
  throw new CreditError('credit_conflict', 'Credit operation conflicted; retry it.', 409);
};

export async function grantCredits(
  env: Env,
  operation: CreditOperation,
): Promise<CreditLedgerEntry> {
  return applyOperation(env, operation, 'grant');
}

export async function consumeCredits(
  env: Env,
  operation: CreditOperation,
): Promise<CreditLedgerEntry> {
  return applyOperation(env, operation, 'consume');
}

export async function handleCreditsApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (request.method !== 'GET') return apiError('method_not_allowed', 'Use GET.', 405);
  const requestedLimit = Number(url.searchParams.get('limit') ?? '30');
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
    return apiError('invalid_limit', 'Limit must be an integer between 1 and 100.', 400);
  }
  const balance = await getCreditBalance(env, userId);
  const entries = await env.DB.prepare(
    `SELECT operation_id, transaction_no, direction, amount, balance_after,
            source_type, source_id, expires_at, created_at
     FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(userId, requestedLimit)
    .all<Record<string, unknown>>();
  return apiJson({ data: { balance, entries: entries.results } });
}
