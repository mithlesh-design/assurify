import {
  Children, cloneElement, createContext, isValidElement, useCallback, useContext,
  useEffect, useId, useLayoutEffect, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';

const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {d}
  </svg>
);

const Icons = {
  Dashboard: (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>}/>,
  Shield: (p) => <Icon {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>,
  Database: (p) => <Icon {...p} d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></>}/>,
  Eye: (p) => <Icon {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>}/>,
  File: (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>,
  Building: (p) => <Icon {...p} d={<><rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></>}/>,
  Users: (p) => <Icon {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  Chart: (p) => <Icon {...p} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></>}/>,
  Bell: (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}/>,
  Refresh: (p) => <Icon {...p} d={<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>}/>,
  ArrowUpRight: (p) => <Icon {...p} d={<><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>}/>,
  Chevron: (p) => <Icon {...p} d={<polyline points="9 18 15 12 9 6"/>}/>,
  ChevronDown: (p) => <Icon {...p} d={<polyline points="6 9 12 15 18 9"/>}/>,
  ChevronLeft: (p) => <Icon {...p} d={<polyline points="15 18 9 12 15 6"/>}/>,
  Alert: (p) => <Icon {...p} d={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>,
  Search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>,
  Settings: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>,
  Signout: (p) => <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>,
  Plus: (p) => <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>,
  Download: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>,
  Share: (p) => <Icon {...p} d={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}/>,
  Copy: (p) => <Icon {...p} d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}/>,
  Check: (p) => <Icon {...p} d={<polyline points="20 6 9 17 4 12"/>}/>,
  X: (p) => <Icon {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  Sparkles: (p) => <Icon {...p} d={<><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/><path d="M19 14l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8L19 14z"/></>}/>,
  Filter: (p) => <Icon {...p} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>}/>,
  Mail: (p) => <Icon {...p} d={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}/>,
  Dot: (p) => <Icon {...p} d={<circle cx="12" cy="12" r="4" fill="currentColor"/>} stroke={0}/>,
  Code: (p) => <Icon {...p} d={<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>}/>,
  Lock: (p) => <Icon {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>,
  Clock: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>}/>,
  Calendar: (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>}/>,
  Clipboard: (p) => <Icon {...p} d={<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V3h6v1.5M9 11h6M9 15h6"/></>}/>,
  Upload: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>}/>,
  Trash: (p) => <Icon {...p} d={<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></>}/>,
  ChevronRight: (p) => <Icon {...p} d={<polyline points="9 18 15 12 9 6"/>}/>,
  TrendUp: (p) => <Icon {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>}/>,
  Edit: (p) => <Icon {...p} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  Send: (p) => <Icon {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>,
  Folder: (p) => <Icon {...p} d={<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>}/>,
  Cloud: (p) => <Icon {...p} d={<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>}/>,
  Card: (p) => <Icon {...p} d={<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}/>,
  Pulse: (p) => <Icon {...p} d={<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>}/>,
  Menu: (p) => <Icon {...p} d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>,
  More: (p) => <Icon {...p} d={<><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></>}/>,
  Info: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}/>,
  Printer: (p) => <Icon {...p} d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>}/>,
  Link: (p) => <Icon {...p} d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>}/>,
  Report: (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></>}/>,
  ArrowRight: (p) => <Icon {...p} d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}/>,
  ArrowUp: (p) => <Icon {...p} d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}/>,
  Help: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><line x1="12" y1="17.5" x2="12.01" y2="17.5"/></>}/>,
  Message: (p) => <Icon {...p} d={<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>}/>,
};

