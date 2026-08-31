import type { Env } from './env';
import { apiError, apiJson } from './http';
import { getConfig, getConfigs } from './config';
import { isBoundedText, isRecord, isTrustedWriteOrigin, readJsonBody } from './validation';
import {
  createMediaTask,
  generateChatCompletion,
  queryMediaTask,
  type ChatMessageInput,
  type MediaProvider,
  type MediaTaskType,
  type TextProvider,
} from './ai-providers';
import { consumeCredits, CreditError, grantCredits } from './credits';

type AiTaskType = 'chat' | MediaTaskType;
type AiProvider = TextProvider | MediaProvider;

type ModelSpec = {
  provider: AiProvider;
  model: string;
  label: string;
  taskTypes: AiTaskType[];
};

type ChatRow = {
  id: string;
  user_id: string;
  title: string;
  provider: string;
  model: string;
  status: string;
  created_at: number;
  updated_at: number;
};

type MessageRow = {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content_json: string;
  provider: string | null;
  model: string | null;
  usage_json: string;
  status: string;
  created_at: number;
};

type TaskRow = {
  id: string;
  user_id: string;
  chat_id: string | null;
  client_request_id: string;
  provider: string;
  model: string;
  task_type: AiTaskType;
  provider_task_id: string | null;
  status: 'created' | 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  input_json: string;
  output_json: string | null;
  error_message: string | null;
  credit_operation_id: string | null;
  cost_credits: number;
  refunded_at: number | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
};

class AiApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AiApiError';
  }
}

const textProviders = new Set<AiProvider>(['openrouter', 'gemini']);
const mediaProviders = new Set<AiProvider>(['replicate', 'fal', 'kie']);
const taskTypes = new Set<AiTaskType>(['chat', 'image', 'video', 'music']);
const requestIdPattern = /^[A-Za-z0-9:_-]{8,120}$/;
const modelPattern = /^[A-Za-z0-9._:/-]{2,200}$/;

const safeParse = (value: string | null, fallback: unknown): unknown => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
};

const pruneJson = (value: unknown, depth = 0): unknown => {
  if (depth > 8) return '[truncated]';
  if (typeof value === 'string') return value.slice(0, 20_000);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => pruneJson(item, depth + 1));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).slice(0, 100).map(([key, item]) => [key.slice(0, 120), pruneJson(item, depth + 1)]),
    );
  }
  return String(value).slice(0, 1_000);
};

const boundedJson = (value: unknown): string => {
  const serialized = JSON.stringify(pruneJson(value));
  return serialized.length <= 300_000
    ? serialized
    : JSON.stringify({ truncated: true, reason: 'provider_output_too_large' });
};

const parseModels = (value: string): ModelSpec[] => {
  const parsed = safeParse(value, []);
  if (!Array.isArray(parsed)) return [];
  const models: ModelSpec[] = [];
  for (const item of parsed) {
    if (!isRecord(item)) continue;
    const provider = item.provider;
    const model = item.model;
    const rawTaskTypes = item.taskTypes;
    if (
      typeof provider !== 'string'
      || (!textProviders.has(provider as AiProvider) && !mediaProviders.has(provider as AiProvider))
      || typeof model !== 'string'
      || !modelPattern.test(model)
      || !Array.isArray(rawTaskTypes)
    ) continue;
    const allowedTasks = rawTaskTypes.filter(
      (task): task is AiTaskType => typeof task === 'string' && taskTypes.has(task as AiTaskType),
    );
    const compatibleTasks = allowedTasks.filter((task) => (
      task === 'chat' ? textProviders.has(provider as AiProvider) : mediaProviders.has(provider as AiProvider)
    ));
    if (compatibleTasks.length === 0) continue;
    models.push({
      provider: provider as AiProvider,
      model,
      label: typeof item.label === 'string' ? item.label.slice(0, 80) : model,
      taskTypes: [...new Set(compatibleTasks)],
    });
  }
  return models;
};

const getModels = async (env: Env): Promise<ModelSpec[]> =>
  parseModels(await getConfig(env, 'ai_models_json', '[]'));

