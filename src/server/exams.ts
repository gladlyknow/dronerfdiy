import type { Env } from './env';
import { apiError, apiJson } from './http';
import {
  isRecord,
  isTrustedWriteOrigin,
  readJsonBody,
} from './validation';
import {
  BANK_VERSIONS,
  EXAM_RULES,
  QUESTION_ANSWER_KEY,
} from './generated/question-answer-key';

type Level = 'A' | 'B' | 'C';

type CreateExamInput = {
  level: Level;
};

type AnswerInput = {
  selectedAnswer: string;
  displayedOrder: string;
};

type SubmitInput = {
  elapsedSeconds: number;
};

type SessionRecord = {
  id: string;
  user_id: string;
  level: Level;
  bank_version: string;
  question_ids: string;
  status: 'active' | 'completed' | 'abandoned';
  total: number;
  correct: number;
  score: number | null;
  elapsed_seconds: number;
  created_at: number;
  completed_at: number | null;
};

const levels = new Set<Level>(['A', 'B', 'C']);
const timestamp = () => Date.now();

const isLevel = (value: unknown): value is Level =>
  typeof value === 'string' && levels.has(value as Level);

const decodePathValue = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const parseQuestionIds = (value: string): string[] | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const randomIndex = (length: number): number => {
  const values = new Uint32Array(1);
  const range = 0x1_0000_0000;
  const ceiling = Math.floor(range / length) * length;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= ceiling);
  return values[0] % length;
};

const shuffled = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const selectQuestions = (level: Level): string[] => {
  const answerMap: Record<string, string> = QUESTION_ANSWER_KEY[level];
  const rules = EXAM_RULES[level];
  const single = Object.keys(answerMap).filter((id) => answerMap[id].length === 1);
  const multiple = Object.keys(answerMap).filter((id) => answerMap[id].length > 1);

  if (single.length < rules.single || multiple.length < rules.multiple) {
    throw new Error(`Question bank ${level} cannot satisfy the configured exam rule.`);
  }

  return shuffled([
    ...shuffled(single).slice(0, rules.single),
    ...shuffled(multiple).slice(0, rules.multiple),
  ]);
};

const parseCreateInput = (value: unknown): CreateExamInput | null => {
  if (!isRecord(value) || !isLevel(value.level)) return null;
  return { level: value.level };
};

const normalizeSelectedAnswer = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length > 4 || !/^[A-D]*$/.test(value)) {
    return null;
  }
  const unique = new Set(value);
  if (unique.size !== value.length) return null;
  return [...unique].sort().join('');
};

const parseAnswerInput = (value: unknown): AnswerInput | null => {
  if (!isRecord(value) || typeof value.displayedOrder !== 'string') return null;
  const selectedAnswer = normalizeSelectedAnswer(value.selectedAnswer);
  if (selectedAnswer === null || value.displayedOrder.length !== 4) return null;
  if (new Set(value.displayedOrder).size !== 4 || !/^[A-D]{4}$/.test(value.displayedOrder)) {
    return null;
  }
  return { selectedAnswer, displayedOrder: value.displayedOrder };
};

const parseSubmitInput = (value: unknown): SubmitInput | null => {
  if (
    !isRecord(value) ||
    typeof value.elapsedSeconds !== 'number' ||
    !Number.isInteger(value.elapsedSeconds) ||
    value.elapsedSeconds < 0 ||
    value.elapsedSeconds > 86_400
  ) {
    return null;
  }
  return { elapsedSeconds: value.elapsedSeconds };
};

const getOwnedSession = async (
  env: Env,
  userId: string,
  sessionId: string,
): Promise<SessionRecord | null> =>
  env.DB.prepare(
    `SELECT id, user_id, level, bank_version, question_ids, status, total, correct,
            score, elapsed_seconds, created_at, completed_at
     FROM exam_session WHERE id = ? AND user_id = ?`,
  )
    .bind(sessionId, userId)
    .first<SessionRecord>();

