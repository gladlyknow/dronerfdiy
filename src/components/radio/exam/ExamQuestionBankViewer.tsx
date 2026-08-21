import React, { useMemo, useState } from 'react';
import type { ExamLevel } from '../../../types';
import { getQuestionsByLevel } from '../../../data/examLevelsData';
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Search } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamQuestionBankViewerProps {
  level: ExamLevel;
  onSelectNode?: (nodeId: string) => void;
}

export const ExamQuestionBankViewer: React.FC<ExamQuestionBankViewerProps> = ({ level }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`ham_favs_${level}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const pageSize = 10;
  const questions = useMemo(() => getQuestionsByLevel(level), [level]);

  const sections = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((q) => {
      const section = q.sectionCode || '通用考点';
      counts.set(section, (counts.get(section) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN', { numeric: true }));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return questions.filter((q) => {
      const matchesSection = selectedSection === 'ALL' || q.sectionCode === selectedSection;
      if (!matchesSection) return false;
      if (!query) return true;
      return [q.id, q.jCode || '', q.question, q.explanation || '', ...q.options.map((o) => o.text)]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [questions, searchTerm, selectedSection]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safePage]);

  const chooseSection = (section: string) => {
    setSelectedSection(section);
    setCurrentPage(1);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`ham_favs_${level}`, JSON.stringify([...next]));
      } catch {
        // localStorage may be unavailable in privacy mode; bookmarking remains usable for this session.
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-4 shadow-sm space-y-3 ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={`搜索 ${level} 类题干、题号、J码或选项…`}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none focus:border-orange-500 ${isDark ? 'bg-[#18181C] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>快速选择章节</span>
            <select
              value={selectedSection}
              onChange={(event) => chooseSection(event.target.value)}
              className={`min-w-[190px] max-w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-orange-500 ${isDark ? 'bg-[#18181C] border-[#2D2D33] text-white' : 'bg-white border-slate-300 text-slate-800'}`}
            >
              <option value="ALL">全部章节（{questions.length} 题）</option>
              {sections.map(([section, count]) => (
                <option key={section} value={section}>§{section}（{count} 题）</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 mb-2">全部章节按钮（可完整选择，不再横向裁切）</div>
          <div className="flex flex-wrap gap-1.5 max-w-full">
            <button
              onClick={() => chooseSection('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors ${selectedSection === 'ALL' ? 'bg-orange-600 text-white font-bold' : isDark ? 'bg-[#1C1C21] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              全部（{questions.length}）
            </button>
            {sections.map(([section, count]) => (
              <button
                key={section}
                onClick={() => chooseSection(section)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors ${selectedSection === section ? 'bg-orange-600 text-white font-bold' : isDark ? 'bg-[#1C1C21] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                §{section}（{count}）
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {paginatedQuestions.map((q, index) => {
          const globalIndex = (safePage - 1) * pageSize + index + 1;
          const isFav = bookmarkedIds.has(q.id);
          return (
            <article key={q.id} className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">第 {globalIndex} / {filteredQuestions.length} 题</span>
                  <span className={`px-2 py-0.5 rounded-md font-mono border ${isDark ? 'bg-[#1F1F24] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>{q.id}</span>
                  {q.jCode && <span className="font-mono text-slate-500">J: {q.jCode}</span>}
                  {q.sectionCode && <span className="text-slate-500">§{q.sectionCode}</span>}
                </div>
                <button onClick={() => toggleBookmark(q.id)} title={isFav ? '取消收藏' : '收藏'} className={`p-1.5 rounded-lg cursor-pointer ${isFav ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-orange-500'}`}>
                  {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>

              <h3 className={`text-sm sm:text-base font-semibold leading-relaxed mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{q.question}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {q.options.map((option) => {
                  const correct = (q.answerType || '').includes(option.key);
                  return (
                    <div key={option.key} className={`p-2.5 rounded-xl border text-xs flex gap-2.5 ${correct ? isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900' : isDark ? 'bg-[#18181C] border-[#26262B] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold shrink-0 ${correct ? 'bg-emerald-600 text-white' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>{option.key}</span>
                      <span className="flex-1 leading-normal">{option.text}</span>
                      {correct && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>

              <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#16161B] border-[#28282E] text-slate-300' : 'bg-orange-50/70 border-orange-200 text-slate-800'}`}>
                <div className="flex items-center gap-1.5 font-bold text-orange-600 mb-1"><HelpCircle className="w-3.5 h-3.5" />标准答案：{q.answerType}</div>
                <div>{q.explanation || '原始题库未提供解析。'}</div>
              </div>
            </article>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className={`p-10 text-center rounded-2xl border text-sm ${isDark ? 'bg-[#111114] border-[#2D2D33] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>没有匹配题目。</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={`rounded-2xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-500">显示 {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredQuestions.length)} / {filteredQuestions.length}</div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className={`p-2 rounded-xl border disabled:opacity-40 cursor-pointer ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}><ChevronLeft className="w-4 h-4" /></button>
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <span>页</span>
              <select value={safePage} onChange={(e) => setCurrentPage(Number(e.target.value))} className={`rounded-lg border px-2 py-1.5 font-mono outline-none ${isDark ? 'bg-[#18181C] border-[#2D2D33] text-white' : 'bg-white border-slate-300'}`}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => <option key={page} value={page}>{page}</option>)}
              </select>
              <span>/ {totalPages}</span>
            </label>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className={`p-2 rounded-xl border disabled:opacity-40 cursor-pointer ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};
