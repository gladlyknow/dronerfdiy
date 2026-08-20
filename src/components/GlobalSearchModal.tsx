import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  MapPin, 
  Radio, 
  ArrowRight,
  Sparkles,
  FileText,
  Workflow
} from 'lucide-react';
import { KnowledgeNode } from '../types';
import { flatKnowledgeNodes, qCodesData, phoneticData, callsignDistricts } from '../data/hamData';
import { pdfQuestionsData } from '../data/pdfQuestions';
import { useTheme } from '../utils/theme';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKnowledgeNode: (node: KnowledgeNode) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectKnowledgeNode,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedNodes = flatKnowledgeNodes.filter((n) =>
      `${n.title} ${n.summary} ${n.detail} ${n.mnemonic || ''} ${n.keyFormula || ''}`
        .toLowerCase()
        .includes(q)
    );

    const matchedPdfQuestions = pdfQuestionsData.filter((item) =>
      `${item.id} ${item.jCode} ${item.question} ${item.explanation || ''} ${item.options.map(o => o.text).join(' ')}`
        .toLowerCase()
        .includes(q)
    );

    const matchedQCodes = qCodesData.filter((code) =>
      `${code.code} ${code.chinese} ${code.question} ${code.answer} ${code.mnemonic}`
        .toLowerCase()
        .includes(q)
    );

    const matchedDistricts = callsignDistricts.filter((dist) =>
      `${dist.name} ${dist.provinces.join(' ')} ${dist.mnemonic}`.toLowerCase().includes(q)
    );

    const matchedPhonetics = phoneticData.filter((p) =>
      `${p.letter} ${p.word} ${p.chinesePronunciation} ${p.morse}`.toLowerCase().includes(q)
    );

    return {
      nodes: matchedNodes,
      pdfQuestions: matchedPdfQuestions,
      qCodes: matchedQCodes,
      districts: matchedDistricts,
      phonetics: matchedPhonetics,
      total:
        matchedNodes.length +
        matchedPdfQuestions.length +
        matchedQCodes.length +
        matchedDistricts.length +
        matchedPhonetics.length,
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-300'
      }`}>
        {/* Search Header Input */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          isDark ? 'border-[#2D2D33]' : 'border-slate-200'
        }`}>
          <Search className="w-5 h-5 text-[#F27D26] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="全局搜索考点、题库原件试题、原理架构图、Q简语、呼号分区..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`flex-1 bg-transparent text-sm sm:text-base focus:outline-none ${
              isDark ? 'text-white placeholder:text-[#8E9299]' : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-lg text-xs ${
                isDark ? 'hover:bg-[#1C1C21] text-[#8E9299]' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              清空
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border ${
              isDark ? 'hover:bg-[#1C1C21] text-[#8E9299] border-[#2D2D33]' : 'hover:bg-slate-100 text-slate-500 border-slate-300'
            }`}
          >
            <kbd className="text-[10px] font-mono">ESC</kbd>
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {!searchResults ? (
            <div className="py-8 text-center text-xs space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-[#F27D26] mb-1" />
              <p className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>
                输入关键词快速定位业余无线电 A 证核心考点、原理架构图与 PDF 题库试题
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {[
                  { tag: '中继台拓扑', isTab: true, tabId: 'diagrams' },
                  { tag: 'SWR驻波匹配', isTab: true, tabId: 'diagrams' },
                  { tag: 'QTH', isTab: false },
                  { tag: '25W', isTab: false },
                  { tag: '430MHz', isTab: false },
                  { tag: 'F3E', isTab: false },
                  { tag: '北京', isTab: false },
                  { tag: 'MC1-0059', isTab: false }
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => {
                      if (item.isTab && item.tabId) {
                        onNavigateToTab(item.tabId);
                        onClose();
                      } else {
                        setQuery(item.tag);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#0A0A0B] hover:bg-[#1C1C21] text-[#8E9299] hover:text-white border-[#2D2D33]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
                    }`}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.total === 0 ? (
            <div className={`py-12 text-center text-xs ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
              未找到与 “{query}” 相关的考点或题库试题
            </div>
          ) : (
            <div className="space-y-4">
              {/* Knowledge Nodes */}
              {searchResults.nodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>核心考点 ({searchResults.nodes.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.nodes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onSelectKnowledgeNode(n);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between group transition-colors ${
                          isDark
                            ? 'bg-[#1C1C21] hover:bg-[#25252B] border-[#2D2D33] hover:border-[#F27D26]'
                            : 'bg-slate-50 hover:bg-orange-50/60 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold group-hover:text-[#F27D26] ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {n.title}
                            </span>
                            {n.pdfPage && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                isDark ? 'bg-[#0A0A0B] text-[#8E9299] border-[#2D2D33]' : 'bg-white text-slate-500 border-slate-300'
                              }`}>
                                P.{n.pdfPage}
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] line-clamp-1 mt-0.5 ${
                            isDark ? 'text-[#8E9299]' : 'text-slate-500'
                          }`}>
                            {n.summary}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#F27D26] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Question Bank Direct Matches */}
              {searchResults.pdfQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>CRAC 官方题库 PDF 试题 ({searchResults.pdfQuestions.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.pdfQuestions.slice(0, 8).map((q) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (q.nodeId) {
                            const node = flatKnowledgeNodes.find(n => n.id === q.nodeId);
                            if (node) onSelectKnowledgeNode(node);
                          }
                          onNavigateToTab('pdf');
                          onClose();
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between group transition-colors ${
                          isDark
                            ? 'bg-[#1C1C21] hover:bg-[#25252B] border-[#2D2D33] hover:border-[#10B981]'
                            : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8E9299]">
                            <span className="text-[#10B981] font-bold">试题 {q.id}</span>
                            <span>P.{q.page}</span>
                            <span>章节 {q.sectionCode}</span>
                          </div>
                          <div className={`text-xs font-sans line-clamp-1 mt-0.5 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {q.question}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-[#10B981] font-bold shrink-0">
                          {q.answerType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Q Codes */}
              {searchResults.qCodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Q 简语 ({searchResults.qCodes.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.qCodes.map((code) => (
                      <div
                        key={code.code}
                        onClick={() => {
                          onNavigateToTab('qcodes');
                          onClose();
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer group transition-colors ${
                          isDark
                            ? 'bg-[#1C1C21] hover:bg-[#25252B] border-[#2D2D33] hover:border-[#F27D26]'
                            : 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#F27D26] text-xs">
                            {code.code}
                          </span>
                          <span className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {code.chinese}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8E9299] truncate mt-1">
                          {code.question}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Districts */}
              {searchResults.districts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>呼号分区 ({searchResults.districts.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.districts.map((d) => (
                      <div
                        key={d.zone}
                        onClick={() => {
                          onNavigateToTab('districts');
                          onClose();
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer group transition-colors ${
                          isDark
                            ? 'bg-[#1C1C21] hover:bg-[#25252B] border-[#2D2D33] hover:border-[#F27D26]'
                            : 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F27D26] text-xs">
                            第 {d.zone} 区
                          </span>
                          <span className="text-[11px] text-[#8E9299]">{d.provinces.join('、')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