const createExam = async (
  env: Env,
  userId: string,
  level: Level,
): Promise<Response> => {
  const questionIds = selectQuestions(level);
  const rule = EXAM_RULES[level];
  const sessionId = crypto.randomUUID();
  const bankVersion = BANK_VERSIONS[level];

  await env.DB.prepare(
    `INSERT INTO exam_session
      (id, user_id, level, bank_version, question_ids, status, total, correct,
       elapsed_seconds, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, 0, 0, ?)`,
  )
    .bind(
      sessionId,
      userId,
      level,
      bankVersion,
      JSON.stringify(questionIds),
      rule.total,
      timestamp(),
    )
    .run();

  return apiJson({
    data: {
      sessionId,
      level,
      bankVersion,
      questionIds,
      timeSeconds: rule.timeSeconds,
      passScore: rule.pass,
    },
  }, 201);
};

const listExams = async (
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> => {
  const requestedLevel = url.searchParams.get('level');
  if (requestedLevel !== null && !isLevel(requestedLevel)) {
    return apiError('invalid_level', 'Level must be A, B, or C.', 400);
  }
  const requestedLimit = Number(url.searchParams.get('limit') ?? '20');
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 50) {
    return apiError('invalid_limit', 'Limit must be an integer between 1 and 50.', 400);
  }
  const statement = requestedLevel
    ? env.DB.prepare(
        `SELECT id, level, bank_version, question_ids, status, total, correct, score,
                elapsed_seconds, created_at, completed_at
         FROM exam_session WHERE user_id = ? AND level = ? ORDER BY created_at DESC LIMIT ?`,
      ).bind(userId, requestedLevel, requestedLimit)
    : env.DB.prepare(
        `SELECT id, level, bank_version, question_ids, status, total, correct, score,
                elapsed_seconds, created_at, completed_at
         FROM exam_session WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      ).bind(userId, requestedLimit);
  const result = await statement.all<Record<string, unknown>>();
  return apiJson({ data: result.results });
};

const getExam = async (
  env: Env,
  userId: string,
  sessionId: string,
): Promise<Response> => {
  const session = await getOwnedSession(env, userId, sessionId);
  if (!session) return apiError('not_found', 'Exam session was not found.', 404);
  const attempts = session.status === 'completed'
    ? await env.DB.prepare(
        `SELECT question_id, displayed_order, selected_answer, is_correct,
                correct_answer, answered_at
         FROM question_attempt WHERE session_id = ? AND user_id = ? ORDER BY answered_at ASC`,
      )
        .bind(sessionId, userId)
        .all<Record<string, unknown>>()
    : await env.DB.prepare(
        `SELECT question_id, displayed_order, selected_answer, answered_at
         FROM question_attempt WHERE session_id = ? AND user_id = ? ORDER BY answered_at ASC`,
      )
        .bind(sessionId, userId)
        .all<Record<string, unknown>>();
  return apiJson({ data: { session, attempts: attempts.results } });
};

const saveAnswer = async (
  env: Env,
  userId: string,
  sessionId: string,
  questionId: string,
  input: AnswerInput,
): Promise<Response> => {
  const session = await getOwnedSession(env, userId, sessionId);
  if (!session) return apiError('not_found', 'Exam session was not found.', 404);
  if (session.status !== 'active') {
    return apiError('exam_not_active', 'Answers can only be saved to an active exam.', 409);
  }
  const questionIds = parseQuestionIds(session.question_ids);
  if (!questionIds || !questionIds.includes(questionId)) {
    return apiError('invalid_question', 'Question does not belong to this exam.', 400);
  }
  const answers: Record<string, string> = QUESTION_ANSWER_KEY[session.level];
  const correctAnswer = answers[questionId];
  if (!correctAnswer) {
    return apiError('invalid_question', 'Question is unavailable in this bank version.', 400);
  }
  const isCorrect = input.selectedAnswer === correctAnswer ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO question_attempt
      (id, session_id, user_id, question_id, level, bank_version, displayed_order,
       selected_answer, correct_answer, is_correct, answered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id, question_id) DO UPDATE SET
       displayed_order = excluded.displayed_order,
       selected_answer = excluded.selected_answer,
       correct_answer = excluded.correct_answer,
       is_correct = excluded.is_correct,
       answered_at = excluded.answered_at`,
  )
    .bind(
      crypto.randomUUID(),
      sessionId,
      userId,
      questionId,
      session.level,
      session.bank_version,
      input.displayedOrder,
      input.selectedAnswer || null,
      correctAnswer,
      isCorrect,
      timestamp(),
    )
    .run();
  return apiJson({ data: { questionId, saved: true } });
};

