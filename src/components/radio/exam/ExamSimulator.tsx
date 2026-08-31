import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExamQuestion, QuestionOption } from '../../../types';
import { EXAM_LEVEL_CONFIGS, generateMockExam, getQuestionsByLevel } from '../../../data/examLevelsData';
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useTheme } from '../../../utils/theme';
import { useAuth } from '../../../auth/AuthProvider';

interface ExamSimulatorProps {
  level: 'A' | 'B' | 'C';
  onGoToWrongBook?: () => void;
}

type PresentedOption = {
  displayKey: QuestionOption['key'];
  sourceKey: QuestionOption['key'];
  text: string;
};

type CloudExam = {
  sessionId: string;
  level: 'A' | 'B' | 'C';
  bankVersion: string;
  questionIds: string[];
  timeSeconds: number;
  passScore: number;
};

type CloudSubmitResult = {
  total: number;
  correct: number;
  score: number;
  passed: boolean;
  passScore: number;
};

type CloudExamDetail = {
  session: {
    status: 'active' | 'completed' | 'abandoned';
    total: number;
    correct: number;
    score: number | null;
  };
};

type ExamMode = 'local' | 'cloud' | 'fallback';

const displayKeys: QuestionOption['key'][] = ['A', 'B', 'C', 'D'];

const sortAnswer = (value: string) =>
  [...new Set(value.split(''))].filter((part) => 'ABCD'.includes(part)).sort().join('');

const shuffledOptions = (question: ExamQuestion): PresentedOption[] => {
  const options = question.options.map((option) => ({ ...option }));
  for (let index = options.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1);
    const length = index + 1;
    const range = 0x1_0000_0000;
    const ceiling = Math.floor(range / length) * length;
    do {
      crypto.getRandomValues(random);
    } while (random[0] >= ceiling);
    const target = random[0] % (index + 1);
    [options[index], options[target]] = [options[target], options[index]];
  }
  return options.map((option, index) => ({
    displayKey: displayKeys[index] ?? option.key,
    sourceKey: option.key,
    text: option.text,
  }));
};

const createOptionOrders = (questions: ExamQuestion[]): Record<string, PresentedOption[]> =>
  Object.fromEntries(questions.map((question) => [question.id, shuffledOptions(question)]));

