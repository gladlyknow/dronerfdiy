const base = process.env.DRONERF_LOCAL_URL ?? 'http://127.0.0.1:8787';
const parsedBase = new URL(base);
if (!['127.0.0.1', 'localhost'].includes(parsedBase.hostname)) {
  throw new Error('This verification script only runs against a local Worker.');
}

const cookies = new Map();

const updateCookies = (response) => {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  for (const value of values) {
    const first = value.split(';', 1)[0];
    const separator = first.indexOf('=');
    if (separator > 0) cookies.set(first.slice(0, separator), first.slice(separator + 1));
  }
};

const request = async (path, options = {}, expected = [200]) => {
  const headers = new Headers(options.headers);
  headers.set('origin', parsedBase.origin);
  if (options.body !== undefined) headers.set('content-type', 'application/json');
  if (cookies.size > 0) {
    headers.set('cookie', [...cookies].map(([name, value]) => `${name}=${value}`).join('; '));
  }
  const response = await fetch(new URL(path, parsedBase), {
    ...options,
    headers,
    redirect: 'manual',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  updateCookies(response);
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!expected.includes(response.status)) {
    throw new Error(`${options.method ?? 'GET'} ${path} returned ${response.status}: ${text.slice(0, 500)}`);
  }
  return { response, payload };
};

const dataOf = (result) => {
  if (!result.payload || typeof result.payload !== 'object' || !('data' in result.payload)) {
    throw new Error('Expected an API data envelope.');
  }
  return result.payload.data;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const legacyRadio = await request('/redio/cn/zh/tools/?source=legacy', {}, [301]);
assert(
  legacyRadio.response.headers.get('location') === `${parsedBase.origin}/radio/cn/zh/tools/?source=legacy`,
  'The legacy /redio path did not preserve its suffix and query in the permanent redirect.',
);
const radioLanding = await request('/radio/cn/zh/license/', {}, [200]);
assert(typeof radioLanding.payload === 'string' && radioLanding.payload.includes('rel="canonical" href="https://dronerfdiy.com/radio/cn/zh/license/"'), 'The prerendered CN license page is missing.');
const sitemap = await request('/sitemap.xml', {}, [200]);
assert(typeof sitemap.payload === 'string' && sitemap.payload.includes('https://dronerfdiy.com/radio/us/en/ham-radio-license/'), 'The root sitemap is missing the US license hub.');

const email = 'admin@local.test';
const signup = await request('/api/auth/sign-up/email', {
  method: 'POST',
  body: { name: 'Local Admin', email, password: 'local-only-password-2026' },
}, [200, 400, 422]);
if (signup.response.status !== 200) {
  await request('/api/auth/sign-in/email', {
    method: 'POST',
    body: { email, password: 'local-only-password-2026' },
  }, [200]);
}

const me = dataOf(await request('/api/v1/me'));
assert(me.user?.email === email, 'Authenticated user was not returned.');
const userId = me.user.id;

await request('/api/v1/favorites/knowledge/local-e2e', { method: 'PUT' });
const favorites = dataOf(await request('/api/v1/favorites'));
assert(Array.isArray(favorites) && favorites.some((item) => item.resource_id === 'local-e2e'), 'Favorite sync failed.');

const dashboard = dataOf(await request('/api/v1/admin/dashboard'));
assert(dashboard.users === 1, 'Initial administrator role or dashboard failed.');

await request(`/api/v1/admin/credits/${encodeURIComponent(userId)}`, {
  method: 'POST',
  body: { amount: 5, reason: 'Local end-to-end verification', requestId: 'local-credit-e2e-01' },
});
let credits = dataOf(await request('/api/v1/credits?limit=20'));
assert(credits.balance === 5, 'Administrator credit grant failed.');

await request('/api/v1/admin/config', {
  method: 'PUT',
  body: {
    values: {
      ai_enabled: 'true',
      ai_chat_credits: '1',
      ai_models_json: JSON.stringify([{
        provider: 'openrouter',
        model: 'local/e2e-model',
        label: 'Local verification model',
        taskTypes: ['chat'],
      }]),
    },
  },
});

const chat = dataOf(await request('/api/v1/ai/chats', {
  method: 'POST',
  body: { provider: 'openrouter', model: 'local/e2e-model', title: '本地验证' },
}, [201]));
const failedTask = dataOf(await request(`/api/v1/ai/chats/${encodeURIComponent(chat.id)}/messages`, {
  method: 'POST',
  body: { requestId: `local-chat-e2e-${chat.id}`, content: '验证失败任务自动退回积分。' },
}, [502]));
assert(failedTask.status === 'failed' && failedTask.refunded === true, 'AI failure was not recorded and refunded.');
credits = dataOf(await request('/api/v1/credits?limit=20'));
assert(credits.balance === 5, 'AI failure changed the final credit balance.');
assert(credits.entries.some((entry) => entry.operation_id === `ai:${failedTask.id}`), 'AI debit ledger entry is missing.');
assert(credits.entries.some((entry) => entry.operation_id === `ai-refund:${failedTask.id}`), 'AI refund ledger entry is missing.');

const exam = dataOf(await request('/api/v1/exams', { method: 'POST', body: { level: 'A' } }, [201]));
assert(Array.isArray(exam.questionIds) && exam.questionIds.length > 0, 'Server-side exam generation failed.');
const firstQuestionId = exam.questionIds[0];
await request(`/api/v1/exams/${encodeURIComponent(exam.sessionId)}/answers/${encodeURIComponent(firstQuestionId)}`, {
  method: 'PUT',
  body: { selectedAnswer: 'A', displayedOrder: 'ABCD' },
});
const activeExam = dataOf(await request(`/api/v1/exams/${encodeURIComponent(exam.sessionId)}`));
assert(activeExam.session.status === 'active', 'Active exam detail was not returned.');
assert(
  activeExam.attempts.every((attempt) => !('correct_answer' in attempt) && !('is_correct' in attempt)),
  'An active exam leaked its answer key.',
);
const submittedExam = dataOf(await request(`/api/v1/exams/${encodeURIComponent(exam.sessionId)}/submit`, {
  method: 'POST',
  body: { elapsedSeconds: 42 },
}));
assert(submittedExam.total === exam.questionIds.length, 'Exam submission did not settle every question.');
const completedExam = dataOf(await request(`/api/v1/exams/${encodeURIComponent(exam.sessionId)}`));
assert(completedExam.session.status === 'completed', 'Exam session did not complete.');
assert(completedExam.attempts.every((attempt) => 'correct_answer' in attempt && 'is_correct' in attempt), 'Completed exam result is incomplete.');
const exams = dataOf(await request('/api/v1/exams?limit=10'));
assert(Array.isArray(exams) && exams.some((item) => item.id === exam.sessionId), 'Exam history persistence failed.');

const products = dataOf(await request('/api/v1/products'));
assert(Array.isArray(products.products) && products.products.length === 0, 'Inactive products leaked into the public catalog.');
await request('/api/v1/checkout', {
  method: 'POST',
  body: { productId: 'credit-pack', requestId: 'local-checkout-e2e-01' },
}, [503]);

const secrets = dataOf(await request('/api/v1/admin/secrets'));
assert(Object.values(secrets.states).every((state) => state.configured === false), 'Unexpected provider secret is configured locally.');

console.log('Local Worker E2E passed: radio redirect/SEO, auth, admin, learning, credits, AI refund, full exam submission, catalog, and secret states.');