const submitExam = async (
  env: Env,
  userId: string,
  sessionId: string,
  input: SubmitInput,
): Promise<Response> => {
  const session = await getOwnedSession(env, userId, sessionId);
  if (!session) return apiError('not_found', 'Exam session was not found.', 404);
  if (session.status !== 'active') {
    return apiError('exam_not_active', 'Only an active exam can be submitted.', 409);
  }
  if (session.bank_version !== BANK_VERSIONS[session.level]) {
    return apiError('bank_version_mismatch', 'The question bank has changed.', 409);
  }
  const questionIds = parseQuestionIds(session.question_ids);
  if (!questionIds || questionIds.length !== session.total) {
    return apiError('invalid_exam', 'Exam question data is invalid.', 409);
  }

  const answerMap: Record<string, string> = QUESTION_ANSWER_KEY[session.level];
  const submittedAt = timestamp();
  const statements: D1PreparedStatement[] = [];

  for (const questionId of questionIds) {
    const correctAnswer = answerMap[questionId];
    if (!correctAnswer) {
      return apiError('invalid_question', 'Question is unavailable in this bank version.', 409);
    }
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO question_attempt
          (id, session_id, user_id, question_id, level, bank_version, displayed_order,
           selected_answer, correct_answer, is_correct, answered_at)
         SELECT ?, ?, ?, ?, ?, ?, 'ABCD', NULL, ?, 0, ?
         WHERE EXISTS (
           SELECT 1 FROM exam_session
           WHERE id = ? AND user_id = ? AND status = 'active'
         )`,
      ).bind(
        crypto.randomUUID(),
        sessionId,
        userId,
        questionId,
        session.level,
        session.bank_version,
        correctAnswer,
        submittedAt,
        sessionId,
        userId,
      ),
    );
  }

  for (const questionId of questionIds) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO question_mastery
          (user_id, question_id, level, mastery, attempt_count, correct_count,
           wrong_count, consecutive_correct, last_answer, is_mastered,
           last_attempt_at, updated_at)
         SELECT qa.user_id, qa.question_id, qa.level,
           CASE WHEN qa.is_correct = 1 THEN 1.0 ELSE 0.0 END,
           1, qa.is_correct, CASE WHEN qa.is_correct = 1 THEN 0 ELSE 1 END,
           qa.is_correct, qa.selected_answer, 0, ?, ?
         FROM question_attempt qa
         WHERE qa.session_id = ? AND qa.question_id = ? AND qa.user_id = ?
           AND EXISTS (
             SELECT 1 FROM exam_session
             WHERE id = ? AND user_id = ? AND status = 'active'
           )
         ON CONFLICT(user_id, question_id, level) DO UPDATE SET
           mastery = CAST(question_mastery.correct_count + excluded.correct_count AS REAL)
             / (question_mastery.attempt_count + excluded.attempt_count),
           attempt_count = question_mastery.attempt_count + excluded.attempt_count,
           correct_count = question_mastery.correct_count + excluded.correct_count,
           wrong_count = question_mastery.wrong_count + excluded.wrong_count,
           consecutive_correct = CASE
             WHEN excluded.correct_count = 1
               THEN question_mastery.consecutive_correct + 1
             ELSE 0
           END,
           last_answer = excluded.last_answer,
           is_mastered = CASE
             WHEN excluded.correct_count = 1
              AND question_mastery.consecutive_correct + 1 >= 3
              AND CAST(question_mastery.correct_count + excluded.correct_count AS REAL)
                / (question_mastery.attempt_count + excluded.attempt_count) >= 0.8
               THEN 1
             ELSE 0
           END,
           last_attempt_at = excluded.last_attempt_at,
           updated_at = excluded.updated_at`,
      ).bind(
        submittedAt,
        submittedAt,
        sessionId,
        questionId,
        userId,
        sessionId,
        userId,
      ),
    );
  }

  statements.push(
    env.DB.prepare(
      `UPDATE exam_session
       SET status = 'completed',
           correct = (
             SELECT COUNT(*) FROM question_attempt
             WHERE session_id = ? AND user_id = ? AND is_correct = 1
           ),
           score = (
             SELECT CAST(COUNT(*) * 100.0 AS REAL) / total FROM question_attempt
             WHERE session_id = ? AND user_id = ? AND is_correct = 1
           ),
           elapsed_seconds = ?,
           completed_at = ?
       WHERE id = ? AND user_id = ? AND status = 'active'`,
    ).bind(
      sessionId,
      userId,
      sessionId,
      userId,
      input.elapsedSeconds,
      submittedAt,
      sessionId,
      userId,
    ),
  );

  const results = await env.DB.batch(statements);
  const completion = results[results.length - 1];
  if (completion.meta.changes === 0) {
    return apiError('exam_not_active', 'This exam was already submitted or closed.', 409);
  }

  const completed = await getOwnedSession(env, userId, sessionId);
  if (!completed) return apiError('not_found', 'Exam session was not found.', 404);
  const passScore = EXAM_RULES[completed.level].pass;
  return apiJson({
    data: {
      total: completed.total,
      correct: completed.correct,
      score: completed.score ?? 0,
      passed: completed.correct >= passScore,
      passScore,
    },
  });
};

