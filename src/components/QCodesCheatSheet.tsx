import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search, Shuffle } from 'lucide-react';
import { qCodesData } from '../data/hamData';
import {
  abbreviationCategoryLabels,
  communicationAbbreviations,
  hamTermCategoryLabels,
  hamTerms,
  matchesHamQuery,
  type AbbreviationCategory,
  type HamTermCategory,
} from '../data/hamDictionaryData';
import { answerText, r2CwAbbreviations, r2QuestionPhrases } from '../data/hamToolData';
import type { ExamQuestion, QCodeItem } from '../types';
import { useTheme } from '../utils/theme';

type Mode = 'dictionary' | 'qcodes' | 'abbreviations' | 'terms' | 'phrases' | 'cw';
type QCodeCategory = 'all' | QCodeItem['category'];

const qCodeCategories: Array<[QCodeCategory, string]> = [
  ['all', '全部'], ['traffic', '通联状态'], ['signal', '信号质量'], ['freq', '频率功率'],
  ['location', '位置与时间'], ['equipment', '设备操作'],
];
const abbreviationCategories: Array<['all' | AbbreviationCategory, string]> = [
  ['all', '全部'], ...Object.entries(abbreviationCategoryLabels) as Array<[AbbreviationCategory, string]>,
];
const termCategories: Array<['all' | HamTermCategory, string]> = [
  ['all', '全部'], ...Object.entries(hamTermCategoryLabels) as Array<[HamTermCategory, string]>,
];

const searchableQuestion = (item: ExamQuestion) =>
  `${item.id} ${item.jCode} ${item.question} ${item.options.map((option) => option.text).join(' ')}`.toLowerCase();

