import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search, Shuffle } from 'lucide-react';
import { qCodesData } from '../data/hamData';
import { answerText, r2CwAbbreviations, r2QuestionPhrases } from '../data/hamToolData';
import type { ExamQuestion, QCodeItem } from '../types';
import { useTheme } from '../utils/theme';

type Mode = 'all' | 'core' | 'phrases' | 'cw';
type Category = 'all' | QCodeItem['category'];

const categories: Array<[Category, string]> = [
  ['all', '全部'],
  ['traffic', '通联状态'],
  ['signal', '信号质量'],
  ['freq', '频率功率'],
  ['location', '位置与时间'],
  ['equipment', '设备操作'],
];

const searchableQuestion = (item: ExamQuestion) =>
  `${item.id} ${item.jCode} ${item.question} ${item.options.map((option) => option.text).join(' ')}`.toLowerCase();

export const QCodesCheatSheet: React.FC = () => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<Mode>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [cards, setCards] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const query = search.trim().toLowerCase();
  const isGlobalSearch = query.length > 0;
  const panel = `border rounded-xl ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`;

  const core = useMemo(() => qCodesData.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesQuery = `${item.code} ${item.chinese} ${item.question} ${item.answer} ${item.exampleQso || ''}`.toLowerCase().includes(query);
    return (isGlobalSearch || matchesCategory) && matchesQuery;
  }), [category, isGlobalSearch, query]);

  const phraseQuestions = useMemo(
    () => r2QuestionPhrases.filter((item) => !query || searchableQuestion(item).includes(query)),
    [query],
  );
  const cwQuestions = useMemo(
    () => r2CwAbbreviations.filter((item) => !query || searchableQuestion(item).includes(query)),
    [query],
  );
  const card = core[core.length ? index % core.length : 0];

  const changeMode = (next: Mode) => {
    setMode(next);
    setSearch('');
    setCategory('all');
    setIndex(0);
    setRevealed(false);
  };

  const renderCoreList = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {core.map((item) => (
        <article key={item.code} className={`${panel} p-4`}>
          <b className="font-mono text-lg text-orange-600">{item.code}</b>
          <span className="float-right text-[10px] text-slate-500">{categories.find((entry) => entry[0] === item.category)?.[1]}</span>
          <h3 className="font-bold mt-1">{item.chinese}</h3>
          <p className="text-xs text-slate-500 mt-2">问：{item.question}</p>
          <p className="text-xs mt-1">答：{item.answer}</p>
          <p className="text-xs text-orange-600 mt-2">{item.exampleQso}</p>
        </article>
      ))}
    </div>
  );

  const renderQuestionList = (questions: ExamQuestion[], source: string) => (
    <div className="space-y-3">
      {questions.map((item) => (
        <article key={`${source}-${item.id}`} className={`${panel} border-l-2 border-l-orange-500 p-4`}>
          <p className="text-[11px] font-mono text-slate-500">{source}　[I] {item.id}　[J] {item.jCode}　[P] {item.sectionCode}</p>
          <p className="font-bold text-sm mt-2 leading-6">{item.question}</p>
          <p className="text-sm text-orange-600 mt-2"><b>标准答案：</b>{answerText(item)}</p>
        </article>
      ))}
    </div>
  );

  const noResults = core.length + phraseQuestions.length + cwQuestions.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      <header className={`${panel} p-5`}>
        <p className="font-mono text-xs font-bold text-orange-600">HAM / COMMUNICATION REFERENCE</p>
        <h2 className="font-black text-xl mt-2">高频通联缩略语与真题问答对照表</h2>
        <p className="text-xs text-slate-500 mt-2">
          全量索引包含 21 条核心词典与 A 类 R2 题库 [P]2.4.1、[P]2.4.2 共 82 道原题；搜索始终覆盖全部 103 个条目。
        </p>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-[#2D2D33]">
        {([
          ['all', '全量索引', qCodesData.length + r2QuestionPhrases.length + r2CwAbbreviations.length],
          ['core', '核心 Q 简语', qCodesData.length],
          ['phrases', 'R2 真题短句', r2QuestionPhrases.length],
          ['cw', 'CW 常用缩语', r2CwAbbreviations.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => changeMode(id)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 ${mode === id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}
          >
            {label} <span className="font-mono">({count})</span>
          </button>
        ))}
      </div>

      <label className="relative block max-w-lg">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setIndex(0); }}
          placeholder="全库搜索题号、短句、Q 简语或 CW 缩语…"
          className={`w-full rounded-xl border pl-9 p-2.5 text-sm outline-none focus:border-orange-500 ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-white border-slate-300'}`}
        />
      </label>

      {isGlobalSearch && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-bold text-orange-600">全库检索</span>
          <span>核心词典 {core.length}</span>
          <span>真题短句 {phraseQuestions.length}</span>
          <span>CW 缩语 {cwQuestions.length}</span>
        </div>
      )}

      {!isGlobalSearch && mode === 'core' && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {categories.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setCategory(id); setIndex(0); }}
                  className={`px-2.5 py-1 text-xs rounded border ${category === id ? 'bg-orange-600 border-orange-600 text-white' : 'text-slate-500 border-slate-300 dark:border-slate-700'}`}
                >
                  {label} ({id === 'all' ? qCodesData.length : qCodesData.filter((item) => item.category === id).length})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCards(false)} className={`text-xs ${!cards ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>列表</button>
              <button onClick={() => { setCards(true); setRevealed(false); }} className={`text-xs ${cards ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>抽认卡</button>
            </div>
          </div>
          {cards && card ? (
            <section className={`${panel} max-w-xl mx-auto p-6 text-center`}>
              <p className="text-xs text-slate-500">{(index % core.length) + 1} / {core.length}</p>
              <b className="text-4xl font-mono text-orange-600 block mt-5">{card.code}</b>
              <h3 className="font-bold mt-2">{card.chinese}</h3>
              {revealed ? (
                <div className="text-left text-sm leading-7 mt-5">
                  <p><b>问：</b>{card.question}</p>
                  <p><b>答：</b>{card.answer}</p>
                  <p className="text-orange-600">{card.exampleQso}</p>
                </div>
              ) : (
                <button onClick={() => setRevealed(true)} className="mt-5 text-xs text-orange-600 flex mx-auto gap-1"><Eye className="w-4 h-4" />揭示答案</button>
              )}
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => { setIndex((index - 1 + core.length) % core.length); setRevealed(false); }} aria-label="上一张"><ChevronLeft /></button>
                <button onClick={() => { setIndex(Math.floor(Math.random() * core.length)); setRevealed(false); }} aria-label="随机抽取"><Shuffle /></button>
                <button onClick={() => { setIndex((index + 1) % core.length); setRevealed(false); }} aria-label="下一张"><ChevronRight /></button>
              </div>
            </section>
          ) : renderCoreList()}
        </>
      )}

      {!isGlobalSearch && mode === 'all' && (
        <div className="space-y-7">
          <section className="space-y-3">
            <h3 className="text-sm font-black">核心 Q 简语词典 <span className="font-mono text-orange-600">21</span></h3>
            {renderCoreList()}
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-black">R2 真题短句 · [P]2.4.1 <span className="font-mono text-orange-600">31</span></h3>
            {renderQuestionList(phraseQuestions, 'R2 / Q-PHRASE')}
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-black">CW 常用缩语 · [P]2.4.2 <span className="font-mono text-orange-600">51</span></h3>
            {renderQuestionList(cwQuestions, 'R2 / CW')}
          </section>
        </div>
      )}

      {!isGlobalSearch && mode === 'phrases' && renderQuestionList(phraseQuestions, 'R2 / Q-PHRASE')}
      {!isGlobalSearch && mode === 'cw' && renderQuestionList(cwQuestions, 'R2 / CW')}

      {isGlobalSearch && !noResults && (
        <div className="space-y-7">
          {core.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">核心词典匹配</h3>{renderCoreList()}</section>}
          {phraseQuestions.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">R2 真题短句匹配</h3>{renderQuestionList(phraseQuestions, 'R2 / Q-PHRASE')}</section>}
          {cwQuestions.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">CW 常用缩语匹配</h3>{renderQuestionList(cwQuestions, 'R2 / CW')}</section>}
        </div>
      )}

      {isGlobalSearch && noResults && <div className={`${panel} p-6 text-sm text-slate-500`}>全量索引中没有找到匹配项，请检查拼写或尝试题号。</div>}
    </div>
  );
};
