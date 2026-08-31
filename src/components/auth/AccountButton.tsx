import { useEffect, useState, type FormEvent } from 'react';
import {
  ChevronDown,
  KeyRound,
  LogIn,
  LogOut,
  MailCheck,
  Sparkles,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { authClient } from '../../auth/client';
import { useAuth } from '../../auth/AuthProvider';
import './auth.css';

type AccountButtonProps = {
  variant: 'radio' | 'site';
};

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

const errorMessage = (message: string | undefined): string => (
  message || '请求未完成，请稍后再试。'
);

const resetTarget = (): { token: string; active: boolean } => {
  const parameters = new URLSearchParams(window.location.search);
  return {
    token: parameters.get('token') ?? '',
    active: parameters.get('reset') === '1' && Boolean(parameters.get('token')),
  };
};

export function AccountButton({ variant }: AccountButtonProps) {
  const { user, isPending, refetch, signOut, syncMessage, syncState } = useAuth();
  const initialReset = resetTarget();
  const [isOpen, setIsOpen] = useState(initialReset.active);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(initialReset.active ? 'reset-password' : 'sign-in');
  const [resetToken, setResetToken] = useState(initialReset.token);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    const target = resetTarget();
    if (!target.active) return;
    setResetToken(target.token);
    setMode('reset-password');
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const setAuthMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
    setPasswordAgain('');
  };

  const closeDialog = () => {
    if (submitting) return;
    setIsOpen(false);
    setError('');
    setNotice('');
  };

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'reset-password' && password !== passwordAgain) {
      setError('两次输入的新密码不一致。');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'forgot-password') {
        await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/account/?reset=1`,
        });
        setNotice('如该邮箱已注册，重置链接已发送。请检查收件箱及垃圾邮件箱。');
        return;
      }
      if (mode === 'reset-password') {
        const result = await authClient.resetPassword({ newPassword: password, token: resetToken });
        if (result.error) {
          setError(errorMessage(result.error.message));
          return;
        }
        setNotice('密码已重置，请使用新密码登录。');
        setResetToken('');
        window.history.replaceState({}, '', `${window.location.pathname}?reset=1`);
        setMode('sign-in');
        return;
      }
      const result = mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(errorMessage(result.error.message));
        return;
      }
      await refetch();
      setPassword('');
      if (mode === 'sign-up') {
        setNotice('账户已创建。若需要验证邮箱，请检查收件箱。');
      } else {
        setIsOpen(false);
      }
    } catch {
      if (mode === 'forgot-password') {
        setNotice('如该邮箱已注册，重置链接已发送。请检查收件箱及垃圾邮件箱。');
      } else {
        setError('网络连接失败，请稍后重试。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const resendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: window.location.href,
      });
      if (result.error) {
        setNotice('验证邮件暂时无法发送，请稍后重试。');
      } else {
        setNotice('验证邮件已发送，请检查收件箱。');
      }
    } catch {
      setNotice('验证邮件暂时无法发送，请稍后重试。');
    } finally {
      setSendingVerification(false);
    }
  };

  const dialogTitle = mode === 'sign-in'
    ? '登录账户'
    : mode === 'sign-up'
      ? '创建账户'
      : mode === 'forgot-password'
        ? '找回密码'
        : '设置新密码';

  const dialog = isOpen && (
    <div className="auth-backdrop" role="presentation" onMouseDown={closeDialog}>
      <section
        className={`auth-dialog auth-dialog--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-close" type="button" onClick={closeDialog} aria-label="关闭账户窗口">
          <X size={18} aria-hidden="true" />
        </button>
        <div className="auth-dialog__heading">
          <UserRound size={20} aria-hidden="true" />
          <div>
            <p>DRONERF DIY</p>
            <h2 id="auth-dialog-title">{dialogTitle}</h2>
          </div>
        </div>
        {(mode === 'sign-in' || mode === 'sign-up') && (
          <div className="auth-tabs" role="tablist" aria-label="账户操作">
            <button type="button" role="tab" aria-selected={mode === 'sign-in'} onClick={() => setAuthMode('sign-in')}>登录</button>
            <button type="button" role="tab" aria-selected={mode === 'sign-up'} onClick={() => setAuthMode('sign-up')}>注册</button>
          </div>
        )}
        <form onSubmit={(event) => void handleAccountSubmit(event)}>
          {mode === 'sign-up' && (
            <label>
              显示名称
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoComplete="name" />
            </label>
          )}
          {mode !== 'reset-password' && (
            <label>
              邮箱
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
          )}
          {mode !== 'forgot-password' && (
            <label>
              {mode === 'reset-password' ? '新密码' : '密码'}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              />
              {mode !== 'sign-in' && <small>至少 8 位字符</small>}
            </label>
          )}
          {mode === 'reset-password' && (
            <label>
              再次输入新密码
              <input type="password" value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
            </label>
          )}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? '正在处理…' : mode === 'sign-in' ? '登录' : mode === 'sign-up' ? '创建账户' : mode === 'forgot-password' ? '发送重置链接' : '重置密码'}
          </button>
          {mode === 'sign-in' && (
            <button className="auth-text-action" type="button" onClick={() => setAuthMode('forgot-password')}>
              忘记密码？
            </button>
          )}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <button className="auth-text-action" type="button" onClick={() => setAuthMode('sign-in')}>
              返回登录
            </button>
          )}
        </form>
      </section>
    </div>
  );

  if (isPending) {
    return <span className={`account-button account-button--${variant} account-button--pending`} aria-label="正在读取登录状态" />;
  }

  if (user) {
    const displayName = user.name || user.email;
    const initial = displayName.slice(0, 1).toUpperCase();
    return (
      <>
        <div className={`account account--${variant}`}>
          <button
            className="account-button account-button--user"
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="account-avatar" aria-hidden="true">{initial}</span>
            <span className="account-name">{displayName}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="account-menu" role="menu">
              <p>{user.email}</p>
              <span className={`account-sync account-sync--${syncState}`}>{syncMessage || '等待同步'}</span>
              {!user.emailVerified && (
                <button type="button" role="menuitem" onClick={() => void resendVerification()} disabled={sendingVerification}>
                  <MailCheck size={15} aria-hidden="true" />
                  {sendingVerification ? '正在发送…' : '重新发送验证邮件'}
                </button>
              )}
              <a href="/account/" role="menuitem"><UserRound size={15} aria-hidden="true" />账户中心</a>
              <a href="/pricing/" role="menuitem"><KeyRound size={15} aria-hidden="true" />订阅与积分</a>
              <a href="/ai/" role="menuitem"><Sparkles size={15} aria-hidden="true" />AI 工作台</a>
              <a href="/admin/" role="menuitem"><ShieldCheck size={15} aria-hidden="true" />管理后台</a>
              {notice && <span className="account-menu__notice" role="status">{notice}</span>}
              <button type="button" role="menuitem" onClick={() => void handleSignOut()}>
                <LogOut size={15} aria-hidden="true" />
                退出登录
              </button>
            </div>
          )}
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <button
        className={`account-button account-button--${variant}`}
        type="button"
        onClick={() => { setAuthMode('sign-in'); setIsOpen(true); }}
      >
        <LogIn size={15} aria-hidden="true" />
        登录
      </button>
      {dialog}
    </>
  );
}
