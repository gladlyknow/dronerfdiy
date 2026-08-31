import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Coins,
  CreditCard,
  Database,
  ExternalLink,
  FileText,
  KeyRound,
  LoaderCircle,
  Mail,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WandSparkles,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ApiRequestError } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import './portal.css';

export type PortalRoute = 'account' | 'pricing' | 'ai' | 'admin';

type UnknownRow = Record<string, unknown>;

type CreditsData = {
  balance: number;
  entries: UnknownRow[];
};

type Product = {
  id: string;
  name: string;
  description: string;
  kind: 'free' | 'subscription' | 'credit_pack';
  currency: string;
  amountMinor: number;
  intervalUnit: 'month' | 'year' | null;
  intervalCount: number | null;
  creditAmount: number;
  creditValidDays: number | null;
};

type AiModel = {
  provider: string;
  model: string;
  label: string;
  taskTypes: Array<'chat' | 'image' | 'video' | 'music'>;
};

type AiTask = {
  id: string;
  chatId: string | null;
  provider: string;
  model: string;
  taskType: 'chat' | 'image' | 'video' | 'music';
  status: 'created' | 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  output: unknown;
  error: string | null;
  costCredits: number;
  refunded: boolean;
  createdAt: number;
};

const cn = (...values: Array<string | false | null | undefined>): string => values.filter(Boolean).join(' ');

const errorText = (error: unknown): string => (
  error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : '请求未完成，请稍后重试。'
);

const formatDate = (value: unknown): string => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(number));
};

const formatMoney = (minor: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
};

function PageIntro({ eyebrow, title, text, icon: Icon }: {
  eyebrow: string;
  title: string;
  text: string;
  icon: typeof UserRound;
}) {
  return (
    <section className="portal-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1><Icon aria-hidden="true" />{title}</h1>
        <p>{text}</p>
      </div>
      <div className="portal-intro__signal" aria-hidden="true"><span /><span /><span /></div>
    </section>
  );
}

function SignInRequired({ feature }: { feature: string }) {
  return (
    <section className="portal-empty portal-empty--auth">
      <KeyRound aria-hidden="true" />
      <h2>登录后使用{feature}</h2>
      <p>请使用页面右上角的“登录”入口。游客状态下，Radio 题库和 Drone 内容仍可正常浏览。</p>
    </section>
  );
}

function LoadingPanel({ label = '正在读取数据…' }: { label?: string }) {
  return <div className="portal-loading"><LoaderCircle aria-hidden="true" />{label}</div>;
}