const requireModel = (
  models: ModelSpec[],
  provider: unknown,
  model: unknown,
  taskType: AiTaskType,
): ModelSpec => {
  if (typeof provider !== 'string' || typeof model !== 'string') {
    throw new AiApiError('invalid_ai_model', 'AI provider and model are required.', 400);
  }
  const selected = models.find((entry) => (
    entry.provider === provider && entry.model === model && entry.taskTypes.includes(taskType)
  ));
  if (!selected) throw new AiApiError('ai_model_not_allowed', 'This AI model is not enabled.', 400);
  return selected;
};

const getCost = async (env: Env, taskType: AiTaskType): Promise<number> => {
  const raw = await getConfig(env, `ai_${taskType}_credits`, '0');
  const cost = Number(raw);
  if (!Number.isInteger(cost) || cost < 0 || cost > 1_000_000) {
    throw new AiApiError('invalid_ai_cost', 'AI credit pricing is misconfigured.', 503);
  }
  return cost;
};

const ensureEnabled = async (env: Env): Promise<void> => {
  if (await getConfig(env, 'ai_enabled', 'false') !== 'true') {
    throw new AiApiError('ai_disabled', 'AI service is not enabled.', 503);
  }
};

const publicTask = (task: TaskRow) => ({
  id: task.id,
  chatId: task.chat_id,
  requestId: task.client_request_id,
  provider: task.provider,
  model: task.model,
  taskType: task.task_type,
  providerTaskId: task.provider_task_id,
  status: task.status,
  input: safeParse(task.input_json, {}),
  output: safeParse(task.output_json, null),
  error: task.error_message,
  costCredits: task.cost_credits,
  refunded: task.refunded_at !== null,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  completedAt: task.completed_at,
});

const getTask = async (env: Env, userId: string, taskId: string): Promise<TaskRow | null> =>
  env.DB.prepare(
    `SELECT id, user_id, chat_id, client_request_id, provider, model, task_type,
            provider_task_id, status, input_json, output_json, error_message,
            credit_operation_id, cost_credits, refunded_at, created_at, updated_at, completed_at
     FROM ai_task WHERE id = ? AND user_id = ?`,
  )
    .bind(taskId, userId)
    .first<TaskRow>();

const getTaskByRequest = async (
  env: Env,
  userId: string,
  requestId: string,
): Promise<TaskRow | null> =>
  env.DB.prepare(
    `SELECT id, user_id, chat_id, client_request_id, provider, model, task_type,
            provider_task_id, status, input_json, output_json, error_message,
            credit_operation_id, cost_credits, refunded_at, created_at, updated_at, completed_at
     FROM ai_task WHERE user_id = ? AND client_request_id = ?`,
  )
    .bind(userId, requestId)
    .first<TaskRow>();

