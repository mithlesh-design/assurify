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

import { useState, useEffect, useRef } from 'react';
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

function PasswordField({ value, onChange, placeholder, autoComplete, disabled, onKeyDown }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
        style={{ paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--slate)', padding: 0, display: 'flex', alignItems: 'center',
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <IconEye open={show} />
      </button>
    </div>
  );
}

/* ── Sign-in form ─────────────────────────────────────── */
function SignInForm({ message }) {
  const { login, authLoading } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email.trim(), pw);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FCD34D',
          color: '#92400E', fontSize: 13, padding: '10px 14px',
          borderRadius: 'var(--r-md)', marginBottom: 16, lineHeight: 1.5,
        }}>
          {message}
        </div>
      )}
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label className="auth-field-label">Email address</label>
        <input
          type="email" className="input"
          value={email} onChange={e => setEmail(e.target.value)}
          required autoComplete="email" placeholder="you@appzlogic.com"
          disabled={authLoading}
        />
      </div>
      <div className="auth-field" style={{ marginBottom: 22 }}>
        <label className="auth-field-label">Password</label>
        <PasswordField
          value={pw} onChange={e => setPw(e.target.value)}
          autoComplete="current-password" placeholder="••••••••"
          disabled={authLoading}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
        />
      </div>

      <button
        type="submit" className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15 }}
        disabled={authLoading}
      >
        {authLoading
          ? <><span className="btn-spinner"/> Signing in…</>
          : 'Sign in →'
        }
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
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div style={{
          background: 'var(--green-soft)', border: '1px solid var(--green-mid)',
          color: 'var(--green-dim)', fontSize: 13, padding: '10px 14px',
          borderRadius: 'var(--r-md)', marginBottom: 16,
        }}>
          ✓ {success}
        </div>
      )}

      <div className="auth-field">
        <label className="auth-field-label">Full name</label>
        <input type="text" className="input" value={username}
          onChange={e => setUsername(e.target.value)} required
          placeholder="Anshul Gupta" disabled={loading} />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">Email address</label>
        <input type="email" className="input" value={email}
          onChange={e => setEmail(e.target.value)} required
          placeholder="name@appzlogic.com" disabled={loading} />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">Role</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
          {ADMIN_ROLES.map(r => {
            const m = ROLE_META[r.toLowerCase()];
            const sel = role === r;
            return (
              <button key={r} type="button" onClick={() => setRole(r)} style={{
                padding: '9px 0',
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
          <strong>Reviewer</strong> — review &amp; approve ·{' '}
          <strong>User</strong> — view &amp; comment
        </div>
      </div>

      <div className="auth-field">
        <label className="auth-field-label">Password</label>
        <PasswordField
          value={pw} onChange={e => setPw(e.target.value)}
          autoComplete="new-password" placeholder="Min. 6 characters"
          disabled={loading}
        />
      </div>
      <div className="auth-field" style={{ marginBottom: 22 }}>
        <label className="auth-field-label">Confirm password</label>
        <PasswordField
          value={confirm} onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" placeholder="Repeat password"
          disabled={loading}
        />
      </div>

      <button
        type="submit" className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15 }}
        disabled={loading}
      >
        {loading
          ? <><span className="btn-spinner"/> Creating account…</>
          : 'Create account'
        }
      </button>
    </form>
  );
}

/* ── Card content ─────────────────────────────────────── */
function LoginCard({ message, onClose }) {
  const [tab, setTab] = useState('signin');

  return (
    /* Outer wrapper — not scrollable, holds the close button */
    <div style={{ position: 'relative' }}>

      {/* Close button — outside the scrollable area so it never scrolls away */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -12, right: -12, zIndex: 10,
            width: 32, height: 32,
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: '50%', cursor: 'pointer',
            color: 'var(--slate)', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--risk-high-bg)'; e.currentTarget.style.color = 'var(--risk-high-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--slate)'; }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}

      {/* Scrollable card content */}
      <div className="auth-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Logo */}
        <div className="auth-logo" style={{ justifyContent: 'center' }}>
          <img src="/MainLogo.png" alt="DPDPA" style={{ height: 58, width: 'auto', objectFit: 'contain' }} />
        </div>

        <h2 className="auth-title">Admin Portal</h2>
        <p className="auth-sub" style={{ marginBottom: 20 }}>
          {tab === 'signin' ? 'Sign in to your account' : 'Create an admin account'}
        </p>

        {/* Tab toggle */}
        <div className="auth-role-toggle" style={{ marginBottom: 24 }}>
          <button type="button"
            className={`auth-role-btn${tab === 'signin' ? ' active' : ''}`}
            onClick={() => setTab('signin')}>
            Sign in
          </button>
          <button type="button"
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
  const backdropRef = useRef(null);

  const handleBackdrop = (e) => {
    if (onClose && e.target === backdropRef.current) onClose();
  };

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (onClose) {
    return (
      <div
        ref={backdropRef}
        onClick={handleBackdrop}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <LoginCard message={message} onClose={onClose} />
      </div>
    );
  }

  /* Full-page fallback (session expired — no close button) */
  return (
    <div className="auth-root">
      <LoginCard message={message} onClose={null} />
    </div>
  );
}