function AccountPage() {
  const { user, apiRequest } = useAuth();
  const [credits, setCredits] = useState<CreditsData>({ balance: 0, entries: [] });
  const [orders, setOrders] = useState<UnknownRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<UnknownRow[]>([]);
  const [progress, setProgress] = useState<UnknownRow[]>([]);
  const [favorites, setFavorites] = useState<UnknownRow[]>([]);
  const [exams, setExams] = useState<UnknownRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    const results = await Promise.allSettled([
      apiRequest<CreditsData>('/api/v1/credits?limit=20'),
      apiRequest<{ orders: UnknownRow[] }>('/api/v1/orders?limit=20'),
      apiRequest<{ subscriptions: UnknownRow[] }>('/api/v1/subscriptions?limit=20'),
      apiRequest<UnknownRow[]>('/api/v1/progress'),
      apiRequest<UnknownRow[]>('/api/v1/favorites'),
      apiRequest<UnknownRow[]>('/api/v1/exams?limit=20'),
    ]);
    if (results[0].status === 'fulfilled') setCredits(results[0].value);
    if (results[1].status === 'fulfilled') setOrders(results[1].value.orders);
    if (results[2].status === 'fulfilled') setSubscriptions(results[2].value.subscriptions);
    if (results[3].status === 'fulfilled') setProgress(results[3].value);
    if (results[4].status === 'fulfilled') setFavorites(results[4].value);
    if (results[5].status === 'fulfilled') setExams(results[5].value);
    if (results.some((result) => result.status === 'rejected')) setMessage('部分云端数据暂未载入，请稍后刷新。');
    setLoading(false);
  }, [apiRequest, user]);

  useEffect(() => { void load(); }, [load]);

  const completedExams = exams.filter((exam) => exam.status === 'completed');
  const averageProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / progress.length * 100)
    : 0;

  const cancelSubscription = async (id: unknown) => {
    if (typeof id !== 'string') return;
    setMessage('正在取消订阅…');
    try {
      await apiRequest(`/api/v1/subscriptions/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      setMessage('订阅已取消。');
      await load();
    } catch (error) {
      setMessage(errorText(error));
    }
  };

  const openBillingPortal = async (id: unknown) => {
    if (typeof id !== 'string') return;
    try {
      const result = await apiRequest<{ url: string | null }>('/api/v1/billing-portal', {
        method: 'POST',
        body: { subscriptionId: id },
      });
      if (result.url) window.location.assign(result.url);
      else setMessage('该支付方式暂不提供外部账单门户，可直接在本页取消订阅。');
    } catch (error) {
      setMessage(errorText(error));
    }
  };

  const billingStatus = new URLSearchParams(window.location.search).get('billing');

  return (
    <>
      <PageIntro eyebrow="ACCOUNT · CLOUD LEARNING" title="个人工作台" icon={UserRound} text="学习记录、考试、收藏、订阅与积分统一保存在你的账户下。" />
      {!user ? <SignInRequired feature="云端工作台" /> : loading ? <LoadingPanel /> : (
        <div className="portal-stack">
          {(billingStatus || message) && (
            <div className={cn('portal-banner', billingStatus === 'paid' && 'success')} role="status">
              {billingStatus === 'paid' ? <CheckCircle2 aria-hidden="true" /> : <Cloud aria-hidden="true" />}
              {message || (billingStatus === 'paid' ? '支付状态已确认，权益正在同步。' : `支付状态：${billingStatus}`)}
            </div>
          )}
          <section className="metric-grid" aria-label="账户概览">
            <article><Coins /><span>可用积分</span><b>{credits.balance}</b><small>AI 与增值工具通用</small></article>
            <article><FileText /><span>云端考试</span><b>{completedExams.length}</b><small>最近保存 {exams.length} 场</small></article>
            <article><Cloud /><span>收藏条目</span><b>{favorites.length}</b><small>题目与知识点合计</small></article>
            <article><Activity /><span>学习进度</span><b>{averageProgress}%</b><small>{progress.length} 个内容节点</small></article>
          </section>

          <section className="portal-panel">
            <div className="panel-heading"><div><p className="eyebrow">LEARNING TRACE</p><h2>最近考试</h2></div><a href="/redio/">继续学习 <ChevronRight /></a></div>
            {exams.length === 0 ? <p className="panel-empty">登录后的模拟考试会显示在这里。</p> : (
              <div className="data-table-wrap"><table className="data-table"><thead><tr><th>级别</th><th>状态</th><th>成绩</th><th>用时</th><th>时间</th></tr></thead><tbody>
                {exams.slice(0, 8).map((exam) => <tr key={String(exam.id)}><td>{String(exam.level ?? '—')} 类</td><td><Status value={exam.status} /></td><td>{exam.score === null || exam.score === undefined ? '—' : `${Math.round(Number(exam.score))}%`}</td><td>{Math.round(Number(exam.elapsed_seconds ?? 0) / 60)} 分钟</td><td>{formatDate(exam.created_at)}</td></tr>)}
              </tbody></table></div>
            )}
          </section>

          <section className="portal-panel">
            <div className="panel-heading"><div><p className="eyebrow">BILLING</p><h2>订阅与订单</h2></div><a href="/pricing/">查看方案 <ChevronRight /></a></div>
            {subscriptions.map((subscription) => (
              <div className="subscription-row" key={String(subscription.id)}>
                <div><CreditCard /><span><b>{String(subscription.product_id ?? '会员订阅')}</b><small>{String(subscription.provider)} · <Status value={subscription.status} /></small></span></div>
                <div className="row-actions"><button type="button" onClick={() => void openBillingPortal(subscription.id)}>账单门户</button><button className="danger" type="button" onClick={() => void cancelSubscription(subscription.id)}>取消订阅</button></div>
              </div>
            ))}
            {orders.length === 0 ? <p className="panel-empty">暂无订单。</p> : (
              <div className="data-table-wrap"><table className="data-table"><thead><tr><th>订单</th><th>商品</th><th>金额</th><th>状态</th><th>时间</th></tr></thead><tbody>
                {orders.slice(0, 10).map((order) => <tr key={String(order.id)}><td>{String(order.orderNo ?? '—')}</td><td>{String(order.productId ?? '—')}</td><td>{formatMoney(Number(order.amountMinor ?? 0), String(order.currency ?? 'USD'))}</td><td><Status value={order.status} /></td><td>{formatDate(order.createdAt)}</td></tr>)}
              </tbody></table></div>
            )}
          </section>

          <section className="portal-panel">
            <div className="panel-heading"><div><p className="eyebrow">CREDIT LEDGER</p><h2>积分明细</h2></div><button className="icon-button" type="button" onClick={() => void load()} aria-label="刷新"><RefreshCw /></button></div>
            {credits.entries.length === 0 ? <p className="panel-empty">暂无积分记录。</p> : <div className="ledger-list">{credits.entries.map((entry) => (
              <div key={String(entry.operation_id)}><span className={Number(entry.amount) >= 0 ? 'positive' : 'negative'}>{Number(entry.amount) > 0 ? '+' : ''}{String(entry.amount)}</span><b>{String(entry.source_type ?? 'system')}</b><small>{formatDate(entry.created_at)} · 余额 {String(entry.balance_after)}</small></div>
            ))}</div>}
          </section>
        </div>
      )}
    </>
  );
}

function Status({ value }: { value: unknown }) {
  const text = String(value ?? 'unknown');
  const good = ['paid', 'active', 'completed', 'sent', 'synced', 'trialing'].includes(text.toLowerCase());
  const bad = ['failed', 'refunded', 'canceled', 'cancelled', 'expired'].includes(text.toLowerCase());
  return <span className={cn('status-chip', good && 'good', bad && 'bad')}>{text}</span>;
}

function PricingPage() {
  const { user, apiRequest } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/api/v1/products')
      .then((result) => setProducts(result.products))
      .catch((error) => setMessage(errorText(error)))
      .finally(() => setLoading(false));
  }, [apiRequest]);

  const checkout = async (product: Product) => {
    if (!user) {
      setMessage('请先使用右上角入口登录，再选择方案。');
      return;
    }
    setBusyId(product.id);
    setMessage('');
    try {
      const result = await apiRequest<{ checkoutUrl: string | null }>('/api/v1/checkout', {
        method: 'POST',
        body: { productId: product.id, requestId: `checkout:${crypto.randomUUID()}` },
      });
      if (!result.checkoutUrl) throw new Error('支付链接暂不可用。');
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(errorText(error));
      setBusyId('');
    }
  };

  return (
    <>
      <PageIntro eyebrow="PLANS · CREDITS" title="方案与积分" icon={CircleDollarSign} text="基础学习保持开放；订阅和积分用于持续服务、云端能力与 AI 工具。" />
      {message && <div className="portal-banner" role="status"><CircleDollarSign />{message}</div>}
      {loading ? <LoadingPanel /> : products.length === 0 ? (
        <section className="portal-empty"><PackageCheck /><h2>方案正在配置</h2><p>管理员尚未启用任何付费方案，现有 Radio 与 Drone 内容不受影响。</p></section>
      ) : (
        <section className="pricing-grid">
          {products.map((product) => (
            <article className={cn(product.kind === 'subscription' && 'featured')} key={product.id}>
              <span className="plan-kind">{product.kind === 'subscription' ? 'MEMBERSHIP' : product.kind === 'credit_pack' ? 'CREDIT PACK' : 'FREE'}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <strong>{formatMoney(product.amountMinor, product.currency)}<small>{product.intervalUnit ? ` / ${product.intervalCount ?? 1} ${product.intervalUnit === 'month' ? '月' : '年'}` : ''}</small></strong>
              <ul>
                <li><CheckCircle2 />云端账户与学习同步</li>
                {product.creditAmount > 0 && <li><CheckCircle2 />包含 {product.creditAmount} 积分</li>}
                <li><CheckCircle2 />服务端订单与支付记录</li>
              </ul>
              <button type="button" disabled={busyId === product.id || product.kind === 'free'} onClick={() => void checkout(product)}>
                {busyId === product.id ? '正在创建安全结账…' : product.kind === 'free' ? '当前开放内容' : '选择此方案'}
              </button>
            </article>
          ))}
        </section>
      )}
      <section className="trust-strip"><ShieldCheck /><div><b>支付信息不经过本站页面保存</b><p>订单金额和商品权益由服务端确认；支付结果必须通过支付商签名回调复核。</p></div></section>
    </>
  );
}

const findUrls = (value: unknown, found = new Set<string>(), depth = 0): string[] => {
  if (depth > 7 || found.size >= 20) return [...found];
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.protocol === 'http:') found.add(url.toString());
    } catch { /* Not a URL. */ }
  } else if (Array.isArray(value)) {
    value.slice(0, 50).forEach((item) => findUrls(item, found, depth + 1));
  } else if (typeof value === 'object' && value !== null) {
    Object.values(value).slice(0, 100).forEach((item) => findUrls(item, found, depth + 1));
  }
  return [...found];
};

function AiPage() {
  const { user, apiRequest } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [models, setModels] = useState<AiModel[]>([]);
  const [taskType, setTaskType] = useState<'chat' | 'image' | 'video' | 'music'>('chat');
  const [modelKey, setModelKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [task, setTask] = useState<AiTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiRequest<{ enabled: boolean; models: AiModel[] }>('/api/v1/ai/models')
      .then((data) => { setEnabled(data.enabled); setModels(data.models); })
      .catch((reason) => setError(errorText(reason)));
  }, [apiRequest, user]);

  const availableModels = useMemo(() => models.filter((model) => model.taskTypes.includes(taskType)), [models, taskType]);
  const selected = availableModels.find((model) => `${model.provider}:${model.model}` === modelKey) ?? availableModels[0];

  useEffect(() => {
    if (selected && !availableModels.some((model) => `${model.provider}:${model.model}` === modelKey)) {
      setModelKey(`${selected.provider}:${selected.model}`);
    }
  }, [availableModels, modelKey, selected]);

  useEffect(() => {
    if (!task || !['queued', 'running'].includes(task.status)) return undefined;
    const timer = window.setInterval(() => {
      void apiRequest<AiTask>(`/api/v1/ai/tasks/${encodeURIComponent(task.id)}?refresh=1`)
        .then(setTask)
        .catch(() => undefined);
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [apiRequest, task]);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !prompt.trim()) return;
    setBusy(true);
    setError('');
    try {
      if (taskType === 'chat') {
        let activeChatId = chatId;
        if (!activeChatId) {
          const chat = await apiRequest<{ id: string }>('/api/v1/ai/chats', {
            method: 'POST',
            body: { provider: selected.provider, model: selected.model, title: prompt.trim().slice(0, 40) },
          });
          activeChatId = chat.id;
          setChatId(chat.id);
        }
        const text = prompt.trim();
        setMessages((current) => [...current, { role: 'user', text }]);
        setPrompt('');
        const result = await apiRequest<AiTask>(`/api/v1/ai/chats/${encodeURIComponent(activeChatId)}/messages`, {
          method: 'POST',
          body: { requestId: `chat:${crypto.randomUUID()}`, content: text },
        });
        const output = typeof result.output === 'object' && result.output !== null
          ? result.output as { text?: unknown }
          : {};
        if (typeof output.text === 'string') {
          const reply = output.text;
          setMessages((current) => [...current, { role: 'assistant', text: reply }]);
        }
        setTask(result);
      } else {
        const result = await apiRequest<AiTask>('/api/v1/ai/tasks', {
          method: 'POST',
          body: {
            requestId: `media:${crypto.randomUUID()}`,
            provider: selected.provider,
            model: selected.model,
            taskType,
            prompt: prompt.trim(),
            options: {},
          },
        });
        setTask(result);
      }
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };

  const mediaUrls = task ? findUrls(task.output) : [];

  return (
    <>
      <PageIntro eyebrow="AI STUDIO · CREDIT SAFE" title="AI 创作台" icon={Bot} text="对话与图像、视频、音乐任务共用一套可审计积分账本；失败任务自动退回积分。" />
      {!user ? <SignInRequired feature="AI 创作台" /> : !enabled || models.length === 0 ? (
        <section className="portal-empty"><WandSparkles /><h2>AI 服务尚未启用</h2><p>管理员需要先配置服务商密钥、允许模型和积分价格。学习功能不受影响。</p></section>
      ) : (
        <section className="ai-studio">
          <aside>
            <p className="eyebrow">MODE</p>
            {(['chat', 'image', 'video', 'music'] as const).map((type) => (
              <button className={taskType === type ? 'active' : ''} key={type} type="button" onClick={() => { setTaskType(type); setTask(null); setError(''); }}>
                {type === 'chat' ? <MessageSquareText /> : <Sparkles />}
                {({ chat: '工程对话', image: '图像生成', video: '视频生成', music: '音乐生成' } as const)[type]}
              </button>
            ))}
          </aside>
          <div className="ai-workbench">
            <div className="ai-toolbar">
              <label>模型<select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>{availableModels.map((model) => <option key={`${model.provider}:${model.model}`} value={`${model.provider}:${model.model}`}>{model.label} · {model.provider}</option>)}</select></label>
              {task && <span><Status value={task.status} /> {task.costCredits} 积分{task.refunded ? ' · 已退回' : ''}</span>}
            </div>
            {taskType === 'chat' && <div className="chat-log" aria-live="polite">{messages.length === 0 ? <div className="chat-placeholder"><Bot /><b>从一个具体问题开始</b><span>例如：如何检查 5.8 GHz 图传链路中的天线极化问题？</span></div> : messages.map((message, index) => <article className={message.role} key={`${message.role}-${index}`}><b>{message.role === 'user' ? '你' : 'DroneRF AI'}</b><p>{message.text}</p></article>)}</div>}
            {taskType !== 'chat' && <div className="media-result">{!task ? <div className="chat-placeholder"><Sparkles /><b>描述要生成的内容</b><span>任务由第三方模型处理，结果链接会显示在这里。</span></div> : mediaUrls.length === 0 ? <LoadingPanel label={task.status === 'failed' ? task.error || '任务失败' : '生成任务处理中…'} /> : <div className="media-links">{mediaUrls.map((url) => taskType === 'image' ? <a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} alt="AI 生成结果" /><span>打开原图 <ExternalLink /></span></a> : <a href={url} target="_blank" rel="noreferrer" key={url}>打开生成结果 <ExternalLink /></a>)}</div>}</div>}
            <form className="ai-composer" onSubmit={(event) => void run(event)}>
              <textarea value={prompt} maxLength={12_000} onChange={(event) => setPrompt(event.target.value)} placeholder={taskType === 'chat' ? '输入问题，尽量包含设备、频段、现象和限制条件…' : '描述主题、构图、风格、画面细节和输出用途…'} />
              <button type="submit" disabled={busy || !selected || !prompt.trim()}>{busy ? <LoaderCircle /> : <Send />} {busy ? '正在提交…' : '开始生成'}</button>
            </form>
            {error && <p className="portal-error" role="alert"><XCircle />{error}</p>}
          </div>
        </section>
      )}
    </>
  );
}

type AdminTab = 'overview' | 'users' | 'products' | 'settings' | 'logs';

const defaultProductForm = {
  id: '', name: '', description: '', kind: 'credit_pack', status: 'inactive', currency: 'USD',
  amountMinor: '0', intervalUnit: '', intervalCount: '1', creditAmount: '0', creditValidDays: '',
  providerProductIds: '{}',
};

function AdminPage() {
  const { user, apiRequest } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [dashboard, setDashboard] = useState<UnknownRow>({});
  const [users, setUsers] = useState<UnknownRow[]>([]);
  const [products, setProducts] = useState<UnknownRow[]>([]);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [secrets, setSecrets] = useState<Record<string, { configured: boolean; source: string }>>({});
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<UnknownRow[]>([]);
  const [logType, setLogType] = useState('orders');
  const [search, setSearch] = useState('');
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [selectedUser, setSelectedUser] = useState<UnknownRow | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('人工核对调整');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest<UnknownRow>('/api/v1/admin/dashboard');
      setDashboard(data);
      setAuthorized(true);
    } catch (error) {
      setAuthorized(false);
      setMessage(errorText(error));
    }
  }, [apiRequest, user]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    if (!authorized) return;
    if (tab === 'users') void apiRequest<{ users: UnknownRow[] }>(`/api/v1/admin/users?limit=50&search=${encodeURIComponent(search)}`).then((data) => setUsers(data.users)).catch((error) => setMessage(errorText(error)));
    if (tab === 'products') void apiRequest<{ products: UnknownRow[] }>('/api/v1/admin/products?limit=100').then((data) => setProducts(data.products)).catch((error) => setMessage(errorText(error)));
    if (tab === 'settings') void Promise.all([
      apiRequest<{ values: Record<string, string> }>('/api/v1/admin/config'),
      apiRequest<{ states: Record<string, { configured: boolean; source: string }> }>('/api/v1/admin/secrets'),
    ]).then(([config, secret]) => { setConfigs(config.values); setSecrets(secret.states); }).catch((error) => setMessage(errorText(error)));
    if (tab === 'logs') void apiRequest<{ entries: UnknownRow[] }>(`/api/v1/admin/${logType}?limit=50`).then((data) => setLogs(data.entries)).catch((error) => setMessage(errorText(error)));
  }, [apiRequest, authorized, logType, search, tab]);

  const saveRoles = async (target: UnknownRow, role: string) => {
    setBusy(true); setMessage('');
    try {
      const roles = role === 'super_admin' ? ['user', 'super_admin'] : role === 'admin' ? ['user', 'admin'] : ['user'];
      await apiRequest(`/api/v1/admin/users/${encodeURIComponent(String(target.id))}/roles`, { method: 'PUT', body: { roles } });
      setUsers((current) => current.map((row) => row.id === target.id ? { ...row, roles } : row));
      setMessage('角色已更新。');
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  };

  const adjustCredits = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    setBusy(true); setMessage('');
    try {
      await apiRequest(`/api/v1/admin/credits/${encodeURIComponent(String(selectedUser.id))}`, {
        method: 'POST',
        body: { amount: Number(creditAmount), reason: creditReason, requestId: `adjust:${crypto.randomUUID()}` },
      });
      setMessage('积分调整已写入账本。'); setCreditAmount('');
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  };

  const editProduct = (product: UnknownRow) => setProductForm({
    id: String(product.id ?? ''),
    name: String(product.name ?? ''),
    description: String(product.description ?? ''),
    kind: String(product.kind ?? 'credit_pack'),
    status: String(product.status ?? 'inactive'),
    currency: String(product.currency ?? 'USD'),
    amountMinor: String(product.amount_minor ?? 0),
    intervalUnit: String(product.interval_unit ?? ''),
    intervalCount: String(product.interval_count ?? 1),
    creditAmount: String(product.credit_amount ?? 0),
    creditValidDays: String(product.credit_valid_days ?? ''),
    providerProductIds: String(product.provider_product_ids_json ?? '{}'),
  });

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const providerProductIds: unknown = JSON.parse(productForm.providerProductIds || '{}');
      const body = {
        ...(productForm.id ? { id: productForm.id } : {}),
        name: productForm.name,
        description: productForm.description,
        kind: productForm.kind,
        status: productForm.status,
        currency: productForm.currency,
        amountMinor: Number(productForm.amountMinor),
        intervalUnit: productForm.kind === 'subscription' ? productForm.intervalUnit : null,
        intervalCount: productForm.kind === 'subscription' ? Number(productForm.intervalCount) : null,
        creditAmount: Number(productForm.creditAmount),
        creditValidDays: productForm.creditValidDays ? Number(productForm.creditValidDays) : null,
        providerProductIds,
        metadata: {},
      };
      await apiRequest(productForm.id ? `/api/v1/admin/products/${encodeURIComponent(productForm.id)}` : '/api/v1/admin/products', { method: productForm.id ? 'PUT' : 'POST', body });
      setMessage('商品已保存。'); setProductForm(defaultProductForm);
      const data = await apiRequest<{ products: UnknownRow[] }>('/api/v1/admin/products?limit=100'); setProducts(data.products);
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  };

  const saveConfigs = async () => {
    setBusy(true); setMessage('');
    try {
      await apiRequest('/api/v1/admin/config', { method: 'PUT', body: { values: configs } });
      setMessage('运行配置已保存。');
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  };

  const saveSecret = async (name: string, remove = false) => {
    setBusy(true); setMessage('');
    try {
      await apiRequest(`/api/v1/admin/secrets/${encodeURIComponent(name)}`, remove ? { method: 'DELETE' } : { method: 'PUT', body: { value: secretValues[name] } });
      const data = await apiRequest<{ states: Record<string, { configured: boolean; source: string }> }>('/api/v1/admin/secrets');
      setSecrets(data.states); setSecretValues((current) => ({ ...current, [name]: '' })); setMessage(remove ? '数据库密钥已清除。' : '密钥已加密保存。');
    } catch (error) { setMessage(errorText(error)); } finally { setBusy(false); }
  };

  if (!user) return <><PageIntro eyebrow="ADMIN · CONTROL PLANE" title="管理后台" icon={ShieldCheck} text="用户、商品、服务商和运行记录的统一控制面。" /><SignInRequired feature="管理后台" /></>;
  if (authorized === null) return <><PageIntro eyebrow="ADMIN · CONTROL PLANE" title="管理后台" icon={ShieldCheck} text="正在验证管理员权限。" /><LoadingPanel /></>;
  if (!authorized) return <><PageIntro eyebrow="ADMIN · CONTROL PLANE" title="管理后台" icon={ShieldCheck} text="此区域仅对获得授权的管理员开放。" /><section className="portal-empty"><ShieldCheck /><h2>没有后台权限</h2><p>{message || '当前账户不是管理员。'}</p></section></>;

  const configField = (key: string, label: string, type: 'text' | 'number' | 'textarea' | 'boolean' = 'text') => (
    <label key={key}>{label}{type === 'textarea' ? <textarea value={configs[key] ?? ''} onChange={(event) => setConfigs((current) => ({ ...current, [key]: event.target.value }))} /> : type === 'boolean' ? <select value={configs[key] ?? 'false'} onChange={(event) => setConfigs((current) => ({ ...current, [key]: event.target.value }))}><option value="false">关闭</option><option value="true">启用</option></select> : <input type={type} value={configs[key] ?? ''} onChange={(event) => setConfigs((current) => ({ ...current, [key]: event.target.value }))} />}</label>
  );

  return (
    <>
      <PageIntro eyebrow="ADMIN · CONTROL PLANE" title="管理后台" icon={ShieldCheck} text="关键操作全部经过服务端权限判断并记录审计日志。" />
      {message && <div className="portal-banner" role="status"><Database />{message}</div>}
      <div className="admin-shell">
        <nav aria-label="后台栏目">{([
          ['overview', '总览', Activity], ['users', '用户与积分', Users], ['products', '商品', PackageCheck], ['settings', '服务配置', Settings2], ['logs', '运行记录', FileText],
        ] as const).map(([value, label, Icon]) => <button className={tab === value ? 'active' : ''} type="button" key={value} onClick={() => setTab(value)}><Icon />{label}</button>)}</nav>
        <div className="admin-content">
          {tab === 'overview' && <section className="metric-grid admin-metrics">{([
            ['users', '用户', Users], ['paidOrders', '已支付订单', CreditCard], ['activeSubscriptions', '有效订阅', PackageCheck], ['runningAiTasks', 'AI 进行中', Bot], ['failedEmails', '失败邮件', Mail],
          ] as Array<[string, string, LucideIcon]>).map(([key, label, Icon]) => <article key={key}><Icon /><span>{label}</span><b>{String(dashboard[key] ?? 0)}</b></article>)}</section>}

          {tab === 'users' && <div className="admin-two-column"><section className="portal-panel"><div className="panel-heading"><h2>用户</h2><input className="compact-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索名称或邮箱" /></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>用户</th><th>角色</th><th>操作</th></tr></thead><tbody>{users.map((row) => { const roles = Array.isArray(row.roles) ? row.roles as string[] : []; const role = roles.includes('super_admin') ? 'super_admin' : roles.includes('admin') ? 'admin' : 'user'; return <tr key={String(row.id)}><td><b>{String(row.name)}</b><small>{String(row.email)}</small></td><td><select disabled={busy} value={role} onChange={(event) => void saveRoles(row, event.target.value)}><option value="user">用户</option><option value="admin">管理员</option><option value="super_admin">超级管理员</option></select></td><td><button type="button" onClick={() => setSelectedUser(row)}>调整积分</button></td></tr>; })}</tbody></table></div></section>{selectedUser && <form className="portal-panel admin-form" onSubmit={(event) => void adjustCredits(event)}><h2>调整积分</h2><p>{String(selectedUser.name)} · {String(selectedUser.email)}</p><label>增减数量<input type="number" required value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} placeholder="正数增加，负数扣除" /></label><label>原因<textarea required value={creditReason} maxLength={500} onChange={(event) => setCreditReason(event.target.value)} /></label><button disabled={busy} type="submit"><Coins />写入积分账本</button></form>}</div>}

          {tab === 'products' && <div className="admin-two-column"><section className="portal-panel"><div className="panel-heading"><h2>商品目录</h2><button type="button" onClick={() => setProductForm(defaultProductForm)}>新建</button></div>{products.map((product) => <button className="product-admin-row" type="button" key={String(product.id)} onClick={() => editProduct(product)}><span><b>{String(product.name)}</b><small>{String(product.id)} · {String(product.kind)}</small></span><Status value={product.status} /></button>)}</section><form className="portal-panel admin-form" onSubmit={(event) => void saveProduct(event)}><h2>{productForm.id ? '编辑商品' : '新建商品'}</h2><label>商品 ID<input value={productForm.id} disabled={Boolean(productForm.id)} onChange={(event) => setProductForm((current) => ({ ...current, id: event.target.value }))} placeholder="留空自动生成" /></label><label>名称<input required value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} /></label><label>说明<textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="form-pair"><label>类型<select value={productForm.kind} onChange={(event) => setProductForm((current) => ({ ...current, kind: event.target.value }))}><option value="credit_pack">积分包</option><option value="subscription">订阅</option><option value="free">免费</option></select></label><label>状态<select value={productForm.status} onChange={(event) => setProductForm((current) => ({ ...current, status: event.target.value }))}><option value="inactive">未启用</option><option value="active">启用</option><option value="archived">归档</option></select></label></div><div className="form-pair"><label>货币<input value={productForm.currency} onChange={(event) => setProductForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} /></label><label>金额（分）<input type="number" value={productForm.amountMinor} onChange={(event) => setProductForm((current) => ({ ...current, amountMinor: event.target.value }))} /></label></div><div className="form-pair"><label>积分<input type="number" value={productForm.creditAmount} onChange={(event) => setProductForm((current) => ({ ...current, creditAmount: event.target.value }))} /></label><label>有效天数<input type="number" value={productForm.creditValidDays} onChange={(event) => setProductForm((current) => ({ ...current, creditValidDays: event.target.value }))} /></label></div>{productForm.kind === 'subscription' && <div className="form-pair"><label>周期<select value={productForm.intervalUnit} onChange={(event) => setProductForm((current) => ({ ...current, intervalUnit: event.target.value }))}><option value="">请选择</option><option value="month">月</option><option value="year">年</option></select></label><label>周期数<input type="number" min="1" value={productForm.intervalCount} onChange={(event) => setProductForm((current) => ({ ...current, intervalCount: event.target.value }))} /></label></div>}<label>支付商商品 ID（JSON）<textarea value={productForm.providerProductIds} onChange={(event) => setProductForm((current) => ({ ...current, providerProductIds: event.target.value }))} placeholder={'{"stripe":"price_..."}'} /></label><button disabled={busy} type="submit"><Save />保存商品</button></form></div>}

          {tab === 'settings' && <div className="admin-two-column admin-settings"><section className="portal-panel admin-form"><h2>运行开关与价格</h2><div className="form-pair">{configField('payment_enabled', '支付', 'boolean')}{configField('default_payment_provider', '默认支付商')}</div><div className="form-pair">{configField('creem_environment', 'Creem 环境')}{configField('paypal_environment', 'PayPal 环境')}</div><div className="form-pair">{configField('ai_enabled', 'AI 服务', 'boolean')}{configField('initial_credits_enabled', '注册赠送', 'boolean')}</div><div className="form-pair">{configField('initial_credits_amount', '注册积分', 'number')}{configField('initial_credits_valid_days', '注册积分有效天数', 'number')}</div><div className="form-pair">{configField('ai_chat_credits', '对话积分', 'number')}{configField('ai_image_credits', '图像积分', 'number')}</div><div className="form-pair">{configField('ai_video_credits', '视频积分', 'number')}{configField('ai_music_credits', '音乐积分', 'number')}</div>{configField('mail_from', '发件人')}{configField('openrouter_base_url', 'OpenRouter API 地址')}{configField('ai_models_json', '允许模型 JSON', 'textarea')}<button disabled={busy} type="button" onClick={() => void saveConfigs()}><Save />保存运行配置</button></section><section className="portal-panel"><h2>服务密钥</h2><p className="settings-note">已保存的值不会回显。环境变量优先于数据库密钥。</p><div className="secret-list">{Object.entries(secrets).map(([name, state]) => <div key={name}><span><b>{name}</b><small>{state.configured ? `已配置 · ${state.source}` : '未配置'}</small></span><input type="password" value={secretValues[name] ?? ''} onChange={(event) => setSecretValues((current) => ({ ...current, [name]: event.target.value }))} placeholder="输入新值" /><button type="button" disabled={!secretValues[name] || busy} onClick={() => void saveSecret(name)}>保存</button><button className="danger" type="button" disabled={busy || state.source === 'environment'} onClick={() => void saveSecret(name, true)}>清除</button></div>)}</div></section></div>}

          {tab === 'logs' && <section className="portal-panel"><div className="panel-heading"><h2>运行记录</h2><select value={logType} onChange={(event) => setLogType(event.target.value)}><option value="orders">订单</option><option value="subscriptions">订阅</option><option value="ai-tasks">AI 任务</option><option value="emails">邮件</option><option value="audit">审计</option></select></div><div className="log-list">{logs.map((row, index) => <article key={String(row.id ?? index)}><div><Status value={row.status ?? row.action ?? logType} /><time>{formatDate(row.created_at)}</time></div><pre>{JSON.stringify(row, null, 2)}</pre></article>)}</div></section>}
        </div>
      </div>
    </>
  );
}

export function PortalPage({ route }: { route: PortalRoute }) {
  return (
    <main className="portal-main">
      {route === 'account' && <AccountPage />}
      {route === 'pricing' && <PricingPage />}
      {route === 'ai' && <AiPage />}
      {route === 'admin' && <AdminPage />}
    </main>
  );
}
