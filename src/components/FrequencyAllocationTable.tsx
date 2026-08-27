import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  ExternalLink,
  RadioTower,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  allocationRules,
  allocationSources,
  frequencyAllocations,
  frequencyUseWindows,
  type AllocationStatus,
  type FrequencyScope,
} from '../data/frequencyAllocationData';
import { useTheme } from '../utils/theme';

type StatusFilter = 'all' | AllocationStatus;
type ScopeFilter = 'all' | FrequencyScope;

const statusStyles: Record<AllocationStatus, string> = {
  专用: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/35 dark:text-orange-300',
  唯一主要: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300',
  共同主要: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/35 dark:text-sky-300',
  次要: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-300',
};

const statusDescriptions: Record<AllocationStatus, string> = {
  专用: '只划分给题库所述业余/卫星业余业务',
  唯一主要: '共用频段内，业余/卫星业余是唯一主要业务',
  共同主要: '与其他主要业务同级共用，可能需要协调',
  次要: '须保护主要业务，不能要求主要业务保护',
};

const scopeOptions: Array<{ id: ScopeFilter; label: string }> = [
  { id: 'all', label: '全部频率' },
  { id: 'below30', label: '30 MHz 以下' },
  { id: '30to3000', label: '30–3000 MHz' },
  { id: 'above3000', label: '3 GHz 以上' },
];

const statusOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: '全部等级' },
  { id: '专用', label: '专用' },
  { id: '唯一主要', label: '唯一主要' },
  { id: '共同主要', label: '共同主要' },
  { id: '次要', label: '次要' },
];

const QuestionReferences: React.FC<{ questions: Array<{ id: string; jCode: string }> }> = ({ questions }) => (
  <div className="mt-2 flex flex-wrap gap-1">
    {questions.map((question) => (
      <span
        key={`${question.id}-${question.jCode}`}
        className="rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-[#34343B] dark:text-slate-400"
      >
        {question.id} · {question.jCode}
      </span>
    ))}
  </div>
);

