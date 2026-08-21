import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Radio, Search, Shuffle, Sparkles } from 'lucide-react';
import { qCodesData } from '../data/hamData';
import type { QCodeItem } from '../types';
import { useTheme } from '../utils/theme';

type QCategory = 'all' | QCodeItem['category'];

const CATEGORY_OPTIONS: Array<{ value: QCategory; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'traffic', label: '通联状态' },
  { value: 'signal', label: '信号质量' },
  { value: 'freq', label: '频率功率' },
  { value: 'location', label: '位置与时间' },
  { value: 'equipment', label: '设备操作' },
];

const categoryLabel = (value: QCodeItem['category']) =>
  CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value;

export const QCodesCheatSheet: React.FC = () => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<QCategory>('all');
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const filteredQCodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return qCodesData.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (!query) return true;
      return [item.code, item.chinese, item.question, item.answer, item.mnemonic || '', item.exampleQso || '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [search, filterCategory]);

  const safeIndex = filteredQCodes.length ? cardIndex % filteredQCodes.length : 0;
  const currentCard = filteredQCodes[safeIndex] || qCodesData[0];

  const changeCategory = (category: QCategory) => {
    setFilterCategory(category);
    setCardIndex(0);
    setRevealed(false);
  };

  const nextCard = () => {
    if (!filteredQCodes.length) return;
    setRevealed(false);
    setCardIndex((index) => (index + 1) % filteredQCodes.length);
  };

  const prevCard = () => {
    if (!filteredQCodes.length) return;
    setRevealed(false);
    setCardIndex((index) => (index - 1 + filteredQCodes.length) % filteredQCodes.length);
  };

  const shuffleCard = () => {
    if (!filteredQCodes.length) return;
    setRevealed(false);
    setCardIndex(Math.floor(Math.random() * filteredQCodes.length));
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <section className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono"><Radio className="w-4 h-4" />常用 Q 简语 (Q-Codes) 备考全览</div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>高频通联缩略语与真题问答对照表</h2>
          <p className="text-xs text-slate-500 mt-1">带问号表示询问，不带问号表示回答或陈述；分类直接按题库数据字段展示。</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFlashcardMode(false)} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${!flashcardMode ? 'bg-orange-600 text-white' : isDark ? 'bg-[#1C1C21] text-slate-400 border border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>📋 完整列表</button>
          <button onClick={() => { setFlashcardMode(true); setRevealed(false); }} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${flashcardMode ? 'bg-orange-600 text-white' : isDark ? 'bg-[#1C1C21] text-slate-400 border border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}><Sparkles className="w-3.5 h-3.5" />🎴 抽认卡</button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((category) => {
              const count = category.value === 'all' ? qCodesData.length : qCodesData.filter((item) => item.category === category.value).length;
              return (
                <button
                  key={category.value}
                  onClick={() => changeCategory(category.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border ${filterCategory === category.value ? 'bg-orange-600 text-white border-orange-600' : isDark ? 'bg-[#141418] text-slate-400 border-[#2D2D33]' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {category.label} <span className="font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setCardIndex(0); }} placeholder="搜索 Q 简语或含义…" className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none focus:border-orange-500 ${isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
          </div>
        </div>

        {filteredQCodes.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center text-sm ${isDark ? 'bg-[#111114] border-[#2D2D33] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>当前分类没有匹配数据。</div>
        ) : flashcardMode ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div onClick={() => setRevealed((value) => !value)} className={`border rounded-3xl p-6 sm:p-8 min-h-[280px] flex flex-col justify-between items-center text-center cursor-pointer shadow-sm ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
              <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400"><span>{safeIndex + 1}/{filteredQCodes.length}</span><span className="text-orange-600 font-bold">{categoryLabel(currentCard.category)}</span></div>
              <div className="space-y-3 py-4 w-full">
                <div className="text-4xl font-mono font-bold text-orange-600">{currentCard.code}</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentCard.chinese}</div>
                {revealed ? (
                  <div className="space-y-2 text-left text-xs">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1C1C21]' : 'bg-slate-50'}`}><strong>询问：</strong>{currentCard.question}</div>
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1C1C21]' : 'bg-slate-50'}`}><strong>回答：</strong>{currentCard.answer}</div>
                    {currentCard.mnemonic && <div className="text-orange-600 font-semibold">速记：{currentCard.mnemonic}</div>}
                  </div>
                ) : <div className="text-xs text-slate-400 flex justify-center gap-1 pt-4"><Eye className="w-4 h-4" />点击卡片查看释义</div>}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={prevCard} className={`p-2.5 rounded-xl border cursor-pointer ${isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-white border-slate-200'}`}><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={shuffleCard} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Shuffle className="w-3.5 h-3.5" />随机</button>
              <button onClick={nextCard} className={`p-2.5 rounded-xl border cursor-pointer ${isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-white border-slate-200'}`}><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className={`uppercase text-[11px] font-mono border-b ${isDark ? 'bg-[#0A0A0B] border-[#2D2D33] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <tr><th className="px-4 py-3">代码</th><th className="px-4 py-3">分类</th><th className="px-4 py-3">中文释义</th><th className="px-4 py-3">询问</th><th className="px-4 py-3">回答/陈述</th><th className="px-4 py-3">速记</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#2D2D33]">
                  {filteredQCodes.map((item) => (
                    <tr key={item.code} className={isDark ? 'hover:bg-[#1C1C21]' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3 font-mono font-bold text-orange-600 text-sm">{item.code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{categoryLabel(item.category)}</td>
                      <td className={`px-4 py-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.chinese}</td>
                      <td className="px-4 py-3 text-slate-500">{item.question}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.answer}</td>
                      <td className="px-4 py-3 text-orange-600">{item.mnemonic || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
