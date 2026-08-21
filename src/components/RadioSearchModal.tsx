import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronRight, FileQuestion } from 'lucide-react';
import type { KnowledgeNode } from '../types';
import { getQuestionsByLevel } from '../data/examLevelsData';
import { examCallsignDistricts } from '../data/aKnowledgeData';
import { qCodesData, phoneticData } from '../data/hamData';
import { useTheme } from '../utils/theme';

interface RadioSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (node: KnowledgeNode) => void;
}

const categoryForSection = (sectionCode = ''): KnowledgeNode['category'] => {
  if (sectionCode.startsWith('1.')) return 'law';
  if (sectionCode.startsWith('2.')) return 'comm';
  if (sectionCode.startsWith('5.')) return 'safety';
  return 'tech';
};

export const RadioSearchModal: React.FC<RadioSearchModalProps> = ({ isOpen, onClose, onSelectNode }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const allQuestions = useMemo(() => getQuestionsByLevel('ALL'), []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const questions = allQuestions.filter((item) => {
      const text = [
        item.level,
        item.id,
        item.jCode,
        item.sectionCode,
        item.question,
        item.answerType,
        ...item.options.map((option) => option.text),
      ].join(' ').toLowerCase();
      return text.includes(q);
    }).slice(0, 24);

    const qcodes = qCodesData.filter((item) =>
      `${item.code} ${item.chinese} ${item.question} ${item.answer}`.toLowerCase().includes(q),
    ).slice(0, 8);

    const districts = examCallsignDistricts.filter((item) =>
      `${item.zone} ${item.name} ${item.provinces.join(' ')} ${item.mnemonic}`.toLowerCase().includes(q),
    ).slice(0, 10);

    const phonetic = phoneticData.filter((item) =>
      `${item.letter} ${item.word} ${item.chinesePronunciation}`.toLowerCase().includes(q),
    ).slice(0, 8);

    return { questions, qcodes, districts, phonetic };
  }, [query, allQuestions]);

  if (!isOpen) return null;
  const hasResults = !!results && (results.questions.length + results.qcodes.length + results.districts.length + results.phonetic.length > 0);

  const openQuestion = (question: ReturnType<typeof getQuestionsByLevel>[number]) => {
    const level = (question.level === 'A' || question.level === 'B' || question.level === 'C') ? question.level : 'A';
    const node: KnowledgeNode = {
      id: `${level}-Q-${question.id}`,
      title: `${level} 类 · ${question.id}`,
      domain: 'radio',
      category: categoryForSection(question.sectionCode),
      level: 3,
      examLevel: level,
      sectionCode: question.sectionCode,
      summary: question.question,
      detail: `${question.options.map((option) => `${option.key}. ${option.text}`).join('\n')}\n\n[T] 标准答案：${question.answerType || ''}\n[J] ${question.jCode || ''}\n[P] ${question.sectionCode || ''}`,
      targetQuestionId: question.id,
      questionIds: [question.id],
    };
    onSelectNode(node);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-3" onMouseDown={onClose}>
      <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#2D2D33] flex items-center gap-3">
          <Search className="w-5 h-5 text-orange-600 shrink-0" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 A/B/C 原题、MC题号、J码、[P]章节、QSL、430MHz、Alfa…" className="flex-1 bg-transparent outline-none text-sm sm:text-base" />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#202027] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4 space-y-5">
          {!query.trim() && <div className="py-10 text-center text-sm text-slate-500">可直接搜索 3108 道 A/B/C R2 原始题库，也可查询 Q 简语、呼号分区和字母解释法。</div>}
          {query.trim() && !hasResults && <div className="py-10 text-center text-sm text-slate-500">没有找到匹配内容。</div>}

          {!!results?.questions.length && (
            <section>
              <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">A / B / C R2 原始题库</div>
              <div className="space-y-1.5">
                {results.questions.map((item) => (
                  <button key={`${item.level}-${item.id}`} onClick={() => openQuestion(item)} className={`w-full flex items-start justify-between gap-3 p-3 rounded-xl border text-left cursor-pointer ${isDark ? 'bg-[#18181D] border-[#2D2D33] hover:border-orange-500' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[10px] font-mono text-slate-500"><FileQuestion className="w-3 h-3" /><strong className="text-orange-600">{item.level} 类</strong><span>{item.id}</span><span>{item.jCode}</span><span>[P]{item.sectionCode}</span></span>
                      <span className="block text-xs sm:text-sm mt-1 leading-relaxed">{item.question}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!results?.qcodes.length && <section><div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">Q 简语</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{results.qcodes.map((item) => <div key={item.code} className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}><strong className="font-mono text-orange-600">{item.code}</strong><div className="text-xs mt-1">{item.chinese}</div></div>)}</div></section>}
          {!!results?.districts.length && <section><div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">呼号 1～0 区</div><div className="space-y-1.5">{results.districts.map((item) => <div key={item.zone} className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}><strong className="text-orange-600">第 {item.zone} 区：</strong>{item.provinces.join('、')}</div>)}</div></section>}
          {!!results?.phonetic.length && <section><div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">字母解释法</div><div className="flex flex-wrap gap-2">{results.phonetic.map((item) => <span key={item.letter} className={`px-3 py-2 rounded-xl border text-xs font-mono ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}><strong className="text-orange-600">{item.letter}</strong> · {item.word}</span>)}</div></section>}
        </div>
      </div>
    </div>
  );
};