export const QCodesCheatSheet: React.FC = () => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<Mode>('dictionary');
  const [search, setSearch] = useState('');
  const [qCodeCategory, setQCodeCategory] = useState<QCodeCategory>('all');
  const [abbreviationCategory, setAbbreviationCategory] = useState<'all' | AbbreviationCategory>('all');
  const [termCategory, setTermCategory] = useState<'all' | HamTermCategory>('all');
  const [cards, setCards] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const query = search.trim().toLowerCase();
  const isGlobalSearch = query.length > 0;
  const dictionaryCount = qCodesData.length + communicationAbbreviations.length + hamTerms.length;
  const searchCount = dictionaryCount + r2QuestionPhrases.length + r2CwAbbreviations.length;
  const panel = `border rounded-xl ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`;

  const qCodes = useMemo(() => qCodesData.filter((item) => {
    const matchesCategory = qCodeCategory === 'all' || item.category === qCodeCategory;
    const matchesQuery = matchesHamQuery(query, [item.code, item.chinese, item.question, item.answer, item.mnemonic || '', item.exampleQso || '']);
    return isGlobalSearch ? matchesQuery : matchesCategory;
  }), [isGlobalSearch, qCodeCategory, query]);

  const abbreviations = useMemo(() => communicationAbbreviations.filter((item) => {
    const matchesCategory = abbreviationCategory === 'all' || item.category === abbreviationCategory;
    const matchesQuery = matchesHamQuery(query, [item.code, ...item.aliases, item.chinese, item.description, item.example, item.questionId, item.sourceAnswer]);
    return isGlobalSearch ? matchesQuery : matchesCategory;
  }), [abbreviationCategory, isGlobalSearch, query]);

  const terms = useMemo(() => hamTerms.filter((item) => {
    const matchesCategory = termCategory === 'all' || item.category === termCategory;
    const matchesQuery = matchesHamQuery(query, [item.term, item.english, ...item.aliases, item.definition, item.use]);
    return isGlobalSearch ? matchesQuery : matchesCategory;
  }), [isGlobalSearch, query, termCategory]);

  const phraseQuestions = useMemo(
    () => r2QuestionPhrases.filter((item) => !query || searchableQuestion(item).includes(query)), [query],
  );
  const cwQuestions = useMemo(
    () => r2CwAbbreviations.filter((item) => !query || searchableQuestion(item).includes(query)), [query],
  );
  const card = qCodes[qCodes.length ? index % qCodes.length : 0];

  const changeMode = (next: Mode) => {
    setMode(next); setSearch(''); setQCodeCategory('all'); setAbbreviationCategory('all'); setTermCategory('all');
    setIndex(0); setRevealed(false); setCards(false);
  };

  const renderQCodes = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {qCodes.map((item) => (
        <article key={item.code} className={`${panel} p-4`}>
          <b className="font-mono text-lg text-orange-600">{item.code}</b>
          <span className="float-right text-[10px] text-slate-500">{qCodeCategories.find(([id]) => id === item.category)?.[1]}</span>
          <h3 className="font-bold mt-1">{item.chinese}</h3>
          <p className="text-xs text-slate-500 mt-2">问：{item.question}</p>
          <p className="text-xs mt-1">答：{item.answer}</p>
          {item.exampleQso && <p className="text-xs text-orange-600 mt-2 font-mono">{item.exampleQso}</p>}
        </article>
      ))}
    </div>
  );

  const renderAbbreviations = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {abbreviations.map((item) => (
        <article key={item.questionId} className={`${panel} p-4 border-l-2 border-l-orange-500`}>
          <div className="flex items-start justify-between gap-3">
            <b className="font-mono text-lg text-orange-600 break-words">{item.code}</b>
            <span className="text-[10px] text-slate-500 shrink-0">{abbreviationCategoryLabels[item.category]}</span>
          </div>
          <h3 className="font-bold mt-1">{item.chinese}</h3>
          <p className="text-xs text-slate-500 mt-2 leading-5">{item.description}</p>
          <p className="text-xs text-orange-600 mt-2 font-mono">{item.example}</p>
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-[#2D2D33] text-[10px] text-slate-500">
            <span className="font-mono">R2 · [I] {item.questionId} · [P] 2.4.2</span>
            <p className="mt-1">标准答案：{item.sourceAnswer}</p>
          </div>
        </article>
      ))}
    </div>
  );

  const renderTerms = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {terms.map((item) => (
        <article key={`${item.category}-${item.term}`} className={`${panel} p-4`}>
          <span className="float-right text-[10px] text-slate-500">{hamTermCategoryLabels[item.category]}</span>
          <h3 className="font-bold pr-16">{item.term}</h3>
          <p className="text-xs font-mono text-orange-600 mt-1">{item.english}</p>
          {item.aliases.length > 0 && <p className="text-[10px] font-mono text-slate-500 mt-1">别名：{item.aliases.join(' / ')}</p>}
          <p className="text-xs leading-5 mt-3">{item.definition}</p>
          <p className="text-xs leading-5 text-slate-500 mt-2"><b>实用：</b>{item.use}</p>
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

  const renderFilters = <T extends string>(
    options: Array<['all' | T, string]>, value: 'all' | T, setValue: (next: 'all' | T) => void,
    countFor: (id: 'all' | T) => number,
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map(([id, label]) => (
        <button key={id} onClick={() => setValue(id)} className={`px-2.5 py-1 text-xs rounded border ${value === id ? 'bg-orange-600 border-orange-600 text-white' : 'text-slate-500 border-slate-300 dark:border-slate-700'}`}>
          {label} ({countFor(id)})
        </button>
      ))}
    </div>
  );

  const noResults = qCodes.length + abbreviations.length + terms.length + phraseQuestions.length + cwQuestions.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      <header className={`${panel} p-5`}>
        <p className="font-mono text-xs font-bold text-orange-600">HAM / COMPLETE COMMUNICATION DICTIONARY</p>
        <h2 className="font-black text-xl mt-2">Q 简语、通联缩语与 HAM 实用名词词典</h2>
        <p className="text-xs text-slate-500 mt-2 leading-5">
          结构化词典共 {dictionaryCount} 条：{qCodesData.length} 条 Q 简语、{communicationAbbreviations.length} 组 R2 通联缩语、{hamTerms.length} 个 HAM 实用名词；另保留 [P]2.4.1 与 [P]2.4.2 共 82 道原题。搜索覆盖全部 {searchCount} 个索引项。
        </p>
      </header>

      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-[#2D2D33]">
        {([
          ['dictionary', '完整词典', dictionaryCount], ['qcodes', 'Q 简语', qCodesData.length],
          ['abbreviations', '通联缩语', communicationAbbreviations.length], ['terms', 'HAM 名词', hamTerms.length],
          ['phrases', 'R2 Q简语原题', r2QuestionPhrases.length], ['cw', 'R2 缩语原题', r2CwAbbreviations.length],
        ] as const).map(([id, label, count]) => (
          <button key={id} onClick={() => changeMode(id)} className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 ${mode === id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>
            {label} <span className="font-mono">({count})</span>
          </button>
        ))}
      </div>

      <label className="relative block max-w-lg">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input value={search} onChange={(event) => { setSearch(event.target.value); setIndex(0); }} placeholder="全库搜索缩语、中英文名词、别名或 R2 题号…" className={`w-full rounded-xl border pl-9 p-2.5 text-sm outline-none focus:border-orange-500 ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-white border-slate-300'}`} />
      </label>

      {isGlobalSearch && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="font-bold text-orange-600">全库检索</span><span>Q 简语 {qCodes.length}</span>
          <span>通联缩语 {abbreviations.length}</span><span>HAM 名词 {terms.length}</span>
          <span>Q 简语原题 {phraseQuestions.length}</span><span>缩语原题 {cwQuestions.length}</span>
        </div>
      )}

      {!isGlobalSearch && mode === 'qcodes' && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            {renderFilters(qCodeCategories, qCodeCategory, (next) => { setQCodeCategory(next); setIndex(0); }, (id) => id === 'all' ? qCodesData.length : qCodesData.filter((item) => item.category === id).length)}
            <div className="flex gap-2"><button onClick={() => setCards(false)} className={`text-xs ${!cards ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>列表</button><button onClick={() => { setCards(true); setRevealed(false); }} className={`text-xs ${cards ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>抽认卡</button></div>
          </div>
          {cards && card ? (
            <section className={`${panel} max-w-xl mx-auto p-6 text-center`}>
              <p className="text-xs text-slate-500">{(index % qCodes.length) + 1} / {qCodes.length}</p><b className="text-4xl font-mono text-orange-600 block mt-5">{card.code}</b><h3 className="font-bold mt-2">{card.chinese}</h3>
              {revealed ? <div className="text-left text-sm leading-7 mt-5"><p><b>问：</b>{card.question}</p><p><b>答：</b>{card.answer}</p><p className="text-orange-600">{card.exampleQso}</p></div> : <button onClick={() => setRevealed(true)} className="mt-5 text-xs text-orange-600 flex mx-auto gap-1"><Eye className="w-4 h-4" />揭示答案</button>}
              <div className="flex justify-center gap-4 mt-6"><button onClick={() => { setIndex((index - 1 + qCodes.length) % qCodes.length); setRevealed(false); }} aria-label="上一张"><ChevronLeft /></button><button onClick={() => { setIndex(Math.floor(Math.random() * qCodes.length)); setRevealed(false); }} aria-label="随机抽取"><Shuffle /></button><button onClick={() => { setIndex((index + 1) % qCodes.length); setRevealed(false); }} aria-label="下一张"><ChevronRight /></button></div>
            </section>
          ) : renderQCodes()}
        </>
      )}

      {!isGlobalSearch && mode === 'abbreviations' && <>{renderFilters<AbbreviationCategory>(abbreviationCategories, abbreviationCategory, (next) => setAbbreviationCategory(next), (id) => id === 'all' ? communicationAbbreviations.length : communicationAbbreviations.filter((item) => item.category === id).length)}{renderAbbreviations()}</>}
      {!isGlobalSearch && mode === 'terms' && <>{renderFilters<HamTermCategory>(termCategories, termCategory, (next) => setTermCategory(next), (id) => id === 'all' ? hamTerms.length : hamTerms.filter((item) => item.category === id).length)}{renderTerms()}</>}

      {!isGlobalSearch && mode === 'dictionary' && (
        <div className="space-y-8">
          <section className="space-y-3"><h3 className="text-sm font-black">Q 简语 <span className="font-mono text-orange-600">{qCodesData.length}</span></h3>{renderQCodes()}</section>
          <section className="space-y-3"><h3 className="text-sm font-black">R2 通联缩语词典 <span className="font-mono text-orange-600">{communicationAbbreviations.length}</span></h3>{renderAbbreviations()}</section>
          <section className="space-y-3"><h3 className="text-sm font-black">HAM 实用名词 <span className="font-mono text-orange-600">{hamTerms.length}</span></h3>{renderTerms()}</section>
        </div>
      )}

      {!isGlobalSearch && mode === 'phrases' && renderQuestionList(phraseQuestions, 'R2 / Q-PHRASE')}
      {!isGlobalSearch && mode === 'cw' && renderQuestionList(cwQuestions, 'R2 / CW')}

      {isGlobalSearch && !noResults && (
        <div className="space-y-8">
          {qCodes.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">Q 简语匹配</h3>{renderQCodes()}</section>}
          {abbreviations.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">通联缩语匹配</h3>{renderAbbreviations()}</section>}
          {terms.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">HAM 名词匹配</h3>{renderTerms()}</section>}
          {phraseQuestions.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">R2 Q 简语原题匹配</h3>{renderQuestionList(phraseQuestions, 'R2 / Q-PHRASE')}</section>}
          {cwQuestions.length > 0 && <section className="space-y-3"><h3 className="text-sm font-black">R2 缩语原题匹配</h3>{renderQuestionList(cwQuestions, 'R2 / CW')}</section>}
        </div>
      )}
      {isGlobalSearch && noResults && <div className={`${panel} p-6 text-sm text-slate-500`}>全量索引中没有找到匹配项，请检查拼写或尝试题号。</div>}
    </div>
  );
};