export async function handleMasteryApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (!isTrustedWriteOrigin(request)) {
    return apiError('invalid_origin', 'Cross-origin write is not allowed.', 403);
  }

  const path = url.pathname.slice('/api/v1'.length);
  const clearWrongMatch = path.match(/^\/mastery\/([ABC])\/clear-wrong$/);
  if (clearWrongMatch) {
    if (request.method !== 'POST') return apiError('method_not_allowed', 'Use POST.', 405);
    const level = clearWrongMatch[1] as Level;
    const result = await env.DB.prepare(
      `UPDATE question_mastery
       SET is_mastered = 1, updated_at = ?
       WHERE user_id = ? AND level = ? AND wrong_count > 0 AND is_mastered = 0`,
    )
      .bind(timestamp(), userId, level)
      .run();
    return apiJson({ data: { level, updated: result.meta.changes } });
  }

  const masteryMatch = path.match(/^\/mastery\/([ABC])\/([^/]+)$/);
  if (masteryMatch) {
    if (request.method !== 'PUT') return apiError('method_not_allowed', 'Use PUT.', 405);
    const level = masteryMatch[1] as Level;
    const questionId = decodePathValue(masteryMatch[2]);
    if (!questionId || !/^MC[1-4]-\d{4}$/.test(questionId)) {
      return apiError('invalid_question', 'Invalid question identifier.', 400);
    }
    if (!QUESTION_ANSWER_KEY[level][questionId]) {
      return apiError('invalid_question', 'Question is unavailable for this level.', 400);
    }
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    if (!isRecord(payload) || typeof payload.isMastered !== 'boolean') {
      return apiError('invalid_mastery', 'isMastered must be a boolean.', 400);
    }
    const updatedAt = timestamp();
    await env.DB.prepare(
      `INSERT INTO question_mastery
        (user_id, question_id, level, mastery, attempt_count, correct_count,
         wrong_count, consecutive_correct, last_answer, is_mastered,
         last_attempt_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, NULL, ?, NULL, ?)
       ON CONFLICT(user_id, question_id, level) DO UPDATE SET
         is_mastered = excluded.is_mastered,
         updated_at = excluded.updated_at`,
    )
      .bind(userId, questionId, level, payload.isMastered ? 1 : 0, updatedAt)
      .run();
    return apiJson({ data: { level, questionId, isMastered: payload.isMastered } });
  }

  if (path !== '/mastery') return apiError('not_found', 'Unknown mastery route.', 404);
  if (request.method !== 'GET') return apiError('method_not_allowed', 'Use GET.', 405);
  const level = url.searchParams.get('level');
  if (!isLevel(level)) return apiError('invalid_level', 'Level must be A, B, or C.', 400);
  const state = url.searchParams.get('state') ?? 'all';
  if (state !== 'all' && state !== 'wrong' && state !== 'mastered') {
    return apiError('invalid_state', 'State must be wrong, mastered, or all.', 400);
  }
  const requestedLimit = Number(url.searchParams.get('limit') ?? '50');
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 500) {
    return apiError('invalid_limit', 'Limit must be an integer between 1 and 500.', 400);
  }
  const condition = state === 'wrong'
    ? 'AND wrong_count > 0 AND is_mastered = 0'
    : state === 'mastered'
      ? 'AND is_mastered = 1'
      : '';
  const result = await env.DB.prepare(
    `SELECT question_id, level, mastery, attempt_count, correct_count, wrong_count,
            consecutive_correct, last_answer, is_mastered, last_attempt_at, updated_at
     FROM question_mastery
     WHERE user_id = ? AND level = ? ${condition}
     ORDER BY updated_at DESC LIMIT ?`,
  )
    .bind(userId, level, requestedLimit)
    .all<Record<string, unknown>>();
  return apiJson({ data: result.results });
}

