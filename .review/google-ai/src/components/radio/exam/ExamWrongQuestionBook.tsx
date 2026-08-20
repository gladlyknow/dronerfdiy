import React, { useState, useEffect } from 'react';
import { ExamLevel, ExamQuestion } from '../../../types';
import { Trash2, RotateCcw, CheckCircle2, XCircle, HelpCircle, BookOpen, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamWrongQuestionBookProps {
  level: ExamLevel;
  onJumpToQuestionBank?: () => void;
}

export const ExamWrongQuestionBook: React.FC<ExamWrongQuestionBookProps> = ({ level, onJumpToQuestionBank }) => {
  const { isDark } = useTheme();
  const storageKey = `ham_wrong_questions_${level}`;

  const [wrongQuestions, setWrongQuestions] = useState<ExamQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(wrongQuestions));
    } catch (e) {
      console.warn(e);
    }
  }, [wrongQuestions, storageKey]);

  const handleSelectOption = (qId: string, optKey: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const handleCheckAnswer = (qId: string) => {
    setCheckedIds((prev) => new Set(prev).add(qId));
  };

  const handleRemoveQuestion = (qId: string) => {
    setWrongQuestions((prev) => prev.filter((q) => q.id !== qId));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
  };

  const handleClearAll = () => {
    if (window.confirm(`确定清空 ${level} 类的所有错题记录吗？`)) {
      setWrongQuestions([]);
      setCheckedIds(new Set());
      setUserAnswers({});
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold">
            {wrongQuestions.length}
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
              <span>{level} 类专属错题强化本</span>
            </h3>
            <p className="text-xs text-slate-500">
              全真模考中做错的题目会自动收录在此，逐题攻克重练
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wrongQuestions.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs text-rose-500 hover:bg-rose-500/10 border-rose-500/30 transition-colors cursor-pointer`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空错题本</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {wrongQuestions.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border shadow-xs ${
          isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-1">
            太棒了！{level} 类错题本为空
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            您在全真模拟自测中尚未产生错题，或已全部掌握攻克。您可以去题库浏览或开启一场新自测！
          </p>
          {onJumpToQuestionBank && (
            <button
              onClick={onJumpToQuestionBank}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              前往 {level} 类题库巩固
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {wrongQuestions.map((q, idx) => {
            const isChecked = checkedIds.has(q.id);
            const userChoice = userAnswers[q.id];
            const isCorrect = isChecked && userChoice === q.answerType;
            const isWrong = isChecked && userChoice && userChoice !== q.answerType;

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      错题 #{idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                      isDark ? 'bg-[#1F1F24] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {q.id}
                    </span>
                    {q.sectionCode && (
                      <span className="text-[11px] text-slate-400">
                        章节: §{q.sectionCode}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="text-slate-400 hover:text-emerald-500 p-1 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="已掌握，从错题本移出"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">已掌握移出</span>
                  </button>
                </div>

                <h4 className={`text-sm sm:text-base font-semibold mb-3.5 leading-relaxed ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {q.question}
                </h4>

                <div className="space-y-2 mb-3.5">
                  {q.options.map((opt) => {
                    const isSelected = userChoice === opt.key;
                    const isOfficialCorrect = isChecked && q.answerType.includes(opt.key);
                    const isSelectedWrong = isChecked && isSelected && !isOfficialCorrect;

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                          isChecked
                            ? isOfficialCorrect
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                              : isSelectedWrong
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 line-through'
                              : isDark ? 'bg-[#18181C] border-[#24242A] text-slate-500 opacity-60' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                            : isSelected
                            ? isDark ? 'bg-orange-500/20 border-orange-500 text-white font-bold' : 'bg-orange-50 border-orange-400 text-orange-950 font-bold'
                            : isDark ? 'bg-[#18181C] border-[#26262B] text-slate-300 hover:bg-[#1E1E24]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold shrink-0 text-xs ${
                          isSelected ? 'bg-orange-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom actions & Explanation */}
                <div className="flex items-center justify-between pt-2">
                  {!isChecked ? (
                    <button
                      onClick={() => handleCheckAnswer(q.id)}
                      disabled={!userChoice}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      核对答案与解析
                    </button>
                  ) : (
                    <div className={`p-3 rounded-xl border text-xs w-full leading-relaxed ${
                      isDark ? 'bg-[#16161B] border-[#28282E] text-slate-300' : 'bg-amber-50/70 border-amber-200 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1 text-orange-600 dark:text-orange-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>标准答案：{q.answerType}</span>
                        {isCorrect && <span className="text-emerald-500 ml-2">✓ 重练回答正确！</span>}
                      </div>
                      <div>{q.explanation}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
