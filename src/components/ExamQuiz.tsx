import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { quizQuestions } from '../data/hamData';
import { QuizQuestion } from '../types';
import { useTheme } from '../utils/theme';

export const ExamQuiz: React.FC = () => {
  const { isDark } = useTheme();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ: QuizQuestion = quizQuestions[currentIdx];
  const selectedOption = selectedAnswers[currentQ.id];
  const isAnswered = selectedOption !== undefined;
  const isCorrect = isAnswered && selectedOption === currentQ.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (showExplanation) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      let correctCount = 0;
      quizQuestions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });
      if (correctCount / quizQuestions.length >= 0.8) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsFinished(false);
  };

  const totalQuestions = quizQuestions.length;
  let correctCount = 0;
  quizQuestions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctIndex) {
      correctCount++;
    }
  });
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Award className="w-4 h-4" />
            <span>CRAC A 证高频考点与易错避坑真题自测</span>
          </div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            精选 12 道易错避坑核心试题自测
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-[#0A0A0B] border border-orange-200 dark:border-[#2D2D33] text-orange-700 dark:text-orange-400 font-bold">
            进度: {isFinished ? totalQuestions : currentIdx + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      {!isFinished ? (
        /* Quiz Question Card */
        <div className={`border rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 transition-colors ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          {/* Question Header & Category Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2D2D33]">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900 font-mono">
              第 {currentIdx + 1} 题 • {currentQ.trapType || '核心考点'}
            </span>
            <span className="text-xs font-mono text-slate-400">单选题</span>
          </div>

          {/* Question Text */}
          <h3 className={`text-sm sm:text-base font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentQ.question}
          </h3>

          {/* Options list */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isThisSelected = selectedOption === idx;
              const isThisCorrect = idx === currentQ.correctIndex;

              let optionClasses = isDark 
                ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-200 hover:border-orange-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-orange-400';

              if (showExplanation) {
                if (isThisCorrect) {
                  optionClasses = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 font-bold';
                } else if (isThisSelected && !isThisCorrect) {
                  optionClasses = 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-700 font-bold';
                } else {
                  optionClasses = isDark ? 'opacity-40 bg-[#16161B] border-[#2D2D33]' : 'opacity-40 bg-slate-50 border-slate-200';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={showExplanation}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${optionClasses}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#0A0A0B] text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </div>

                  {showExplanation && (
                    <div>
                      {isThisCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isThisSelected && !isThisCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className={`p-4 rounded-2xl border space-y-2 animate-in fade-in ${
              isCorrect
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {isCorrect ? (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> 回答正确！
                  </span>
                ) : (
                  <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> 回答错误，请注意该考点避坑陷阱！
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-end pt-2">
            {showExplanation ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span>{currentIdx < totalQuestions - 1 ? '下一题' : '查看自测成绩'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs text-slate-400">请点击选项作答</span>
            )}
          </div>
        </div>
      ) : (
        /* Results Card */
        <div className={`border rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6 transition-colors ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          <div className="inline-flex p-4 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 mb-2">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              自测完成！得分: {scorePercent}%
            </h3>
            <p className="text-xs text-slate-500">
              共答对 {correctCount} / {totalQuestions} 道试题 • {scorePercent >= 80 ? '🎉 恭喜！您已达到 CRAC A 证合格线 (80%)！' : '需加强复习，建议查看知识图谱与避坑卡片。'}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新自测</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
