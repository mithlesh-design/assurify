import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OBL_META, statusLabel } from '../data/controls';
import { GAPP_PRINCIPLE_LABELS } from '../config/obligations';

const CANON_ORDER = [...Object.keys(GAPP_PRINCIPLE_LABELS), ...OBL_META.map(o => o.id)];

function resolveOblName(oblId) {
  return OBL_META.find(o => o.id === oblId)?.name
    ?? GAPP_PRINCIPLE_LABELS[oblId]
    ?? oblId.replace(/_/g, ' ');
}

const STATUS_STYLE = {
  pending_review:   { bg: 'var(--surface)',       color: 'var(--slate)',          border: 'var(--border)' },
  in_progress:      { bg: '#EFF6FF',              color: '#1D4ED8',               border: '#BFDBFE' },
  implemented:      { bg: 'var(--green-soft)',    color: 'var(--green-dim)',      border: 'var(--green-mid)' },
  needs_discussion: { bg: 'var(--risk-med-bg)',   color: 'var(--risk-med-text)',  border: 'var(--risk-med-border)' },
  blocked:          { bg: 'var(--risk-high-bg)',  color: 'var(--risk-high-text)', border: 'var(--risk-high-border)' },
  not_applicable:   { bg: '#F5F3FF',              color: '#6D28D9',               border: '#DDD6FE' },
};

const STATUS_DEFS = {
  implemented:       'Control fully in place; evidence reviewed and approved by the reviewer.',
  in_progress:       'Implementation commenced; evidence partially submitted and under review.',
  pending_review:    'Evidence submitted by the organization; awaiting reviewer assessment.',
  needs_discussion:  'Open question raised by the reviewer; awaiting resolution with the organization.',
  blocked:           'Critical issue identified; control cannot proceed until resolved.',
  not_applicable:    "Control does not apply to this organization's processing activities.",
};

const PRIORITY_RANK = { blocked: 0, needs_discussion: 1, pending_review: 2, in_progress: 3 };

function StatusInline({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending_review;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      display: 'inline-block',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {statusLabel(status)}
    </span>
  );
}