const claimTask = async (
  env: Env,
  input: {
    userId: string;
    chatId?: string | null;
    requestId: string;
    provider: AiProvider;
    model: string;
    taskType: AiTaskType;
    cost: number;
    inputJson: string;
  },
): Promise<TaskRow> => {
  const taskId = crypto.randomUUID();
  const createdAt = Date.now();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ai_task
      (id, user_id, chat_id, client_request_id, provider, model, task_type, status,
       input_json, cost_credits, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?)`,
  )
    .bind(
      taskId,
      input.userId,
      input.chatId ?? null,
      input.requestId,
      input.provider,
      input.model,
      input.taskType,
      input.inputJson,
      input.cost,
      createdAt,
      createdAt,
    )
    .run();
  const task = await getTaskByRequest(env, input.userId, input.requestId);
  if (!task) throw new AiApiError('ai_task_unavailable', 'AI task could not be created.', 409);
  if (
    task.chat_id !== (input.chatId ?? null)
    || task.provider !== input.provider
    || task.model !== input.model
    || task.task_type !== input.taskType
    || task.input_json !== input.inputJson
  ) {
    throw new AiApiError('request_id_conflict', 'This request ID was already used for another AI task.', 409);
  }
  return task;
};

const acquireTask = async (env: Env, task: TaskRow): Promise<boolean> => {
  const result = await env.DB.prepare(
    `UPDATE ai_task SET status = 'running', updated_at = ?
     WHERE id = ? AND status = 'created'`,
  )
    .bind(Date.now(), task.id)
    .run();
  return result.meta.changes === 1;
};

const hasConsumedCredits = async (env: Env, task: TaskRow): Promise<boolean> => {
  if (task.cost_credits === 0) return false;
  const row = await env.DB.prepare(
    `SELECT 1 AS found FROM credit_ledger
     WHERE user_id = ? AND operation_id = ? AND direction = 'consume' LIMIT 1`,
  )
    .bind(task.user_id, `ai:${task.id}`)
    .first<{ found: number }>();
  return row?.found === 1;
};

const refundTask = async (env: Env, task: TaskRow): Promise<void> => {
  if (task.cost_credits <= 0 || task.refunded_at !== null || !await hasConsumedCredits(env, task)) return;
  await grantCredits(env, {
    userId: task.user_id,
    amount: task.cost_credits,
    operationId: `ai-refund:${task.id}`,
    transactionNo: `ai-refund:${task.id}`,
    sourceType: 'ai',
    sourceId: task.id,
    metadataJson: JSON.stringify({ reason: 'provider_failure', taskType: task.task_type }),
  });
  await env.DB.prepare(
    'UPDATE ai_task SET refunded_at = COALESCE(refunded_at, ?), updated_at = ? WHERE id = ?',
  )
    .bind(Date.now(), Date.now(), task.id)
    .run();
};

const failTask = async (env: Env, task: TaskRow, error: unknown): Promise<TaskRow> => {
  const message = error instanceof Error ? error.message.slice(0, 1_000) : 'AI provider request failed.';
  const completedAt = Date.now();
  await env.DB.prepare(
    `UPDATE ai_task
     SET status = 'failed', error_message = ?, updated_at = ?, completed_at = ?
     WHERE id = ? AND status NOT IN ('completed', 'canceled')`,
  )
    .bind(message, completedAt, completedAt, task.id)
    .run();
  const failed = await getTask(env, task.user_id, task.id);
  if (!failed) throw new AiApiError('ai_task_unavailable', 'AI task could not be loaded.', 409);
  await refundTask(env, failed);
  return await getTask(env, task.user_id, task.id) ?? failed;
};

const chargeTask = async (env: Env, task: TaskRow): Promise<void> => {
  if (task.cost_credits === 0) return;
  const operationId = `ai:${task.id}`;
  await consumeCredits(env, {
    userId: task.user_id,
    amount: task.cost_credits,
    operationId,
    transactionNo: operationId,
    sourceType: 'ai',
    sourceId: task.id,
    metadataJson: JSON.stringify({ provider: task.provider, model: task.model, taskType: task.task_type }),
  });
  await env.DB.prepare(
    'UPDATE ai_task SET credit_operation_id = ?, updated_at = ? WHERE id = ?',
  )
    .bind(operationId, Date.now(), task.id)
    .run();
};

const contentText = (contentJson: string): string => {
  const parsed = safeParse(contentJson, {});
  return isRecord(parsed) && typeof parsed.text === 'string' ? parsed.text : '';
};

const handleModels = async (env: Env): Promise<Response> => {
  const [enabled, models, costs] = await Promise.all([
    getConfig(env, 'ai_enabled', 'false'),
    getModels(env),
    getConfigs(env, ['ai_chat_credits', 'ai_image_credits', 'ai_video_credits', 'ai_music_credits']),
  ]);
  return apiJson({ data: { enabled: enabled === 'true', models, costs } });
};

const handleChatsCollection = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (request.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? '30');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return apiError('invalid_limit', 'Limit must be between 1 and 100.', 400);
    }
    const chats = await env.DB.prepare(
      `SELECT id, title, provider, model, status, created_at, updated_at
       FROM ai_chat WHERE user_id = ? AND status <> 'deleted'
       ORDER BY updated_at DESC LIMIT ?`,
    )
      .bind(userId, limit)
      .all<Record<string, unknown>>();
    return apiJson({ data: chats.results });
  }
  if (request.method !== 'POST') return apiError('method_not_allowed', 'Use GET or POST.', 405);
  await ensureEnabled(env);
  const body = await readJsonBody(request, 16_384);
  if (body instanceof Response) return body;
  if (!isRecord(body)) return apiError('invalid_body', 'Invalid chat request.', 400);
  const model = requireModel(await getModels(env), body.provider, body.model, 'chat');
  const title = body.title === undefined ? '新对话' : body.title;
  if (!isBoundedText(title, 120) || !title.trim()) return apiError('invalid_title', 'Chat title is invalid.', 400);
  const chatId = crypto.randomUUID();
  const createdAt = Date.now();
  await env.DB.prepare(
    `INSERT INTO ai_chat
      (id, user_id, title, provider, model, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', '{}', ?, ?)`,
  )
    .bind(chatId, userId, title.trim(), model.provider, model.model, createdAt, createdAt)
    .run();
  return apiJson({ data: { id: chatId, title: title.trim(), ...model, status: 'active', createdAt } }, 201);
};