const SourceIcon = ({ type }) => {
  const map = {
    database: { bg: 'oklch(96% 0.025 240)', c: 'oklch(45% 0.13 240)', icon: <Icons.Database size={16}/> },
    cloud: { bg: 'oklch(96% 0.04 75)', c: 'oklch(45% 0.13 75)', icon: <Icons.Folder size={16}/> },
    crm: { bg: 'oklch(96% 0.03 200)', c: 'oklch(40% 0.10 200)', icon: <Icons.Cloud size={16}/> },
    object: { bg: 'oklch(96% 0.03 25)', c: 'oklch(45% 0.13 25)', icon: <Icons.Cloud size={16}/> },
    payment: { bg: 'oklch(96% 0.03 305)', c: 'oklch(45% 0.13 305)', icon: <Icons.Card size={16}/> },
    email: { bg: 'oklch(96% 0.03 155)', c: 'oklch(40% 0.10 155)', icon: <Icons.Mail size={16}/> },
    sms: { bg: 'oklch(96% 0.03 350)', c: 'oklch(45% 0.13 350)', icon: <Icons.Pulse size={16}/> },
  };
  const s = map[type] || map.database;
  return <span className="src-icon" style={{ background: s.bg, color: s.c }}>{s.icon}</span>;
};

/* Badge — tone: neutral | success | info | warning (med) | danger (high) | violet | low */
const Badge = ({ tone = 'neutral', children, dot = false, title }) => (
  <span className={`badge badge-${tone}`} title={title}>
    {dot && <span className="badge-dot" aria-hidden="true" />}
    {children}
  </span>
);

/* FilterChips — single-select filter with counts. items: [{ key, label, count }] */
const FilterChips = ({ items, value, onChange, label = 'Filter' }) => (
  <div className="filter-pills" role="group" aria-label={label}>
    {items.map(item => (
      <button
        key={item.key}
        type="button"
        className={`filter-pill${value === item.key ? ' active' : ''}`}
        aria-pressed={value === item.key}
        onClick={() => onChange(item.key)}
      >
        {item.dot && <span className="filter-pill-dot" style={{ background: item.dot }} aria-hidden="true" />}
        <span>{item.label}</span>
        {item.count != null && <span className="filter-pill-count">{item.count}</span>}
      </button>
    ))}
  </div>
);

/* Button — variant: primary | secondary | ghost | danger | danger-ghost; size: sm.
   Pass `loading` to show a spinner and block repeat clicks. Any other prop
   (disabled, title, aria-label, form…) is forwarded to the <button>. */
