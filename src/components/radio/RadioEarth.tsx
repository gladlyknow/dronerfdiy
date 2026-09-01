import React from 'react';
import {
  Activity,
  BookOpen,
  Globe2,
  Headphones,
  Moon,
  Radio,
  Satellite,
  Search,
  Sun,
  Waves,
} from 'lucide-react';
import zhCN from '../../i18n/zh-CN.json';
import enCN from '../../i18n/en-CN.json';
import enUS from '../../i18n/en-US.json';
import zhUS from '../../i18n/zh-US.json';
import { radioMarkets, type RadioLocale, type RadioMarket } from '../../data/radioMarkets';
import { typedRadioRoutes, type RadioSeoRoute } from '../../seo/radioRoutes';
import type { KnowledgeNode } from '../../types';
import { useTheme } from '../../utils/theme';
import { AccountButton } from '../auth/AccountButton';
import { RadioMain, type RadioSection } from './RadioMain';
import type { ExamSubTab } from './exam/LevelExamView';

type RadioCopy = typeof zhCN;
type RadioLocaleId = 'zh-CN' | 'en-CN' | 'en-US' | 'zh-US';

type RadioEarthRoute = {
  market: RadioMarket;
  locale: RadioLocale;
  localeId: RadioLocaleId;
  section: 'earth' | RadioSection;
  level: 'A' | 'B' | 'C';
  tab: ExamSubTab;
  pathname: string;
};

interface RadioEarthProps {
  onOpenSearch: () => void;
  onSelectNode: (node: KnowledgeNode) => void;
}

const copyByLocale: Record<RadioLocaleId, RadioCopy> = {
  'zh-CN': zhCN,
  'en-CN': enCN,
  'en-US': enUS,
  'zh-US': zhUS,
};

const homePaths = new Set([
  '/radio/',
  '/radio/cn/zh/',
  '/radio/cn/en/',
  '/radio/us/en/',
  '/radio/us/zh/',
]);

const isMarket = (value: string | undefined): value is RadioMarket => value === 'cn' || value === 'us';
const isLocale = (value: string | undefined): value is RadioLocale => value === 'zh' || value === 'en';
const normalizePath = (pathname: string) => pathname.endsWith('/') ? pathname : `${pathname}/`;

const routeFromLocation = (): RadioEarthRoute => {
  const pathname = normalizePath(window.location.pathname === '/radio' ? '/radio/' : window.location.pathname);
  const segments = pathname.split('/').filter(Boolean);
  const market = isMarket(segments[1]) ? segments[1] : 'us';
  const locale = isLocale(segments[2]) ? segments[2] : market === 'us' ? 'en' : 'zh';
  const localeId = `${locale}-${market.toUpperCase()}` as RadioLocaleId;
  const nestedPath = segments.slice(3).join('/');
  const isExam = nestedPath === 'license/exam';
  const isTools = nestedPath === 'tools';
  const search = new URLSearchParams(window.location.search);
  const level = search.get('level');
  const tab = search.get('tab');
  return {
    market,
    locale,
    localeId,
    section: isExam ? 'exam' : isTools ? 'tools' : 'earth',
    level: level === 'B' || level === 'C' ? level : 'A',
    tab: tab === 'question_bank' || tab === 'simulator' || tab === 'wrong_book' ? tab : 'knowledge',
    pathname,
  };
};

const pathFor = (market: RadioMarket, locale: RadioLocale, suffix = ''): string => `/radio/${market}/${locale}/${suffix}`;
const licensePathFor = (market: RadioMarket, locale: RadioLocale): string => (
  market === 'cn'
    ? pathFor(market, locale, 'license/')
    : pathFor(market, locale, 'ham-radio-license/')
);

