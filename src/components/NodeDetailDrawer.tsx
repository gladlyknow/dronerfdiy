import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  Bookmark, 
  BookmarkCheck, 
  FileText,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { KnowledgeNode, PdfQuestion } from '../types';
import { pdfQuestionsData } from '../data/pdfQuestions';
import { useTheme } from '../utils/theme';

interface NodeDetailDrawerProps {
  node: KnowledgeNode | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onJumpToPdf?: (page: number, questionId?: string) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onJumpToPdf,
}) => {
  const { isDark } = useTheme();
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Find all questions belonging to this knowledge node
  const linkedQuestions = useMemo<PdfQuestion[]>(() => {
    if (!node) return [];

    const matched = pdfQuestionsData.filter((q) => {
      if (q.nodeId === node.id) return true;
      if (node.targetQuestionId && q.id === node.targetQuestionId) return true;
      if (node.questionIds && node.questionIds.includes(q.id)) return true;
      if (node.sectionCode && q.sectionCode.startsWith(node.sectionCode)) return true;
      return false;
    });

    if (matched.length === 0 && node.targetQuestionId) {
      const single = pdfQuestionsData.find((q) => q.id === node.targetQuestionId);
      if (single) return [single];
    }

    return matched;
  }, [node]);

  if (!node) return null;

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestionId((prev) => (prev === qId ? null : qId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className={`w-full max-w-xl border-l h-full overflow-y-auto shadow-2xl p-4 sm:p-6 flex flex-col justify-between space-y-5 transition-colors ${
        isDark ? 'bg-[#0E0E11] border-[#2D2D33] text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="space-y-5">
          {/* Header */}
          <div className={`flex items-start justify-between gap-3 pb-3 border-b ${
            isDark ? 'border-[#2D2D33]' : 'border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  isDark 
                    ? 'bg-[#0A0A0B] text-orange-400 border-[#2D2D33]' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {node.category === 'law'
                    ? '法律法规'
                    : node.category === 'comm'
                    ? '通联规范'
                    : node.category === 'bands'
                    ? '频段功率'
                    : node.category === 'tech'
                    ? '射频电学'
                    : '安全应急'}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {node.id}</span>
                {node.sectionCode && (
                  <span className="text-xs text-slate-400 font-mono">§{node.sectionCode}</span>
                )}
              </div>
              <h2 className={`text-base sm:text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {node.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onToggleBookmark(node.id)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1C1C21] text-slate-400 hover:text-orange-400 border-[#2D2D33]'
                    : 'bg-slate-50 text-slate-600 hover:text-orange-600 border-slate-200'
                }`}
                title={isBookmarked ? '取消收藏' : '收藏此考点'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-orange-600 fill-orange-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1C1C21] text-slate-400 hover:text-white border-[#2D2D33]'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick PDF Jump Banner */}
          {node.pdfPage && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-orange-950/20 border-orange-900/50' : 'bg-orange-50/80 border-orange-200'
            }`}>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">官方题库 PDF 原件联动</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  起始页: 第 {node.pdfPage} 页 • 涵盖真题: {linkedQuestions.length} 道
                </div>
              </div>

              {onJumpToPdf && (
                <button
                  onClick={() => {
                    const primaryQId = node.targetQuestionId || (linkedQuestions[0]?.id);
                    onJumpToPdf(node.pdfPage || 1, primaryQId);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <span>定位原题</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-medium ${
            isDark 
              ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-200' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            💡 {node.summary}
          </div>

          {/* Full Explanation Detail */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>考点深度剖析</span>
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed p-3.5 rounded-2xl border ${
              isDark
                ? 'text-slate-200 bg-[#1C1C21] border-[#2D2D33]'
                : 'text-slate-800 bg-slate-50/70 border-slate-200'
            }`}>
              {node.detail}
            </p>
          </div>

          {/* Key Formula */}
          {node.keyFormula && (
            <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
              isDark ? 'bg-[#0A0A0B] border-[#2D2D33]' : 'bg-orange-50/50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                <Calculator className="w-3.5 h-3.5" />
                <span>核心计算公式</span>
              </div>
              <div className={`text-xs font-mono font-bold p-2.5 rounded-xl border ${
                isDark ? 'text-white bg-[#1C1C21] border-[#2D2D33]' : 'text-slate-900 bg-white border-slate-200'
              }`}>
                {node.keyFormula}
              </div>
            </div>
          )}

          {/* Memory Mnemonic */}
          {node.mnemonic && (
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>速记口诀</span>
              </div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{node.mnemonic}</p>
            </div>
          )}

          {/* Exam Tips */}
          {node.examTips && node.examTips.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>考试必背要点</span>
              </h4>
              <ul className="space-y-1.5">
                {node.examTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className={`text-xs p-2.5 rounded-xl border flex items-start gap-2 ${
                      isDark
                        ? 'text-slate-200 bg-[#1C1C21] border-[#2D2D33]'
                        : 'text-slate-800 bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trap Warning Alert */}
          {node.trapWarning && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>真题避坑指南</span>
              </div>
              <p className="text-xs leading-relaxed font-medium text-rose-700 dark:text-rose-300">
                {node.trapWarning}
              </p>
            </div>
          )}

          {/* Linked Prototype Exam Questions (Full Coverage) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
                <span>本考点涵盖的全部官方原型题 ({linkedQuestions.length} 道)</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">100% 全收录</span>
            </div>

            {linkedQuestions.length === 0 ? (
              <div className={`p-4 rounded-xl border text-center text-xs text-slate-400 ${
                isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
              }`}>
                暂无收录此考点对应的独立试题
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestionId === q.id || linkedQuestions.length === 1;

                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark 
                          ? 'bg-[#141418] border-[#2D2D33]' 
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Question Top Info Bar */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 font-mono font-bold text-[11px]">
                            {q.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            §{q.sectionCode} • 第 {q.page} 页
                          </span>
                        </div>

                        {onJumpToPdf && (
                          <button
                            onClick={() => {
                              onJumpToPdf(q.page, q.id);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-600 hover:text-white text-orange-700 dark:text-orange-400 font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0 border border-orange-200 dark:border-orange-900"
                            title="在题库原件中精准高亮此题"
                          >
                            <span>定位原题</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Question Stem */}
                      <div className={`text-xs sm:text-sm font-medium mb-2 leading-snug ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        <span className="text-slate-400 font-mono mr-1.5">[{idx + 1}]</span>
                        {q.question}
                      </div>

                      {/* Toggle Options and Answer */}
                      <div>
                        <button
                          onClick={() => toggleQuestionExpand(q.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer mb-1.5"
                        >
                          <span>{isExpanded ? '收起选项与解析' : '展开查看选项与答案'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="space-y-2 animate-in fade-in duration-150">
                            {/* Options List */}
                            <div className="space-y-1">
                              {q.options.map((opt) => {
                                const isCorrect = q.answerType.includes(opt.key);
                                return (
                                  <div
                                    key={opt.key}
                                    className={`p-2 rounded-xl text-xs flex items-start gap-2 border transition-all ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                                        : isDark
                                        ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]'
                                        : 'bg-white text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded flex items-center justify-center font-mono text-[10px] shrink-0 font-bold ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : isDark
                                        ? 'bg-[#2D2D33] text-slate-400'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {opt.key}
                                    </span>
                                    <span className="leading-tight flex-1">{opt.text}</span>
                                    {isCorrect && (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Official Explanation */}
                            {q.explanation && (
                              <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed mt-2 ${
                                isDark 
                                  ? 'bg-[#0A0A0B] border-[#2D2D33] text-slate-300' 
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}>
                                <span className="text-orange-600 font-bold mr-1">【官方精析】</span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Close Action */}
        <div className={`pt-3 border-t space-y-2 shrink-0 ${
          isDark ? 'border-[#2D2D33]' : 'border-slate-200'
        }`}>
          {node.pdfPage && onJumpToPdf && (
            <button
              onClick={() => {
                const primaryQId = node.targetQuestionId || (linkedQuestions[0]?.id);
                onJumpToPdf(node.pdfPage || 1, primaryQId);
                onClose();
              }}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>在 PDF 题库中全览此考点试题（共 {linkedQuestions.length} 题）</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            关闭考点面板
          </button>
        </div>
      </div>
    </div>
  );
};
