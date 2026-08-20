import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import type { KnowledgeNode } from '../types';
import { flatAKnowledgeNodes, examCallsignDistricts } from '../data/aKnowledgeData';
import { qCodesData, phoneticData } from '../data/hamData';
import { useTheme } from '../utils/theme';

interface RadioSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (node: KnowledgeNode) => void;
}

export const RadioSearchModal: React.FC<RadioSearchModalProps> = ({ isOpen, onClose, onSelectNode }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const nodes = flatAKnowledgeNodes.filter((node) =>
      `${node.title} ${node.summary} ${node.detail} ${node.trapWarning || ''}`.toLowerCase().includes(q),
    ).slice(0, 12);

    const qcodes = qCodesData.filter((item) =>
      `${item.code} ${item.chinese} ${item.question} ${item.answer}`.toLowerCase().includes(q),
    ).slice(0, 8);

    const districts = examCallsignDistricts.filter((item) =>
      `${item.zone} ${item.name} ${item.provinces.join(' ')} ${item.mnemonic}`.toLowerCase().includes(q),
    ).slice(0, 10);

    const phonetic = phoneticData.filter((item) =>
      `${item.letter} ${item.word} ${item.chinesePronunciation}`.toLowerCase().includes(q),
    ).slice(0, 8);

    return { nodes, qcodes, districts, phonetic };
  }, [query]);

  if (!isOpen) return null;

  const hasResults = !!results && (results.nodes.length + results.qcodes.length + results.districts.length + results.phonetic.length > 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-3" onMouseDown={onClose}>
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#2D2D33] flex items-center gap-3">
          <Search className="w-5 h-5 text-orange-600 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 QSL、430MHz、避雷、A1A、北京、Alfa…"
            className="flex-1 bg-transparent outline-none text-sm sm:text-base"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#202027] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4 space-y-5">
          {!query.trim() && <div className="py-10 text-center text-sm text-slate-500">输入关键词搜索 A 证知识点、Q 简语、呼号分区和字母解释法。</div>}
          {query.trim() && !hasResults && <div className="py-10 text-center text-sm text-slate-500">没有找到匹配内容。</div>}

          {!!results?.nodes.length && (
            <section>
              <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">A 证知识图谱</div>
              <div className="space-y-1.5">
                {results.nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => { onSelectNode(node); onClose(); }}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left cursor-pointer ${isDark ? 'bg-[#18181D] border-[#2D2D33] hover:border-orange-500' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}
                  >
                    <span><strong className="text-sm">{node.title}</strong><span className="block text-[11px] text-slate-500 mt-0.5 line-clamp-1">{node.summary}</span></span>
                    <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!results?.qcodes.length && (
            <section>
              <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">Q 简语</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.qcodes.map((item) => (
                  <div key={item.code} className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
                    <strong className="font-mono text-orange-600">{item.code}</strong>
                    <div className="text-xs mt-1">{item.chinese}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!results?.districts.length && (
            <section>
              <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">呼号 1～0 区</div>
              <div className="space-y-1.5">
                {results.districts.map((item) => (
                  <div key={item.zone} className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
                    <strong className="text-orange-600">第 {item.zone} 区：</strong>{item.provinces.join('、')}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!results?.phonetic.length && (
            <section>
              <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">字母解释法</div>
              <div className="flex flex-wrap gap-2">
                {results.phonetic.map((item) => (
                  <span key={item.letter} className={`px-3 py-2 rounded-xl border text-xs font-mono ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
                    <strong className="text-orange-600">{item.letter}</strong> · {item.word}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
