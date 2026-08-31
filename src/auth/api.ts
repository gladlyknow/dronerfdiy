export type ResourceType = 'question' | 'knowledge' | 'drone_article' | 'video' | 'tool';

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseEnvelope = <T>(value: unknown): ApiEnvelope<T> => {
  if (!isRecord(value)) return {};
  const error = isRecord(value.error)
    ? {
        code: typeof value.error.code === 'string' ? value.error.code : undefined,
        message: typeof value.error.message === 'string' ? value.error.message : undefined,
      }
    : undefined;
  return { data: value.data as T | undefined, error };
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
  });
  let payload: unknown = null;
  try {
    payload = await response.json() as unknown;
  } catch {
    throw new ApiRequestError('invalid_response', '服务器返回了无法识别的响应。');
  }
  const envelope = parseEnvelope<T>(payload);
  if (!response.ok || envelope.error || envelope.data === undefined) {
    throw new ApiRequestError(
      envelope.error?.code ?? `http_${response.status}`,
      envelope.error?.message ?? '请求未完成，请稍后重试。',
    );
  }
  return envelope.data;
}