const abandonExam = async (
  env: Env,
  userId: string,
  sessionId: string,
): Promise<Response> => {
  const result = await env.DB.prepare(
    `UPDATE exam_session SET status = 'abandoned'
     WHERE id = ? AND user_id = ? AND status = 'active'`,
  )
    .bind(sessionId, userId)
    .run();
  if (result.meta.changes === 0) {
    const existing = await getOwnedSession(env, userId, sessionId);
    if (!existing) return apiError('not_found', 'Exam session was not found.', 404);
    return apiError('exam_not_active', 'Only an active exam can be abandoned.', 409);
  }
  return apiJson({ data: { sessionId, status: 'abandoned' } });
};

export async function handleExamsApi(
  request: Request,
  env: Env,
  userId: string,
  url: URL,
): Promise<Response> {
  if (!isTrustedWriteOrigin(request)) {
    return apiError('invalid_origin', 'Cross-origin write is not allowed.', 403);
  }

  const path = url.pathname.slice('/api/v1'.length);
  if (path === '/exams') {
    if (request.method === 'GET') return listExams(env, userId, url);
    if (request.method !== 'POST') return apiError('method_not_allowed', 'Use GET or POST.', 405);
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    const input = parseCreateInput(payload);
    if (!input) return apiError('invalid_exam', 'Level must be A, B, or C.', 400);
    return createExam(env, userId, input.level);
  }

  const answerMatch = path.match(/^\/exams\/([^/]+)\/answers\/([^/]+)$/);
  if (answerMatch) {
    if (request.method !== 'PUT') return apiError('method_not_allowed', 'Use PUT.', 405);
    const sessionId = decodePathValue(answerMatch[1]);
    const questionId = decodePathValue(answerMatch[2]);
    if (!sessionId || !questionId || sessionId.length > 160 || questionId.length > 160) {
      return apiError('invalid_exam', 'Invalid exam or question identifier.', 400);
    }
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    const input = parseAnswerInput(payload);
    if (!input) return apiError('invalid_answer', 'Invalid answer payload.', 400);
    return saveAnswer(env, userId, sessionId, questionId, input);
  }

  const submitMatch = path.match(/^\/exams\/([^/]+)\/submit$/);
  if (submitMatch) {
    if (request.method !== 'POST') return apiError('method_not_allowed', 'Use POST.', 405);
    const sessionId = decodePathValue(submitMatch[1]);
    if (!sessionId || sessionId.length > 160) {
      return apiError('invalid_exam', 'Invalid exam identifier.', 400);
    }
    const payload = await readJsonBody(request);
    if (payload instanceof Response) return payload;
    const input = parseSubmitInput(payload);
    if (!input) {
      return apiError('invalid_exam', 'Elapsed seconds must be an integer up to 86400.', 400);
    }
    return submitExam(env, userId, sessionId, input);
  }

  const sessionMatch = path.match(/^\/exams\/([^/]+)$/);
  if (sessionMatch) {
    const sessionId = decodePathValue(sessionMatch[1]);
    if (!sessionId || sessionId.length > 160) {
      return apiError('invalid_exam', 'Invalid exam identifier.', 400);
    }
    if (request.method === 'GET') return getExam(env, userId, sessionId);
    if (request.method === 'DELETE') return abandonExam(env, userId, sessionId);
    return apiError('method_not_allowed', 'Use GET or DELETE.', 405);
  }

  return apiError('not_found', 'Unknown exam route.', 404);
}
