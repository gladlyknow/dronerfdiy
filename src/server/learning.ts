import type { Env } from './env';
import { QUESTION_ANSWER_KEY } from './generated/question-answer-key';
import { apiError, apiJson } from './http';
import {
  isBoundedText,
  isNonNegativeInteger,
  isRecord,
  isResource,
  isResourceType,
  isTrustedWriteOrigin,
  readJsonBody,
} from './validation';

const now = () => Date.now();
const newId = () => crypto.randomUUID();
const examLevels = new Set(['A', 'B', 'C']);

const decodePathPart = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const parseResourcePath = (
  match: RegExpMatchArray,
): { resourceType: string; resourceId: string } | null => {
  const resourceType = decodePathPart(match[1]);
  const resourceId = decodePathPart(match[2]);
  if (!isResource(resourceType, resourceId)) return null;
  return { resourceType, resourceId };
};

const queryResourceType = (url: URL): string | null | Response => {
  const resourceType = url.searchParams.get('resource_type');
  if (resourceType !== null && !isResourceType(resourceType)) {
    return apiError('invalid_resource_type', 'Invalid resource type.', 400);
  }
  return resourceType;
};

const handleFavoriteCollection = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (request.method !== 'GET') {
    return apiError('method_not_allowed', 'Use GET.', 405);
  }

  const resourceType = queryResourceType(url);
  if (resourceType instanceof Response) return resourceType;

  const statement = resourceType
    ? env.DB.prepare(
        'SELECT resource_type, resource_id, created_at FROM user_favorite WHERE user_id = ? AND resource_type = ? ORDER BY created_at DESC',
      ).bind(userId, resourceType)
    : env.DB.prepare(
        'SELECT resource_type, resource_id, created_at FROM user_favorite WHERE user_id = ? ORDER BY created_at DESC',
      ).bind(userId);
  const result = await statement.all();
  return apiJson({ data: result.results });
};

const handleFavorite = async (
  request: Request,
  env: Env,
  userId: string,
  resourceType: string,
  resourceId: string,
): Promise<Response> => {
  if (request.method === 'PUT') {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO user_favorite (id, user_id, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(newId(), userId, resourceType, resourceId, now())
      .run();
    return apiJson({ data: { resourceType, resourceId, favorited: true } });
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare(
      'DELETE FROM user_favorite WHERE user_id = ? AND resource_type = ? AND resource_id = ?',
    )
      .bind(userId, resourceType, resourceId)
      .run();
    return apiJson({ data: { resourceType, resourceId, favorited: false } });
  }

  return apiError('method_not_allowed', 'Use PUT or DELETE.', 405);
};

const handleActivities = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (request.method === 'GET') {
    const resourceType = queryResourceType(url);
    if (resourceType instanceof Response) return resourceType;

    const requestedLimit = Number(url.searchParams.get('limit') ?? '20');
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return apiError('invalid_limit', 'Limit must be an integer between 1 and 100.', 400);
    }
    const limit = Math.min(requestedLimit, 100);
    const statement = resourceType
      ? env.DB.prepare(
          'SELECT resource_type, resource_id, kind, view_count, position_seconds, total_seconds, completed, last_viewed_at, updated_at FROM resource_activity WHERE user_id = ? AND resource_type = ? ORDER BY last_viewed_at DESC LIMIT ?',
        ).bind(userId, resourceType, limit)
      : env.DB.prepare(
          'SELECT resource_type, resource_id, kind, view_count, position_seconds, total_seconds, completed, last_viewed_at, updated_at FROM resource_activity WHERE user_id = ? ORDER BY last_viewed_at DESC LIMIT ?',
        ).bind(userId, limit);
    const result = await statement.all();
    return apiJson({ data: result.results });
  }

  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use GET or POST.', 405);
  }

  const payload = await readJsonBody(request);
  if (payload instanceof Response) return payload;
  if (!isRecord(payload)) {
    return apiError('invalid_activity', 'Activity payload must be an object.', 400);
  }

  const {
    resourceType,
    resourceId,
    kind,
    positionSeconds,
    totalSeconds,
    completed,
    countView,
  } = payload;
  if (
    !isResource(resourceType, resourceId) ||
    (kind !== 'view' && kind !== 'watch') ||
    !isNonNegativeInteger(positionSeconds) ||
    !isNonNegativeInteger(totalSeconds) ||
    (completed !== undefined && typeof completed !== 'boolean') ||
    (countView !== undefined && typeof countView !== 'boolean') ||
    (totalSeconds > 0 && positionSeconds > totalSeconds)
  ) {
    return apiError('invalid_activity', 'Invalid activity payload.', 400);
  }

  const timestamp = now();
  const viewIncrement = countView === false ? 0 : 1;
  await env.DB.prepare(
    `INSERT INTO resource_activity
      (id, user_id, resource_type, resource_id, kind, view_count, position_seconds, total_seconds, completed, last_viewed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, resource_type, resource_id, kind) DO UPDATE SET
       view_count = resource_activity.view_count + ?,
       position_seconds = excluded.position_seconds,
       total_seconds = excluded.total_seconds,
       completed = excluded.completed,
       last_viewed_at = excluded.last_viewed_at,
       updated_at = excluded.updated_at`,
  )
    .bind(
      newId(),
      userId,
      resourceType,
      resourceId,
      kind,
      viewIncrement,
      positionSeconds,
      totalSeconds,
      completed === true ? 1 : 0,
      timestamp,
      timestamp,
      viewIncrement,
    )
    .run();
  return apiJson({ data: { resourceType, resourceId, kind, updated: true } });
};