function MiniBar({ pct }) {
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 30, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function ExecCard({ label, value, sub, accent }) {
  return (
    <div className="rexec-card" style={{ borderTopColor: accent }}>
      <div className="rexec-val" style={{ color: accent }}>{value}</div>
      <div className="rexec-lbl">{label}</div>
      {sub && <div className="rexec-sub">{sub}</div>}
    </div>
  );
}

function ScoreRing({ score, color }) {
  const r = 64, c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
      <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

export default function ComplianceReport({ onNavigate, autoPrint = false, onPrinted }) {
  const { controls, complianceScore, user, tenant, controlsLoading } = useApp();

  /* "Export PDF" from the assessment opens this report and the browser's Save as PDF dialog */
  useEffect(() => {
    if (!autoPrint || controlsLoading) return undefined;
    const t = setTimeout(() => { window.print(); onPrinted?.(); }, 450);
    return () => clearTimeout(t);
  }, [autoPrint, controlsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const score   = complianceScore();
  const impl    = controls.filter(c => c.status === 'implemented').length;
  const inProg  = controls.filter(c => c.status === 'in_progress').length;
  const pending = controls.filter(c => c.status === 'pending_review').length;
  const discuss = controls.filter(c => c.status === 'needs_discussion').length;
  const blocked = controls.filter(c => c.status === 'blocked').length;

  const company  = tenant?.name || user?.company || 'Your organization';
  const today    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const scColor  = score >= 80 ? 'var(--green)' : score >= 50 ? '#F59E0B' : '#EF4444';
  const scText   = score >= 80 ? 'var(--green-dim)' : score >= 50 ? '#B45309' : '#991B1B';

  const reviewerName = tenant?.reviewer?.name || user?.name || 'Anshul Gupta';
  const reviewerCred = tenant?.reviewer?.designation || 'CIPP/E — Certified Information Privacy Professional (Europe)';
  const credAbbrev   = reviewerCred.split(' — ')[0];

  const reportStatus = score >= 100 ? 'Final' : 'Interim';

  const oblIds = [...new Set(controls.map(c => c.obl).filter(Boolean))]
    .sort((a, b) => {
      const ia = CANON_ORDER.indexOf(a), ib = CANON_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  const oblRows = oblIds.map((oblId, idx) => {
    const cs  = controls.filter(c => c.obl === oblId);
    const oi  = cs.filter(c => c.status === 'implemented').length;
    const ip  = cs.filter(c => c.status === 'in_progress').length;
    const pr  = cs.filter(c => c.status === 'pending_review' || c.status === 'needs_discussion').length;
    const bl  = cs.filter(c => c.status === 'blocked').length;
    const pct = cs.length > 0 ? Math.round((oi / cs.length) * 100) : 0;
    return { id: oblId, ref: `OBL-${String(idx + 1).padStart(2, '0')}`, name: resolveOblName(oblId), cs, oi, ip, pr, bl, pct };
  });

  const bestObl  = oblRows.length ? oblRows.slice().sort((a, b) => b.pct - a.pct)[0] : null;
  const worstObl = oblRows.length ? oblRows.slice().sort((a, b) => a.pct - b.pct)[0] : null;

  const gapControls = controls
    .filter(c => c.status !== 'implemented' && c.status !== 'not_applicable')
    .slice()
    .sort((a, b) => (PRIORITY_RANK[a.status] ?? 9) - (PRIORITY_RANK[b.status] ?? 9));

  const immediate  = gapControls.filter(c => c.status === 'blocked' || c.status === 'needs_discussion');
  const shortTerm  = gapControls.filter(c => c.status === 'pending_review');
  const mediumTerm = gapControls.filter(c => c.status === 'in_progress');
  const ROADMAP_CAP = 8;

  if (controlsLoading) {
    return <div className="cr-root" style={{ padding: 60, textAlign: 'center', color: 'var(--slate)' }}>Loading report…</div>;
  }

  return (
    <div className="cr-root">
      {/* ── Nav ── */}
      <nav className="lp-nav cr-nav-print" style={{
        background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="lp-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => onNavigate('dashboard')}>
            <img src="/MainLogo.png" alt="DPDPA" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('assessment')}>
              ← Assessment
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
      </nav>

      {/* ── Report document ── */}
      <div style={{ padding: '32px 20px 64px', background: 'var(--surface)' }}>
        <div className="rdoc">

          {/* ── Cover ── */}
          <div className="rcov" style={{ background: 'linear-gradient(160deg, var(--black) 0%, #253A8E 55%, #1a6080 100%)' }}>
            <div className="rcov-inner">
              <div className="rcov-brand">APPZLOGIC GRC</div>
              <div className="rcov-tagline">Compliance Intelligence Platform</div>
              <div className="rcov-title">DPDP ACT 2023</div>
              <div className="rcov-subtitle">Compliance Assessment Report</div>

              <div className="rcov-ring-wrap">
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <ScoreRing score={score} color={scColor} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}%</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Compliance Score</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{impl} of {controls.length} controls</div>
                  </div>
                </div>
              </div>

              <div className="rcov-meta">
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Organization</div>
                  <div className="rcov-meta-val">{company}</div>
                </div>
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Assessment Date</div>
                  <div className="rcov-meta-val">{today}</div>
                </div>
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Framework</div>
                  <div className="rcov-meta-val">DPDP Act 2023 (No. 22 of 2023)</div>
                </div>
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Reviewer</div>
                  <div className="rcov-meta-val">{reviewerName} — {credAbbrev}</div>
                </div>
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Total Controls</div>
                  <div className="rcov-meta-val">{controls.length} controls across {oblRows.length} obligation{oblRows.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="rcov-meta-item">
                  <div className="rcov-meta-label">Report Status</div>
                  <div className="rcov-meta-val">{reportStatus}{reportStatus === 'Interim' ? ' — Full cert. pending complete implementation' : ''}</div>
                </div>
              </div>
            </div>
            <div className="rcov-conf">CONFIDENTIAL — Prepared exclusively for {company}. Not for redistribution.</div>
          </div>

          {/* ── Body ── */}
          <div className="rdoc-body">

            {/* 1. Executive summary */}
            <div className="rsec">
              <div className="rst">1. Executive summary</div>

              <div className="rexec-grid">
                <ExecCard label="Overall Score"   value={`${score}%`} sub="of 100%" accent="#F59E0B" />
                <ExecCard label="Implemented"     value={impl}        sub="controls" accent="var(--green)" />
                <ExecCard label="In Progress"     value={inProg}      sub="controls" accent="#2563EB" />
                <ExecCard label="Pending Review"  value={pending + discuss} sub="controls" accent="#D97706" />
                <ExecCard label="Blocked"         value={blocked}     sub="controls" accent="#DC2626" />
              </div>

              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.75, margin: '0 0 10px' }}>
                This Compliance Assessment Report presents the findings of an independent review of{' '}
                <strong>{company}</strong>'s compliance posture against the Digital Personal Data Protection
                Act, 2023 (DPDP Act — No. 22 of 2023), conducted as on {today}. The assessment was performed
                by {reviewerName}, a {reviewerCred} privacy professional at Appzlogic GRC.
              </p>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.75, margin: '0 0 10px' }}>
                The review examined {controls.length} controls spanning {oblRows.length} key obligation{oblRows.length !== 1 ? 's' : ''}
                {' '}— {oblRows.map(o => o.name).join(', ')}. {company} has achieved a current compliance score
                of <strong style={{ color: scText }}>{score}%</strong>, with {impl} controls fully implemented,
                {' '}{inProg} in progress, and {pending + discuss} pending review{blocked > 0 ? `, and ${blocked} blocked` : ''}.
              </p>
              {bestObl && (
                <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.75, margin: '0 0 10px' }}>
                  <strong>Key strength:</strong> {company} has achieved {bestObl.pct}% compliance on{' '}
                  {bestObl.name} ({bestObl.oi}/{bestObl.cs.length} controls implemented).
                </p>
              )}
              {worstObl && (
                <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.75, margin: 0 }}>
                  <strong>Priority gap:</strong> {worstObl.name} remains the lowest-scoring obligation at{' '}
                  {worstObl.pct}% complete{blocked > 0 ? `. ${blocked} control${blocked !== 1 ? 's are' : ' is'} currently blocked and represent${blocked === 1 ? 's' : ''} the highest-priority regulatory risk` : ''}.
                </p>
              )}

              <table className="rtbl" style={{ marginTop: 20 }}>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Obligation</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ minWidth: 120 }}>Progress</th>
                    <th style={{ textAlign: 'center' }}>Implemented</th>
                    <th style={{ textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {oblRows.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{o.ref}</td>
                      <td style={{ fontWeight: 500 }}>{o.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{o.pct}%</td>
                      <td style={{ minWidth: 120 }}><MiniBar pct={o.pct} /></td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.oi}</td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.cs.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Assessment methodology */}
            <div className="rsec">
              <div className="rst">2. Assessment methodology</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, margin: '0 0 16px' }}>
                The assessment was conducted using Appzlogic GRC's proprietary compliance framework, mapped
                directly to the provisions of the Digital Personal Data Protection Act, 2023 and associated
                rules. The methodology follows a structured, evidence-based review process:
              </p>
              <div className="rmethod">
                {[
                  { t: 'Control Mapping', d: `Each control was mapped to specific sections of the DPDP Act 2023, ensuring complete regulatory coverage across all ${oblRows.length} obligation${oblRows.length !== 1 ? 's' : ''} and ${controls.length} controls.` },
                  { t: 'Evidence Collection', d: `${company} submitted supporting documents, policies, screenshots, and process records for each control via the Appzlogic GRC portal. Submissions are version-controlled and timestamped.` },
                  { t: 'Reviewer Assessment', d: `A ${credAbbrev}-certified privacy professional reviewed each submission, recorded specific observations, and assigned a compliance status to each control.` },
                  { t: 'Gap Identification', d: 'Controls not meeting the required standard were flagged with detailed observations and actionable recommendations for remediation.' },
                  { t: 'Scoring', d: `The compliance score (${score}%) reflects the percentage of fully implemented controls out of the total ${controls.length} controls assessed under this ${reportStatus.toLowerCase()} report.` },
                  { t: 'Report Generation', d: 'This report was generated by the Appzlogic GRC platform and certified by the assigned reviewer. Final certification is issued upon 100% control implementation.' },
                ].map((step, i) => (
                  <div className="rmethod-step" key={step.t}>
                    <div className="rmethod-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="rmethod-text"><strong>{step.t}</strong> — {step.d}</div>
                  </div>
                ))}
              </div>

              <div className="rst" style={{ marginTop: 24 }}>Control status definitions</div>
              <table className="rtbl">
                <thead>
                  <tr><th>Status</th><th>Definition</th></tr>
                </thead>
                <tbody>
                  {Object.entries(STATUS_DEFS).map(([status, def]) => (
                    <tr key={status}>
                      <td style={{ whiteSpace: 'nowrap' }}><StatusInline status={status} /></td>
                      <td style={{ fontSize: 13, color: 'var(--ink2)' }}>{def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Obligation-wise compliance overview */}
            <div className="rsec">
              <div className="rst">3. Obligation-wise compliance overview</div>
              <table className="rtbl">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Obligation</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Impl.</th>
                    <th style={{ textAlign: 'center' }}>In Prog.</th>
                    <th style={{ textAlign: 'center' }}>Pending</th>
                    <th style={{ textAlign: 'center' }}>Blocked</th>
                    <th style={{ textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {oblRows.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{o.ref}</td>
                      <td style={{ fontWeight: 500 }}>{o.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: o.pct >= 80 ? 'var(--green-dim)' : o.pct >= 50 ? '#B45309' : '#DC2626' }}>{o.pct}%</td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.oi}</td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.ip || '—'}</td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.pr || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: o.bl > 0 ? '#DC2626' : 'var(--muted)' }}>{o.bl || '—'}</td>
                      <td style={{ textAlign: 'center', color: 'var(--slate)' }}>{o.cs.length}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: 'var(--surface)' }}>
                    <td colSpan={2}>Grand Total</td>
                    <td style={{ textAlign: 'center' }}>{score}%</td>
                    <td style={{ textAlign: 'center' }}>{impl}</td>
                    <td style={{ textAlign: 'center' }}>{inProg}</td>
                    <td style={{ textAlign: 'center' }}>{pending + discuss}</td>
                    <td style={{ textAlign: 'center' }}>{blocked}</td>
                    <td style={{ textAlign: 'center' }}>{controls.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Detailed control assessment */}
            <div className="rsec">
              <div className="rst">4. Detailed control assessment</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, margin: '0 0 18px' }}>
                Each control below includes the regulatory reference, compliance status, reviewer observation,
                and a specific actionable recommendation.
              </p>
              {oblRows.map((o, oi) => (
                <div className="robl-section" key={o.id}>
                  <div className="robl-hdr">
                    <span>4.{oi + 1} {o.name}</span>
                    <span className="robl-hdr-ref">{o.ref}</span>
                  </div>
                  {o.cs.map(c => (
                    <div className="rctrl-card" key={c.id}>
                      <div className="rctrl-hdr">
                        <span className="rctrl-id">{c.oblId}</span>
                        <span className="rctrl-name">{c.name}</span>
                        <StatusInline status={c.status} />
                        {c.req && <span className="rctrl-ref">{c.req}</span>}
                      </div>
                      <div className="rctrl-grid">
                        <div className="rctrl-obs">
                          <div className="rctrl-lbl">Observation</div>
                          {c.remarks?.trim() || 'No observation recorded yet.'}
                        </div>
                        <div className="rctrl-rec">
                          <div className="rctrl-lbl">Recommendation</div>
                          {c.recommendation?.trim() || 'No recommendation recorded yet.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 5. Gap summary & priority remediation */}
            {gapControls.length > 0 && (
              <div className="rsec">
                <div className="rst">5. Gap summary &amp; priority remediation</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, margin: '0 0 16px' }}>
                  The following controls require remediation. They are sorted by regulatory risk priority:
                  Blocked → Needs Discussion → Pending Review → In Progress.
                </p>
                <table className="rtbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Control</th>
                      <th>Obligation</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th>Reg. Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapControls.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{c.oblId}</td>
                        <td style={{ fontSize: 13 }}>{c.name}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--slate)' }}>{resolveOblName(c.obl)}</td>
                        <td style={{ textAlign: 'center' }}><StatusInline status={c.status} /></td>
                        <td style={{ fontSize: 12, color: 'var(--slate)' }}>{c.req}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Recommendations roadmap */}
            {gapControls.length > 0 && (
              <div className="rsec">
                <div className="rst">6. Recommendations roadmap</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.7, margin: '0 0 16px' }}>
                  Remediation actions are grouped across three time horizons to support structured and
                  prioritized implementation.
                </p>
                {[
                  { key: 'immediate', label: 'Immediate Actions (0–30 Days)', cls: 'immediate', items: immediate },
                  { key: 'short',     label: 'Short-Term Actions (30–60 Days)', cls: 'short',     items: shortTerm },
                  { key: 'medium',    label: 'Medium-Term Actions (60–90 Days)', cls: 'medium',    items: mediumTerm },
                ].filter(b => b.items.length > 0).map(block => (
                  <div className="rmap-block" key={block.key}>
                    <div className={`rmap-hdr ${block.cls}`}>{block.label}</div>
                    <ul className="rmap-list">
                      {block.items.slice(0, ROADMAP_CAP).map((c, i) => (
                        <li key={c.id}>
                          <span className="rmap-num">{i + 1}</span>
                          <span>{c.recommendation?.trim() || c.name}</span>
                        </li>
                      ))}
                    </ul>
                    {block.items.length > ROADMAP_CAP && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 16px', borderTop: '1px solid var(--border-soft)' }}>
                        + {block.items.length - ROADMAP_CAP} more — see Gap Summary above.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 7. Assessment certification */}
            <div className="rcert" style={{ borderTop: '3px solid var(--green)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                7. Assessment certification
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.75, marginBottom: 18 }}>
                This DPDP Act 2023 Compliance Assessment Report was prepared in accordance with the
                provisions of the Digital Personal Data Protection Act, 2023 (No. 22 of 2023) and reflects
                the compliance posture of {company} as on {today}. The assessment was conducted by a
                qualified privacy professional holding the {reviewerCred} credential, issued by the
                International Association of Privacy Professionals (IAPP).
                {reportStatus === 'Interim'
                  ? ` This is an interim report. A final compliance certificate will be issued by Appzlogic GRC upon all ${controls.length} controls achieving 'Implemented' status and successful completion of final reviewer sign-off.`
                  : ' This report certifies full compliance with all assessed DPDP Act obligations.'}
              </div>

              <div className="rcert-grid">
                <div>
                  <div className="rcert-field-lbl">Reviewer Name</div>
                  <div className="rcert-field-val">{reviewerName}</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Organization assessed</div>
                  <div className="rcert-field-val">{company}</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Credential</div>
                  <div className="rcert-field-val">{reviewerCred}</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Report Status</div>
                  <div className="rcert-field-val" style={{ color: scText }}>{reportStatus}</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Organization</div>
                  <div className="rcert-field-val">Appzlogic GRC</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Compliance Score</div>
                  <div className="rcert-field-val" style={{ color: scText, fontSize: 18 }}>{score}%</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Date of Assessment</div>
                  <div className="rcert-field-val">{today}</div>
                </div>
                <div>
                  <div className="rcert-field-lbl">Controls Assessed</div>
                  <div className="rcert-field-val">{controls.length} controls across {oblRows.length} obligation{oblRows.length !== 1 ? 's' : ''}</div>
                </div>
              </div>

              <div className="rcert-sig">
                <div className="rcert-av">{reviewerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{reviewerName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{reviewerCred}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{
                    fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em', marginBottom: 2,
                  }}>
                    Authorized for Appzlogic GRC
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{today}</div>
                </div>
              </div>

              <div className="rcert-disclaimer">
                Disclaimer: This report is prepared solely for the use of {company} and Appzlogic GRC.
                It reflects the compliance posture based on evidence provided by the organization as of
                the assessment date. Appzlogic GRC does not accept liability for inaccuracies arising
                from incomplete or misleading information provided during assessment. This report does
                not constitute legal advice.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
