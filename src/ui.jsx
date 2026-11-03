import { useEffect } from 'react';

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

const Badge = ({ tone = 'neutral', children, dot = false }) => (
  <span className={`badge badge-${tone}`}>
    {dot && (
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
    )}
    {children}
  </span>
);

const Button = ({ variant = 'secondary', size, icon, children, onClick, type = 'button', style }) => (
  <button type={type} onClick={onClick} style={style} className={`btn btn-${variant}${size ? ` btn-${size}` : ''}`}>
    {icon}
    {children}
  </button>
);

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

const Modal = ({ title, icon, onClose, children, footer, width }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" style={{ maxWidth: width || 560 }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        {icon}
        <h3 className="modal-title">{title}</h3>
        <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
          <Icons.X size={16} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

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

export { Icon, Icons, SourceIcon, Badge, Button, StatTile, Progress, ScoreRing, Modal, Toast };
