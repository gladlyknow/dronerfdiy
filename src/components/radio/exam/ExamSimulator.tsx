import React, { useEffect, useMemo, useState } from 'react';
import type { ExamQuestion } from '../../../types';
import { EXAM_LEVEL_CONFIGS, generateMockExam } from '../../../data/examLevelsData';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamSimulatorProps {
  level: 'A' | 'B' | 'C';
  onGoToWrongBook?: () => void;
}

const sortAnswer = (value: string) => [...new Set(value.split(''))].filter((x) => 'ABCD'.includes(x)).sort().join('');

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({ level, onGoToWrongBook }) => {
  const config = EXAM_LEVEL_CONFIGS[level];
  const { isDark } = useTheme();
  const [questions, setQuestions] = useState<ExamQuestion[]>(() => generateMockExam(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(config.timeLimitMin * 60);
  const [examStartedAt, setExamStartedAt] = useState(Date.now());

  const restart = () => {
    setQuestions(generateMockExam(level));
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setTimeLeftSec(config.timeLimitMin * 60);
    setExamStartedAt(Date.now());
  };

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = window.setInterval(() => setTimeLeftSec((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isSubmitted]);

  const submitExam = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    const wrongQs = questions.filter((q) => sortAnswer(answers[q.id] || '') !== sortAnswer(q.answerType || ''));
    try {
      const key = `ham_wrong_questions_${level}`;
      const existing: ExamQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
      const byId = new Map(existing.map((q) => [q.id, q]));
      wrongQs.forEach((q) => byId.set(q.id, q));
      localStorage.setItem(key, JSON.stringify([...byId.values()]));
    } catch (error) {
      console.warn('Failed to save wrong questions', error);
    }
  };

  useEffect(() => {
    if (timeLeftSec === 0 && !isSubmitted) submitExam();
  }, [timeLeftSec, isSubmitted]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const isMultiple = (currentQuestion?.answerType || '').length > 1;

  const selectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted || !currentQuestion) return;
    setAnswers((previous) => {
      if (!isMultiple) return { ...previous, [currentQuestion.id]: key };
      const selected = new Set((previous[currentQuestion.id] || '').split('').filter(Boolean));
      if (selected.has(key)) selected.delete(key); else selected.add(key);
      return { ...previous, [currentQuestion.id]: [...selected].sort().join('') };
    });
  };

  const score = useMemo(() => {
    const correctCount = questions.filter((q) => sortAnswer(answers[q.id] || '') === sortAnswer(q.answerType || '')).length;
    const elapsed = Math.max(0, Math.floor((Date.now() - examStartedAt) / 1000));
    return {
      correctCount,
      wrongCount: questions.length - correctCount,
      accuracy: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
      passed: correctCount >= config.passScore,
      elapsedMin: Math.floor(elapsed / 60),
      elapsedSec: elapsed % 60,
    };
  }, [questions, answers, config.passScore, examStartedAt, isSubmitted]);

  if (!currentQuestion) return null;

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const minutesLeft = Math.floor(timeLeftSec / 60);
  const secondsLeft = timeLeftSec % 60;

  return (
    <div className="space-y-4">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${level === 'A' ? 'bg-emerald-600' : level === 'B' ? 'bg-sky-600' : 'bg-amber-600'}`}>{level}</div>
          <div>
            <div className="font-bold text-sm sm:text-base">{level} 类全真模拟 · {config.singleQuestions} 单选 + {config.multipleQuestions} 多选</div>
            <div className="text-xs text-slate-500 mt-0.5">合格 ≥ {config.passScore}/{config.totalQuestions} · 已答 {answeredCount}/{questions.length}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSubmitted && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-sm font-bold ${timeLeftSec < 300 ? 'border-rose-500/40 text-rose-500 bg-rose-500/10' : isDark ? 'border-[#2D2D33] bg-[#18181D] text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              <Clock className="w-4 h-4" />{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
            </div>
          )}
          {!isSubmitted ? (
            <button onClick={submitExam} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Send className="w-4 h-4" />提交试卷</button>
          ) : (
            <button onClick={restart} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><RotateCcw className="w-4 h-4" />重新抽题</button>
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
            {currentQuestion.options.map((opt) => {
              const selected = currentAnswer.includes(opt.key);
              const correct = isSubmitted && (currentQuestion.answerType || '').includes(opt.key);
              const wrongSelected = isSubmitted && selected && !correct;
              return (
                <button
                  key={opt.key}
                  onClick={() => selectOption(opt.key)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                    isSubmitted
                      ? correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : wrongSelected
                          ? 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'border-slate-200 dark:border-[#2D2D33] opacity-60'
                      : selected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-200 dark:border-[#2D2D33] hover:border-orange-400'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${selected ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{opt.key}</span>
                  <span className="text-xs sm:text-sm leading-relaxed pt-1">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div className={`mt-5 p-4 rounded-2xl border text-xs ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-amber-50 border-amber-200'}`}>
              <div className="font-bold text-orange-600 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" />题库标准答案：{currentQuestion.answerType}</div>
              <div className="text-slate-500 mt-1">{currentQuestion.explanation}</div>
              {isMultiple && <div className="mt-2 text-violet-600">多选题按完全匹配计分：多选或少选均不得分。</div>}
            </div>
          )}

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-[#2D2D33]">
            <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2D2D33] text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" />上一题</button>
            <button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} disabled={currentIndex === questions.length - 1} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2D2D33] text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer">下一题<ChevronRight className="w-4 h-4" /></button>
          </div>
        </section>

        <aside className={`p-4 rounded-3xl border h-fit lg:sticky lg:top-20 ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
          <div className="font-bold text-xs mb-3">答题卡 · {answeredCount}/{questions.length}</div>
          <div className="grid grid-cols-5 gap-1.5 max-h-[430px] overflow-y-auto">
            {questions.map((q, index) => {
              const answered = !!answers[q.id];
              const exact = sortAnswer(answers[q.id] || '') === sortAnswer(q.answerType || '');
              const active = index === currentIndex;
              const state = isSubmitted ? (exact ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : answered ? 'bg-orange-500/15 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500';
              return <button key={q.id} onClick={() => setCurrentIndex(index)} className={`h-8 rounded-lg text-[11px] font-mono border border-transparent cursor-pointer ${state} ${active ? 'ring-2 ring-orange-500' : ''}`}>{index + 1}</button>;
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
