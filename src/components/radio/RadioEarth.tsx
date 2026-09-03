import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Home,
  Radio,
  Search,
  Settings2,
  Wrench,
} from 'lucide-react';
import { typedRadioRoutes, type RadioSeoRoute } from '../../seo/radioRoutes';
import type { KnowledgeNode } from '../../types';
import { useTheme } from '../../utils/theme';
import { AccountButton } from '../auth/AccountButton';
import { RadioMain, type RadioSection } from './RadioMain';
import type { ExamSubTab } from './exam/LevelExamView';
import type { ToolSubTab } from './tools/RadioToolsHub';
import './radio-earth.css';

type RouteKind = 'home' | 'us-hub' | 'cn-hub' | 'us-class' | 'cn-class' | 'workspace' | 'content' | 'not-found';
type UsClass = 'technician' | 'general' | 'extra';
type CnClass = 'a' | 'b' | 'c';

type RadioRoute = {
  kind: RouteKind;
  pathname: string;
  section?: RadioSection;
  usClass?: UsClass;
  cnClass?: CnClass;
  level: 'A' | 'B' | 'C';
  tab: ExamSubTab;
  tool: ToolSubTab;
  page?: RadioSeoRoute;
};

interface RadioEarthProps {
  onOpenSearch: () => void;
  onSelectNode: (node: KnowledgeNode) => void;
}

