/* ── Static Admin Dashboard ────────────────────────────
   Shows: stat tiles, reviewer→tenant assignments,
          tenant compliance progress & status.
   All data is static placeholder — swap with API later.
─────────────────────────────────────────────────────── */

/* ── Static data ──────────────────────────────────── */
const STATS = [
  { label: 'Total Clients',    value: 8,    sub: '+2 this month',   color: '#1B3680', bg: '#EEF2FF' },
  { label: 'Total Reviewers',  value: 5,    sub: '4 active',        color: '#0369A1', bg: '#E0F2FE' },
  { label: 'Total Users',      value: 23,   sub: '18 active',       color: '#065F46', bg: '#D1FAE5' },
  { label: 'Avg. Compliance',  value: '61%', sub: '↑ 8% this month', color: '#7C3AED', bg: '#EDE9FE' },
];

const REVIEWERS = [
  {
    id: 'r1', name: 'Priya Sharma', email: 'priya@assurify.in', initials: 'PS',
    tenants: ['Acme Corp', 'TechStart Inc'],
  },
  {
    id: 'r2', name: 'Rahul Mehta', email: 'rahul@assurify.in', initials: 'RM',
    tenants: ['Global Finance Ltd'],
  },
  {
    id: 'r3', name: 'Anita Singh', email: 'anita@assurify.in', initials: 'AS',
    tenants: ['MedTech Solutions', 'RetailPro'],
  },
  {
    id: 'r4', name: 'Dev Patel', email: 'dev@assurify.in', initials: 'DP',
    tenants: ['EduLearn Systems'],
  },
  {
    id: 'r5', name: 'Kavya Nair', email: 'kavya@assurify.in', initials: 'KN',
    tenants: ['DataCraft Analytics', 'CloudBase LLC'],
  },
];

const TENANTS = [
  { id: 't1', name: 'Acme Corp',           reviewer: 'Priya Sharma',  progress: 72,  status: 'in-progress',   risk: 'medium', lastUpdated: '2 days ago' },
  { id: 't2', name: 'TechStart Inc',        reviewer: 'Priya Sharma',  progress: 45,  status: 'in-progress',   risk: 'medium', lastUpdated: '5 days ago' },
  { id: 't3', name: 'Global Finance Ltd',   reviewer: 'Rahul Mehta',   progress: 91,  status: 'near-complete', risk: 'low',    lastUpdated: '1 day ago'  },
  { id: 't4', name: 'MedTech Solutions',    reviewer: 'Anita Singh',   progress: 28,  status: 'at-risk',       risk: 'high',   lastUpdated: '1 week ago' },
  { id: 't5', name: 'RetailPro',            reviewer: 'Anita Singh',   progress: 63,  status: 'in-progress',   risk: 'medium', lastUpdated: '3 days ago' },
  { id: 't6', name: 'EduLearn Systems',     reviewer: 'Dev Patel',     progress: 100, status: 'compliant',     risk: 'low',    lastUpdated: 'Today'      },
  { id: 't7', name: 'DataCraft Analytics',  reviewer: 'Kavya Nair',    progress: 15,  status: 'not-started',   risk: 'high',   lastUpdated: '2 weeks ago'},
  { id: 't8', name: 'CloudBase LLC',        reviewer: 'Kavya Nair',    progress: 58,  status: 'in-progress',   risk: 'medium', lastUpdated: '4 days ago' },
];