const useNavigate = () => (next: string) => {
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

function syncMetadata(route: RadioSeoRoute | undefined) {
  if (!route) return;
  document.documentElement.lang = route.locale;
  document.title = route.title;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = route.description;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `https://dronerfdiy.com${route.canonical}`;
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
  Object.entries(route.alternates).forEach(([locale, pathname]) => {
    const alternate = document.createElement('link');
    alternate.rel = 'alternate';
    alternate.hreflang = locale;
    alternate.href = `https://dronerfdiy.com${pathname}`;
    document.head.appendChild(alternate);
  });
  const fallback = document.createElement('link');
  fallback.rel = 'alternate';
  fallback.hreflang = 'x-default';
  fallback.href = 'https://dronerfdiy.com/radio/';
  document.head.appendChild(fallback);
}

function RadioHeader({ route, copy, onOpenSearch }: { route: RadioEarthRoute; copy: RadioCopy; onOpenSearch: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  const hub = pathFor(route.market, route.locale);
  const license = licensePathFor(route.market, route.locale);
  const tools = route.market === 'cn' && route.locale === 'zh' ? pathFor('cn', 'zh', 'tools/') : `${hub}#tools`;
  const navItems = [
    { label: copy.live, href: `${hub}#live` },
    { label: copy.satellites, href: `${hub}#satellites` },
    { label: copy.listen, href: `${hub}#listen` },
    { label: copy.propagation, href: `${hub}#propagation` },
    { label: copy.learn, href: `${hub}#learn` },
    { label: copy.license, href: license },
    { label: copy.tools, href: tools },
  ];
  const selectors = (idSuffix: string) => (
    <div className="flex shrink-0 items-center gap-2 text-xs">
      <label className="sr-only" htmlFor={`radio-market-${idSuffix}`}>Region</label>
      <select
        id={`radio-market-${idSuffix}`}
        value={route.market}
        onChange={(event) => window.location.assign(pathFor(event.target.value as RadioMarket, route.locale))}
        className="rounded-lg border border-[#365b75] bg-[#0c2133] px-2 py-1.5 text-slate-100"
      >
        {(Object.keys(radioMarkets) as RadioMarket[]).map((item) => <option key={item} value={item}>{radioMarkets[item].label[route.locale]}</option>)}
      </select>
      <label className="sr-only" htmlFor={`radio-language-${idSuffix}`}>Language</label>
      <select
        id={`radio-language-${idSuffix}`}
        value={route.locale}
        onChange={(event) => window.location.assign(pathFor(route.market, event.target.value as RadioLocale))}
        className="rounded-lg border border-[#365b75] bg-[#0c2133] px-2 py-1.5 text-slate-100"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#25445d] bg-[#071523]/95 text-slate-100 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="/radio/" className="flex shrink-0 items-center gap-2 font-black tracking-[0.14em] text-white">
          <Radio className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          <span className="text-sm sm:text-base">{copy.brand}</span>
        </a>
        <nav className="hidden items-center gap-4 text-xs font-bold text-slate-300 xl:flex" aria-label="Radio Earth">
          {navItems.map((item) => <a key={item.label} href={item.href} className="transition hover:text-cyan-200">{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:block">{selectors('desktop')}</div>
          {route.market === 'cn' && (
            <button type="button" onClick={onOpenSearch} className="rounded-lg border border-[#365b75] bg-[#0c2133] p-2 text-cyan-200" title="搜索知识点" aria-label="搜索知识点">
              <Search className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={toggleTheme} className="rounded-lg border border-[#365b75] bg-[#0c2133] p-2 text-amber-300" title={isDark ? '切换明亮模式' : '切换暗色模式'} aria-label="切换主题">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <AccountButton variant="radio" />
        </div>
      </div>
      <div className="border-t border-[#17344a] px-4 py-2 xl:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto whitespace-nowrap text-xs font-bold text-slate-300">
          <div className="lg:hidden">{selectors('mobile')}</div>
          {navItems.map((item) => <a key={item.label} href={item.href} className="py-1 transition hover:text-cyan-200">{item.label}</a>)}
        </div>
      </div>
    </header>
  );
}

function RadioEarthHome({ route, copy }: { route: RadioEarthRoute; copy: RadioCopy }) {
  const market = radioMarkets[route.market];
  const license = licensePathFor(route.market, route.locale);
  const tools = route.market === 'cn' && route.locale === 'zh' ? pathFor('cn', 'zh', 'tools/') : `${pathFor(route.market, route.locale)}#tools`;
  const isChinese = route.locale === 'zh';
  const isGlobal = route.pathname === '/radio/';
  return (
    <main className="bg-[#071523]">
      <section className="border-b border-[#25445d] bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,.18),_transparent_38%),linear-gradient(135deg,#071523,#0c2133)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:py-24">
          <div>
            <p className="mb-4 font-mono text-xs font-bold tracking-[0.22em] text-cyan-300">RECEIVE · LEARN · EXPLORE</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">{copy.tagline}</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">
              {isGlobal
                ? 'Choose a region and language to begin. Radio Earth V1 is for receiving, learning and exploration; it does not control a transmitter.'
                : market.notice[route.locale]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#06101c] transition hover:bg-cyan-200" href="#live">{copy.explore}</a>
              {isGlobal ? (
                <>
                  <a className="rounded-xl border border-[#476e88] px-5 py-3 text-sm font-black text-white transition hover:border-cyan-200" href="/radio/cn/zh/">中国 · 中文</a>
                  <a className="rounded-xl border border-[#476e88] px-5 py-3 text-sm font-black text-white transition hover:border-cyan-200" href="/radio/us/en/">United States · English</a>
                </>
              ) : (
                <a className="rounded-xl border border-[#476e88] px-5 py-3 text-sm font-black text-white transition hover:border-cyan-200" href={license}>{copy.chinaLearning}</a>
              )}
            </div>
          </div>
          <aside className="grid gap-3 rounded-3xl border border-[#31536d] bg-[#091c2c]/90 p-5 shadow-2xl shadow-black/20">
            <p className="font-mono text-[11px] font-bold tracking-[.16em] text-cyan-300">RADIO EARTH · DATA HONESTY</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {['LIVE', 'SAT', 'PROP'].map((label) => <span key={label} className="rounded-xl bg-white/5 p-3 text-slate-300">{label}<br /><strong className="text-white">—</strong></span>)}
            </div>
            <p className="text-xs leading-6 text-slate-400">{isChinese ? '第三方实时数据尚未接入时保持空值，不把历史记录或预测伪装成直播。' : 'Live values stay empty until providers are connected and verified. Recorded or predicted data will never be presented as live.'}</p>
          </aside>
        </div>
      </section>

      <section id="live" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12 sm:px-6">
        <div className="mb-6"><p className="font-mono text-xs text-cyan-300">INTERESTING NOW · PROVIDERS NEXT</p><h2 className="mt-2 text-2xl font-black text-white">{copy.explore}</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { id: 'satellites', icon: <Satellite />, title: copy.satellites, body: isChinese ? 'SatNOGS 轨道与过境数据将在 Provider 缓存层完成后接入。' : 'SatNOGS orbit and pass data will arrive through the cached provider layer.' },
            { id: 'propagation', icon: <Activity />, title: copy.propagation, body: isChinese ? 'NOAA 空间天气与观测传播会明确标注数据时间和状态。' : 'NOAA space weather and observed paths will show timestamp and data status.' },
            { id: 'listen', icon: <Headphones />, title: copy.listen, body: isChinese ? '仅把通过状态检查的接收节点标为 LIVE。' : 'Only receiver nodes that pass stream and status checks will be labelled LIVE.' },
          ].map((item) => <article id={item.id} key={item.title} className="scroll-mt-32 rounded-2xl border border-[#31536d] bg-[#0b2031] p-5"><span className="text-cyan-300">{item.icon}</span><h3 className="mt-5 font-black text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p></article>)}
        </div>
      </section>

      <section id="learn" className="mx-auto grid max-w-7xl scroll-mt-32 gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#31536d] bg-[#0b2031] p-6"><BookOpen className="text-cyan-300" /><h2 className="mt-4 text-xl font-black text-white">{copy.license}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{isChinese ? '地区法规与界面语言相互独立；进入对应市场的学习与官方来源。' : 'Region and interface language remain independent. Open the correct market-specific learning path.'}</p><a className="mt-5 inline-flex font-bold text-cyan-200" href={license}>{copy.chinaLearning} →</a></article>
        <article id="tools" className="scroll-mt-32 rounded-2xl border border-[#31536d] bg-[#0b2031] p-6"><Waves className="text-cyan-300" /><h2 className="mt-4 text-xl font-black text-white">{copy.toolbox}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{isChinese ? '呼号、词典、频段与天馈工具继续复用现有工程资产。' : 'Callsign, terminology, band and antenna tools continue to reuse the verified product foundation.'}</p><a className="mt-5 inline-flex font-bold text-cyan-200" href={tools}>{copy.toolbox} →</a></article>
      </section>
    </main>
  );
}

function RadioSeoLanding({ page, isChinese }: { page: RadioSeoRoute; isChinese: boolean }) {
  return (
    <main className="mx-auto max-w-5xl bg-[#071523] px-4 py-10 sm:px-6 sm:py-16">
      <nav className="mb-7 flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb"><a className="text-cyan-200" href="/radio/">Radio Earth</a><span>/</span><span>{page.market}</span></nav>
      <article>
        <p className="font-mono text-xs font-bold tracking-[.18em] text-cyan-300">{page.market} · {page.locale}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">{page.h1}</h1>
        <section className="mt-7 rounded-2xl border border-[#31536d] bg-[#0b2031] p-6"><h2 className="text-sm font-black text-cyan-200">{isChinese ? '快速答案' : 'Quick Answer'}</h2><p className="mt-3 leading-7 text-slate-300">{page.quickAnswer}</p></section>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-[#294a63] bg-[#091c2c] p-5"><h2 className="font-black text-white">{isChinese ? '开始前确认' : 'Before you start'}</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">{page.requirements.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section className="rounded-2xl border border-[#294a63] bg-[#091c2c] p-5"><h2 className="font-black text-white">{isChinese ? '下一步怎么做' : 'Step by step'}</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">{page.steps.map((item) => <li key={item}>{item}</li>)}</ol></section>
        </div>
        {page.sections.map((section) => <section key={section.heading} className="mt-6 rounded-2xl border border-[#294a63] bg-[#091c2c] p-6"><h2 className="text-xl font-black text-white">{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 leading-7 text-slate-300">{paragraph}</p>)}{section.items && <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">{section.items.map((item) => <li key={item} className="rounded-xl bg-white/5 px-4 py-3">{item}</li>)}</ul>}</section>)}
        <a className="mt-8 inline-flex rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#06101c]" href={page.ctaHref}>{page.cta}</a>
        {page.faq.length > 0 && <section className="mt-10"><h2 className="text-xl font-black text-white">{isChinese ? '常见问题' : 'FAQ'}</h2><div className="mt-4 space-y-3">{page.faq.map((item) => <details key={item.question} className="rounded-xl border border-[#294a63] bg-[#091c2c] p-4"><summary className="cursor-pointer font-bold text-white">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-300">{item.answer}</p></details>)}</div></section>}
        {page.officialSources.length > 0 && <section className="mt-10 border-t border-[#294a63] pt-6"><h2 className="font-black text-white">{isChinese ? '官方来源' : 'Official Sources'}</h2><ul className="mt-3 space-y-2 text-sm">{page.officialSources.map((source) => <li key={source.url}><a className="text-cyan-200 hover:underline" href={source.url} rel="nofollow external">{source.label}</a></li>)}</ul><p className="mt-4 text-xs text-slate-500">{isChinese ? '最后复核' : 'Last reviewed'}：{page.lastReviewed}</p></section>}
      </article>
    </main>
  );
}

export function RadioEarth({ onOpenSearch, onSelectNode }: RadioEarthProps) {
  const [route, setRoute] = React.useState<RadioEarthRoute>(routeFromLocation);
  const navigate = useNavigate();
  const copy = copyByLocale[route.localeId];
  const seoPage = typedRadioRoutes.find((page) => page.path === route.pathname);
  const { isDark } = useTheme();
  const usesDarkShell = route.section === 'earth';

  React.useEffect(() => {
    const syncRoute = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  React.useEffect(() => syncMetadata(seoPage), [seoPage]);

  const setRadioState = (section: RadioSection, level = route.level, tab = route.tab) => {
    const suffix = section === 'tools' ? 'tools/' : 'license/exam/';
    const query = section === 'exam' ? `?level=${level}&tab=${tab}` : '';
    navigate(`${pathFor('cn', 'zh', suffix)}${query}`);
  };

  return (
    <div className={`min-h-screen ${usesDarkShell || isDark ? 'bg-[#071523] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <RadioHeader route={route} copy={copy} onOpenSearch={onOpenSearch} />
      {route.section === 'exam' || route.section === 'tools' ? (
        <main>
          <div className="border-b border-[#25445d] bg-[#0a1c2b] text-slate-100"><div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-slate-300 sm:px-6"><a className="hover:text-cyan-200" href="/radio/cn/zh/">Radio Earth</a><span>/</span><a className="hover:text-cyan-200" href="/radio/cn/zh/license/">中国 License</a><span>/</span><strong className="text-white">{route.section === 'tools' ? copy.toolbox : copy.exam}</strong></div></div>
          <RadioMain initialSection={route.section} initialLevel={route.level} initialTab={route.tab} onSelectNode={onSelectNode} onNavigate={setRadioState} />
        </main>
      ) : homePaths.has(route.pathname) ? (
        <RadioEarthHome route={route} copy={copy} />
      ) : seoPage ? (
        <RadioSeoLanding page={seoPage} isChinese={route.locale === 'zh'} />
      ) : (
        <main className="mx-auto max-w-3xl px-6 py-24 text-center"><Globe2 className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-5 text-3xl font-black">Radio route not found</h1><a className="mt-6 inline-flex text-cyan-300" href="/radio/">Return to Radio Earth</a></main>
      )}
    </div>
  );
}