export const FrequencyAllocationTable: React.FC = () => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return frequencyAllocations.filter((item) => {
      const searchable = [
        item.spectrum,
        item.nickname,
        item.range,
        item.status,
        item.examPoint,
        item.relation,
        ...item.questions.flatMap((question) => [question.id, question.jCode]),
      ].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesScope = scope === 'all' || item.scope === scope;
      const matchesStatus = status === 'all' || item.status === status;
      return matchesQuery && matchesScope && matchesStatus;
    });
  }, [query, scope, status]);

  const panelClass = isDark
    ? 'border-[#2D2D33] bg-[#111114]'
    : 'border-slate-200 bg-white';

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${panelClass}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-orange-600">
              <RadioTower className="h-4 w-4" />
              <span>R2 A 类题库 · §1.7.1 · 33 题完整映射</span>
            </div>
            <h2 className={`mt-1.5 text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              中国业余业务与卫星业余业务频率划分总表
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              将题库里的分散考点还原为“频率范围—业务等级—保护关系—题号”四条并行线，14 MHz 与 144 MHz 按业务状态拆段呈现。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <a
              href={allocationSources.regulation}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 dark:border-[#34343B]"
            >
              国家频率划分规定 <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={allocationSources.questionBank}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 dark:border-[#34343B]"
            >
              CRAC R2 题库 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            ['33', '§1.7.1 原题'],
            ['18', '划分条目'],
            ['4', '业务等级'],
            ['135.7 kHz → 250 GHz', '题库频率跨度'],
          ].map(([value, label]) => (
            <div key={label} className={`rounded-xl border px-3 py-3 ${isDark ? 'border-[#2D2D33] bg-[#18181D]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="font-mono text-sm font-bold text-orange-600 sm:text-base">{value}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>频率划分不等于个人操作权限。</strong> 实际发射须同时符合操作证书类别、电台执照载明事项、设备核准范围和当地频率协调要求。</p>
        </div>
      </header>

      <section className={`rounded-2xl border p-4 shadow-sm ${panelClass}`} aria-labelledby="allocation-legend-title">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-orange-600" />
          <h3 id="allocation-legend-title" className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>业务等级图例</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(statusDescriptions) as AllocationStatus[]).map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 p-3 dark:border-[#2D2D33]">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyles[item]}`}>{item}</span>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{statusDescriptions[item]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {allocationRules.map((rule) => (
            <article key={rule.question.id} className={`rounded-xl border p-3 ${isDark ? 'border-[#2D2D33] bg-[#18181D]' : 'border-slate-200 bg-slate-50'}`}>
              <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{rule.title}</h4>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{rule.detail}</p>
              <QuestionReferences questions={[rule.question]} />
            </article>
          ))}
        </div>
      </section>

      <section className={`overflow-hidden rounded-2xl border shadow-sm ${panelClass}`} aria-labelledby="allocation-table-title">
        <div className="border-b border-slate-200 p-3.5 dark:border-[#2D2D33] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 id="allocation-table-title" className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BookOpenCheck className="h-4 w-4 text-orange-600" />
                中国内地频率划分 · 题库考点表
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">当前显示 {rows.length} / {frequencyAllocations.length} 条；可搜索频率、波段、MC1 题号或 J 码。</p>
            </div>
            <label className="relative block w-full xl:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">搜索频率划分总表</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索频率、波段、MC1 或 J 码…"
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-colors focus:border-orange-500 ${isDark ? 'border-[#34343B] bg-[#18181D] text-white placeholder:text-slate-600' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'}`}
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5" aria-label="频率范围筛选">
              {scopeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScope(option.id)}
                  aria-pressed={scope === option.id}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${scope === option.id ? 'border-orange-600 bg-orange-600 text-white' : isDark ? 'border-[#34343B] text-slate-400 hover:border-orange-700 hover:text-orange-400' : 'border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="业务等级筛选">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatus(option.id)}
                  aria-pressed={status === option.id}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${status === option.id ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900' : isDark ? 'border-[#34343B] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Search className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-500">没有符合条件的频段</p>
            <button type="button" onClick={() => { setQuery(''); setScope('all'); setStatus('all'); }} className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-500">清除全部筛选</button>
          </div>
        ) : (
          <>
            <div className="hidden max-h-[720px] overflow-auto md:block">
              <table className="min-w-[1180px] w-full table-fixed text-left text-xs">
                <thead className={`sticky top-0 z-10 border-b text-[11px] ${isDark ? 'border-[#2D2D33] bg-[#18181D] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  <tr>
                    <th className="w-[118px] px-3 py-3">频谱 / 俗称</th>
                    <th className="w-[175px] px-3 py-3">精确频率范围</th>
                    <th className="w-[105px] px-3 py-3">业务等级</th>
                    <th className="w-[230px] px-3 py-3">共用与保护关系</th>
                    <th className="w-[245px] px-3 py-3">卫星业余说明</th>
                    <th className="px-3 py-3">§1.7.1 考点 / 题号</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#2D2D33]">
                  {rows.map((item) => (
                    <tr key={item.id} className={isDark ? 'align-top hover:bg-[#18181D]' : 'align-top hover:bg-slate-50'}>
                      <td className="px-3 py-3">
                        <strong className={isDark ? 'text-white' : 'text-slate-900'}>{item.spectrum}</strong>
                        <div className="mt-1 text-[11px] text-slate-500">{item.nickname}</div>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-orange-600">{item.range}</td>
                      <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyles[item.status]}`}>{item.status}</span></td>
                      <td className="px-3 py-3 leading-5 text-slate-500">{item.relation}</td>
                      <td className="px-3 py-3 leading-5 text-slate-500">{item.satellite}</td>
                      <td className="px-3 py-3 leading-5 text-slate-500">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.examPoint}</span>
                        <QuestionReferences questions={item.questions} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 p-3 md:hidden">
              {rows.map((item) => (
                <article key={item.id} className={`rounded-xl border p-3 ${isDark ? 'border-[#2D2D33] bg-[#18181D]' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.spectrum} · {item.nickname}</div>
                      <div className="mt-1 font-mono text-sm font-bold text-orange-600">{item.range}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyles[item.status]}`}>{item.status}</span>
                  </div>
                  <dl className="mt-3 space-y-2 text-[11px] leading-5">
                    <div><dt className="font-bold text-slate-500">共用 / 保护</dt><dd className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.relation}</dd></div>
                    <div><dt className="font-bold text-slate-500">卫星业余</dt><dd className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.satellite}</dd></div>
                    <div><dt className="font-bold text-slate-500">考试提示</dt><dd className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.examPoint}</dd></div>
                  </dl>
                  <QuestionReferences questions={item.questions} />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${panelClass}`} aria-labelledby="frequency-windows-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="frequency-windows-title" className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>题库边界速查</h3>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">把 WARC、信标保护、话音实际占用范围和本地联络避让区单列，避免把“整个划分频段”误当成“任意方式均可占用”。</p>
          </div>
          <span className="shrink-0 rounded-lg bg-orange-50 px-2 py-1 font-mono text-[10px] font-bold text-orange-700 dark:bg-orange-950/35 dark:text-orange-300">11 条</span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {frequencyUseWindows.map((window) => (
            <article key={window.id} className={`rounded-xl border border-l-2 border-l-orange-500 p-3 ${isDark ? 'border-y-[#2D2D33] border-r-[#2D2D33] bg-[#18181D]' : 'border-y-slate-200 border-r-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{window.name}</h4>
                <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-[#2B2B31] dark:text-slate-400">{window.category}</span>
              </div>
              <p className="mt-2 font-mono text-[11px] font-bold leading-5 text-orange-600">{window.range}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{window.detail}</p>
              <QuestionReferences questions={[window.question]} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