const handleProgressCollection = async (
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  if (request.method !== 'GET') {
    return apiError('method_not_allowed', 'Use GET.', 405);
  }

  const resourceType = queryResourceType(url);
  if (resourceType instanceof Response) return resourceType;
  const statement = resourceType
    ? env.DB.prepare(
        'SELECT resource_type, resource_id, progress, completed_at, updated_at FROM learning_progress WHERE user_id = ? AND resource_type = ? ORDER BY updated_at DESC',
      ).bind(userId, resourceType)
    : env.DB.prepare(
        'SELECT resource_type, resource_id, progress, completed_at, updated_at FROM learning_progress WHERE user_id = ? ORDER BY updated_at DESC',
      ).bind(userId);
  const result = await statement.all();
  return apiJson({ data: result.results });
};

const handleProgress = async (
  request: Request,
  env: Env,
  userId: string,
  resourceType: string,
  resourceId: string,
): Promise<Response> => {
  if (request.method !== 'PUT') {
    return apiError('method_not_allowed', 'Use PUT.', 405);
  }

  const payload = await readJsonBody(request);
  if (payload instanceof Response) return payload;
  if (
    !isRecord(payload) ||
    typeof payload.progress !== 'number' ||
    !Number.isFinite(payload.progress) ||
    payload.progress < 0 ||
    payload.progress > 1
  ) {
    return apiError('invalid_progress', 'Progress must be a number between 0 and 1.', 400);
  }

  const timestamp = now();
  const completedAt = payload.progress === 1 ? timestamp : null;
  await env.DB.prepare(
    `INSERT INTO learning_progress
      (id, user_id, resource_type, resource_id, progress, completed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, resource_type, resource_id) DO UPDATE SET
       progress = MAX(learning_progress.progress, excluded.progress),
       completed_at = COALESCE(learning_progress.completed_at, excluded.completed_at),
       updated_at = excluded.updated_at`,
  )
    .bind(newId(), userId, resourceType, resourceId, payload.progress, completedAt, timestamp)
    .run();
  return apiJson({ data: { resourceType, resourceId, progress: payload.progress } });
};

