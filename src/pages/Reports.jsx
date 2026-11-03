import { useState } from 'react';
import { Icons, Badge, Button, Progress } from '../ui';

const REPORTS = [
  {
    id: 'r1', title: 'DPDP Compliance Status — May 2026',
    date: '2026-05-22', score: 34, prevScore: 28, status: 'Current',
    obligations: [
      { id: 'OBL-1', name: 'Consent management', pct: 0 },
      { id: 'OBL-2', name: 'Privacy notice (Section 5)', pct: 40 },
      { id: 'OBL-3', name: 'Data Principal rights', pct: 25 },
      { id: 'OBL-4', name: 'Data localisation (SDF)', pct: 100 },
      { id: 'OBL-5', name: 'Data Processor agreements', pct: 22 },
      { id: 'OBL-6', name: 'Breach notification', pct: 55 },
      { id: 'OBL-7', name: "Children's data (Section 9)", pct: 0 },
      { id: 'OBL-8', name: 'Grievance redressal', pct: 80 },
    ],
    summary: 'Acme Technologies Pvt Ltd scores 34% overall compliance against the 8 DPDP Act obligations as of 22 May 2026. Score improved by 6 points since the April report — driven primarily by progress on Privacy Notice and Breach notification controls.',
  },
  {
    id: 'r2', title: 'DPDP Readiness Assessment — April 2026',
    date: '2026-04-15', score: 28, prevScore: 21, status: 'Archived',
    obligations: [
      { id: 'OBL-1', name: 'Consent management', pct: 0 },
      { id: 'OBL-2', name: 'Privacy notice (Section 5)', pct: 20 },
      { id: 'OBL-3', name: 'Data Principal rights', pct: 25 },
      { id: 'OBL-4', name: 'Data localisation (SDF)', pct: 100 },
      { id: 'OBL-5', name: 'Data Processor agreements', pct: 22 },
      { id: 'OBL-6', name: 'Breach notification', pct: 30 },
      { id: 'OBL-7', name: "Children's data (Section 9)", pct: 0 },
      { id: 'OBL-8', name: 'Grievance redressal', pct: 60 },
    ],
    summary: 'Mid-quarter review covering April. Grievance redressal mechanism stood up and breach notification playbook drafted.',
  },
  {
    id: 'r3', title: 'Q1 2026 Compliance Review',
    date: '2026-03-31', score: 21, prevScore: 12, status: 'Archived',
    obligations: [
      { id: 'OBL-1', name: 'Consent management', pct: 0 },
      { id: 'OBL-2', name: 'Privacy notice (Section 5)', pct: 10 },
      { id: 'OBL-3', name: 'Data Principal rights', pct: 10 },
      { id: 'OBL-4', name: 'Data localisation (SDF)', pct: 80 },
      { id: 'OBL-5', name: 'Data Processor agreements', pct: 0 },
      { id: 'OBL-6', name: 'Breach notification', pct: 20 },
      { id: 'OBL-7', name: "Children's data (Section 9)", pct: 0 },
      { id: 'OBL-8', name: 'Grievance redressal', pct: 40 },
    ],
    summary: 'First quarterly compliance baseline for the board. Establishes target trajectory before enforcement deadline.',
  },
];

function PageReports({ onAction }) {
  const [activeId, setActiveId] = useState(REPORTS[0].id);
  const active = REPORTS.find((r) => r.id === activeId);

  const trend = active.score - active.prevScore;
  const trendColor = trend >= 0 ? 'var(--risk-low-text)' : 'var(--risk-high-text)';

  return (
    <div className="page">
      <div className="two-col" style={{ alignItems: 'start', gridTemplateColumns: '1fr 2fr' }}>
        <div>
          <div className="section-header" style={{ margin: '0 0 12px' }}>
            <h3>Reports</h3>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{REPORTS.length} total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REPORTS.map((r) => (
              <div
                key={r.id}
                className={`report-item${r.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(r.id)}
              >
                <div className="report-item-row">
                  <div className="report-item-icon"><Icons.File size={15} /></div>
                  <div className="report-item-title">{r.title}</div>
                </div>
                <div className="report-item-meta">
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{r.date}</span>
                  <span className="report-item-score" style={{
                    color: r.score < 40 ? 'var(--risk-high-text)'
                      : r.score < 70 ? 'var(--risk-med-text)'
                      : 'var(--risk-low-text)',
                  }}>{r.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Badge tone={active.status === 'Current' ? 'info' : 'neutral'}>{active.status}</Badge>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    Confidential · Internal
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>
                  {active.title}
                </h2>
                <div style={{
                  fontSize: 13, color: 'var(--text-muted)', marginTop: 6,
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <span>Acme Technologies Pvt Ltd</span>
                  <span className="dot-sep" style={{ width: 3, height: 3, background: 'var(--text-dim)', borderRadius: '50%' }} />
                  <span>Prepared by Rajesh Kumar</span>
                  <span className="dot-sep" style={{ width: 3, height: 3, background: 'var(--text-dim)', borderRadius: '50%' }} />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{active.date}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Score
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  color: active.score < 40 ? 'var(--risk-high-text)'
                    : active.score < 70 ? 'var(--risk-med-text)'
                    : 'var(--risk-low-text)',
                }}>{active.score}%</div>
                <div style={{ fontSize: 12, color: trendColor, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icons.TrendUp size={12} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
                  {trend > 0 ? '+' : ''}{trend} pts since last report
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 28px' }}>
            <h3 style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)',
              letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px',
            }}>Executive summary</h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0, maxWidth: '72ch' }}>
              {active.summary}
            </p>
          </div>

          <div style={{ padding: '8px 28px 24px' }}>
            <h3 style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)',
              letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 14px',
            }}>Obligation status</h3>
            <div>
              {active.obligations.map((o) => {
                const tone = o.pct === 0 ? 'high' : o.pct < 60 ? 'med' : 'low';
                const textColor = o.pct === 0 ? 'var(--risk-high-text)'
                  : o.pct < 60 ? 'var(--risk-med-text)' : 'var(--risk-low-text)';
                return (
                  <div key={o.id} className="obl-status-row">
                    <span className="id">{o.id}</span>
                    <span className="name">{o.name}</span>
                    <Progress value={o.pct} tone={tone} />
                    <span className="pct" style={{ color: textColor }}>{o.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            padding: '16px 28px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            background: 'oklch(98.8% 0.003 240)',
          }}>
            <Button icon={<Icons.Share size={14} />} onClick={() => onAction('Share link copied')}>Share</Button>
            <Button icon={<Icons.Download size={14} />} onClick={() => onAction('Report downloaded')}>
              Download PDF
            </Button>
            <Button variant="primary" icon={<Icons.Send size={14} />} onClick={() => onAction('Sent to board members')}>
              Send to board
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageReports;