const localQuestions = (level: 'A' | 'B' | 'C'): ExamQuestion[] => generateMockExam(level);

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({ level, onGoToWrongBook }) => {
  const config = EXAM_LEVEL_CONFIGS[level];
  const { isDark } = useTheme();
  const { user, isPending, apiRequest } = useAuth();
  const [questions, setQuestions] = useState<ExamQuestion[]>(() => localQuestions(level));
  const [optionOrders, setOptionOrders] = useState<Record<string, PresentedOption[]>>(() => createOptionOrders(questions));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(config.timeLimitMin * 60);
  const [examStartedAt, setExamStartedAt] = useState(Date.now());
  const [submittedElapsedSeconds, setSubmittedElapsedSeconds] = useState<number | null>(null);
  const [mode, setMode] = useState<ExamMode>('local');
  const [modeMessage, setModeMessage] = useState('本机模式');
  const [serverResult, setServerResult] = useState<CloudSubmitResult | null>(null);
  const cloudSessionId = useRef<string | null>(null);
  const startSequence = useRef(0);
  const examGeneration = useRef(0);
  const submitInFlight = useRef(false);
  const saveChains = useRef(new Map<string, Promise<void>>());
  const saveFailed = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  const userId = user?.id ?? null;

  const applyExam = useCallback((nextQuestions: ExamQuestion[], nextMode: ExamMode, message: string, timeSeconds?: number) => {
    examGeneration.current += 1;
    answersRef.current = {};
    saveChains.current.clear();
    saveFailed.current = false;
    setQuestions(nextQuestions);
    setOptionOrders(createOptionOrders(nextQuestions));
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setIsSubmitting(false);
    setServerResult(null);
    setSubmittedElapsedSeconds(null);
    setTimeLeftSec(timeSeconds ?? config.timeLimitMin * 60);
    setExamStartedAt(Date.now());
    setMode(nextMode);
    setModeMessage(message);
  }, [config.timeLimitMin]);

  const closeActiveCloudExam = useCallback(async () => {
    examGeneration.current += 1;
    const sessionId = cloudSessionId.current;
    cloudSessionId.current = null;
    if (!sessionId) return;
    try {
      await apiRequest(`/api/v1/exams/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
    } catch {
      // The next attempt can still proceed locally if a stale server session cannot be closed.
    }
  }, [apiRequest]);

  const startExam = useCallback(async (replaceExisting = false) => {
    const sequence = startSequence.current + 1;
    startSequence.current = sequence;
    if (replaceExisting) await closeActiveCloudExam();
    if (sequence !== startSequence.current) return;

    if (!userId) {
      applyExam(localQuestions(level), 'local', '本机模式');
      return;
    }

    try {
      const cloudExam = await apiRequest<CloudExam>('/api/v1/exams', {
        method: 'POST',
        body: { level },
      });
      if (sequence !== startSequence.current) {
        try {
          await apiRequest(`/api/v1/exams/${encodeURIComponent(cloudExam.sessionId)}`, { method: 'DELETE' });
        } catch {
          // A newer exam already owns the screen; this stale session is best-effort cleanup only.
        }
        return;
      }
      const allQuestions = new Map(getQuestionsByLevel(level).map((question) => [question.id, question]));
      const selected = cloudExam.questionIds.map((id) => allQuestions.get(id));
      const valid = cloudExam.level === level
        && selected.length === config.totalQuestions
        && new Set(cloudExam.questionIds).size === config.totalQuestions
        && selected.every((question): question is ExamQuestion => question !== undefined);
      if (!valid) {
        try {
          await apiRequest(`/api/v1/exams/${encodeURIComponent(cloudExam.sessionId)}`, { method: 'DELETE' });
        } catch {
          // The malformed server session is isolated; the current test falls back locally.
        }
        throw new Error('Cloud exam question mapping is invalid.');
      }
      cloudSessionId.current = cloudExam.sessionId;
      applyExam(selected, 'cloud', '云端记录', cloudExam.timeSeconds);
    } catch {
      if (sequence !== startSequence.current) return;
      cloudSessionId.current = null;
      applyExam(localQuestions(level), 'fallback', '云端未连接，本次仅保存在本机');
    }
  }, [apiRequest, applyExam, closeActiveCloudExam, config.totalQuestions, level, userId]);

  const restart = useCallback(() => {
    void startExam(true);
  }, [startExam]);

  useEffect(() => {
    if (isPending) return;
    void startExam(true);
    return () => {
      startSequence.current += 1;
      void closeActiveCloudExam();
    };
  }, [closeActiveCloudExam, isPending, startExam, userId]);

  useEffect(() => {
    if (isSubmitted) return undefined;
    const timer = window.setInterval(() => setTimeLeftSec((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [isSubmitted]);

  const queueAnswerSave = useCallback((question: ExamQuestion, selectedAnswer: string) => {
    const sessionId = cloudSessionId.current;
    const generation = examGeneration.current;
    const displayedOrder = (optionOrders[question.id] ?? [])
      .map((option) => option.sourceKey)
      .join('');
    if (!sessionId || displayedOrder.length !== 4) return;
    const previous = saveChains.current.get(question.id) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        await apiRequest(
          `/api/v1/exams/${encodeURIComponent(sessionId)}/answers/${encodeURIComponent(question.id)}`,
          { method: 'PUT', body: { selectedAnswer, displayedOrder } },
        );
      })
      .catch(() => {
        if (generation !== examGeneration.current || sessionId !== cloudSessionId.current) return;
        saveFailed.current = true;
        setMode('fallback');
        setModeMessage('云同步待重试，本机记录仍可使用');
      });
    saveChains.current.set(question.id, next);
  }, [apiRequest, optionOrders]);

  const selectOption = (sourceKey: QuestionOption['key']) => {
    const currentQuestion = questions[currentIndex];
    if (isSubmitted || isSubmitting || !currentQuestion) return;
    const isMultiple = (currentQuestion.answerType || '').length > 1;
    const previous = answersRef.current[currentQuestion.id] ?? '';
    const nextAnswer = isMultiple
      ? sortAnswer(previous.includes(sourceKey)
        ? previous.replace(sourceKey, '')
        : `${previous}${sourceKey}`)
      : sourceKey;
    answersRef.current = { ...answersRef.current, [currentQuestion.id]: nextAnswer };
    setAnswers(answersRef.current);
    queueAnswerSave(currentQuestion, nextAnswer);
  };

  const localScore = useMemo(() => {
    const correctCount = questions.filter((question) => (
      sortAnswer(answers[question.id] || '') === sortAnswer(question.answerType || '')
    )).length;
    const elapsed = submittedElapsedSeconds
      ?? Math.max(0, Math.floor((Date.now() - examStartedAt) / 1_000));
    return {
      correctCount,
      wrongCount: questions.length - correctCount,
      accuracy: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
      passed: correctCount >= config.passScore,
      elapsedMin: Math.floor(elapsed / 60),
      elapsedSec: elapsed % 60,
    };
  }, [answers, config.passScore, examStartedAt, questions, submittedElapsedSeconds]);

  const saveWrongQuestionsLocally = useCallback(() => {
    const wrongQuestions = questions.filter((question) => (
      sortAnswer(answersRef.current[question.id] || '') !== sortAnswer(question.answerType || '')
    ));
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(`ham_wrong_questions_${level}`) ?? '[]');
      const existing = Array.isArray(parsed)
        ? parsed.filter((question): question is ExamQuestion => (
          typeof question === 'object' && question !== null && 'id' in question && typeof question.id === 'string'
        ))
        : [];
      const byId = new Map(existing.map((question) => [question.id, question]));
      wrongQuestions.forEach((question) => byId.set(question.id, question));
      localStorage.setItem(`ham_wrong_questions_${level}`, JSON.stringify([...byId.values()]));
    } catch {
      // Private browsing may reject storage. The on-screen score still remains available.
    }
  }, [level, questions]);

  const submitCloudSession = useCallback(async (
    sessionId: string,
    elapsedSeconds: number,
  ): Promise<CloudSubmitResult> => {
    try {
      await Promise.all([...saveChains.current.values()]);
      await Promise.all(Object.entries(answersRef.current).map(async ([questionId, selectedAnswer]) => {
        const displayedOrder = (optionOrders[questionId] ?? [])
          .map((option) => option.sourceKey)
          .join('');
        if (displayedOrder.length !== 4) {
          throw new Error('Displayed option order is unavailable.');
        }
        await apiRequest(
          `/api/v1/exams/${encodeURIComponent(sessionId)}/answers/${encodeURIComponent(questionId)}`,
          { method: 'PUT', body: { selectedAnswer, displayedOrder } },
        );
      }));
      saveFailed.current = false;
      return await apiRequest<CloudSubmitResult>(
        `/api/v1/exams/${encodeURIComponent(sessionId)}/submit`,
        { method: 'POST', body: { elapsedSeconds } },
      );
    } catch (error) {
      try {
        const detail = await apiRequest<CloudExamDetail>(
          `/api/v1/exams/${encodeURIComponent(sessionId)}`,
        );
        if (detail.session.status === 'completed') {
          const correct = detail.session.correct;
          const total = detail.session.total;
          return {
            total,
            correct,
            score: detail.session.score ?? (total ? (correct / total) * 100 : 0),
            passed: correct >= config.passScore,
            passScore: config.passScore,
          };
        }
      } catch {
        // Preserve the original save/submit failure for the retry state below.
      }
      throw error;
    }
  }, [apiRequest, config.passScore, optionOrders]);

  const submitExam = useCallback(async () => {
    if (isSubmitted || submitInFlight.current) return;
    submitInFlight.current = true;
    setIsSubmitting(true);
    const elapsedSeconds = Math.max(
      0,
      Math.min(86_400, Math.floor((Date.now() - examStartedAt) / 1_000)),
    );
    setSubmittedElapsedSeconds(elapsedSeconds);
    try {
      saveWrongQuestionsLocally();
      const sessionId = cloudSessionId.current;
      if (sessionId) {
        try {
          const result = await submitCloudSession(sessionId, elapsedSeconds);
          setServerResult(result);
          setMode('cloud');
          setModeMessage('云端记录 · 已同步');
          window.dispatchEvent(new CustomEvent('dronerf:cloud-sync'));
        } catch {
          setMode('fallback');
          setModeMessage('云端暂未同步，可点击重试；本机成绩已保留');
        }
      }
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
      submitInFlight.current = false;
    }
  }, [examStartedAt, isSubmitted, saveWrongQuestionsLocally, submitCloudSession]);

  const retryCloudSubmission = useCallback(async () => {
    const sessionId = cloudSessionId.current;
    if (!sessionId || submitInFlight.current) return;
    submitInFlight.current = true;
    setIsSubmitting(true);
    try {
      const elapsedSeconds = submittedElapsedSeconds
        ?? Math.max(0, Math.min(86_400, Math.floor((Date.now() - examStartedAt) / 1_000)));
      const result = await submitCloudSession(sessionId, elapsedSeconds);
      setServerResult(result);
      setMode('cloud');
      setModeMessage('云端记录 · 已同步');
      window.dispatchEvent(new CustomEvent('dronerf:cloud-sync'));
    } catch {
      setMode('fallback');
      setModeMessage('云端仍未连接，本机成绩已保留');
    } finally {
      setIsSubmitting(false);
      submitInFlight.current = false;
    }
  }, [examStartedAt, submitCloudSession, submittedElapsedSeconds]);

  useEffect(() => {
    if (timeLeftSec === 0 && !isSubmitted) void submitExam();
  }, [isSubmitted, submitExam, timeLeftSec]);

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const currentAnswer = answers[currentQuestion.id] || '';
  const currentOptions = optionOrders[currentQuestion.id] ?? [];
  const displayedCorrectAnswer = sortAnswer(currentOptions
    .filter((option) => (currentQuestion.answerType || '').includes(option.sourceKey))
    .map((option) => option.displayKey)
    .join(''));
  const isMultiple = (currentQuestion.answerType || '').length > 1;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const minutesLeft = Math.floor(timeLeftSec / 60);
  const secondsLeft = timeLeftSec % 60;
  const score = serverResult
    ? {
        correctCount: serverResult.correct,
        wrongCount: serverResult.total - serverResult.correct,
        accuracy: Math.round(serverResult.score),
        passed: serverResult.passed,
        elapsedMin: Math.floor(localScore.elapsedMin),
        elapsedSec: localScore.elapsedSec,
      }
    : localScore;

  return (
    <div className="space-y-4">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${level === 'A' ? 'bg-emerald-600' : level === 'B' ? 'bg-sky-600' : 'bg-amber-600'}`}>{level}</div>
          <div>
            <div className="font-bold text-sm sm:text-base">{level} 类全真模拟 · {config.singleQuestions} 单选 + {config.multipleQuestions} 多选</div>
            <div className="text-xs text-slate-500 mt-0.5">合格 ≥ {config.passScore}/{config.totalQuestions} · 已答 {answeredCount}/{questions.length}</div>
            <div className={`mt-1 text-[11px] ${mode === 'cloud' ? 'text-emerald-600 dark:text-emerald-400' : mode === 'fallback' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{modeMessage}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSubmitted && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-sm font-bold ${timeLeftSec < 300 ? 'border-rose-500/40 text-rose-500 bg-rose-500/10' : isDark ? 'border-[#2D2D33] bg-[#18181D] text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              <Clock className="w-4 h-4" />{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
            </div>
          )}
          {!isSubmitted ? (
            <button onClick={() => void submitExam()} disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"><Send className="w-4 h-4" />{isSubmitting ? '正在提交…' : '提交试卷'}</button>
          ) : (
            <>
              {mode === 'fallback' && cloudSessionId.current && (
                <button onClick={() => void retryCloudSubmission()} disabled={isSubmitting} className="px-3 py-2 rounded-xl border border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  <Send className="w-4 h-4" />{isSubmitting ? '同步中…' : '重试云同步'}
                </button>
              )}
              <button onClick={restart} disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"><RotateCcw className="w-4 h-4" />重新抽题</button>
            </>
          )}
        </div>
      </div>

      {isSubmitted && (
        <section className={`p-6 rounded-3xl border text-center ${score.passed ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
          {score.passed ? <Award className="w-10 h-10 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />}
          <h3 className={`text-xl font-black mt-2 ${score.passed ? 'text-emerald-500' : 'text-rose-500'}`}>{score.passed ? '模拟考核合格' : '模拟成绩未达合格线'}</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto text-left">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D2D33]"><div className="text-[10px] text-slate-500">正确</div><div className="font-mono font-black text-lg text-emerald-500">{score.correctCount}/{questions.length}</div></div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D2D33]"><div className="text-[10px] text-slate-500">错误/未答</div><div className="font-mono font-black text-lg text-rose-500">{score.wrongCount}</div></div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D2D33]"><div className="text-[10px] text-slate-500">正确率</div><div className="font-mono font-black text-lg text-sky-500">{score.accuracy}%</div></div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D2D33]"><div className="text-[10px] text-slate-500">用时</div><div className="font-mono font-black text-lg text-amber-500">{score.elapsedMin}:{String(score.elapsedSec).padStart(2, '0')}</div></div>
          </div>
          {onGoToWrongBook && score.wrongCount > 0 && <button onClick={onGoToWrongBook} className="mt-4 text-xs font-bold text-orange-600 cursor-pointer">进入 {level} 类错题本（{score.wrongCount}）</button>}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <section className={`lg:col-span-3 p-5 sm:p-6 rounded-3xl border ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-orange-500/10 text-orange-600">第 {currentIndex + 1}/{questions.length} 题</span>
            <span className="text-[11px] font-mono text-slate-500">{currentQuestion.id}</span>
            <span className="text-[11px] font-mono text-slate-500">[P]{currentQuestion.sectionCode}</span>
            <span className={`text-[11px] font-bold ${isMultiple ? 'text-violet-500' : 'text-sky-500'}`}>{isMultiple ? '多选题 · 可选择多个答案' : '单选题'}</span>
          </div>
          <h3 className={`text-base sm:text-lg font-bold leading-relaxed mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentQuestion.question}</h3>
          <div className="space-y-2.5">
            {currentOptions.map((option) => {
              const selected = currentAnswer.includes(option.sourceKey);
              const correct = isSubmitted && (currentQuestion.answerType || '').includes(option.sourceKey);
              const wrongSelected = isSubmitted && selected && !correct;
              return (
                <button key={option.displayKey} onClick={() => selectOption(option.sourceKey)} disabled={isSubmitted || isSubmitting} className={`w-full text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${isSubmitted ? correct ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : wrongSelected ? 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'border-slate-200 dark:border-[#2D2D33] opacity-60' : selected ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-[#2D2D33] hover:border-orange-400'}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${selected ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{option.displayKey}</span>
                  <span className="text-xs sm:text-sm leading-relaxed pt-1">{option.text}</span>
                </button>
              );
            })}
          </div>
          {isSubmitted && (
            <div className={`mt-5 p-4 rounded-2xl border text-xs ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-amber-50 border-amber-200'}`}>
              <div className="font-bold text-orange-600 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" />本题显示答案：{displayedCorrectAnswer}</div>
              <div className="text-slate-500 mt-1">{currentQuestion.explanation}</div>
              {isMultiple && <div className="mt-2 text-violet-600">多选题按完全匹配计分：多选或少选均不得分。</div>}
            </div>
          )}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-[#2D2D33]">
            <button onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2D2D33] text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" />上一题</button>
            <button onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={currentIndex === questions.length - 1} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2D2D33] text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer">下一题<ChevronRight className="w-4 h-4" /></button>
          </div>
        </section>
        <aside className={`p-4 rounded-3xl border h-fit lg:sticky lg:top-20 ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
          <div className="font-bold text-xs mb-3">答题卡 · {answeredCount}/{questions.length}</div>
          <div className="grid grid-cols-5 gap-1.5 max-h-[430px] overflow-y-auto">
            {questions.map((question, index) => {
              const answered = !!answers[question.id];
              const exact = sortAnswer(answers[question.id] || '') === sortAnswer(question.answerType || '');
              const active = index === currentIndex;
              const state = isSubmitted ? (exact ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : answered ? 'bg-orange-500/15 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500';
              return <button key={question.id} onClick={() => setCurrentIndex(index)} className={`h-8 rounded-lg text-[11px] font-mono border border-transparent cursor-pointer ${state} ${active ? 'ring-2 ring-orange-500' : ''}`}>{index + 1}</button>;
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