const getOwnedChat = async (env: Env, userId: string, chatId: string): Promise<ChatRow | null> =>
  env.DB.prepare(
    `SELECT id, user_id, title, provider, model, status, created_at, updated_at
     FROM ai_chat WHERE id = ? AND user_id = ?`,
  )
    .bind(chatId, userId)
    .first<ChatRow>();

const handleChatItem = async (
  request: Request,
  env: Env,
  userId: string,
  chatId: string,
): Promise<Response> => {
  const chat = await getOwnedChat(env, userId, chatId);
  if (!chat || chat.status === 'deleted') return apiError('not_found', 'Chat was not found.', 404);
  if (request.method === 'DELETE') {
    await env.DB.prepare(
      `UPDATE ai_chat SET status = 'deleted', updated_at = ? WHERE id = ? AND user_id = ?`,
    )
      .bind(Date.now(), chatId, userId)
      .run();
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'GET') return apiError('method_not_allowed', 'Use GET or DELETE.', 405);
  const messages = await env.DB.prepare(
    `SELECT id, role, content_json, provider, model, usage_json, status, created_at
     FROM ai_message WHERE chat_id = ? AND user_id = ?
     ORDER BY created_at ASC LIMIT 200`,
  )
    .bind(chatId, userId)
    .all<MessageRow>();
  return apiJson({
    data: {
      chat,
      messages: messages.results.map((message) => ({
        id: message.id,
        role: message.role,
        content: safeParse(message.content_json, {}),
        provider: message.provider,
        model: message.model,
        usage: safeParse(message.usage_json, {}),
        status: message.status,
        createdAt: message.created_at,
      })),
    },
  });
};

