import React, { useState, useEffect, useMemo } from 'react';
import { ExamLevel, ExamQuestion } from '../../../types';
import { EXAM_LEVEL_CONFIGS, generateMockExam } from '../../../data/examLevelsData';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Send,
  HelpCircle
} from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamSimulatorProps {
  level: 'A' | 'B' | 'C';
  onGoToWrongBook?: () => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({ level, onGoToWrongBook }) => {
  const config = EXAM_LEVEL_CONFIGS[level];
  const { isDark } = useTheme();

  const [questions, setQuestions] = useState<ExamQuestion[]>(() => generateMockExam(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(config.timeLimitMin * 60);
  const [examStartedAt, setExamStartedAt] = useState<number>(Date.now());

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Restart exam with fresh randomized questions
  const handleRestartExam = () => {
    const newQuestions = generateMockExam(level);
    setQuestions(newQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setTimeLeftSec(config.timeLimitMin * 60);
    setExamStartedAt(Date.now());
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    
    // For single-choice questions (standard in CRAC exams)
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: key,
    }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);

    // Save wrong questions to localStorage
    const wrongQs: ExamQuestion[] = [];
    questions.forEach((q) => {
      const userAns = answers[q.id];
      if (userAns !== q.answerType) {
        wrongQs.push(q);
      }
    });

    if (wrongQs.length > 0) {
      try {
        const saved = localStorage.getItem(`ham_wrong_questions_${level}`);
        const existing: ExamQuestion[] = saved ? JSON.parse(saved) : [];
        const existingIds = new Set(existing.map((x) => x.id));
        const toAdd = wrongQs.filter((x) => !existingIds.has(x.id));
        const updated = [...toAdd, ...existing];
        localStorage.setItem(`ham_wrong_questions_${level}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save wrong questions', e);
      }
    }
  };

  // Grading calculation
  const scoreStats = useMemo(() => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answerType) {
        correctCount++;
      }
    });
    const isPassed = correctCount >= config.passScore;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const timeSpentSec = Math.floor((Date.now() - examStartedAt) / 1000);
    const timeSpentMin = Math.floor(timeSpentSec / 60);
    const timeSpentRemainingSec = timeSpentSec % 60;

    return {
      correctCount,
      totalCount: questions.length,
      wrongCount: questions.length - correctCount,
      isPassed,
      accuracy,
      timeSpentMin,
      timeSpentRemainingSec,
    };
  }, [questions, answers, isSubmitted, config.passScore, examStartedAt]);

  const currentQuestion = questions[currentIndex];
  const minutesLeft = Math.floor(timeLeftSec / 60);
  const secondsLeft = timeLeftSec % 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Header bar: Timer, Progress & Status */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
            level === 'A' ? 'bg-emerald-600' : level === 'B' ? 'bg-sky-600' : 'bg-amber-600'
          }`}>
            {level}
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base flex items-center gap-2">
              <span>{config.title} 全真自测</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                合格标准: ≥{config.passScore}/{config.totalQuestions} 题
              </span>
            </div>
            <div className="text-xs text-slate-500">
              已完成 {answeredCount} / {questions.length} 题
            </div>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {!isSubmitted ? (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              timeLeftSec < 300 
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse' 
                : isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>
                {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
              scoreStats.isPassed 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {scoreStats.isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{scoreStats.isPassed ? '考试通过合格' : '未达到及格线'}</span>
            </div>
          )}

          {!isSubmitted ? (
            <button
              onClick={handleSubmitExam}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>提交试卷</span>
            </button>
          ) : (
            <button
              onClick={handleRestartExam}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新抽题测试</span>
            </button>
          )}
        </div>
      </div>

      {/* If Submitted: Result Scorecard Banner */}
      {isSubmitted && (
        <div className={`p-6 rounded-3xl border shadow-lg text-center relative overflow-hidden ${
          scoreStats.isPassed
            ? isDark ? 'bg-gradient-to-b from-emerald-950/40 to-[#111114] border-emerald-500/40' : 'bg-emerald-50/80 border-emerald-300'
            : isDark ? 'bg-gradient-to-b from-rose-950/40 to-[#111114] border-rose-500/40' : 'bg-rose-50/80 border-rose-300'
        }`}>
          <div className="inline-flex p-3 rounded-2xl mb-3 shadow-inner bg-white/10">
            {scoreStats.isPassed ? (
              <Award className="w-10 h-10 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            )}
          </div>
          <h3 className={`text-2xl font-black mb-1 ${
            scoreStats.isPassed ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {scoreStats.isPassed ? '🎉 恭喜！全真模拟考核合格' : '⚠️ 模拟成绩未达及格线，继续加油'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            CRAC {config.title} · 合格要求答对 ≥ {config.passScore} / {questions.length} 题
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6 text-left">
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-white border-slate-200'}`}>
              <div className="text-[11px] text-slate-500">最终得分 / 正确题数</div>
              <div className="text-xl font-mono font-black text-emerald-500">
                {scoreStats.correctCount} <span className="text-xs text-slate-400">/ {questions.length}</span>
              </div>
            </div>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-white border-slate-200'}`}>
              <div className="text-[11px] text-slate-500">错题数量</div>
              <div className="text-xl font-mono font-black text-rose-500">
                {scoreStats.wrongCount} <span className="text-xs text-slate-400">题</span>
              </div>
            </div>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-white border-slate-200'}`}>
              <div className="text-[11px] text-slate-500">答题正确率</div>
              <div className="text-xl font-mono font-black text-sky-500">
                {scoreStats.accuracy}%
              </div>
            </div>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-white border-slate-200'}`}>
              <div className="text-[11px] text-slate-500">用时耗时</div>
              <div className="text-xl font-mono font-black text-amber-500">
                {scoreStats.timeSpentMin}分{scoreStats.timeSpentRemainingSec}秒
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleRestartExam}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              再练一套新模拟题
            </button>
            {onGoToWrongBook && scoreStats.wrongCount > 0 && (
              <button
                onClick={onGoToWrongBook}
                className="px-4 py-2 rounded-xl border border-orange-500/50 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-xs font-bold transition-colors cursor-pointer"
              >
                进入 {level} 类错题本强化 ({scoreStats.wrongCount} 题)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Canvas & Palette Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 cols: Active Question Display */}
        <div className="lg:col-span-3 space-y-4">
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  第 {currentIndex + 1} / {questions.length} 题
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-mono border ${
                  isDark ? 'bg-[#1F1F24] text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {currentQuestion.id}
                </span>
                {currentQuestion.sectionCode && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    大纲章节: §{currentQuestion.sectionCode}
                  </span>
                )}
              </div>

              {isSubmitted && (
                <div>
                  {answers[currentQuestion.id] === currentQuestion.answerType ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 本题正确
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 本题回答错误
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Question Text */}
            <h3 className={`text-base sm:text-lg font-bold leading-relaxed mb-6 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {currentQuestion.question}
            </h3>

            {/* Options Interactive List */}
            <div className="space-y-2.5 mb-6">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                const isCorrect = isSubmitted && currentQuestion.answerType.includes(opt.key);
                const isWrongSelection = isSubmitted && isSelected && !isCorrect;

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSubmitted
                        ? isCorrect
                          ? isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold' : 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                          : isWrongSelection
                          ? isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 line-through' : 'bg-rose-50 border-rose-400 text-rose-900 line-through'
                          : isDark ? 'bg-[#18181D] border-[#28282F] text-slate-400 opacity-60' : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                        : isSelected
                        ? isDark
                          ? 'bg-orange-500/15 border-orange-500 text-white font-semibold shadow-inner'
                          : 'bg-orange-50 border-orange-400 text-orange-950 font-semibold shadow-inner'
                        : isDark
                        ? 'bg-[#18181D] border-[#28282F] text-slate-300 hover:border-slate-600 hover:bg-[#1E1E24]'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isSubmitted
                        ? isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isWrongSelection
                          ? 'bg-rose-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                        : isSelected
                        ? 'bg-orange-600 text-white shadow-sm'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="flex-1 text-xs sm:text-sm leading-normal pt-0.5">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation (Visible after submit) */}
            {isSubmitted && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-150 ${
                isDark ? 'bg-[#18181D] border-[#2C2C33] text-slate-300' : 'bg-amber-50/80 border-amber-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1.5 text-orange-600 dark:text-orange-400 text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>CRAC 官方标准答案：{currentQuestion.answerType}</span>
                </div>
                <div>{currentQuestion.explanation}</div>
              </div>
            )}

            {/* Question Next / Prev navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#2C2C33]">
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold disabled:opacity-30 cursor-pointer ${
                  isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-200 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一题</span>
              </button>

              <div className="text-xs font-mono text-slate-500">
                {currentIndex + 1} / {questions.length}
              </div>

              <button
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                disabled={currentIndex === questions.length - 1}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold disabled:opacity-30 cursor-pointer ${
                  isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-200 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>下一题</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 col: Question Number Palette Grid */}
        <div className="lg:col-span-1">
          <div className={`p-4 rounded-3xl border shadow-sm sticky top-20 ${
            isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#2C2C33]">
              <div className="font-bold text-xs">答题卡总览</div>
              <div className="text-[11px] font-mono text-slate-500">
                {answeredCount}/{questions.length} 已答
              </div>
            </div>

            {/* Matrix of circles */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-72 lg:max-h-96 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = !!answers[q.id];
                const isCorrect = isSubmitted && answers[q.id] === q.answerType;
                const isWrong = isSubmitted && isAnswered && answers[q.id] !== q.answerType;
                const isSkipped = isSubmitted && !isAnswered;

                let colorClasses = isDark ? 'bg-[#1C1C21] text-slate-400 border-[#2D2D33]' : 'bg-slate-100 text-slate-600 border-slate-200';

                if (isSubmitted) {
                  if (isCorrect) colorClasses = 'bg-emerald-600 text-white font-bold border-emerald-600';
                  else if (isWrong) colorClasses = 'bg-rose-600 text-white font-bold border-rose-600';
                  else if (isSkipped) colorClasses = 'bg-slate-700 text-slate-300 border-slate-600';
                } else if (isAnswered) {
                  colorClasses = isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold' : 'bg-orange-100 text-orange-700 border-orange-300 font-bold';
                }

                if (isCurrent) {
                  colorClasses += ' ring-2 ring-orange-500 scale-105';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-7.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${colorClasses}`}
                    title={`第 ${idx + 1} 题`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
