import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Radio, 
  Shuffle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { qCodesData } from '../data/hamData';
import { useTheme } from '../utils/theme';

export const QCodesCheatSheet: React.FC = () => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [flashcardMode, setFlashcardMode] = useState<boolean>(false);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);

  const filteredQCodes = useMemo(() => {
    return qCodesData.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        return (
          item.code.toLowerCase().includes(query) ||
          item.chinese.toLowerCase().includes(query) ||
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.mnemonic.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [search, filterCategory]);

  const currentCard = filteredQCodes[cardIndex % filteredQCodes.length] || qCodesData[0];

  const nextCard = () => {
    setRevealed(false);
    setCardIndex((prev) => (prev + 1) % filteredQCodes.length);
  };

  const prevCard = () => {
    setRevealed(false);
    setCardIndex((prev) => (prev - 1 + filteredQCodes.length) % filteredQCodes.length);
  };

  const shuffleCard = () => {
    setRevealed(false);
    setCardIndex(Math.floor(Math.random() * filteredQCodes.length));
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner & Mode Switch */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Radio className="w-4 h-4" />
            <span>常用 Q 简语 (Q-Codes) 备考全览</span>
          </div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            高频通联缩略语与真题问答对照表
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            在电报 (CW) 或话音 (Phone) 通联中，Q 简语带问号表示询问，不带问号表示回答或陈述。
          </p>
        </div>

        {/* View Switch: Table vs Flashcard */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlashcardMode(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !flashcardMode
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : isDark ? 'bg-[#1C1C21] text-slate-400 border border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            📋 完整列表
          </button>
          <button
            onClick={() => {
              setFlashcardMode(true);
              setRevealed(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              flashcardMode
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : isDark ? 'bg-[#1C1C21] text-slate-400 border border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎴 抽认卡模式</span>
          </button>
        </div>
      </div>

      {flashcardMode ? (
        /* Flashcard Mode */
        <div className="max-w-xl mx-auto space-y-4">
          <div
            onClick={() => setRevealed(!revealed)}
            className={`border rounded-3xl p-6 sm:p-8 min-h-[280px] flex flex-col justify-between items-center text-center cursor-pointer shadow-sm transition-all hover:scale-[1.01] ${
              isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
              <span>抽认卡 ({cardIndex + 1}/{filteredQCodes.length})</span>
              <span className="text-orange-600 font-bold">{currentCard.category}</span>
            </div>

            <div className="space-y-3 py-4">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-orange-600 tracking-wider">
                {currentCard.code}
              </div>
              <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentCard.chinese}
              </div>

              {revealed ? (
                <div className="space-y-2 pt-2 animate-in fade-in text-left">
                  <div className="text-xs space-y-1">
                    <div className="text-slate-500 font-semibold">❓ 问句含义 (带?):</div>
                    <div className={`p-2 rounded-xl text-xs ${isDark ? 'bg-[#1C1C21] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                      {currentCard.question}
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-500 font-semibold">💡 答句含义 (无?):</div>
                    <div className={`p-2 rounded-xl text-xs ${isDark ? 'bg-[#1C1C21] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                      {currentCard.answer}
                    </div>
                  </div>
                  {currentCard.mnemonic && (
                    <div className="text-xs text-orange-600 font-semibold pt-1">
                      💡 速记: {currentCard.mnemonic}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1 pt-4">
                  <Eye className="w-4 h-4" />
                  <span>点击卡片翻转查看释义与例句</span>
                </div>
              )}
            </div>

            <div className="w-full text-[11px] text-slate-400 border-t border-slate-200 dark:border-[#2D2D33] pt-2">
              点击翻转 • 点击下方按钮切题
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={prevCard}
              className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                isDark ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={shuffleCard}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>随机抽题</span>
            </button>
            <button
              onClick={nextCard}
              className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                isDark ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Table Mode */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['all', '通联状态', '信号质量', '频率功率', '位置与时间'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-orange-600 text-white font-bold shadow-xs'
                      : isDark ? 'bg-[#141418] text-slate-400 border border-[#2D2D33]' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索 Q 简语或含义..."
                className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 ${
                  isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase text-[11px] font-mono border-b border-slate-200 dark:border-[#2D2D33] ${
                  isDark ? 'bg-[#0A0A0B] text-slate-400' : 'bg-slate-50 text-slate-600'
                }`}>
                  <tr>
                    <th className="px-4 py-3">简语代码</th>
                    <th className="px-4 py-3">中文释义</th>
                    <th className="px-4 py-3">带问号 (询问)</th>
                    <th className="px-4 py-3">不带问号 (陈述/回答)</th>
                    <th className="px-4 py-3">速记诀窍</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#2D2D33]">
                  {filteredQCodes.map((item, idx) => (
                    <tr
                      key={idx}
                      className={isDark ? 'hover:bg-[#1C1C21] transition-colors' : 'hover:bg-slate-50 transition-colors'}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-orange-600 text-sm">
                        {item.code}
                      </td>
                      <td className={`px-4 py-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.chinese}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.question}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {item.answer}
                      </td>
                      <td className="px-4 py-3 font-medium text-orange-600">
                        {item.mnemonic}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