const handleChatMessage = async (
  request: Request,
  env: Env,
  userId: string,
  chatId: string,
): Promise<Response> => {
  if (request.method !== 'POST') return apiError('method_not_allowed', 'Use POST.', 405);
  await ensureEnabled(env);
  const body = await readJsonBody(request, 65_536);
  if (body instanceof Response) return body;
  if (!isRecord(body) || !requestIdPattern.test(String(body.requestId ?? '')) || !isBoundedText(body.content, 12_000) || !body.content.trim()) {
    return apiError('invalid_message', 'Request ID or message content is invalid.', 400);
  }
  const chat = await getOwnedChat(env, userId, chatId);
  if (!chat || chat.status !== 'active') return apiError('not_found', 'Active chat was not found.', 404);
  const model = requireModel(await getModels(env), chat.provider, chat.model, 'chat');
  const requestId = String(body.requestId);
  const content = body.content.trim();
  const inputJson = JSON.stringify({ chatId, content });
  let task = await claimTask(env, {
    userId,
    chatId,
    requestId,
    provider: model.provider,
    model: model.model,
    taskType: 'chat',
    cost: await getCost(env, 'chat'),
    inputJson,
  });
  if (task.status !== 'created') {
    if (['failed', 'canceled'].includes(task.status)) await refundTask(env, task);
    return apiJson({ data: publicTask(await getTask(env, userId, task.id) ?? task) }, task.status === 'completed' ? 200 : 202);
  }
  const messageId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ai_message
      (id, chat_id, user_id, request_id, task_id, role, content_json, provider, model, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, 'complete', ?)`,
  )
    .bind(messageId, chatId, userId, requestId, task.id, JSON.stringify({ text: content }), model.provider, model.model, Date.now())
    .run();
  if (!await acquireTask(env, task)) {
    task = await getTask(env, userId, task.id) ?? task;
    return apiJson({ data: publicTask(task) }, 202);
  }

  try {
    await chargeTask(env, task);
    const history = await env.DB.prepare(
      `SELECT role, content_json FROM ai_message
       WHERE chat_id = ? AND user_id = ? AND status = 'complete'
         AND role IN ('system', 'user', 'assistant')
       ORDER BY created_at DESC LIMIT 40`,
    )
      .bind(chatId, userId)
      .all<Pick<MessageRow, 'role' | 'content_json'>>();
    const messages: ChatMessageInput[] = history.results.reverse()
      .map((message) => ({ role: message.role as ChatMessageInput['role'], content: contentText(message.content_json) }))
      .filter((message) => message.content.length > 0);
    const completion = await generateChatCompletion(
      env,
      model.provider as TextProvider,
      model.model,
      messages,
    );
    const assistantId = crypto.randomUUID();
    const completedAt = Date.now();
    const outputJson = boundedJson({ messageId: assistantId, text: completion.content, usage: completion.usage });
    const results = await env.DB.batch([
      env.DB.prepare(
        `INSERT OR IGNORE INTO ai_message
          (id, chat_id, user_id, request_id, task_id, role, content_json, provider, model, usage_json, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'assistant', ?, ?, ?, ?, 'complete', ?)`,
      ).bind(
        assistantId,
        chatId,
        userId,
        requestId,
        task.id,
        JSON.stringify({ text: completion.content }),
        model.provider,
        model.model,
        boundedJson(completion.usage),
        completedAt,
      ),
      env.DB.prepare(
        `UPDATE ai_task SET status = 'completed', output_json = ?, error_message = NULL,
            updated_at = ?, completed_at = ? WHERE id = ? AND status = 'running'`,
      ).bind(outputJson, completedAt, completedAt, task.id),
      env.DB.prepare('UPDATE ai_chat SET updated_at = ? WHERE id = ?').bind(completedAt, chatId),
    ]);
    if (results[1].meta.changes !== 1) throw new Error('AI task completion conflicted.');
    task = await getTask(env, userId, task.id) ?? task;
    return apiJson({ data: publicTask(task) });
  } catch (error) {
    task = await failTask(env, task, error);
    if (error instanceof CreditError) throw error;
    return apiJson({ data: publicTask(task) }, 502);
  }
};

const handleTasksCollection = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (request.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? '30');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return apiError('invalid_limit', 'Limit must be between 1 and 100.', 400);
    }
    const tasks = await env.DB.prepare(
      `SELECT id, user_id, chat_id, client_request_id, provider, model, task_type,
              provider_task_id, status, input_json, output_json, error_message,
              credit_operation_id, cost_credits, refunded_at, created_at, updated_at, completed_at
       FROM ai_task WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
      .bind(userId, limit)
      .all<TaskRow>();
    return apiJson({ data: tasks.results.map(publicTask) });
  }
  if (request.method !== 'POST') return apiError('method_not_allowed', 'Use GET or POST.', 405);
  await ensureEnabled(env);
  const body = await readJsonBody(request, 131_072);
  if (body instanceof Response) return body;
  if (
    !isRecord(body)
    || !requestIdPattern.test(String(body.requestId ?? ''))
    || !['image', 'video', 'music'].includes(String(body.taskType ?? ''))
    || !isBoundedText(body.prompt, 12_000)
    || !body.prompt.trim()
  ) return apiError('invalid_ai_task', 'AI task request is invalid.', 400);
  const taskType = body.taskType as MediaTaskType;
  const model = requireModel(await getModels(env), body.provider, body.model, taskType);
  const options = body.options === undefined ? {} : body.options;
  if (!isRecord(options) || JSON.stringify(options).length > 100_000) {
    return apiError('invalid_ai_options', 'AI task options are invalid.', 400);
  }
  const prompt = body.prompt.trim();
  const inputJson = boundedJson({ prompt, options });
  let task = await claimTask(env, {
    userId,
    requestId: String(body.requestId),
    provider: model.provider,
    model: model.model,
    taskType,
    cost: await getCost(env, taskType),
    inputJson,
  });
  if (task.status !== 'created') {
    if (['failed', 'canceled'].includes(task.status)) await refundTask(env, task);
    return apiJson({ data: publicTask(await getTask(env, userId, task.id) ?? task) }, 202);
  }
  if (!await acquireTask(env, task)) {
    return apiJson({ data: publicTask(await getTask(env, userId, task.id) ?? task) }, 202);
  }
  try {
    await chargeTask(env, task);
    const providerResult = await createMediaTask(env, model.provider as MediaProvider, {
      taskType,
      model: model.model,
      prompt,
      options,
    });
    const completedAt = ['completed', 'failed', 'canceled'].includes(providerResult.status) ? Date.now() : null;
    await env.DB.prepare(
      `UPDATE ai_task SET provider_task_id = ?, status = ?, output_json = ?, error_message = ?,
          updated_at = ?, completed_at = ? WHERE id = ? AND status = 'running'`,
    )
      .bind(
        providerResult.providerTaskId,
        providerResult.status,
        boundedJson(providerResult.output),
        providerResult.error ?? null,
        Date.now(),
        completedAt,
        task.id,
      )
      .run();
    task = await getTask(env, userId, task.id) ?? task;
    if (['failed', 'canceled'].includes(task.status)) await refundTask(env, task);
    return apiJson({ data: publicTask(await getTask(env, userId, task.id) ?? task) }, 201);
  } catch (error) {
    task = await failTask(env, task, error);
    if (error instanceof CreditError) throw error;
    return apiJson({ data: publicTask(task) }, 502);
  }
};

