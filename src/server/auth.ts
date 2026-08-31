import { betterAuth } from 'better-auth';
import type { Env } from './env';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { getConfigs } from './config';
import { grantCredits } from './credits';

export type AuthEnv = Env;

export const createAuth = (env: AuthEnv) => {
  const requireEmailVerification = env.EMAIL_VERIFICATION_REQUIRED === 'true';
  return betterAuth({
  database: env.DB,
  appName: 'DroneRF DIY',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    'https://dronerfdiy.com',
    'https://www.dronerfdiy.com',
    'http://localhost:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ],
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => sendVerificationEmail(env, user, url),
    sendOnSignUp: requireEmailVerification,
    sendOnSignIn: requireEmailVerification,
    autoSignInAfterVerification: true,
    expiresIn: 3_600,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification,
    sendResetPassword: async ({ user, url }) => sendPasswordResetEmail(env, user, url),
    resetPasswordTokenExpiresIn: 3_600,
  },
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
    ipAddress: { disableIpTracking: true },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await env.DB.prepare('INSERT OR IGNORE INTO role (id, name) VALUES (?, ?)').bind('user', 'user').run();
          await env.DB.prepare('INSERT OR IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)').bind(user.id, 'user').run();
          const initialAdminEmail = env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
          if (initialAdminEmail && user.email.toLowerCase() === initialAdminEmail) {
            await env.DB.prepare(
              'INSERT OR IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)',
            )
              .bind(user.id, 'super_admin')
              .run();
          }
          try {
            const creditConfig = await getConfigs(env, [
              'initial_credits_enabled',
              'initial_credits_amount',
              'initial_credits_valid_days',
            ]);
            const amount = Number(creditConfig.initial_credits_amount ?? '0');
            const validDays = Number(creditConfig.initial_credits_valid_days ?? '0');
            if (
              creditConfig.initial_credits_enabled === 'true'
              && Number.isInteger(amount)
              && amount > 0
            ) {
              await grantCredits(env, {
                userId: user.id,
                amount,
                operationId: `signup:${user.id}`,
                transactionNo: `signup:${user.id}`,
                sourceType: 'signup',
                sourceId: user.id,
                expiresAt: Number.isInteger(validDays) && validDays > 0
                  ? Date.now() + validDays * 86_400_000
                  : null,
              });
            }
          } catch {
            // Account creation must remain available if optional welcome credits fail.
          }
        },
      },
    },
  },
  });
};

export const requireSession = async (request: Request, env: AuthEnv) => {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ? session : null;
};