const Button = ({
  variant = 'secondary', size, icon, children, type = 'button', loading = false,
  block = false, className = '', disabled, ...rest
}) => {
  const iconOnly = !children && !!icon;
  const classes = [
    'btn', `btn-${variant}`, size && `btn-${size}`, iconOnly && 'btn-icon',
    block && 'btn-block', loading && 'btn-loading', className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="btn-spinner-inline" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
};

const StatTile = ({ label, value, meta, tone, icon }) => (
  <div className="stat-tile">
    <div className="stat-tile-label">{icon}{label}</div>
    <div className={`stat-tile-value${tone ? ` ${tone}` : ''}`}>{value}</div>
    {meta && <div className={`stat-tile-meta${tone ? ` ${tone}` : ''}`}>{meta}</div>}
  </div>
);

const Progress = ({ value, max = 100, tone = 'primary', thickness = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  /* Softer, more palette-friendly bar colors */
  const colors = {
    primary: 'var(--primary)',
    low:  '#34D399',   /* soft emerald — good / complete */
    med:  '#FCD34D',   /* soft amber — in progress */
    high: '#FCA5A5',   /* soft rose — needs attention */
  };
  return (
    <div className={`progress ${thickness}`}>
      <div style={{ width: `${pct}%`, background: colors[tone] || colors.primary, borderRadius: 'inherit' }} />
    </div>
  );
};

const ScoreRing = ({ value, size = 140, stroke = 11 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  const color = pct < 40 ? '#FCA5A5' : pct < 70 ? '#FCD34D' : 'var(--green)';
  const valueColor = pct < 40 ? '#DC2626' : pct < 70 ? '#B45309' : 'var(--green-dim)';
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="score-ring-text">
        <div className="v" style={{ color: valueColor }}>{value}%</div>
        <div className="l">DPDP readiness</div>
      </div>
    </div>
  );
};

/* ── Dialog behaviour shared by every modal / drawer in the product ──
   Escape closes the top-most dialog only, focus moves into the dialog and
   returns to the trigger on close, and Tab stays inside the dialog. */
const dialogStack = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialog(ref, onClose, { active = true, initialFocus = true } = {}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    const token = {};
    dialogStack.push(token);
    const previouslyFocused = document.activeElement;

    if (node && initialFocus) {
      const inBody = ['.modal-body', '.drawer-body'].flatMap(b => FOCUSABLE.split(', ').map(f => `${b} ${f}`)).join(', ');
      const target = node.querySelector('[data-autofocus]') || node.querySelector(inBody) || node;
      requestAnimationFrame(() => {
        if (!node.contains(document.activeElement)) target?.focus?.({ preventScroll: true });
      });
    }

    const onKey = (e) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (e.key === 'Escape' && closeRef.current) {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = dialogStack.indexOf(token);
      if (i >= 0) dialogStack.splice(i, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus?.({ preventScroll: true });
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* Modal — size: sm (420) | md (560, default) | lg (760) | xl (960), or a numeric width.
   On phones it becomes a full-height sheet with the footer pinned to the bottom. */
const MODAL_SIZES = { sm: 420, md: 560, lg: 760, xl: 960 };
const Modal = ({ title, subtitle, icon, onClose, children, footer, width, size, className = '', dismissible = true }) => {
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, dismissible ? onClose : null);
  const maxWidth = width || MODAL_SIZES[size] || MODAL_SIZES.md;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (dismissible && e.target === e.currentTarget) onClose?.(); }}>
      <div
        ref={ref}
        className={`modal ${className}`.trim()}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="modal-header">
          {icon && <span className="modal-header-icon">{icon}</span>}
          <div className="modal-heading">
            <h3 className="modal-title" id={titleId}>{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog">
              <Icons.X size={16} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

/* Drawer — right-hand panel for secondary workflows (full-screen on phones). */
const Drawer = ({ title, eyebrow, onClose, children, footer, width = 520 }) => {
  const ref = useRef(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className="drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <aside ref={ref} className="drawer" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            {eyebrow && <span className="drawer-eyebrow">{eyebrow}</span>}
            <h2 id={titleId} className="drawer-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close panel"><Icons.X size={18} /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>
  );
};

/* File name from API file objects ({ file_name }), browser File objects or plain strings */
const fileLabel = (f) => (typeof f === 'string' ? f : f?.name ?? f?.file_name ?? f?.filename ?? f?.original_name ?? 'Document');

/* ConfirmDialog — use before destructive or irreversible actions. */
const ConfirmDialog = ({
  title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'danger', onConfirm, onCancel, busy = false,
}) => (
  <Modal
    title={title}
    size="sm"
    onClose={busy ? undefined : onCancel}
    dismissible={!busy}
    icon={<Icons.Alert size={18} />}
    className={`confirm-dialog confirm-${tone}`}
    footer={(
      <>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} data-autofocus>
          {confirmLabel}
        </Button>
      </>
    )}
  >
    <div className="confirm-message">{message}</div>
  </Modal>
);

/* Field — label, optional/required marker, hint and error wired to the control for screen readers. */
const Field = ({ label, required, optional, hint, error, children, className = '', id: idProp }) => {
  const autoId = useId();
  const child = Children.only(children);
  const id = idProp || child.props.id || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [child.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(child)
    ? cloneElement(child, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : child.props['aria-invalid'],
        required: child.props.required ?? required,
      })
    : child;
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="field-required" aria-hidden="true">*</span>}
          {optional && <span className="field-optional">Optional</span>}
        </label>
      )}
      {control}
      {hint && !error && <div className="field-hint" id={hintId}>{hint}</div>}
      {error && <div className="field-error" id={errorId} role="alert"><Icons.Alert size={13} />{error}</div>}
    </div>
  );
};

