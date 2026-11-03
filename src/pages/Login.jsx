/**
 * pages/Login.jsx — Admin Portal
 *
 * Rendered as a modal overlay when onClose prop is provided.
 * Without onClose it renders full-page (e.g. for session-expired with no close option).
 *
 * Props:
 *   onClose   () => void | null/undefined — enables modal mode with backdrop + X button
 *   message   string | null               — shown at top of sign-in form (session-expired notice)
 */

import { useState, useRef } from 'react';
import { Icons, useDialog } from '../ui';
import { useApp }       from '../context/AppContext';
import { useToast }     from '../context/ToastContext';
import { registerUser } from '../api/services/auth';
import { ROLE_META }    from '../lib/permissions';

const ADMIN_ROLES = ['Admin', 'Reviewer'];


function IconEye({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordField({ id, value, onChange, placeholder, autoComplete, disabled, invalid, describedBy }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
      >
        <IconEye open={show} />
      </button>
    </div>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return <div className="field-error" id={id} role="alert"><Icons.Alert size={13} />{children}</div>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Sign-in form ─────────────────────────────────────── */
function SignInForm({ message }) {
  const { login, authLoading } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = !email.trim() ? 'Enter your email address.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address, like name@company.com.' : '';
  const pwError = !pw ? 'Enter your password.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (emailError || pwError) return;
    const result = await login(email.trim(), pw);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
    } else {
      setError(result.error || 'We couldn’t sign you in. Check your email and password and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {message && <div className="auth-notice" role="status"><Icons.Clock size={15} />{message}</div>}
      {error && <div className="auth-error" role="alert"><Icons.Alert size={15} />{error}</div>}

      <div className="auth-field">
        <label className="auth-field-label" htmlFor="signin-email">Email address</label>
        <input
          id="signin-email"
          type="email" className="input" data-autofocus
          value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email" placeholder="you@company.com"
          disabled={authLoading}
          aria-invalid={(touched && !!emailError) || undefined}
          aria-describedby={touched && emailError ? 'signin-email-error' : undefined}
        />
        <FieldError id="signin-email-error">{touched && emailError}</FieldError>
      </div>
      <div className="auth-field" style={{ marginBottom: 22 }}>
        <label className="auth-field-label" htmlFor="signin-password">Password</label>
        <PasswordField
          id="signin-password"
          value={pw} onChange={e => setPw(e.target.value)}
          autoComplete="current-password" placeholder="Enter your password"
          disabled={authLoading}
          invalid={touched && !!pwError}
          describedBy={touched && pwError ? 'signin-password-error' : undefined}
        />
        <FieldError id="signin-password-error">{touched && pwError}</FieldError>
      </div>

      <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={authLoading} aria-busy={authLoading || undefined}>
        {authLoading
          ? <><span className="btn-spinner-inline" aria-hidden="true" /> Signing in…</>
          : <>Sign in <Icons.ChevronRight size={16} /></>}
      </button>
    </form>
  );
}

/* ── Register form ────────────────────────────────────── */
function RegisterForm({ onDone }) {
  const toast = useToast();
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [role,     setRole]     = useState('Reviewer');
  const [pw,       setPw]       = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!username.trim() || !email.trim()) { setError('Enter a full name and email address.'); return; }
    if (!EMAIL_RE.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    if (pw.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await registerUser({ email: email.trim(), username: username.trim(), role, password: pw });
      const msg = `Account created for ${email.trim()}. They can now sign in.`;
      setSuccess(msg);
      toast.success(`${username || email} registered as ${role} successfully!`);
      setEmail(''); setUsername(''); setPw(''); setConfirm('');
      setTimeout(() => onDone?.(), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="auth-error" role="alert"><Icons.Alert size={15} />{error}</div>}
      {success && <div className="auth-success" role="status"><Icons.Check size={15} />{success}</div>}

      <div className="auth-field">
        <label className="auth-field-label" htmlFor="register-name">Full name</label>
        <input id="register-name" type="text" className="input" value={username} data-autofocus
          onChange={e => setUsername(e.target.value)} autoComplete="name"
          placeholder="e.g. Jordan Miller" disabled={loading} />
      </div>

      <div className="auth-field">
        <label className="auth-field-label" htmlFor="register-email">Email address</label>
        <input id="register-email" type="email" className="input" value={email}
          onChange={e => setEmail(e.target.value)} autoComplete="email"
          placeholder="name@company.com" disabled={loading} />
      </div>

      <div className="auth-field">
        <span className="auth-field-label" id="register-role-label">Role</span>
        <div role="radiogroup" aria-labelledby="register-role-label" style={{ display: 'grid', gridTemplateColumns: `repeat(${ADMIN_ROLES.length},1fr)`, gap: 8 }}>
          {ADMIN_ROLES.map(r => {
            const m = ROLE_META[r.toLowerCase()];
            const sel = role === r;
            return (
              <button key={r} type="button" role="radio" aria-checked={sel} onClick={() => setRole(r)} style={{
                padding: '10px 0',
                border: `1.5px solid ${sel ? m.color : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600,
                background: sel ? m.bg : 'var(--white)',
                color: sel ? m.color : 'var(--slate)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>
                {r}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 7, lineHeight: 1.55 }}>
          <strong>Admin</strong> — full access ·{' '}
          <strong>Reviewer</strong> — review &amp; approve assessments
        </div>
      </div>

      <div className="auth-field">
        <label className="auth-field-label" htmlFor="register-password">Password</label>
        <PasswordField
          id="register-password"
          value={pw} onChange={e => setPw(e.target.value)}
          autoComplete="new-password" placeholder="At least 6 characters"
          disabled={loading}
        />
      </div>
      <div className="auth-field" style={{ marginBottom: 22 }}>
        <label className="auth-field-label" htmlFor="register-confirm">Confirm password</label>
        <PasswordField
          id="register-confirm"
          value={confirm} onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" placeholder="Repeat password"
          disabled={loading}
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading} aria-busy={loading || undefined}>
        {loading ? <><span className="btn-spinner-inline" aria-hidden="true" /> Creating account…</> : 'Create account'}
      </button>
    </form>
  );
}

/* ── Card content ─────────────────────────────────────── */
function LoginCard({ message, onClose }) {
  const [tab, setTab] = useState('signin');
  const cardRef = useRef(null);
  useDialog(cardRef, onClose);

  return (
    <div className="auth-card-wrap" ref={cardRef} role="dialog" aria-modal={onClose ? 'true' : undefined} aria-labelledby="auth-title" tabIndex={-1}>
      {onClose && (
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close sign-in">
          <Icons.X size={16} />
        </button>
      )}

      <div className="auth-card">
        <div className="auth-logo">
          <img src="/AssurifyLogo.svg" alt="Assurify" />
        </div>

        <h2 className="auth-title" id="auth-title">{tab === 'signin' ? 'Sign in to Assurify' : 'Create an account'}</h2>
        <p className="auth-sub">
          {tab === 'signin' ? 'Use your work email to access your compliance workspace.' : 'For administrators and privacy reviewers.'}
        </p>

        <div className="auth-role-toggle" role="tablist" aria-label="Sign in or register">
          <button type="button" role="tab" aria-selected={tab === 'signin'}
            className={`auth-role-btn${tab === 'signin' ? ' active' : ''}`}
            onClick={() => setTab('signin')}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={tab === 'register'}
            className={`auth-role-btn${tab === 'register' ? ' active' : ''}`}
            onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {tab === 'signin'
          ? <SignInForm message={message} />
          : <RegisterForm onDone={() => setTab('signin')} />
        }
      </div>
    </div>
  );
}

/* ── Login shell — modal or full-page ────────────────── */
export default function Login({ onClose, message }) {
  return (
    <div className="auth-backdrop" onMouseDown={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}>
      <LoginCard message={message} onClose={onClose || null} />
    </div>
  );
}