const normalizePath = (pathname: string): string => {
  const normalized = pathname === '/radio' ? '/radio/' : pathname;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

const examTabs: ExamSubTab[] = ['knowledge', 'question_bank', 'simulator', 'wrong_book'];
const toolByQuery: Record<string, ToolSubTab> = {
  map: 'districts',
  dictionary: 'qcodes',
  phonetic: 'phonetic',
  bands: 'bands',
  antenna: 'antenna_diy',
};
const queryByTool: Record<ToolSubTab, string> = {
  districts: 'map',
  qcodes: 'dictionary',
  phonetic: 'phonetic',
  bands: 'bands',
  antenna_diy: 'antenna',
};

const pageFor = (pathname: string): RadioSeoRoute | undefined => (
  typedRadioRoutes.find((page) => page.path === pathname)
);

const routeFromLocation = (): RadioRoute => {
  const pathname = normalizePath(window.location.pathname);
  const query = new URLSearchParams(window.location.search);
  const level = query.get('level');
  const tab = query.get('tab');
  const tool = query.get('tool');
  const levelValue: 'A' | 'B' | 'C' = level === 'B' || level === 'C' ? level : 'A';
  const tabValue: ExamSubTab = examTabs.includes(tab as ExamSubTab) ? tab as ExamSubTab : 'knowledge';
  const toolValue: ToolSubTab = toolByQuery[tool ?? ''] ?? 'districts';
  const initial = {
    pathname,
    level: levelValue,
    tab: tabValue,
    tool: toolValue,
  };
  if (pathname === '/radio/') return { ...initial, kind: 'home' };
  if (pathname === '/radio/ham-radio-license/') return { ...initial, kind: 'us-hub' };
  if (pathname === '/radio/china-license/') return { ...initial, kind: 'cn-hub' };
  if (pathname === '/radio/exam/') return { ...initial, kind: 'workspace', section: 'exam' };
  if (pathname === '/radio/tools/') return { ...initial, kind: 'workspace', section: 'tools' };
  if (pathname === '/radio/technician/' || pathname === '/radio/general/' || pathname === '/radio/extra/') {
    return { ...initial, kind: 'us-class', usClass: pathname.slice('/radio/'.length, -1) as UsClass };
  }
  if (pathname === '/radio/license-a/' || pathname === '/radio/license-b/' || pathname === '/radio/license-c/') {
    return { ...initial, kind: 'cn-class', cnClass: pathname.slice(-2, -1) as CnClass };
  }
  const page = pageFor(pathname);
  return page ? { ...initial, kind: 'content', page } : { ...initial, kind: 'not-found' };
};

const navigate = (href: string): void => {
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const syncMetadata = (page: RadioSeoRoute | undefined): void => {
  if (!page) return;
  document.documentElement.lang = page.locale;
  document.title = page.title;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = page.description;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `https://dronerfdiy.com${page.canonical}`;
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
  Object.entries(page.alternates).forEach(([locale, pathname]) => {
    const alternate = document.createElement('link');
    alternate.rel = 'alternate';
    alternate.hreflang = locale;
    alternate.href = `https://dronerfdiy.com${pathname}`;
    document.head.appendChild(alternate);
  });
};

function Header({ market, onMarketChange }: {
  market: 'China' | 'United States';
  onMarketChange: (value: 'China' | 'United States') => void;
}) {
  return (
    <header className="radio-light-header">
      <div className="radio-light-header__inner">
        <a className="radio-light-brand" href="/radio/"><Radio size={20} /> Radio Earth</a>
        <nav className="radio-light-nav" aria-label="Radio Earth 主导航">
          <a href="/radio/ham-radio-license/">执照</a>
          <a href="/radio/exam/">考试</a>
          <a href="/radio/tools/">工具</a>
          <a href="/radio/#explore">探索</a>
        </nav>
        <div className="radio-light-actions">
          <label className="sr-only" htmlFor="radio-market">学习地区</label>
          <select id="radio-market" value={market} onChange={(event) => onMarketChange(event.target.value as 'China' | 'United States')}>
            <option>China</option><option>United States</option>
          </select>
          <AccountButton variant="radio" />
        </div>
      </div>
    </header>
  );
}

function PageNav({ parent }: { parent?: { href: string; label: string } }) {
  return (
    <nav className="radio-page-nav" aria-label="页面导航">
      {parent && <a href={parent.href}><ArrowLeft size={15} />返回{parent.label}</a>}
      <a href="/radio/"><Home size={15} />Radio Earth 首页</a>
    </nav>
  );
}

function WorkspaceHeader({ section, onOpenSearch }: { section: RadioSection; onOpenSearch: () => void }) {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign('/radio/');
  };
  return (
    <header className="radio-workspace-header">
      <div>
        <p>RADIO EARTH · WORKSPACE</p>
        <h1>{section === 'exam' ? '中国业余无线电学习考试工作区' : 'HAM 实用工具工作区'}</h1>
      </div>
      <div className="radio-workspace-header__actions">
        {section === 'exam' && <button type="button" onClick={onOpenSearch}><Search size={16} />搜索题库</button>}
        <button type="button" onClick={goBack}><ArrowLeft size={16} />返回</button>
        <a href="/radio/"><Home size={16} />Radio Earth 首页</a>
      </div>
    </header>
  );
}

function HomePage() {
  const cards = [
    { href: '/radio/china-license/', icon: <BookOpen />, title: '执照', body: '中国 A/B/C 学习路径，以及美国执照官方资料入口。' },
    { href: '/radio/exam/', icon: <Settings2 />, title: '考试', body: '中国 A/B/C 类知识、原题、模拟考试与错题复盘。' },
    { href: '/radio/tools/', icon: <Wrench />, title: '工具', body: '呼号地图、通联词典、频段与天馈计算。' },
    { href: '#explore', icon: <Compass />, title: '探索', body: '从卫星、传播和收听概念开始；不伪造实时数据。' },
  ];
  return (
    <main>
      <section className="radio-hero">
        <div className="radio-hero__grid" aria-hidden="true" />
        <div className="radio-container radio-hero__content">
          <p className="radio-eyebrow">RECEIVE · LEARN · EXPLORE</p>
          <h1>理解无线电，从第一段可靠信息开始。</h1>
          <p>Radio Earth 面向学习、收听与探索。先选择执照、考试或工具，再逐步了解信号如何穿越地球周围的空间。</p>
          <div className="radio-status-list"><span>官方来源优先</span><span>3108 道中国源题</span><span>不展示伪实时数据</span></div>
        </div>
      </section>
      <section className="radio-container radio-section">
        <div className="radio-card-grid">
          {cards.map((card) => <a key={card.title} className="radio-entry-card" href={card.href}><span>{card.icon}</span><h2>{card.title}</h2><p>{card.body}</p><b>进入 →</b></a>)}
        </div>
        <div className="radio-license-links" aria-label="执照学习地区">
          <a href="/radio/china-license/">China License</a>
          <a href="/radio/ham-radio-license/">US Ham Radio License</a>
        </div>
      </section>
      <section id="explore" className="radio-container radio-section radio-explore">
        <p className="radio-eyebrow">EXPLORE WITHOUT PRETENDING</p>
        <h2>卫星、传播与收听，先从可验证的概念开始。</h2>
        <p>后续数据接入会标示来源、时间与状态。在此之前，这里只提供学习线索，不把预测、历史记录或占位符包装为实时电波。</p>
      </section>
    </main>
  );
}

const usCards: Array<{ slug: UsClass; title: string; text: string }> = [
  { slug: 'technician', title: 'Technician', text: 'An entry-level path. Use current authorized study material and a recognized exam coordinator.' },
  { slug: 'general', title: 'General', text: 'Build on the entry-level path with current official and recognized study references.' },
  { slug: 'extra', title: 'Amateur Extra', text: 'An advanced path. Confirm current rules and examination details before acting.' },
];
const cnCards: Array<{ slug: CnClass; title: string; text: string }> = [
  { slug: 'a', title: 'A 类', text: '683 道权威源题；从基础知识和操作能力开始。' },
  { slug: 'b', title: 'B 类', text: '1143 道权威源题；继续完成知识、题库与模拟练习。' },
  { slug: 'c', title: 'C 类', text: '1282 道权威源题；按当前源文件完成系统复习。' },
];

function LicenseHub({ country }: { country: 'us' | 'cn' }) {
  const isUs = country === 'us';
  const cards = isUs ? usCards : cnCards;
  const page = pageFor(isUs ? '/radio/ham-radio-license/' : '/radio/china-license/');
  const parent = { href: '/radio/', label: '首页' };
  const labels = isUs
    ? { quick: 'Quick overview', before: 'Before you start', steps: 'Suggested steps', sources: 'Official sources', reviewed: 'Last reviewed', enter: 'View path →' }
    : { quick: '快速说明', before: '开始前确认', steps: '建议步骤', sources: '官方来源', reviewed: '最后复核', enter: '查看路径 →' };
  return <main className="radio-container radio-content"><PageNav parent={parent} /><article><p className="radio-eyebrow">LICENSE PATH</p><h1>{page?.h1 ?? (isUs ? 'Ham Radio License' : '中国业余无线电学习')}</h1><section className="radio-paper"><h2>{labels.quick}</h2><p>{page?.quickAnswer}</p></section>{page?.requirements.length ? <section className="radio-paper"><h2>{labels.before}</h2><ul>{page.requirements.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}{page?.steps.length ? <section className="radio-paper"><h2>{labels.steps}</h2><ol>{page.steps.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}<div className="radio-card-grid">{cards.map((card) => <a className="radio-entry-card" key={card.slug} href={isUs ? `/radio/${card.slug}/` : `/radio/license-${card.slug}/`}><h2>{card.title}</h2><p>{card.text}</p><b>{labels.enter}</b></a>)}</div>{page?.officialSources.length ? <section className="radio-sources"><h2>{labels.sources}</h2>{page.officialSources.map((source) => <a key={source.url} href={source.url} rel="nofollow external">{source.label}</a>)}<p className="radio-reviewed">{labels.reviewed}: {page.lastReviewed}</p></section> : null}</article><PageNav parent={parent} /></main>;
}

function ClassPage({ country, value }: { country: 'us' | 'cn'; value: UsClass | CnClass }) {
  const isUs = country === 'us';
  const page = isUs
    ? pageFor(`/radio/${value}/`)
    : pageFor(`/radio/license-${value}/`);
  const parent = { href: isUs ? '/radio/ham-radio-license/' : '/radio/china-license/', label: isUs ? '美国执照' : '中国执照' };
  return <ContentPage page={page} parent={parent} fallbackTitle={isUs ? String(value) : `${String(value).toUpperCase()} 类学习`} />;
}

function ContentPage({ page, parent, fallbackTitle }: { page?: RadioSeoRoute; parent: { href: string; label: string }; fallbackTitle: string }) {
  const title = page?.h1 ?? fallbackTitle;
  const isUs = page?.locale === 'en-US';
  const labels = isUs
    ? { before: 'Before you start', sources: 'Official Sources', reviewed: 'Last reviewed' }
    : { before: '开始前确认', sources: '官方来源', reviewed: '最后复核' };
  return <main className="radio-container radio-content"><PageNav parent={parent} /><article><p className="radio-eyebrow">SOURCE-AWARE GUIDE</p><h1>{title}</h1><p className="radio-lead">{page?.quickAnswer ?? '请以当前官方信息与适用规则为准。'}</p>{page?.requirements.length ? <section className="radio-paper"><h2>{labels.before}</h2><ul>{page.requirements.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}{page?.sections.map((section) => <section className="radio-paper" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</section>)}{page?.ctaHref && <a className="radio-primary-link" href={page.ctaHref}>{page.cta} →</a>}{page?.officialSources.length ? <section className="radio-sources"><h2>{labels.sources}</h2>{page.officialSources.map((source) => <a key={source.url} href={source.url} rel="nofollow external">{source.label}</a>)}<p className="radio-reviewed">{labels.reviewed}: {page.lastReviewed}</p></section> : null}</article><PageNav parent={parent} /></main>;
}

function UnknownPage() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/radio/');
  };
  return <main className="radio-container radio-content radio-unknown"><nav className="radio-page-nav" aria-label="页面导航"><button type="button" onClick={goBack}><ArrowLeft size={15} />返回上一页</button><a href="/radio/"><Home size={15} />Radio Earth 首页</a></nav><h1>未找到此 Radio 页面</h1><p>请返回 Radio Earth 首页，或从执照、考试与工具入口继续。</p><a className="radio-primary-link" href="/radio/">Radio Earth 首页</a></main>;
}

export function RadioEarth({ onOpenSearch, onSelectNode }: RadioEarthProps) {
  const [route, setRoute] = useState<RadioRoute>(routeFromLocation);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
    const sync = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [setTheme]);

  useEffect(() => syncMetadata(pageFor(route.pathname)), [route.pathname]);

  const setWorkspaceState = (section: RadioSection, level = route.level, tab = route.tab, tool = route.tool) => {
    if (section === 'tools') navigate(`/radio/tools/?tool=${queryByTool[tool]}`);
    else navigate(`/radio/exam/?level=${level}&tab=${tab}`);
  };

  const isUsRoute = route.kind === 'us-hub' || route.kind === 'us-class' || route.page?.market === 'US';
  const market: 'China' | 'United States' = isUsRoute ? 'United States' : 'China';
  const changeMarket = (value: 'China' | 'United States') => navigate(value === 'China' ? '/radio/china-license/' : '/radio/ham-radio-license/');

  const regularPage = route.kind !== 'workspace';
  const legacyParent = route.pathname.includes('/us/') ? { href: '/radio/ham-radio-license/', label: '美国执照' } : { href: '/radio/china-license/', label: '中国执照' };

  return <div className="radio-light-shell">
    {regularPage && <Header market={market} onMarketChange={changeMarket} />}
    {route.kind === 'home' && <HomePage />}
    {route.kind === 'us-hub' && <LicenseHub country="us" />}
    {route.kind === 'cn-hub' && <LicenseHub country="cn" />}
    {route.kind === 'us-class' && <ClassPage country="us" value={route.usClass!} />}
    {route.kind === 'cn-class' && <ClassPage country="cn" value={route.cnClass!} />}
    {route.kind === 'content' && <ContentPage page={route.page} parent={legacyParent} fallbackTitle="Radio Earth 指南" />}
    {route.kind === 'workspace' && <main className="radio-workspace"><WorkspaceHeader section={route.section!} onOpenSearch={onOpenSearch} /><RadioMain initialSection={route.section!} initialLevel={route.level} initialTab={route.tab} initialTool={route.tool} onSelectNode={onSelectNode} onNavigate={setWorkspaceState} /></main>}
    {route.kind === 'not-found' && <UnknownPage />}
  </div>;
}
