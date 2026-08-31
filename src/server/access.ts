import type { Env } from './env';

export async function hasPermission(
  env: Env,
  userId: string,
  permission: string,
): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1 AS allowed
     FROM user_role ur
     JOIN role r ON r.id = ur.role_id
     LEFT JOIN role_permission rp ON rp.role_id = r.id
     LEFT JOIN permission p ON p.id = rp.permission_id
     WHERE ur.user_id = ?
       AND (r.name = 'super_admin' OR p.name = ?)
     LIMIT 1`,
  )
    .bind(userId, permission)
    .first<{ allowed: number }>();
  return row?.allowed === 1;
}

export async function writeAdminAudit(
  env: Env,
  input: {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: unknown;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO admin_audit_log
      (id, actor_user_id, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      input.actorUserId,
      input.action,
      input.targetType,
      input.targetId ?? null,
      input.metadata === undefined ? '{}' : JSON.stringify(input.metadata),
      Date.now(),
    )
    .run();
}
