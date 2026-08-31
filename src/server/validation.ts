import { apiError } from './http';

export const resourceTypes = ['question', 'knowledge', 'drone_article', 'video', 'tool'] as const;
export type ResourceType = (typeof resourceTypes)[number];

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isResourceType = (value: unknown): value is ResourceType =>
  typeof value === 'string' && resourceTypes.includes(value as ResourceType);

export const isResource = (
  type: unknown,
  resourceId: unknown,
): type is ResourceType =>
  isResourceType(type) &&
  typeof resourceId === 'string' &&
  resourceId.length > 0 &&
  resourceId.length <= 160;

export const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const isBoundedText = (
  value: unknown,
  maxLength: number,
  minLength = 1,
): value is string =>
  typeof value === 'string' &&
  value.length >= minLength &&
  value.length <= maxLength;

export async function readJsonBody(
  request: Request,
  limitBytes = 65_536,
): Promise<unknown | Response> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    return apiError('unsupported_media_type', 'Content-Type must be application/json.', 415);
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return apiError('invalid_content_length', 'Content-Length is invalid.', 400);
    }
    if (contentLength > limitBytes) {
      return apiError('payload_too_large', 'Request body is too large.', 413);
    }
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > limitBytes) {
    return apiError('payload_too_large', 'Request body is too large.', 413);
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON.', 400);
  }
}

const trustedOrigins = new Set([
  'https://dronerfdiy.com',
  'https://www.dronerfdiy.com',
  'http://localhost:3000',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

export const isTrustedWriteOrigin = (request: Request): boolean => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return true;
  const origin = request.headers.get('origin');
  return origin !== null && trustedOrigins.has(origin);
};
