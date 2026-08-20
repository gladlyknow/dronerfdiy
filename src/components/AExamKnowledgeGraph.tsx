import React, { useMemo, useState } from 'react';
import { ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react';
import type { KnowledgeNode } from '../types';
import { aKnowledgeTree } from '../data/aKnowledgeData';
import { useTheme } from '../utils/theme';

interface AExamKnowledgeGraphProps {
  onSelectNode?: (node: KnowledgeNode) => void;
}

const MODULE_COLORS = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export const AExamKnowledgeGraph: React.FC<AExamKnowledgeGraphProps> = ({ onSelectNode }) => {
  const { isDark } = useTheme();
  const [scale, setScale] = useState(0.9);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visibleModules = useMemo(() => aKnowledgeTree.children || [], []);

  const toggle = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`relative h-[620px] overflow-auto rounded-2xl ${isDark ? 'bg-[#09090c]' : 'bg-slate-50'}`}>
      <div className={`sticky top-3 left-3 z-20 w-fit flex items-center gap-1 p-1.5 rounded-xl border shadow-md ${isDark ? 'bg-[#111114]/95 border-[#2D2D33]' : 'bg-white/95 border-slate-200'}`}>
        <button onClick={() => setScale((s) => Math.min(1.35, s + 0.1))} className="p-1.5 rounded-lg hover:bg-orange-500/10 cursor-pointer" title="放大"><Plus className="w-4 h-4" /></button>
        <button onClick={() => setScale((s) => Math.max(0.6, s - 0.1))} className="p-1.5 rounded-lg hover:bg-orange-500/10 cursor-pointer" title="缩小"><Minus className="w-4 h-4" /></button>
        <span className="text-[10px] font-mono text-slate-500 min-w-10 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => { setScale(0.9); setCollapsed(new Set()); }} className="p-1.5 rounded-lg hover:bg-orange-500/10 cursor-pointer" title="复位"><RotateCcw className="w-4 h-4" /></button>
      </div>

      <div className="min-w-[1120px] p-8 origin-top-left transition-transform" style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <button
          onClick={() => onSelectNode?.(aKnowledgeTree)}
          className={`block mx-auto mb-8 px-6 py-4 rounded-2xl border-2 font-black shadow-lg cursor-pointer ${isDark ? 'bg-[#111114] border-orange-500 text-white' : 'bg-white border-orange-500 text-slate-900'}`}
        >
          <div className="text-orange-600 text-xs font-mono mb-1">HAM · CLASS A</div>
          {aKnowledgeTree.title}
        </button>

        <div className="h-6 w-px bg-orange-400 mx-auto" />
        <div className="h-px bg-slate-300 dark:bg-slate-700 mx-[9%]" />

        <div className="grid grid-cols-5 gap-4 mt-0">
          {visibleModules.map((module, index) => {
            const isCollapsed = collapsed.has(module.id);
            const color = MODULE_COLORS[index];
            return (
              <div key={module.id} className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-px bg-slate-300 dark:bg-slate-700" />
                <div
                  className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}
                  style={{ borderTopColor: color, borderTopWidth: 3 }}
                >
                  <button onClick={() => onSelectNode?.(module)} className="w-full p-3 text-left cursor-pointer">
                    <div className="font-black text-sm leading-snug">{module.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{module.summary}</div>
                  </button>
                  <button onClick={() => toggle(module.id)} className="w-full border-t border-slate-200 dark:border-[#2D2D33] px-3 py-1.5 text-[11px] text-slate-500 flex items-center justify-center gap-1 cursor-pointer">
                    <ChevronRight className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    {isCollapsed ? '展开知识点' : '收起知识点'}
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="mt-3 space-y-2">
                    {module.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onSelectNode?.(child)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${isDark ? 'bg-[#16161b] border-[#2D2D33] hover:border-orange-500 text-slate-200' : 'bg-white border-slate-200 hover:border-orange-400 text-slate-700'}`}
                      >
                        <div className="font-bold leading-snug">{child.title}</div>
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{child.summary}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
