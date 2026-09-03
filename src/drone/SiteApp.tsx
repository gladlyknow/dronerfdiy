import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Calculator,
  ChevronRight,
  CircuitBoard,
  Compass,
  ExternalLink,
  House,
  Menu,
  Radio,
  Send,
  ShieldCheck,
  Waves,
  Wrench,
  X,
} from 'lucide-react';
import { dronePages, navItems } from './data';
import { AccountButton } from '../components/auth/AccountButton';
import { useAuth } from '../auth/AuthProvider';
import { PortalPage, type PortalRoute } from './PortalPage';
import './site.css';
import './site-light.css';

const base = '/';
const recordedPageViews = new Set<string>();

function href(path = '') {
  return `${base}${path.replace(/^\/+/, '')}`;
}

function Logo() {
  return (
    <a className="site-logo" href={href()} aria-label="DroneRF DIY 首页">
      <img src={href('assets/logo/drone-rf-mark.svg')} alt="" width="42" height="42" />
      <span>
        DroneRF <b>DIY</b>
        <small>无线电 × 飞行实验室</small>
      </span>
    </a>
  );
}

const headerLinks = [
  { label: 'Drone 总览', to: 'drone/' },
  { label: '安全', to: 'drone/safety/' },
  { label: '装机', to: 'drone/build/' },
  { label: 'RF 链路', to: 'drone/rf/' },
  { label: '工程工具', to: 'drone/tools/' },
  { label: 'Radio Earth', to: 'radio/' },
];

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Logo />
      <nav id="primary-navigation" className={open ? 'open' : ''} aria-label="主导航">
        {headerLinks.map((item) => (
          <a href={href(item.to)} key={item.to} onClick={() => setOpen(false)}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="site-actions">
        <AccountButton variant="site" />
        <button
          className="menu"
          type="button"
          aria-label={open ? '关闭导航' : '打开导航'}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <Logo />
      <p>为好奇心、工程习惯与安全飞行而造。</p>
      <div>
        <a href={href('drone/')}>Drone 模块</a>
        <a href={href('radio/')}>Radio 学习</a>
        <a href={href('drone/tools/')}>工程工具</a>
      </div>
    </footer>
  );
}

const gateways = [
  {
    title: 'Radio 无线电学习站',
    text: 'A / B / C 类题库、知识图谱、Q 简语与模拟考试',
    to: 'radio/',
    tone: 'cyan',
    icon: Radio,
    meta: '3,108 道权威源题',
  },
  {
    title: 'Drone 无人机 DIY 站',
    text: '安全、装机、飞控调参、图传链路与工程工具',
    to: 'drone/',
    tone: 'orange',
    icon: Send,
    meta: '10 条实践路径',
  },
];

const workflow = [
  ['01', '理解', '从频率、动力与控制原理建立共同语言。'],
  ['02', '构建', '按机械、供电、通信分阶段装配与检查。'],
  ['03', '测试', '小步验证，记录参数、观察与异常。'],
  ['04', '复盘', '把一次飞行变成下一次更可靠的改进。'],
];

const disciplines = [
  { icon: Waves, title: 'RF 链路', text: '从天线、极化与遮挡理解可靠连接。', to: 'drone/rf/' },
  { icon: CircuitBoard, title: '系统构建', text: '让选型、装配和调试都有清晰验收点。', to: 'drone/build/' },
  { icon: ShieldCheck, title: '安全边界', text: '把空域、人员、电池与退出条件放在性能之前。', to: 'drone/safety/' },
];

function Home() {
  return (
    <div className="site-light-shell">
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">DRONERF DIY · PRECISION LAB</p>
            <h1>无线电 × 无人机 × DIY 实验站</h1>
            <p>探索 RF 世界，创造飞行未来。把可靠知识、可复盘的工作流和动手实验放在同一张工作台上。</p>
            <div className="actions">
              <a className="button cyan" href={href('radio/')}>
                进入 Radio <ArrowRight aria-hidden="true" />
              </a>
              <a className="button orange" href={href('drone/')}>
                进入 Drone <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="hero-signals" aria-label="平台能力">
              <span><b>RADIO</b> 权威题库</span>
              <span><b>DRONE</b> 实践路径</span>
              <span><b>DIY</b> 可验证工具</span>
            </div>
          </div>
          <img
            src={href('assets/home/hero-drone-rf.webp')}
            alt="悬停在无线电实验工作台前的 FPV 无人机"
            width="1672"
            height="941"
            fetchPriority="high"
          />
        </section>

        <section className="entry-grid" aria-label="站点入口">
          {gateways.map((item) => {
            const Icon = item.icon;
            return (
              <a className={`entry ${item.tone}`} href={href(item.to)} key={item.title}>
                <Icon className="entry-icon" aria-hidden="true" />
                <div>
                  <span className="entry-meta">{item.meta}</span>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </div>
                <ArrowRight className="entry-arrow" aria-hidden="true" />
              </a>
            );
          })}
        </section>

        <section className="content-section">
          <p className="eyebrow">HOW WE BUILD</p>
          <h2 className="section-title">从好奇，到能验证的系统</h2>
          <div className="cards">
            {workflow.map(([step, title, text]) => (
              <article key={step}>
                <span>{step}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="disciplines content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ONE SYSTEM · THREE DISCIPLINES</p>
              <h2 className="section-title">把飞行看成完整工程</h2>
            </div>
            <p>动力让它离地，控制让它可预测，无线电让人在系统之外仍能可靠判断。</p>
          </div>
          <div className="discipline-grid">
            {disciplines.map((item) => {
              const Icon = item.icon;
              return (
                <a href={href(item.to)} key={item.title}>
                  <Icon aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span>查看路径 <ChevronRight aria-hidden="true" /></span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="feature content-section">
          <img
            loading="lazy"
            src={href('assets/drone/fpv-workbench.webp')}
            alt="整齐摆放无人机部件的 FPV 装机工作台"
            width="1536"
            height="1024"
          />
          <div>
            <p className="eyebrow">FEATURED PATH</p>
            <h2>从一台可靠的 FPV 开始</h2>
            <p>围绕安全、维护和真实的工程约束，建立自己的飞行实验路径；先验证基础，再追求性能。</p>
            <a className="text-link" href={href('drone/fpv/')}>
              查看 FPV 入门路径 <ChevronRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function parsePositive(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function Tools() {
  const [frequency, setFrequency] = useState('2400');
  const [capacity, setCapacity] = useState('1500');
  const [current, setCurrent] = useState('12');

  const antenna = useMemo(() => {
    const mhz = parsePositive(frequency);
    if (!mhz) return null;
    const wavelengthMeters = 299_792_458 / (mhz * 1_000_000);
    return {
      full: wavelengthMeters * 100,
      quarter: wavelengthMeters * 25,
    };
  }, [frequency]);

  const flightMinutes = useMemo(() => {
    const mah = parsePositive(capacity);
    const amps = parsePositive(current);
    if (!mah || !amps) return null;
    return ((mah / 1000) * 0.8 * 60) / amps;
  }, [capacity, current]);

  return (
    <div className="tool-grid">
      <section className="tool">
        <Calculator aria-hidden="true" />
        <h3>天线长度估算</h3>
        <label htmlFor="frequency">工作频率</label>
        <div className="input-unit">
          <input
            id="frequency"
            type="number"
            min="0.001"
            step="0.1"
            inputMode="decimal"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
          />
          <span>MHz</span>
        </div>
        <output aria-live="polite">
          全波长 {antenna ? `${antenna.full.toFixed(2)} cm` : '—'}
          <br />
          四分之一波长 {antenna ? `${antenna.quarter.toFixed(2)} cm` : '—'}
        </output>
        <p>使用 λ = c ÷ f 的自由空间理论值；实际天线还需要考虑材料速度因子、馈电与安装环境。</p>
      </section>

      <section className="tool">
        <Compass aria-hidden="true" />
        <h3>理论续航估算</h3>
        <label htmlFor="capacity">电池标称容量</label>
        <div className="input-unit">
          <input
            id="capacity"
            type="number"
            min="1"
            step="10"
            inputMode="decimal"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
          <span>mAh</span>
        </div>
        <label htmlFor="current">预估平均电流</label>
        <div className="input-unit">
          <input
            id="current"
            type="number"
            min="0.01"
            step="0.1"
            inputMode="decimal"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
          <span>A</span>
        </div>
        <output aria-live="polite">约 {flightMinutes ? `${flightMinutes.toFixed(1)} 分钟` : '—'}</output>
        <p>按使用标称容量的 80% 估算；飞行风格、低温、电池老化和瞬时负载都会改变结果。</p>
      </section>
    </div>
  );
}

function DroneIndex() {
  return (
    <div className="site-light-shell">
      <Header />
      <main className="drone-index">
        <div className="drone-page-links" aria-label="快捷导航">
          <a href={href()}><House aria-hidden="true" />返回首页</a>
          <a href={href('radio/')}><Radio aria-hidden="true" />前往 Radio Earth</a>
        </div>
        <section className="drone-hero">
          <div>
            <p className="eyebrow">DRONE LAB · BUILD WITH EVIDENCE</p>
            <h1>无人机 DIY 模块</h1>
            <p>从安全边界开始，沿着装机、控制和 RF 链路建立一套可检查、可记录、可复盘的工程实践。</p>
            <a className="button orange" href={href('drone/safety/')}>
              从安全检查开始 <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <img
            src={href('assets/drone/fpv-workbench.webp')}
            alt="FPV 无人机机架、飞控、天线与电池工作台"
            width="1536"
            height="1024"
            fetchPriority="high"
          />
        </section>

        <section className="path-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KNOWLEDGE PATHS</p>
              <h2 className="section-title">选择当前要解决的问题</h2>
            </div>
            <p>每条路径都给出检查点、风险边界和下一步，不用从术语堆里寻找入口。</p>
          </div>
          <div className="drone-nav">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <a href={href(`drone/${item.slug}/`)} key={item.slug}>
                  <span className="path-number">{String(index + 1).padStart(2, '0')}</span>
                  <Icon aria-hidden="true" />
                  <span>
                    <b>{item.shortTitle}</b>
                    <small>{item.description}</small>
                  </span>
                  <ChevronRight className="path-arrow" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DroneArticle({ slug }: { slug: string }) {
  const page = dronePages[slug];
  const index = navItems.findIndex((item) => item.slug === slug);
  const nextPage = navItems[(index + 1) % navItems.length];
  const Icon = page.icon;

  return (
    <div className="site-light-shell">
      <Header />
      <main className="article">
        <div className="drone-page-links article-page-links" aria-label="页面导航">
          <a href={href('drone/')}><ArrowLeft aria-hidden="true" />返回 Drone 总览</a>
          <a href={href()}><House aria-hidden="true" />返回首页</a>
        </div>
        <div className="breadcrumbs" aria-label="面包屑">
          <a href={href()}>首页</a>
          <ChevronRight aria-hidden="true" />
          <a href={href('drone/')}>Drone</a>
          <ChevronRight aria-hidden="true" />
          <span>{page.shortTitle}</span>
        </div>

        <aside aria-label="Drone 模块页面">
          {navItems.map((item) => (
            <a
              className={item.slug === slug ? 'active' : ''}
              href={href(`drone/${item.slug}/`)}
              key={item.slug}
              aria-current={item.slug === slug ? 'page' : undefined}
            >
              {item.shortTitle}
            </a>
          ))}
        </aside>

        <article className="article-body">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1><Icon aria-hidden="true" /> {page.title}</h1>
          <p className="lead">{page.description}</p>

          {page.sections.map((section, sectionIndex) => (
            <section key={section.heading}>
              <span className="section-index">0{sectionIndex + 1}</span>
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
              <ul>
                {section.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </section>
          ))}

          {slug === 'tools' && <Tools />}

          <div className="notice">
            <ShieldCheck aria-hidden="true" />
            <span>
              飞行前请核对中国民航 UOM、属地空域要求与最新规定；本站内容仅作学习参考。
              <a href="https://uom.caac.gov.cn/" target="_blank" rel="noreferrer">
                打开 UOM <ExternalLink aria-hidden="true" />
              </a>
            </span>
          </div>

          <a className="next-page" href={href(`drone/${nextPage.slug}/`)}>
            <span>下一条路径</span>
            <b>{nextPage.shortTitle}</b>
            <ArrowRight aria-hidden="true" />
          </a>
          <div className="drone-page-links article-page-links article-page-links--bottom" aria-label="页尾导航">
            <a href={href('drone/')}><ArrowLeft aria-hidden="true" />返回 Drone 总览</a>
            <a href={href()}><House aria-hidden="true" />返回首页</a>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function useDocumentMetadata(slug: string | null, portalRoute: PortalRoute | null) {
  useEffect(() => {
    const page = slug ? dronePages[slug] : null;
    const isDroneIndex = window.location.pathname.startsWith('/drone') && !page;
    const portalMetadata = portalRoute ? {
      account: ['个人工作台 · DroneRF DIY', '学习记录、考试、收藏、订阅与积分账户。'],
      pricing: ['方案与积分 · DroneRF DIY', 'DroneRF DIY 订阅方案与积分包。'],
      ai: ['AI 创作台 · DroneRF DIY', '可审计积分账本支持的 AI 对话与媒体生成。'],
      admin: ['管理后台 · DroneRF DIY', 'DroneRF DIY 服务管理控制面。'],
    }[portalRoute] : null;
    const title = portalMetadata
      ? portalMetadata[0]
      : page
      ? `${page.title} · DroneRF DIY`
      : isDroneIndex
        ? '无人机 DIY 模块 · DroneRF DIY'
        : 'DroneRF DIY · 无人机与无线电实验站';
    const description = portalMetadata
      ? portalMetadata[1]
      : page
      ? page.description
      : isDroneIndex
        ? '无人机安全、FPV 入门、装机、飞控调参、RF 链路、电池与工程工具。'
        : 'DroneRF DIY：无线电、无人机与 DIY 实验学习平台。';

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [portalRoute, slug]);
}

function usePageActivity(resourceId: string | null) {
  const { user, recordActivity, saveProgress } = useAuth();

  useEffect(() => {
    if (!user || !resourceId) return undefined;
    const viewKey = `${user.id}:${resourceId}`;
    if (!recordedPageViews.has(viewKey)) {
      recordedPageViews.add(viewKey);
      void recordActivity({
        resourceType: 'drone_article',
        resourceId,
        kind: 'view',
        positionSeconds: 0,
        totalSeconds: 0,
        countView: true,
      });
    }

    let lastSaved = -1;
    let timer: number | null = null;
    const readProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      return available <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / available));
    };
    const persist = () => {
      timer = null;
      const progress = Math.round(readProgress() * 100) / 100;
      if (progress < 1 && progress - lastSaved < 0.05) return;
      lastSaved = Math.max(lastSaved, progress);
      void saveProgress('drone_article', resourceId, progress);
    };
    const onScroll = () => {
      if (timer !== null) return;
      timer = window.setTimeout(persist, 800);
    };
    const onPageHide = () => {
      if (timer !== null) window.clearTimeout(timer);
      persist();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onPageHide);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onPageHide);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [recordActivity, resourceId, saveProgress, user]);
}

export default function SiteApp() {
  const firstPathPart = window.location.pathname.split('/').filter(Boolean)[0] ?? '';
  const portalRoute = (['account', 'pricing', 'ai', 'admin'] as const).includes(firstPathPart as PortalRoute)
    ? firstPathPart as PortalRoute
    : null;
  const isDrone = window.location.pathname.startsWith('/drone');
  const candidate = isDrone ? window.location.pathname.split('/').filter(Boolean).at(-1) ?? null : null;
  const slug = candidate && dronePages[candidate] ? candidate : null;
  useDocumentMetadata(slug, portalRoute);
  usePageActivity(portalRoute ? null : !isDrone ? 'home' : slug ? `drone:${slug}` : 'drone:index');

  if (portalRoute) return <><Header /><PortalPage route={portalRoute} /><Footer /></>;
  if (!isDrone) return <Home />;
  if (!slug) return <DroneIndex />;
  return <DroneArticle slug={slug} />;
}