/* ── Status config ───────────────────────────────── */
const STATUS_MAP = {
  'compliant':     { label: 'Compliant',     bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  'near-complete': { label: 'Near Complete', bg: '#EDE9FE', color: '#5B21B6', border: '#C4B5FD' },
  'in-progress':   { label: 'In Progress',   bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'at-risk':       { label: 'At Risk',       bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  'not-started':   { label: 'Not Started',   bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
};

const RISK_MAP = {
  low:    { label: 'Low',    color: '#065F46', bg: '#D1FAE5' },
  medium: { label: 'Medium', color: '#92400E', bg: '#FEF3C7' },
  high:   { label: 'High',   color: '#B91C1C', bg: '#FEE2E2' },
};

const PROGRESS_COLORS = {
  low:    '#10B981',
  medium: '#F59E0B',
  high:   '#EF4444',
};

/* ── Avatar ──────────────────────────────────────── */
function Avatar({ initials, size = 32, bg = 'var(--green-soft)', color = 'var(--green-dim)', radius = '50%' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: bg, color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

/* ── Stat Tile ───────────────────────────────────── */
function StatTile({ label, value, sub, color, bg }) {
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--border)', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5"/>
          <rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/>
          <rect x="3" y="16" width="7" height="5" rx="1.5"/>
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-1px', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{sub}</div>
    </div>
  );
}

/* ── Progress bar ────────────────────────────────── */
function ProgressBar({ value, risk }) {
  const barColor = PROGRESS_COLORS[risk] ?? '#00AABF';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99, background: 'var(--border-soft)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`, height: '100%', borderRadius: 99,
          background: barColor, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', minWidth: 32, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: 'var(--bg)', color: 'var(--slate)', border: 'var(--border)' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--r-pill)',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

/* ── Risk Badge ──────────────────────────────────── */
function RiskBadge({ risk }) {
  const r = RISK_MAP[risk] ?? { label: risk, color: 'var(--slate)', bg: 'var(--bg)' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--r-pill)',
      background: r.bg, color: r.color, border: `1px solid ${r.color}22`,
    }}>
      {r.label}
    </span>
  );
}

/* ── Section header ──────────────────────────────── */
function SectionHead({ title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
      {count != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-pill)',
          background: 'var(--green-soft)', color: 'var(--green-dim)', border: '1px solid var(--green-mid)',
        }}>{count}</span>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────── */
export default function AdminDashboard() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Stat tiles ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}>
        {STATS.map(s => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* ── Mid row: Reviewer assignments + Activity feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Reviewer assignments card */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <SectionHead title="Reviewer Assignments" count={REVIEWERS.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {REVIEWERS.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0',
                borderBottom: i < REVIEWERS.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <Avatar initials={r.initials} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{r.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 'var(--r-pill)',
                      background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                    }}>Reviewer</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8 }}>{r.email}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.tenants.map(t => (
                      <span key={t} style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                        background: 'var(--green-soft)', color: 'var(--green-dim)',
                        border: '1px solid var(--green-mid)',
                      }}>{t}</span>
                    ))}
                    {r.tenants.length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No tenants assigned</span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                  background: 'var(--surface)', color: 'var(--slate)', border: '1px solid var(--border)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {r.tenants.length} client{r.tenants.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats / status breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Compliance status breakdown */}
          <div className="card" style={{ padding: '20px 24px', flex: 1 }}>
            <SectionHead title="Status Breakdown" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(STATUS_MAP).map(([key, cfg]) => {
                const count = TENANTS.filter(t => t.status === key).length;
                const pct = Math.round((count / TENANTS.length) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <StatusBadge status={key} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)' }}>
                        {count} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--border-soft)' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 99,
                        background: cfg.color, opacity: 0.7,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk summary */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <SectionHead title="Risk Distribution" />
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(RISK_MAP).map(([key, cfg]) => {
                const count = TENANTS.filter(t => t.risk === key).length;
                return (
                  <div key={key} style={{
                    flex: 1, borderRadius: 'var(--r-md)', padding: '12px 10px', textAlign: 'center',
                    background: cfg.bg, border: `1px solid ${cfg.color}22`,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginTop: 4 }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tenant compliance table ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHead title="Tenant Compliance Progress" count={TENANTS.length} />
          <span style={{ fontSize: 12, color: 'var(--slate)' }}>Static preview — connect API to load live data</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Tenant / Client</th>
              <th>Assigned Reviewer</th>
              <th style={{ minWidth: 180 }}>Compliance Progress</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {TENANTS.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar
                      initials={t.name.slice(0, 2).toUpperCase()}
                      size={32}
                      radius={8}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{t.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar
                      initials={t.reviewer.split(' ').map(n => n[0]).join('')}
                      size={24}
                      bg="#EFF6FF"
                      color="#1D4ED8"
                    />
                    <span style={{ fontSize: 13, color: 'var(--slate)' }}>{t.reviewer}</span>
                  </div>
                </td>
                <td>
                  <ProgressBar value={t.progress} risk={t.risk} />
                </td>
                <td><StatusBadge status={t.status} /></td>
                <td><RiskBadge risk={t.risk} /></td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
