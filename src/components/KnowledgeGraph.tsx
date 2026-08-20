import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Maximize2, 
  ChevronRight, 
  AlertTriangle,
  Sparkles,
  ListTree,
  Network,
  BookOpen,
  FileText
} from 'lucide-react';
import { KnowledgeNode, CategoryType } from '../types';
import { hamKnowledgeTree, flatKnowledgeNodes } from '../data/hamData';
import { pdfQuestionsData } from '../data/pdfQuestions';
import { useTheme } from '../utils/theme';

interface GraphLayoutNode {
  node: KnowledgeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  parent?: GraphLayoutNode;
  children?: GraphLayoutNode[];
  isCollapsed?: boolean;
}

interface KnowledgeGraphProps {
  onSelectNode: (node: KnowledgeNode) => void;
  searchQuery?: string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  onSelectNode,
  searchQuery = '',
}) => {
  const { isDark } = useTheme();
  const [viewStyle, setViewStyle] = useState<'canvas' | 'outline'>('canvas');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState<number>(0.85);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 40, y: 120 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle Collapse State
  const toggleCollapse = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all / Collapse all
  const expandAll = () => setCollapsedNodeIds(new Set());
  const collapseToLevel1 = () => {
    const idsToCollapse = new Set<string>();
    if (hamKnowledgeTree.children) {
      hamKnowledgeTree.children.forEach((child) => {
        idsToCollapse.add(child.id);
      });
    }
    setCollapsedNodeIds(idsToCollapse);
  };

  // Map question count per node
  const questionCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    pdfQuestionsData.forEach((q) => {
      map[q.nodeId] = (map[q.nodeId] || 0) + 1;
    });
    return map;
  }, []);

  // Build tree layout positions for 2D Canvas
  const layoutTree = useMemo(() => {
    let currentY = 0;
    const HORIZONTAL_GAP = 285;
    const VERTICAL_GAP = 28;

    function buildLayout(
      node: KnowledgeNode,
      depth: number,
      parent?: GraphLayoutNode
    ): GraphLayoutNode {
      const isCollapsed = collapsedNodeIds.has(node.id);
      const width = depth === 0 ? 240 : depth === 1 ? 220 : 260;
      const height = depth === 0 ? 90 : depth === 1 ? 84 : 96;

      const layoutNode: GraphLayoutNode = {
        node,
        x: depth * HORIZONTAL_GAP + 50,
        y: 0,
        width,
        height,
        parent,
        isCollapsed,
      };

      if (!isCollapsed && node.children && node.children.length > 0) {
        const childLayouts = node.children.map((child) =>
          buildLayout(child, depth + 1, layoutNode)
        );
        layoutNode.children = childLayouts;

        const firstChild = childLayouts[0];
        const lastChild = childLayouts[childLayouts.length - 1];
        layoutNode.y = (firstChild.y + lastChild.y) / 2;
      } else {
        layoutNode.y = currentY;
        currentY += height + VERTICAL_GAP;
      }

      return layoutNode;
    }

    currentY = 0;
    const root = buildLayout(hamKnowledgeTree, 0);
    return root;
  }, [collapsedNodeIds]);

  // Flatten nodes and links for rendering
  const { allNodes, allLinks } = useMemo(() => {
    const nodes: GraphLayoutNode[] = [];
    const links: {
      source: GraphLayoutNode;
      target: GraphLayoutNode;
      category: CategoryType;
    }[] = [];

    function traverse(node: GraphLayoutNode) {
      nodes.push(node);
      if (!node.isCollapsed && node.children) {
        node.children.forEach((child) => {
          links.push({
            source: node,
            target: child,
            category: child.node.category,
          });
          traverse(child);
        });
      }
    }

    traverse(layoutTree);
    return { allNodes: nodes, allLinks: links };
  }, [layoutTree]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(Math.max(0.35, prev * zoomFactor), 2.2));
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mobile Touch pan support
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - translate.x,
        y: e.touches[0].clientY - translate.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTranslate({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      });
    }
  };

  const resetView = () => {
    setScale(0.8);
    setTranslate({ x: window.innerWidth < 640 ? 20 : 60, y: 80 });
  };

  return (
    <div className={`relative w-full h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-7rem)] overflow-hidden select-none transition-colors ${
      isDark ? 'bg-[#08080A]' : 'bg-[#F8FAFC]'
    }`}>
      {/* Background Dot Matrix */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(#25252D 1px, transparent 1px)' 
            : 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Floating Control Bar */}
      <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 backdrop-blur-md px-3 py-1.5 sm:py-2 rounded-2xl border shadow-lg transition-all ${
        isDark ? 'bg-[#111114]/90 border-[#2D2D33] text-white' : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 text-xs font-bold pr-2 border-r border-slate-300 dark:border-[#2D2D33]">
          <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
          <span className="hidden xs:inline">CRAC A 证考纲图谱</span>
        </div>

        {/* View Style Switcher (Canvas / Outline) */}
        <div className="flex items-center rounded-xl p-0.5 border border-slate-300 dark:border-[#2D2D33] bg-slate-100 dark:bg-black/30 text-xs">
          <button
            onClick={() => setViewStyle('canvas')}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewStyle === 'canvas'
                ? 'bg-orange-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3 h-3" />
            <span className="hidden sm:inline">2D 拓扑图</span>
            <span className="sm:hidden">图谱</span>
          </button>
          <button
            onClick={() => setViewStyle('outline')}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewStyle === 'outline'
                ? 'bg-orange-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTree className="w-3 h-3" />
            <span className="hidden sm:inline">大纲清单</span>
            <span className="sm:hidden">清单</span>
          </button>
        </div>

        {viewStyle === 'canvas' && (
          <>
            <button
              onClick={expandAll}
              className={`px-2 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#1C1C21] hover:bg-[#25252B] text-slate-300 border-[#2D2D33]' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              展开
            </button>

            <button
              onClick={collapseToLevel1}
              className={`hidden sm:inline-block px-2 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#1C1C21] hover:bg-[#25252B] text-slate-400 border-[#2D2D33]' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              收起
            </button>

            <button
              onClick={resetView}
              className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#1C1C21] hover:bg-[#25252B] text-slate-400 hover:text-orange-400 border-[#2D2D33]' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-orange-600 border-slate-200'
              }`}
              title="重置视图"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Floating Category Legend */}
      <div className={`hidden md:flex absolute top-4 right-4 z-20 items-center gap-3 backdrop-blur-md px-3.5 py-2 rounded-2xl border text-xs font-mono shadow-md ${
        isDark ? 'bg-[#111114]/90 border-[#2D2D33] text-slate-400' : 'bg-white/95 border-slate-200 text-slate-600'
      }`}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-600"></span>
          <span className={isDark ? 'text-white' : 'text-slate-900 font-semibold'}>核心考点</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>频段≤25W</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="text-rose-600 font-semibold">真题避坑</span>
        </span>
      </div>

      {/* Bottom Floating Zoom Controls (for Canvas view) */}
      {viewStyle === 'canvas' && (
        <div className={`absolute bottom-6 right-4 sm:right-6 z-20 flex flex-col gap-1 backdrop-blur-md p-1.5 rounded-2xl border shadow-xl ${
          isDark ? 'bg-[#111114]/95 border-[#2D2D33]' : 'bg-white/95 border-slate-200'
        }`}>
          <button
            onClick={() => setScale((s) => Math.min(2.2, s * 1.15))}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'bg-[#1C1C21] text-white hover:text-orange-400' : 'bg-slate-100 text-slate-800 hover:text-orange-600'
            }`}
            title="放大"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono text-center text-slate-400 py-0.5">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale((s) => Math.max(0.35, s * 0.85))}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'bg-[#1C1C21] text-white hover:text-orange-400' : 'bg-slate-100 text-slate-800 hover:text-orange-600'
            }`}
            title="缩小"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'bg-[#1C1C21] text-orange-400' : 'bg-slate-100 text-orange-600'
            }`}
            title="居中"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: OUTLINE TREE LIST (PHONE & TABLET ULTRA-FRIENDLY) */}
      {/* ========================================================= */}
      {viewStyle === 'outline' && (
        <div className="w-full h-full overflow-y-auto pt-16 pb-20 px-3 sm:px-6 max-w-4xl mx-auto space-y-4">
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span>CRAC 业余无线电 A 证考纲完整结构树</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              适合手机端浏览。点击任意知识点直接查看深度解析、计算公式及全部对应真题。
            </p>
          </div>

          <div className="space-y-3">
            {hamKnowledgeTree.children?.map((moduleNode) => {
              const isModuleCollapsed = collapsedNodeIds.has(moduleNode.id);
              const moduleQuestionsCount = pdfQuestionsData.filter((q) => 
                moduleNode.children?.some(c => c.id === q.nodeId || (c.sectionCode && q.sectionCode.startsWith(c.sectionCode)))
              ).length;

              return (
                <div 
                  key={moduleNode.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Module Header */}
                  <div 
                    onClick={() => toggleCollapse(moduleNode.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isDark ? 'hover:bg-[#16161C]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        §{moduleNode.sectionCode || '1'}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {moduleNode.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {moduleNode.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-semibold border border-orange-200 dark:border-orange-900">
                        {moduleNode.children?.length || 0} 考点 • {moduleQuestionsCount} 题
                      </span>
                      <div className={`p-1 rounded-lg text-slate-400 transition-transform ${isModuleCollapsed ? '' : 'rotate-90'}`}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Child Knowledge Points List */}
                  {!isModuleCollapsed && moduleNode.children && (
                    <div className={`p-3 pt-0 space-y-2 border-t ${
                      isDark ? 'border-[#2D2D33] bg-[#0C0C0F]' : 'border-slate-100 bg-slate-50/50'
                    }`}>
                      {moduleNode.children.map((child) => {
                        const qCount = questionCountMap[child.id] || (child.targetQuestionId ? 1 : 0);

                        return (
                          <div
                            key={child.id}
                            onClick={() => onSelectNode(child)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              isDark 
                                ? 'bg-[#141419] border-[#2D2D33] hover:border-orange-500 text-white' 
                                : 'bg-white border-slate-200 hover:border-orange-400 text-slate-800 shadow-xs'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 font-semibold">
                                  §{child.sectionCode || child.id}
                                </span>
                                {child.pdfPage && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1C1C21] text-slate-600 dark:text-slate-400">
                                    PDF P.{child.pdfPage}
                                  </span>
                                )}
                                {qCount > 0 && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold">
                                    🎯 {qCount} 道真题
                                  </span>
                                )}
                                {child.trapWarning && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-medium">
                                    ⚠️ 避坑
                                  </span>
                                )}
                              </div>

                              <h5 className="font-bold text-xs sm:text-sm">
                                {child.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {child.summary}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-orange-600 font-semibold shrink-0">
                              <span>查看解析</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: 2D INTERACTIVE GRAPH CANVAS (TOUCH & MOUSE ENABLED) */}
      {/* ========================================================= */}
      {viewStyle === 'canvas' && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={`w-full h-full cursor-grab active:cursor-grabbing ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          <div
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
            className="relative"
          >
            {/* SVG Connecting Links */}
            <svg
              className="absolute top-0 left-0 pointer-events-none overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <defs>
                <linearGradient id="link-grad-light" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EA580C" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="link-grad-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2D2D33" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F27D26" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {allLinks.map((link, idx) => {
                const startX = link.source.x + link.source.width;
                const startY = link.source.y + link.source.height / 2;
                const endX = link.target.x;
                const endY = link.target.y + link.target.height / 2;
                const deltaX = (endX - startX) * 0.5;

                const pathData = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${
                  endX - deltaX
                } ${endY}, ${endX} ${endY}`;

                return (
                  <g key={idx}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isDark ? 'url(#link-grad-dark)' : 'url(#link-grad-light)'}
                      strokeWidth="2"
                      strokeDasharray={link.target.node.level === 2 ? '4 3' : 'none'}
                    />
                    <circle
                      cx={endX}
                      cy={endY}
                      r="3.5"
                      fill="#EA580C"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Graph Nodes */}
            {allNodes.map((layoutNode) => {
              const { node, x, y, width, height, isCollapsed } = layoutNode;
              const hasChildren = node.children && node.children.length > 0;
              const isMatch =
                searchQuery.trim() !== '' &&
                (node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  node.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  node.detail.toLowerCase().includes(searchQuery.toLowerCase()));

              const isRoot = node.level === 0;
              const qCount = questionCountMap[node.id] || (node.targetQuestionId ? 1 : 0);

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    minHeight: `${height}px`,
                  }}
                  className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer shadow-md ${
                    isRoot
                      ? isDark
                        ? 'bg-orange-950/40 border-2 border-orange-500 shadow-orange-500/20'
                        : 'bg-orange-50 border-2 border-orange-500 shadow-orange-500/10'
                      : isDark
                      ? 'bg-[#141419] border-[#2D2D33] hover:border-orange-500 text-white'
                      : 'bg-white border-slate-200 hover:border-orange-400 text-slate-800'
                  } ${
                    isMatch
                      ? 'ring-2 ring-orange-500 ring-offset-2 scale-105 border-orange-500 shadow-lg'
                      : ''
                  } hover:scale-[1.02] hover:shadow-xl`}
                >
                  {/* Node Top Header */}
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold ${
                          isRoot
                            ? 'bg-orange-600 text-white'
                            : isDark
                            ? 'bg-[#0A0A0B] text-orange-400 border border-[#2D2D33]'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {node.level === 0 ? 'CRAC 大纲' : node.level === 1 ? '模块' : '考点'}
                      </span>
                      {node.pdfPage && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                          isDark ? 'bg-[#0A0A0B] text-slate-400 border-[#2D2D33]' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          P.{node.pdfPage}
                        </span>
                      )}
                      {qCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                          🎯 {qCount} 题
                        </span>
                      )}
                      {node.trapWarning && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" /> 避坑
                        </span>
                      )}
                    </div>

                    {/* Expand / Collapse Button */}
                    {hasChildren && (
                      <button
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className={`p-1 rounded-md border transition-colors ${
                          isDark 
                            ? 'bg-[#0A0A0B] text-slate-400 hover:text-white border-[#2D2D33]' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                        }`}
                        title={isCollapsed ? '展开考点' : '收起考点'}
                      >
                        {isCollapsed ? (
                          <Plus className="w-3 h-3 text-orange-600" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Node Title */}
                  <h4 className={`font-bold text-xs sm:text-sm line-clamp-1 leading-snug ${
                    isRoot ? 'text-orange-600' : isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {node.title}
                  </h4>

                  {/* Summary snippet */}
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {node.summary}
                  </p>

                  {/* Key formula pill if present */}
                  {node.keyFormula && (
                    <div className={`mt-2 text-[10px] font-mono px-2 py-0.5 rounded-md truncate font-semibold ${
                      isDark ? 'bg-[#0A0A0B] text-orange-400 border border-[#2D2D33]' : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {node.keyFormula}
                    </div>
                  )}

                  {/* Inspect cue on hover */}
                  <div className={`mt-2 pt-1 border-t flex items-center justify-between text-[10px] transition-colors ${
                    isDark ? 'border-[#2D2D33] text-slate-400 group-hover:text-orange-400' : 'border-slate-100 text-slate-500 group-hover:text-orange-600'
                  }`}>
                    <span>{qCount > 0 ? `查看考点与全部 ${qCount} 道真题` : '查看解析'}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
