import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck,
  FileText
} from 'lucide-react';
import { KnowledgeNode, CategoryType } from '../types';
import { flatKnowledgeNodes } from '../data/hamData';
import { pdfQuestionsData } from '../data/pdfQuestions';
import { useTheme } from '../utils/theme';

interface CardViewProps {
  onSelectNode: (node: KnowledgeNode) => void;
  searchQuery?: string;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  onJumpToPdf?: (page: number, questionId?: string) => void;
}

const CATEGORY_TABS: { id: 'all' | CategoryType; label: string }[] = [
  { id: 'all', label: '全部考点' },
  { id: 'law', label: '法律法规' },
  { id: 'comm', label: '通联与呼号' },
  { id: 'bands', label: '频段与功率' },
  { id: 'tech', label: '电学与天线' },
  { id: 'safety', label: '安全防护' },
];

export const CardView: React.FC<CardViewProps> = ({
  onSelectNode,
  searchQuery = '',
  bookmarkedIds,
  onToggleBookmark,
  onJumpToPdf,
}) => {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryType>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>('');

  const query = (searchQuery || localSearch).trim().toLowerCase();

  const filteredNodes = useMemo(() => {
    return flatKnowledgeNodes.filter((node) => {
      if (selectedCategory !== 'all' && node.category !== selectedCategory) {
        return false;
      }
      if (onlyBookmarks && !bookmarkedIds.has(node.id)) {
        return false;
      }
      if (query) {
        const text = `${node.title} ${node.summary} ${node.detail} ${node.mnemonic || ''} ${
          node.keyFormula || ''
        } ${(node.examTips || []).join(' ')}`.toLowerCase();
        return text.includes(query);
      }
      return true;
    });
  }, [selectedCategory, onlyBookmarks, bookmarkedIds, query]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Search & Filter Header Bar */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <BookOpen className="w-4 h-4" />
            <span>CRAC A 证考纲结构化考点精编卡</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-[#0A0A0B] text-orange-700 dark:text-orange-400 font-mono">
              共 {filteredNodes.length} 个考点
            </span>
          </div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            核心知识点、避坑指南与真题联动
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            涵盖无线电管理条例、呼号规则、Q简语、30-3000MHz功率上限、发射类别(F3E)及真题解析。
          </p>
        </div>

        {/* Local Search Input & Bookmark Switch */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索考点、公式或避坑..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-orange-500 transition-colors ${
                isDark 
                  ? 'bg-[#1C1C21] border-[#2D2D33] text-white placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>

          <button
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
              onlyBookmarks
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                : isDark 
                ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-300 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>收藏 ({bookmarkedIds.size})</span>
          </button>
        </div>
      </div>

      {/* Category Pills Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-orange-600 text-white font-bold shadow-sm'
                    : 'bg-orange-600 text-white font-bold shadow-sm'
                  : isDark
                  ? 'bg-[#141418] text-slate-400 border border-[#2D2D33] hover:text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid of Knowledge Point Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredNodes.map((node) => {
          const isBookmarked = bookmarkedIds.has(node.id);
          const qCount = pdfQuestionsData.filter((q) => q.nodeId === node.id).length;

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md relative flex flex-col justify-between group ${
                isDark 
                  ? 'bg-[#111114] border-[#2D2D33] hover:border-orange-500 text-white' 
                  : 'bg-white border-slate-200 hover:border-orange-400 text-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 font-bold">
                      §{node.sectionCode || node.id}
                    </span>
                    {node.pdfPage && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1C1C21] text-slate-600 dark:text-slate-400">
                        P.{node.pdfPage}
                      </span>
                    )}
                    {qCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold">
                        🎯 {qCount} 道题
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(node.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/40'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title={isBookmarked ? '取消收藏' : '收藏考点'}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Title */}
                <h3 className={`font-bold text-sm sm:text-base leading-snug group-hover:text-orange-600 transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {node.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {node.summary}
                </p>

                {/* Key formula pill if present */}
                {node.keyFormula && (
                  <div className={`mt-2.5 text-xs font-mono px-2.5 py-1 rounded-xl font-semibold truncate ${
                    isDark ? 'bg-[#1C1C21] text-orange-400 border border-[#2D2D33]' : 'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {node.keyFormula}
                  </div>
                )}

                {/* Mnemonic Rhyme */}
                {node.mnemonic && (
                  <div className={`mt-2 text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                    isDark ? 'bg-[#141418] text-slate-300 border-[#2D2D33]' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate font-medium">{node.mnemonic}</span>
                  </div>
                )}

                {/* Trap Warning Alert */}
                {node.trapWarning && (
                  <div className="mt-2 text-xs px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                    <span className="line-clamp-1">{node.trapWarning}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2D2D33] flex items-center justify-between text-xs">
                {node.pdfPage && onJumpToPdf ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToPdf(node.pdfPage!, node.targetQuestionId);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    <span>题库原件 P.{node.pdfPage}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">考纲标准题</span>
                )}

                <span className="text-orange-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-xs">
                  查看深度解析
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNodes.length === 0 && (
        <div className={`p-8 text-center rounded-2xl border ${
          isDark ? 'bg-[#111114] border-[#2D2D33] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <p className="text-sm">未找到匹配的考点知识卡片</p>
          <button
            onClick={() => {
              setLocalSearch('');
              setSelectedCategory('all');
              setOnlyBookmarks(false);
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold"
          >
            重置筛选条件
          </button>
        </div>
      )}
    </div>
  );
};
