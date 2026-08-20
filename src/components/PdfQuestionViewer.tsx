import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Search, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  Filter,
  Maximize2,
  Minimize2,
  X,
  ListFilter,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { pdfQuestionsData } from '../data/pdfQuestions';
import { KnowledgeNode, PdfQuestion } from '../types';
import { flatKnowledgeNodes } from '../data/hamData';
import { useTheme } from '../utils/theme';

interface PdfQuestionViewerProps {
  targetPage?: number;
  highlightQuestionId?: string;
  activeKnowledgeNode?: KnowledgeNode | null;
  onSelectKnowledgeNode?: (node: KnowledgeNode) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

export const PdfQuestionViewer: React.FC<PdfQuestionViewerProps> = ({
  targetPage = 1,
  highlightQuestionId,
  activeKnowledgeNode,
  onSelectKnowledgeNode,
  onClose,
  isFloating = false,
}) => {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState<number>(targetPage);
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [browseMode, setBrowseMode] = useState<'page' | 'continuous' | 'nodeOnly'>('page');
  const [viewStyle, setViewStyle] = useState<'a4' | 'cards'>('a4');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(highlightQuestionId || null);

  const containerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // List of all pages that actually contain questions
  const availablePages = useMemo(() => {
    const pages = Array.from(new Set(pdfQuestionsData.map((q) => q.page))).sort((a, b) => a - b);
    return pages;
  }, []);

  const totalPages = 165; // Total pages in CRAC official PDF document

  // Synchronize with external targetPage / highlightQuestionId changes
  useEffect(() => {
    if (targetPage) {
      setCurrentPage(targetPage);
    }
  }, [targetPage]);

  useEffect(() => {
    if (highlightQuestionId) {
      setSelectedQuestionId(highlightQuestionId);
      const found = pdfQuestionsData.find((q) => q.id === highlightQuestionId);
      if (found && found.page !== currentPage) {
        setCurrentPage(found.page);
      }
    }
  }, [highlightQuestionId]);

  // When activeKnowledgeNode changes, jump to its assigned PDF page
  useEffect(() => {
    if (activeKnowledgeNode?.pdfPage) {
      setCurrentPage(activeKnowledgeNode.pdfPage);
      if (activeKnowledgeNode.targetQuestionId) {
        setSelectedQuestionId(activeKnowledgeNode.targetQuestionId);
      }
    }
  }, [activeKnowledgeNode]);

  // Smooth scroll to the highlighted question
  useEffect(() => {
    if (selectedQuestionId && questionRefs.current[selectedQuestionId]) {
      const el = questionRefs.current[selectedQuestionId];
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    }
  }, [selectedQuestionId, currentPage, browseMode]);

  // Extract all unique sections
  const sectionList = useMemo(() => {
    const sections = new Set<string>();
    pdfQuestionsData.forEach((q) => sections.add(q.sectionCode));
    return Array.from(sections).sort();
  }, []);

  // Filter questions based on query, section, browseMode, or currentPage
  const displayedQuestions = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return pdfQuestionsData.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.jCode.toLowerCase().includes(q) ||
          item.question.toLowerCase().includes(q) ||
          item.sectionCode.includes(q) ||
          item.options.some((opt) => opt.text.toLowerCase().includes(q))
      );
    }

    if (browseMode === 'nodeOnly' && activeKnowledgeNode) {
      const list = pdfQuestionsData.filter(
        (item) =>
          item.nodeId === activeKnowledgeNode.id ||
          (activeKnowledgeNode.targetQuestionId && item.id === activeKnowledgeNode.targetQuestionId) ||
          (activeKnowledgeNode.sectionCode && item.sectionCode.startsWith(activeKnowledgeNode.sectionCode))
      );
      if (list.length > 0) return list;
    }

    if (selectedSection !== 'all') {
      return pdfQuestionsData.filter((item) => item.sectionCode === selectedSection);
    }

    if (browseMode === 'continuous') {
      return pdfQuestionsData;
    }

    // Default 'page' mode: return questions on this exact page
    return pdfQuestionsData.filter((item) => item.page === currentPage);
  }, [currentPage, searchQuery, selectedSection, browseMode, activeKnowledgeNode]);

  // Nearest available pages when user lands on a transitional/sparse page
  const nearestPages = useMemo(() => {
    const prev = availablePages.filter((p) => p < currentPage).pop();
    const next = availablePages.filter((p) => p > currentPage)[0];
    return { prev, next };
  }, [availablePages, currentPage]);

  // Closest available questions fallback when a page has 0 questions
  const fallbackQuestions = useMemo(() => {
    if (displayedQuestions.length > 0) return [];
    // Find closest page
    const target = nearestPages.next || nearestPages.prev || 1;
    return pdfQuestionsData.filter((q) => q.page === target);
  }, [displayedQuestions.length, nearestPages]);

  // Smart Navigation: Jump to next / prev page that actually contains questions
  const handleSmartPrev = () => {
    if (nearestPages.prev) {
      setCurrentPage(nearestPages.prev);
    } else if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSmartNext = () => {
    if (nearestPages.next) {
      setCurrentPage(nearestPages.next);
    } else if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSearchQuery('');
      setSelectedSection('all');
    }
  };

  const handleQuestionClick = (q: PdfQuestion) => {
    setSelectedQuestionId(q.id);
    if (q.nodeId && onSelectKnowledgeNode) {
      const node = flatKnowledgeNodes.find((n) => n.id === q.nodeId);
      if (node) {
        onSelectKnowledgeNode(node);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col shadow-xl transition-all duration-200 overflow-hidden border ${
        isDark ? 'bg-[#0E0E11] border-[#2D2D33]' : 'bg-white border-slate-200'
      } ${
        isExpanded
          ? 'fixed inset-2 sm:inset-4 z-50 rounded-3xl'
          : isFloating
          ? 'w-full h-full rounded-2xl'
          : 'w-full h-full rounded-2xl'
      }`}
    >
      {/* Top Header & Toolbar */}
      <div className={`p-3 sm:p-4 border-b flex flex-col gap-2.5 shrink-0 ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {/* Title with live sync badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0 font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CRAC 官方 A 类题库 PDF 原件联动
                </span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                  原件对照
                </span>
              </div>
              {activeKnowledgeNode ? (
                <div className="text-[11px] text-orange-600 truncate font-medium">
                  考点: {activeKnowledgeNode.title} (P.{activeKnowledgeNode.pdfPage || currentPage})
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 truncate">
                  支持按页仿真翻阅、361题连续刷题与考点智能定位
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center rounded-xl p-0.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-black/40 text-xs">
              <button
                onClick={() => setBrowseMode('page')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  browseMode === 'page'
                    ? 'bg-orange-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
                title="按 PDF 官方原件 165 页逐页翻看"
              >
                按页仿真
              </button>
              <button
                onClick={() => setBrowseMode('continuous')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  browseMode === 'continuous'
                    ? 'bg-orange-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
                title="361道题目连续向下滚屏刷题"
              >
                连续刷题
              </button>
            </div>

            <button
              onClick={() => setShowAnswers((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAnswers
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : isDark
                  ? 'bg-[#1C1C21] text-slate-400 border-[#2D2D33]'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title="显示/隐藏答案"
            >
              {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{showAnswers ? '答案已显' : '显示答案'}</span>
            </button>

            <button
              onClick={() => setViewStyle((prev) => (prev === 'a4' ? 'cards' : 'a4'))}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="切换 PDF 仿真版式 / 交互卡片版式"
            >
              {viewStyle === 'a4' ? '📑 仿真' : '🃏 卡片'}
            </button>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1C1C21] text-slate-400 border-[#2D2D33]'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title={isExpanded ? '缩小' : '全屏展开'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1C1C21] text-slate-400 border-[#2D2D33]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Quick Page Jump (when in page mode) */}
          {browseMode === 'page' && (
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isDark ? 'bg-[#0A0A0B] border-[#2D2D33]' : 'bg-white border-slate-300'
            }`}>
              <button
                onClick={handleSmartPrev}
                disabled={currentPage <= 1 && !nearestPages.prev}
                className={`p-1 rounded-lg disabled:opacity-30 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#1C1C21] text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="跳转到上一有题页面"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono px-1">
                <span className="text-slate-400">P.</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handlePageChange(val);
                  }}
                  className={`w-10 text-center font-bold text-orange-600 rounded px-1 py-0.5 focus:outline-none focus:border-orange-500 border ${
                    isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="text-slate-400">/ {totalPages}</span>
              </div>

              <button
                onClick={handleSmartNext}
                disabled={currentPage >= totalPages && !nearestPages.next}
                className={`p-1 rounded-lg disabled:opacity-30 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#1C1C21] text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="跳转到下一有题页面"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search inside PDF Question Bank */}
          <div className="flex-1 min-w-[140px] relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索题号 (如 MC1-0001)、关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 border ${
                isDark
                  ? 'bg-[#0A0A0B] border-[#2D2D33] text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chapter Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeKnowledgeNode && (
              <button
                onClick={() => setBrowseMode((prev) => (prev === 'nodeOnly' ? 'page' : 'nodeOnly'))}
                className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  browseMode === 'nodeOnly'
                    ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#0A0A0B] text-slate-400 hover:text-orange-400 border-[#2D2D33]'
                    : 'bg-white text-slate-600 hover:text-orange-600 border-slate-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{browseMode === 'nodeOnly' ? '已聚合当前考点' : '聚合当前考点'}</span>
              </button>
            )}

            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSearchQuery('');
                  setBrowseMode('page');
                }}
                className={`text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-orange-500 border cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0A0B] border-[#2D2D33] text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">全部章节 (§1.1 ~ §5.1)</option>
                {sectionList.map((sec) => (
                  <option key={sec} value={sec}>
                    §{sec} 章节考题
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Questions View Area */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 transition-colors ${
        isDark ? 'bg-[#09090B]' : 'bg-slate-100'
      }`}>
        {/* Transitional/Empty Page Informative Fallback */}
        {displayedQuestions.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-4">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200 shadow-sm'
            } space-y-3.5`}>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 mx-auto flex items-center justify-center font-bold">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                CRAC 官方题库文档 • 第 {currentPage} 页
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                官方 165 页题库原件按章节分布，当前页为章节目录、过渡说明或间隔页。系统已为您自动检索就近试题。
              </p>

              {/* Navigation Jump Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {nearestPages.prev && (
                  <button
                    onClick={() => setCurrentPage(nearestPages.prev!)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:border-orange-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>跳转上一试题页 (P.{nearestPages.prev})</span>
                  </button>
                )}

                {nearestPages.next && (
                  <button
                    onClick={() => setCurrentPage(nearestPages.next!)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>跳转下一试题页 (P.{nearestPages.next})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setBrowseMode('continuous')}
                  className="px-3 py-1.5 rounded-xl border border-orange-300 dark:border-orange-900 text-orange-600 dark:text-orange-400 text-xs font-semibold cursor-pointer"
                >
                  切换为 361 题连续刷题模式
                </button>
              </div>
            </div>

            {/* Render Preview of Closest Questions */}
            {fallbackQuestions.length > 0 && (
              <div className="pt-2 text-left space-y-2">
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <span>为您就近呈现第 {fallbackQuestions[0].page} 页试题:</span>
                </div>
                <div className="space-y-3 opacity-90">
                  {fallbackQuestions.slice(0, 2).map((q) => (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentPage(q.page);
                        handleQuestionClick(q);
                      }}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer ${
                        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="font-mono text-[11px] text-orange-600 font-bold mb-1">
                        [I]{q.id} • P.{q.page} • §{q.sectionCode}
                      </div>
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {q.question}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5 max-w-4xl mx-auto">
            {/* Header info */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <span>
                  {browseMode === 'continuous'
                    ? 'CRAC 官方 361 题全真模拟试卷'
                    : browseMode === 'nodeOnly'
                    ? `当前考点专项题集 (${displayedQuestions.length} 题)`
                    : `CRAC A 证题库 • 第 ${currentPage} 页`}
                </span>
              </span>
              <span>呈现 {displayedQuestions.length} 题</span>
            </div>

            {displayedQuestions.map((q) => {
              const isSelected = selectedQuestionId === q.id;
              const linkedNode = q.nodeId
                ? flatKnowledgeNodes.find((n) => n.id === q.nodeId)
                : null;

              if (viewStyle === 'a4') {
                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      questionRefs.current[q.id] = el;
                    }}
                    onClick={() => handleQuestionClick(q)}
                    className={`rounded-2xl transition-all cursor-pointer border text-xs sm:text-sm p-4 sm:p-5 relative ${
                      isSelected
                        ? isDark
                          ? 'bg-[#15151B] border-orange-500 ring-2 ring-orange-500/50 shadow-lg'
                          : 'bg-orange-50/50 border-orange-400 ring-2 ring-orange-400/40 shadow-md'
                        : isDark
                        ? 'bg-[#111114] border-[#2D2D33] hover:border-orange-500/50'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Active Tag */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>当前定位考题</span>
                      </div>
                    )}

                    {/* Meta line */}
                    <div className="text-[11px] text-slate-400 space-x-2.5 mb-1.5 flex flex-wrap items-center font-mono">
                      <span className="text-orange-600 font-bold">[J]{q.jCode}</span>
                      <span>[P]{q.sectionCode}</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>[I]{q.id}</span>
                      <span>P.{q.page}</span>
                    </div>

                    {/* Question text */}
                    <div className={`font-medium text-xs sm:text-sm leading-relaxed mb-2.5 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <span className="text-orange-600 font-mono font-bold mr-1.5">[Q]</span>
                      {q.question}
                    </div>

                    {/* Answer Key info */}
                    {showAnswers && (
                      <div className="mb-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>[T 官方标准答案] {q.answerType}</span>
                      </div>
                    )}

                    {/* Options list */}
                    <div className="space-y-1.5 pl-0.5">
                      {q.options.map((opt) => {
                        const isCorrectOption =
                          showAnswers && q.answerType.includes(opt.key);
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-start gap-2 p-2 rounded-xl text-xs leading-relaxed transition-colors ${
                              isCorrectOption
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800'
                                : isDark
                                ? 'text-slate-300 bg-[#16161B]/60'
                                : 'text-slate-700 bg-slate-50'
                            }`}
                          >
                            <span className="font-mono font-bold shrink-0">
                              [{opt.key}]
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Linked Knowledge Node and Explanation */}
                    {q.explanation && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#2D2D33] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-slate-500 text-[11px] leading-relaxed">
                          💡 <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>{q.explanation}</span>
                        </div>

                        {linkedNode && onSelectKnowledgeNode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectKnowledgeNode(linkedNode);
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline shrink-0 px-2 py-1 rounded-lg border ${
                              isDark ? 'bg-[#0A0A0B] border-[#2D2D33]' : 'bg-orange-50 border-orange-200'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>关联考点: {linkedNode.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              /* Interactive Card Mode */
              return (
                <div
                  key={q.id}
                  ref={(el) => {
                    questionRefs.current[q.id] = el;
                  }}
                  onClick={() => handleQuestionClick(q)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#16161C] border-orange-500 ring-2 ring-orange-500/50'
                        : 'bg-orange-50/60 border-orange-400 ring-2 ring-orange-400/40 shadow-sm'
                      : isDark
                      ? 'bg-[#111114] border-[#2D2D33]'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900">
                      试题 {q.id} • 章节 §{q.sectionCode}
                    </span>
                    <span className="text-slate-400">第 {q.page} 页</span>
                  </div>

                  <h4 className={`text-xs sm:text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 gap-1.5">
                    {q.options.map((opt) => {
                      const isCorrect = showAnswers && q.answerType.includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                              : isDark
                              ? 'bg-[#1C1C21] border-[#2D2D33] text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-[#0A0A0B] text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="leading-relaxed">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#2D2D33] text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Status Ticker */}
      <div className={`p-2.5 px-4 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
        isDark ? 'bg-[#141418] border-[#2D2D33] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-600" />
          <span>
            {browseMode === 'continuous' ? '连续卷面: 全 361 题' : `页码: P.${currentPage} / ${totalPages}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-orange-600 font-semibold">
          <span>CRAC 官方 A 证全套题库原件核对系统</span>
        </div>
      </div>
    </div>
  );
};