const handleLocalImport = async (
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> => {
  if (request.method !== 'POST') {
    return apiError('method_not_allowed', 'Use POST.', 405);
  }

  const payload = await readJsonBody(request, 262_144);
  if (payload instanceof Response) return payload;
  if (
    !isRecord(payload) ||
    !isBoundedText(payload.deviceId, 128) ||
    !isBoundedText(payload.payloadVersion, 32) ||
    !isBoundedText(payload.digest, 64, 64) ||
    !/^[a-f0-9]{64}$/i.test(payload.digest) ||
    !Array.isArray(payload.favorites) ||
    !Array.isArray(payload.wrongQuestions) ||
    payload.favorites.length > 5_000 ||
    payload.wrongQuestions.length > 5_000
  ) {
    return apiError('invalid_import', 'Invalid local import payload.', 400);
  }

  const previous = await env.DB.prepare(
    'SELECT id FROM local_data_import WHERE user_id = ? AND source_device_id = ? AND payload_version = ? AND digest = ?',
  )
    .bind(userId, payload.deviceId, payload.payloadVersion, payload.digest)
    .first();
  if (previous) {
    return apiJson({ data: { alreadyImported: true, imported: 0 } });
  }

  const timestamp = now();
  const statements: D1PreparedStatement[] = [];
  for (const favorite of payload.favorites) {
    if (
      !isRecord(favorite) ||
      !isResource(favorite.resourceType, favorite.resourceId)
    ) {
      return apiError('invalid_import', 'Invalid favorite in local import.', 400);
    }
    statements.push(
      env.DB.prepare(
        'INSERT OR IGNORE INTO user_favorite (id, user_id, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?)',
      ).bind(newId(), userId, favorite.resourceType, favorite.resourceId, timestamp),
    );
  }

  for (const wrongQuestion of payload.wrongQuestions) {
    if (
      !isRecord(wrongQuestion) ||
      !isBoundedText(wrongQuestion.questionId, 160) ||
      typeof wrongQuestion.level !== 'string' ||
      !examLevels.has(wrongQuestion.level) ||
      !QUESTION_ANSWER_KEY[wrongQuestion.level as 'A' | 'B' | 'C'][wrongQuestion.questionId] ||
      (wrongQuestion.selectedAnswer !== undefined &&
        (!isBoundedText(wrongQuestion.selectedAnswer, 4) ||
          !/^[A-D]{1,4}$/.test(wrongQuestion.selectedAnswer)))
    ) {
      return apiError('invalid_import', 'Invalid wrong question in local import.', 400);
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO question_mastery
          (user_id, question_id, level, mastery, attempt_count, correct_count, wrong_count, consecutive_correct, last_answer, is_mastered, last_attempt_at, updated_at)
         VALUES (?, ?, ?, 0, 1, 0, 1, 0, ?, 0, ?, ?)
         ON CONFLICT(user_id, question_id, level) DO UPDATE SET
           attempt_count = MAX(question_mastery.attempt_count, 1),
           wrong_count = MAX(question_mastery.wrong_count, 1),
           consecutive_correct = 0,
           last_answer = COALESCE(question_mastery.last_answer, excluded.last_answer),
           updated_at = MAX(question_mastery.updated_at, excluded.updated_at)`,
      ).bind(
        userId,
        wrongQuestion.questionId,
        wrongQuestion.level,
        wrongQuestion.selectedAnswer ?? null,
        timestamp,
        timestamp,
      ),
    );
  }

  for (let offset = 0; offset < statements.length; offset += 100) {
    await env.DB.batch(statements.slice(offset, offset + 100));
  }

  try {
    await env.DB.prepare(
      `INSERT INTO local_data_import
        (id, user_id, source, source_device_id, payload_version, digest, item_count, created_at)
       VALUES (?, ?, 'browser-local-storage', ?, ?, ?, ?, ?)`,
    )
      .bind(
        newId(),
        userId,
        payload.deviceId,
        payload.payloadVersion,
        payload.digest,
        statements.length,
        timestamp,
      )
      .run();
  } catch {
    return apiJson({ data: { alreadyImported: true, imported: 0 } });
  }

  return apiJson({
    data: { alreadyImported: false, imported: statements.length },
  });
};

export async function handleLearningApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (!isTrustedWriteOrigin(request)) {
    return apiError('invalid_origin', 'Cross-origin write is not allowed.', 403);
  }

  const path = url.pathname.slice('/api/v1'.length);
  if (path === '/favorites') {
    return handleFavoriteCollection(request, env, userId, url);
  }
  if (path === '/activities') {
    return handleActivities(request, env, userId, url);
  }
  if (path === '/progress') {
    return handleProgressCollection(request, env, userId, url);
  }
  if (path === '/import/local') {
    return handleLocalImport(request, env, userId);
  }

  const favoriteMatch = path.match(/^\/favorites\/([^/]+)\/([^/]+)$/);
  if (favoriteMatch) {
    const favorite = parseResourcePath(favoriteMatch);
    if (!favorite) return apiError('invalid_resource', 'Invalid resource.', 400);
    return handleFavorite(
      request,
      env,
      userId,
      favorite.resourceType,
      favorite.resourceId,
    );
  }

  const progressMatch = path.match(/^\/progress\/([^/]+)\/([^/]+)$/);
  if (progressMatch) {
    const progress = parseResourcePath(progressMatch);
    if (!progress) return apiError('invalid_resource', 'Invalid resource.', 400);
    return handleProgress(
      request,
      env,
      userId,
      progress.resourceType,
      progress.resourceId,
    );
  }

  return apiError('not_found', 'Unknown learning route.', 404);
}
