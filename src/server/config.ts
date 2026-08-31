import type { Env } from './env';

export type ConfigMap = Record<string, string>;

export async function getConfig(
  env: Env,
  name: string,
  fallback = '',
): Promise<string> {
  const row = await env.DB.prepare(
    'SELECT value FROM app_config WHERE name = ?',
  )
    .bind(name)
    .first<{ value: string | null }>();
  return row?.value ?? fallback;
}

export async function getConfigs(
  env: Env,
  names?: readonly string[],
): Promise<ConfigMap> {
  if (names && names.length === 0) return {};
  const result = names
    ? await env.DB.prepare(
        `SELECT name, value FROM app_config WHERE name IN (${names.map(() => '?').join(', ')})`,
      )
        .bind(...names)
        .all<{ name: string; value: string | null }>()
    : await env.DB.prepare('SELECT name, value FROM app_config ORDER BY name')
        .all<{ name: string; value: string | null }>();
  return Object.fromEntries(result.results.map((row) => [row.name, row.value ?? '']));
}

export async function setConfig(
  env: Env,
  name: string,
  value: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO app_config (name, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
  )
    .bind(name, value, Date.now())
    .run();
}