const handleTaskItem = async (
  env: Env,
  userId: string,
  taskId: string,
  url: URL,
): Promise<Response> => {
  let task = await getTask(env, userId, taskId);
  if (!task) return apiError('not_found', 'AI task was not found.', 404);
  if (
    url.searchParams.get('refresh') === '1'
    && task.task_type !== 'chat'
    && task.provider_task_id
    && !['completed', 'failed', 'canceled'].includes(task.status)
  ) {
    try {
      const result = await queryMediaTask(env, task.provider as MediaProvider, {
        providerTaskId: task.provider_task_id,
        taskType: task.task_type,
        model: task.model,
      });
      const completedAt = ['completed', 'failed', 'canceled'].includes(result.status) ? Date.now() : null;
      await env.DB.prepare(
        `UPDATE ai_task SET status = ?, output_json = ?, error_message = ?,
            updated_at = ?, completed_at = ? WHERE id = ?`,
      )
        .bind(result.status, boundedJson(result.output), result.error ?? null, Date.now(), completedAt, task.id)
        .run();
      task = await getTask(env, userId, taskId) ?? task;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1_000) : 'AI task refresh failed.';
      return apiJson({ data: publicTask(task), warning: { code: 'refresh_failed', message } }, 502);
    }
  }
  if (['failed', 'canceled'].includes(task.status)) {
    await refundTask(env, task);
    task = await getTask(env, userId, taskId) ?? task;
  }
  return apiJson({ data: publicTask(task) });
};

const handleAiApiInner = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (!isTrustedWriteOrigin(request)) return apiError('forbidden_origin', 'Write origin is not allowed.', 403);
  const parts = url.pathname.slice('/api/v1/ai'.length).split('/').filter(Boolean);
  if (parts[0] === 'models' && parts.length === 1 && request.method === 'GET') return handleModels(env);
  if (parts[0] === 'chats' && parts.length === 1) return handleChatsCollection(request, env, userId, url);
  if (parts[0] === 'chats' && parts.length === 2) return handleChatItem(request, env, userId, parts[1]);
  if (parts[0] === 'chats' && parts.length === 3 && parts[2] === 'messages') {
    return handleChatMessage(request, env, userId, parts[1]);
  }
  if (parts[0] === 'tasks' && parts.length === 1) return handleTasksCollection(request, env, userId, url);
  if (parts[0] === 'tasks' && parts.length === 2 && request.method === 'GET') {
    return handleTaskItem(env, userId, parts[1], url);
  }
  return apiError('not_found', 'Unknown AI API route.', 404);
};

export async function handleAiApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  try {
    return await handleAiApiInner(request, env, userId, url);
  } catch (error) {
    if (error instanceof AiApiError || error instanceof CreditError) {
      return apiError(error.code, error.message, error.status);
    }
    return apiError('ai_request_failed', 'AI request could not be completed.', 500);
  }
}
