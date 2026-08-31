import type { Env } from './env';
import { getConfig } from './config';
import { getSecret } from './secrets';

type EmailKind = 'verification' | 'password_reset' | 'welcome' | 'payment' | 'system';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: EmailKind;
  userId?: string | null;
  idempotencyKey?: string;
};

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export async function sendEmail(env: Env, input: SendEmailInput): Promise<string> {
  const apiKey = await getSecret(env, 'resend_api_key');
  if (!apiKey) throw new Error('Email service is not configured.');
  const from = env.MAIL_FROM?.trim()
    || await getConfig(env, 'mail_from', 'DroneRF DIY <noreply@dronerfdiy.com>');
  const deliveryId = crypto.randomUUID();
  const createdAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO email_delivery
      (id, user_id, recipient, kind, subject, provider, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'resend', 'sending', ?, ?)`,
  )
    .bind(
      deliveryId,
      input.userId ?? null,
      input.to.toLowerCase(),
      input.kind,
      input.subject,
      createdAt,
      createdAt,
    )
    .run();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        ...(input.idempotencyKey ? { 'idempotency-key': input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    const result = await response.json()
      .catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !result.id) {
      throw new Error(result.message || `Resend request failed with status ${response.status}.`);
    }
    await env.DB.prepare(
      `UPDATE email_delivery
       SET status = 'sent', provider_message_id = ?, sent_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(result.id, Date.now(), Date.now(), deliveryId)
      .run();
    return result.id;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1_000) : 'Email delivery failed.';
    await env.DB.prepare(
      `UPDATE email_delivery SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(message, Date.now(), deliveryId)
      .run();
    throw error;
  }
}

const actionEmail = (
  title: string,
  description: string,
  actionLabel: string,
  actionUrl: string,
): { html: string; text: string } => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeLabel = escapeHtml(actionLabel);
  const safeUrl = escapeHtml(actionUrl);
  return {
    html: `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#071523;color:#eaf2fb;font-family:system-ui,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="color:#58dcfb;font-weight:800;letter-spacing:.12em">DRONERF DIY</p><h1 style="font-size:24px">${safeTitle}</h1><p style="color:#b7c8dc;line-height:1.8">${safeDescription}</p><p style="margin:30px 0"><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#ff9848;color:#071523;text-decoration:none;font-weight:800">${safeLabel}</a></p><p style="color:#7f99b3;font-size:12px;word-break:break-all">若按钮无法打开，请复制：${safeUrl}</p></div></body></html>`,
    text: `${title}\n\n${description}\n\n${actionLabel}: ${actionUrl}`,
  };
};

export async function sendVerificationEmail(
  env: Env,
  user: { id: string; email?: string; name: string },
  url: string,
): Promise<void> {
  if (!user.email) throw new Error('User email is unavailable.');
  const content = actionEmail(
    '验证你的邮箱',
    `${user.name || '你好'}，请完成邮箱验证，以启用 DroneRF DIY 云同步与账户功能。`,
    '验证邮箱',
    url,
  );
  await sendEmail(env, {
    to: user.email,
    subject: '验证你的 DroneRF DIY 邮箱',
    kind: 'verification',
    userId: user.id,
    idempotencyKey: `verify-${user.id}-${await shortDigest(url)}`,
    ...content,
  });
}

export async function sendPasswordResetEmail(
  env: Env,
  user: { id: string; email?: string; name: string },
  url: string,
): Promise<void> {
  if (!user.email) throw new Error('User email is unavailable.');
  const content = actionEmail(
    '重置账户密码',
    `${user.name || '你好'}，我们收到了密码重置请求。如果不是你本人操作，可以忽略此邮件。`,
    '重置密码',
    url,
  );
  await sendEmail(env, {
    to: user.email,
    subject: '重置 DroneRF DIY 密码',
    kind: 'password_reset',
    userId: user.id,
    idempotencyKey: `reset-${user.id}-${await shortDigest(url)}`,
    ...content,
  });
}

async function shortDigest(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].slice(0, 12)
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}