/* SearchInput — text input with a leading search icon. */
const SearchInput = ({ value, onChange, placeholder = 'Search…', label, className = '', ...rest }) => (
  <div className={`input-icon search-input ${className}`.trim()}>
    <Icons.Search size={16} />
    <input
      type="search"
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label || placeholder}
      {...rest}
    />
  </div>
);

/* EmptyState — for empty lists and "no results" after filtering. */
const EmptyState = ({ icon, title, description, action, compact = false }) => (
  <div className={`empty${compact ? ' empty-compact' : ''}`} role="status">
    <div className="empty-icon">{icon || <Icons.File size={22} />}</div>
    {title && <h3 className="empty-title">{title}</h3>}
    {description && <p className="empty-desc">{description}</p>}
    {action}
  </div>
);

/* LoadingState — consistent spinner + label while data loads. */
const LoadingState = ({ label = 'Loading…', compact = false }) => (
  <div className={`loading-state${compact ? ' loading-compact' : ''}`} role="status" aria-live="polite">
    <span className="loading-spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

/* ErrorState — inline error with an optional retry. */
const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="error-state" role="alert">
    <Icons.Alert size={18} />
    <div>
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
    {onRetry && <Button size="sm" variant="secondary" icon={<Icons.Refresh size={14} />} onClick={onRetry}>Try again</Button>}
  </div>
);

/* RowActions — kebab menu for row-level actions in tables and cards.
   items: [{ label, icon, onClick, danger, disabled, hidden }]. Rendered in a
   portal so it is never clipped by scrolling table containers. */
const RowActions = ({ items, label = 'More actions', align = 'end' }) => {
  const visible = items.filter(item => item && !item.hidden);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = (menuRef.current?.offsetHeight) || visible.length * 40 + 12;
    const menuW = Math.max(menuRef.current?.offsetWidth || 0, 200);
    const below = r.bottom + 6 + menuH <= window.innerHeight - 8;
    const top = below ? r.bottom + 6 : Math.max(8, r.top - 6 - menuH);
    let left = align === 'end' ? r.right - menuW : r.left;
    left = Math.min(Math.max(8, left), window.innerWidth - menuW - 8);
    setPos({ top, left });
  }, [align, visible.length]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); btnRef.current?.focus(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const els = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? [])];
        const i = els.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
        els[next]?.focus();
      }
    };
    /* Keep the menu attached to its button while the page scrolls or resizes */
    const onScroll = () => place();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus());
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  if (!visible.length) return null;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="icon-btn row-actions-btn"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <Icons.More size={16} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className="row-actions-menu"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {visible.map((item, i) => (
            <button
              key={item.label + i}
              type="button"
              role="menuitem"
              className={`row-actions-item${item.danger ? ' danger' : ''}`}
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onClick?.(); }}
            >
              {item.icon && <span className="row-actions-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
};

/* ── Page header action slot ──
   Pages render their primary actions with <PageActions> and they appear in
   the sticky page header (no DOM-click workarounds). */
const PageActionsContext = createContext(null);
const PageActionsProvider = PageActionsContext.Provider;
const PageActions = ({ children }) => {
  const target = useContext(PageActionsContext);
  return target ? createPortal(children, target) : null;
};

const Toast = ({ message, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2600);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  return (
    <div className="toast">
      <Icons.Check size={16} />
      <span>{message}</span>
    </div>
  );
};

export {
  Icon, Icons, SourceIcon, Badge, FilterChips, Button, StatTile, Progress, ScoreRing, Modal, Toast,
  useDialog, Drawer, fileLabel, ConfirmDialog, Field, SearchInput, EmptyState, LoadingState, ErrorState,
  RowActions, PageActions, PageActionsProvider,
};
