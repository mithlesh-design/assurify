/**
 * context/ToastContext.jsx
 *
 * Global toast notification system.
 *
 * Usage:
 *   import { useToast } from '../context/ToastContext';
 *   const toast = useToast();
 *   toast.success('Document approved');
 *   toast.error('Login failed');
 *   toast.info('Processing…');
 *   toast.warning('Token expiring soon');
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

/* Duration in ms per type */
const DURATION = { success: 3500, error: 5000, info: 3500, warning: 4000 };

/* Icon per type */
const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

/* ── Single toast item ─────────────────────────────────── */
function ToastItem({ id, type, message, duration, onRemove }) {
  return (
    <div
      className={`tz-item tz-${type}`}
      role="alert"
      aria-live="polite"
      style={{ '--tz-duration': `${duration}ms` }}
    >
      <div className="tz-icon">{ICONS[type]}</div>
      <span className="tz-msg">{message}</span>
      <button className="tz-close" onClick={() => onRemove(id)} aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      {/* progress bar auto-fills using CSS animation keyed to --tz-duration */}
      <div className="tz-progress"/>
    </div>
  );
}

/* ── Provider ──────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message, type = 'success') => {
    const id  = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const dur = DURATION[type] ?? 3500;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration: dur }]);
    timers.current[id] = setTimeout(() => remove(id), dur);
    return id;
  }, [remove]);

  const api = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
    warning: (msg) => add(msg, 'warning'),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 && (
        <div className="tz-container" aria-label="Notifications">
          {toasts.map(t => (
            <ToastItem key={t.id} {...t} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
