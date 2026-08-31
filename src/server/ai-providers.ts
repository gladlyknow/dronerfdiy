import type { Env } from './env';
import { getConfig } from './config';
import { getSecret } from './secrets';

export type TextProvider = 'openrouter' | 'gemini';
export type MediaProvider = 'replicate' | 'fal' | 'kie';
export type MediaTaskType = 'image' | 'video' | 'music';

export type ChatMessageInput = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletion = {
  content: string;
  usage: Record<string, unknown>;
  raw: unknown;
};

export type MediaTaskResult = {
  providerTaskId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  output: unknown;
  error?: string;
};

const readJson = async (response: Response): Promise<Record<string, unknown>> => {
  const parsed = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status}.`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Provider returned an invalid response.');
  }
  return parsed as Record<string, unknown>;
};

const safeOptions = (options: unknown): Record<string, unknown> => (
  typeof options === 'object' && options !== null && !Array.isArray(options)
    ? options as Record<string, unknown>
    : {}
);

const textFromGemini = (result: Record<string, unknown>): string => {
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  const first = candidates[0];
  if (typeof first !== 'object' || first === null) return '';
  const content = (first as Record<string, unknown>).content;
  if (typeof content !== 'object' || content === null) return '';
  const parts = Array.isArray((content as Record<string, unknown>).parts)
    ? (content as Record<string, unknown>).parts as unknown[]
    : [];
  return parts.map((part) => (
    typeof part === 'object' && part !== null && typeof (part as Record<string, unknown>).text === 'string'
      ? (part as Record<string, unknown>).text as string
      : ''
  )).join('').trim();
};

export async function generateChatCompletion(
  env: Env,
  provider: TextProvider,
  model: string,
  messages: ChatMessageInput[],
): Promise<ChatCompletion> {
  if (!/^[A-Za-z0-9._:/-]{2,160}$/.test(model)) throw new Error('Invalid AI model.');
  if (provider === 'openrouter') {
    const apiKey = await getSecret(env, 'openrouter_api_key');
    if (!apiKey) throw new Error('OpenRouter is not configured.');
    const configuredBase = await getConfig(env, 'openrouter_base_url', 'https://openrouter.ai/api/v1');
    const base = new URL(configuredBase);
    if (base.protocol !== 'https:') throw new Error('OpenRouter base URL must use HTTPS.');
    const response = await fetch(new URL('chat/completions', `${base.toString().replace(/\/$/, '')}/`), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'http-referer': env.BETTER_AUTH_URL,
        'x-title': 'DroneRF DIY',
      },
      body: JSON.stringify({ model, messages }),
    });
    const result = await readJson(response);
    const choices = Array.isArray(result.choices) ? result.choices : [];
    const first = choices[0];
    const message = typeof first === 'object' && first !== null
      ? (first as Record<string, unknown>).message
      : null;
    const content = typeof message === 'object' && message !== null
      && typeof (message as Record<string, unknown>).content === 'string'
      ? (message as Record<string, unknown>).content as string
      : '';
    if (!content) throw new Error('OpenRouter returned no message content.');
    return {
      content,
      usage: typeof result.usage === 'object' && result.usage !== null
        ? result.usage as Record<string, unknown>
        : {},
      raw: result,
    };
  }

  const apiKey = await getSecret(env, 'gemini_api_key');
  if (!apiKey) throw new Error('Gemini is not configured.');
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
  const system = messages.filter((message) => message.role === 'system')
    .map((message) => message.content).join('\n\n');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      }),
    },
  );
  const result = await readJson(response);
  const content = textFromGemini(result);
  if (!content) throw new Error('Gemini returned no message content.');
  return {
    content,
    usage: typeof result.usageMetadata === 'object' && result.usageMetadata !== null
      ? result.usageMetadata as Record<string, unknown>
      : {},
    raw: result,
  };
}

export async function createMediaTask(
  env: Env,
  provider: MediaProvider,
  input: {
    taskType: MediaTaskType;
    model: string;
    prompt: string;
    options?: unknown;
  },
): Promise<MediaTaskResult> {
  if (!/^[A-Za-z0-9._:/-]{2,200}$/.test(input.model)) throw new Error('Invalid AI model.');
  const options = safeOptions(input.options);
  if (provider === 'replicate') {
    const apiToken = await getSecret(env, 'replicate_api_token');
    if (!apiToken) throw new Error('Replicate is not configured.');
    const modelParts = input.model.split('/');
    if (modelParts.length !== 2 || modelParts.some((part) => !part)) {
      throw new Error('Replicate model must use owner/name format.');
    }
    const response = await fetch(
      `https://api.replicate.com/v1/models/${encodeURIComponent(modelParts[0])}/${encodeURIComponent(modelParts[1])}/predictions`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ input: { prompt: input.prompt, ...options } }),
      },
    );
    const result = await readJson(response);
    if (typeof result.id !== 'string') throw new Error('Replicate returned no task ID.');
    return { providerTaskId: result.id, status: mapReplicateStatus(result.status), output: result };
  }

  if (provider === 'fal') {
    const apiKey = await getSecret(env, 'fal_api_key');
    if (!apiKey) throw new Error('fal.ai is not configured.');
    const response = await fetch(`https://queue.fal.run/${input.model}`, {
      method: 'POST',
      headers: { authorization: `Key ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: input.prompt, ...options }),
    });
    const result = await readJson(response);
    if (typeof result.request_id !== 'string') throw new Error('fal.ai returned no task ID.');
    return { providerTaskId: result.request_id, status: 'queued', output: result };
  }

  const apiKey = await getSecret(env, 'kie_api_key');
  if (!apiKey) throw new Error('Kie AI is not configured.');
  const isMusic = input.taskType === 'music';
  const endpoint = isMusic
    ? 'https://api.kie.ai/api/v1/generate'
    : 'https://api.kie.ai/api/v1/jobs/createTask';
  const payload = isMusic
    ? { prompt: input.prompt, model: input.model, customMode: false, ...options }
    : { model: input.model, input: { prompt: input.prompt, ...options } };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await readJson(response);
  const data = typeof result.data === 'object' && result.data !== null
    ? result.data as Record<string, unknown>
    : {};
  if (result.code !== 200 || typeof data.taskId !== 'string') {
    throw new Error('Kie AI returned no task ID.');
  }
  return { providerTaskId: data.taskId, status: 'queued', output: result };
}

const mapReplicateStatus = (status: unknown): MediaTaskResult['status'] => {
  if (status === 'starting') return 'queued';
  if (status === 'processing') return 'running';
  if (status === 'succeeded') return 'completed';
  if (status === 'failed') return 'failed';
  if (status === 'canceled') return 'canceled';
  return 'queued';
};

export async function queryMediaTask(
  env: Env,
  provider: MediaProvider,
  input: { providerTaskId: string; taskType: MediaTaskType; model: string },
): Promise<MediaTaskResult> {
  if (provider === 'replicate') {
    const apiToken = await getSecret(env, 'replicate_api_token');
    if (!apiToken) throw new Error('Replicate is not configured.');
    const result = await readJson(await fetch(
      `https://api.replicate.com/v1/predictions/${encodeURIComponent(input.providerTaskId)}`,
      { headers: { authorization: `Bearer ${apiToken}` } },
    ));
    return {
      providerTaskId: input.providerTaskId,
      status: mapReplicateStatus(result.status),
      output: result,
      error: typeof result.error === 'string' ? result.error : undefined,
    };
  }
  if (provider === 'fal') {
    const apiKey = await getSecret(env, 'fal_api_key');
    if (!apiKey) throw new Error('fal.ai is not configured.');
    const parts = input.model.split('/');
    const queryModel = parts.length > 2 ? `${parts[0]}/${parts[1]}` : input.model;
    const headers = { authorization: `Key ${apiKey}` };
    const statusResult = await readJson(await fetch(
      `https://queue.fal.run/${queryModel}/requests/${encodeURIComponent(input.providerTaskId)}/status`,
      { headers },
    ));
    const status = statusResult.status === 'COMPLETED'
      ? 'completed'
      : statusResult.status === 'FAILED'
        ? 'failed'
        : statusResult.status === 'IN_PROGRESS'
          ? 'running'
          : 'queued';
    if (status !== 'completed') {
      return { providerTaskId: input.providerTaskId, status, output: statusResult };
    }
    const result = await readJson(await fetch(
      `https://queue.fal.run/${queryModel}/requests/${encodeURIComponent(input.providerTaskId)}`,
      { headers },
    ));
    return { providerTaskId: input.providerTaskId, status, output: result };
  }

  const apiKey = await getSecret(env, 'kie_api_key');
  if (!apiKey) throw new Error('Kie AI is not configured.');
  const endpoint = input.taskType === 'music'
    ? `https://api.kie.ai/api/v1/generate/record-info?taskId=${encodeURIComponent(input.providerTaskId)}`
    : `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(input.providerTaskId)}`;
  const result = await readJson(await fetch(endpoint, {
    headers: { authorization: `Bearer ${apiKey}` },
  }));
  const data = typeof result.data === 'object' && result.data !== null
    ? result.data as Record<string, unknown>
    : {};
  const providerStatus = String(data.state ?? data.status ?? '').toLowerCase();
  const status: MediaTaskResult['status'] = ['success', 'succeeded', 'completed'].includes(providerStatus)
    ? 'completed'
    : ['fail', 'failed', 'error'].includes(providerStatus)
      ? 'failed'
      : ['running', 'processing', 'generating'].includes(providerStatus)
        ? 'running'
        : 'queued';
  return {
    providerTaskId: input.providerTaskId,
    status,
    output: result,
    error: typeof data.failMsg === 'string' ? data.failMsg : undefined,
  };
}
