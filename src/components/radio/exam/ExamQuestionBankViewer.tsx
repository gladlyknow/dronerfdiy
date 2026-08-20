import React, { useState, useMemo } from 'react';
import { ExamLevel, ExamQuestion } from '../../../types';
import { getQuestionsByLevel } from '../../../data/examLevelsData';
import { Search, CheckCircle2, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, HelpCircle, Layers } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamQuestionBankViewerProps {
  level: ExamLevel;
  onSelectNode?: (nodeId: string) => void;
}

export const ExamQuestionBankViewer: React.FC<ExamQuestionBankViewerProps> = ({ level }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`ham_favs_${level}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const questions = useMemo(() => getQuestionsByLevel(level), [level]);

  const sections = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q) => {
      const sec = q.sectionCode || '通用考点';
      map.set(sec, (map.get(sec) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = 
        !searchTerm || 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.jCode && q.jCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSection = selectedSection === 'ALL' || q.sectionCode === selectedSection;

      return matchesSearch && matchesSection;
    });
  }, [questions, searchTerm, selectedSection]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`ham_favs_${level}`, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Section Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`在 ${level} 类题库中搜索题目、题号 (如 MC1-0059)、关键字或解析...`}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors ${
              isDark ? 'bg-[#18181C] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Section Pill selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => { setSelectedSection('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer font-medium ${
              selectedSection === 'ALL'
                ? 'bg-orange-600 text-white font-bold'
                : isDark ? 'bg-[#1C1C21] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部章节 ({questions.length})
          </button>
          {sections.map(([sec, count]) => (
            <button
              key={sec}
              onClick={() => { setSelectedSection(sec); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer font-medium ${
                selectedSection === sec
                  ? 'bg-orange-600 text-white font-bold'
                  : isDark ? 'bg-[#1C1C21] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              §{sec} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {paginatedQuestions.map((q, idx) => {
          const isFav = bookmarkedIds.has(q.id);
          const globalIdx = (currentPage - 1) * pageSize + idx + 1;
          return (
            <div
              key={q.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                isDark ? 'bg-[#141418] border-[#2D2D33] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    第 {globalIdx} 题 / {filteredQuestions.length}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                    isDark ? 'bg-[#1F1F24] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {q.id}
                  </span>
                  {q.jCode && (
                    <span className="text-[11px] font-mono text-slate-500">
                      CRAC: {q.jCode}
                    </span>
                  )}
                  {q.sectionCode && (
                    <span className="text-[11px] text-slate-400">
                      大纲章节: §{q.sectionCode}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleBookmark(q.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isFav
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : isDark ? 'text-slate-500 hover:text-slate-300 border-transparent' : 'text-slate-400 hover:text-slate-700 border-transparent'
                  }`}
                  title={isFav ? '取消收藏' : '收藏到重点题本'}
                >
                  {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>

              {/* Question text */}
              <h4 className={`text-sm sm:text-base font-semibold leading-relaxed mb-3.5 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {q.question}
              </h4>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
                {q.options.map((opt) => {
                  const isCorrect = q.answerType.includes(opt.key);
                  return (
                    <div
                      key={opt.key}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                        isCorrect
                          ? isDark
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                          : isDark
                          ? 'bg-[#18181C] border-[#26262B] text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold shrink-0 text-xs ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 leading-normal">{opt.text}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Official Answer & Explanation */}
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-[#16161B] border-[#28282E] text-slate-300' : 'bg-orange-50/70 border-orange-200/80 text-slate-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1 text-orange-600 dark:text-orange-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>标准答案：{q.answerType}</span>
                </div>
                <div>{q.explanation}</div>
              </div>
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-[#111114] border-[#2D2D33] text-slate-500' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            未找到与 "{searchTerm}" 相关的题目，请尝试更换搜索词或重置章节。
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredQuestions.length)} 题，共 {filteredQuestions.length} 题
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border text-xs disabled:opacity-40 cursor-pointer ${
                isDark ? 'bg-[#141418] border-[#2D2D33] text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border text-xs disabled:opacity-40 cursor-pointer ${
                isDark ? 'bg-[#141418] border-[#2D2D33] text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
