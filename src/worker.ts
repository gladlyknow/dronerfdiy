import { createAuth, requireSession } from './server/auth';
import type { Env } from './server/env';
import { apiError, apiJson } from './server/http';
import { handleExamsApi, handleMasteryApi } from './server/exams';
import { handleLearningApi } from './server/learning';
import { handleCreditsApi } from './server/credits';
import { handleAdminApi } from './server/admin';
import { handleAiApi } from './server/ai';
import {
  handleCommerceApi,
  handleCommerceCallback,
  handleCommercePublicApi,
  handleCommerceWebhook,
} from './server/commerce';


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname.startsWith('/api/auth/')) return createAuth(env).handler(request);
    if (url.pathname.startsWith('/api/v1/webhooks/')) {
      return handleCommerceWebhook(request, env, url);
    }
    if (url.pathname.startsWith('/api/v1/payments/callback/')) {
      return handleCommerceCallback(request, env, url);
    }
    if (url.pathname === '/api/v1/products') return handleCommercePublicApi(request, env, url);
    if (url.pathname.startsWith('/api/v1/admin/')) {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleAdminApi(request, env, session.user.id, url);
    }
    if (url.pathname.startsWith('/api/v1/exams')) {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleExamsApi(request, env, session.user.id, url);
    }
    if (url.pathname.startsWith('/api/v1/mastery')) {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleMasteryApi(request, env, session.user.id, url);
    }
    if (url.pathname === '/api/v1/credits') {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleCreditsApi(request, env, session.user.id, url);
    }
    if (url.pathname.startsWith('/api/v1/ai/')) {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleAiApi(request, env, session.user.id, url);
    }
    if (url.pathname === '/api/v1/checkout'
      || url.pathname === '/api/v1/orders'
      || url.pathname === '/api/v1/subscriptions'
      || url.pathname === '/api/v1/billing-portal'
      || url.pathname.startsWith('/api/v1/subscriptions/')) {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleCommerceApi(request, env, session.user.id, url);
    }
    if (url.pathname.startsWith('/api/v1/favorites') || url.pathname.startsWith('/api/v1/activities') || url.pathname.startsWith('/api/v1/progress') || url.pathname === '/api/v1/import/local') {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return handleLearningApi(request, env, session.user.id, url);
    }
    if (url.pathname === '/api/v1/me' && request.method === 'GET') {
      const session = await requireSession(request, env);
      if (!session) return apiError('unauthorized', 'Authentication is required.', 401);
      return apiJson({ data: { user: session.user, session: session.session } });
    }
    return apiError('not_found', 'Unknown API route.', 404);
  },
} satisfies ExportedHandler<Env>;
