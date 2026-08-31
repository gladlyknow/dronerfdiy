import type { Env } from './env';

export const secretNames = [
  'stripe_secret_key',
  'stripe_webhook_secret',
  'creem_api_key',
  'creem_webhook_secret',
  'paypal_client_id',
  'paypal_client_secret',
  'paypal_webhook_id',
  'resend_api_key',
  'openrouter_api_key',
  'gemini_api_key',
  'replicate_api_token',
  'replicate_webhook_secret',
  'fal_api_key',
  'kie_api_key',
] as const;

export type SecretName = (typeof secretNames)[number];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
};

const base64ToBytes = (value: string): Uint8Array => {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const keyFor = async (env: Env): Promise<CryptoKey> => {
  const material = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`dronerfdiy:app-secret:v1:${env.BETTER_AUTH_SECRET}`),
  );
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

const environmentSecret = (env: Env, name: SecretName): string | undefined => {
  const values: Record<SecretName, string | undefined> = {
    stripe_secret_key: env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: env.STRIPE_WEBHOOK_SECRET,
    creem_api_key: env.CREEM_API_KEY,
    creem_webhook_secret: env.CREEM_WEBHOOK_SECRET,
    paypal_client_id: env.PAYPAL_CLIENT_ID,
    paypal_client_secret: env.PAYPAL_CLIENT_SECRET,
    paypal_webhook_id: env.PAYPAL_WEBHOOK_ID,
    resend_api_key: env.RESEND_API_KEY,
    openrouter_api_key: env.OPENROUTER_API_KEY,
    gemini_api_key: env.GEMINI_API_KEY,
    replicate_api_token: env.REPLICATE_API_TOKEN,
    replicate_webhook_secret: env.REPLICATE_WEBHOOK_SECRET,
    fal_api_key: env.FAL_API_KEY,
    kie_api_key: env.KIE_API_KEY,
  };
  const value = values[name]?.trim();
  return value || undefined;
};

export async function getSecret(env: Env, name: SecretName): Promise<string | null> {
  const direct = environmentSecret(env, name);
  if (direct) return direct;
  const row = await env.DB.prepare(
    'SELECT ciphertext, iv FROM app_secret WHERE name = ?',
  )
    .bind(name)
    .first<{ ciphertext: string; iv: string }>();
  if (!row) return null;
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(row.iv),
        additionalData: encoder.encode(name),
      },
      await keyFor(env),
      base64ToBytes(row.ciphertext),
    );
    return decoder.decode(decrypted);
  } catch {
    throw new Error(`Stored secret ${name} cannot be decrypted.`);
  }
}

export async function setSecret(env: Env, name: SecretName, value: string): Promise<void> {
  const normalized = value.trim();
  if (!normalized || normalized.length > 16_384) {
    throw new Error('Secret value is empty or too long.');
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encoder.encode(name),
    },
    await keyFor(env),
    encoder.encode(normalized),
  );
  await env.DB.prepare(
    `INSERT INTO app_secret (name, ciphertext, iv, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       ciphertext = excluded.ciphertext,
       iv = excluded.iv,
       updated_at = excluded.updated_at`,
  )
    .bind(name, bytesToBase64(new Uint8Array(ciphertext)), bytesToBase64(iv), Date.now())
    .run();
}

export async function deleteSecret(env: Env, name: SecretName): Promise<void> {
  await env.DB.prepare('DELETE FROM app_secret WHERE name = ?').bind(name).run();
}

export async function getSecretStates(
  env: Env,
): Promise<Record<SecretName, { configured: boolean; source: 'environment' | 'database' | 'none' }>> {
  const stored = await env.DB.prepare('SELECT name FROM app_secret').all<{ name: string }>();
  const storedNames = new Set(stored.results.map((row) => row.name));
  return Object.fromEntries(secretNames.map((name) => {
    const source = environmentSecret(env, name)
      ? 'environment'
      : storedNames.has(name)
        ? 'database'
        : 'none';
    return [name, { configured: source !== 'none', source }];
  })) as Record<SecretName, { configured: boolean; source: 'environment' | 'database' | 'none' }>;
}
