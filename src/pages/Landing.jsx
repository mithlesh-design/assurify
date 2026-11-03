import { Icons } from '../ui';

function BrandLogo() {
  return (
    <img
      src="/AssurifyLogo.svg"
      alt="Assurify"
      style={{ height: 34, width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  );
}

function AdminPreviewCard() {
  return (
    <div className="lp-hcard">
      <div className="lp-score-row">
        <div className="lp-ring-wrap">
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-soft)" strokeWidth="6"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--green)" strokeWidth="6"
              strokeDasharray="201" strokeDashoffset="101" strokeLinecap="round"/>
          </svg>
          <div className="lp-ring-text">
            <span className="lp-ring-val">50%</span>
            <span className="lp-ring-lbl">avg. score</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="lp-score-title">Platform overview</div>
          {[
            { name: '5 customers',    pct: 60, color: 'var(--green)' },
            { name: '30 controls',    pct: 45, color: 'var(--risk-med-solid)' },
            { name: '2 blocked',      pct: 15, color: 'var(--risk-high-solid)' },
          ].map(b => (
            <div key={b.name} className="lp-bar-row">
              <span className="lp-bar-name">{b.name}</span>
              <div className="lp-bar-track">
                <div className="lp-bar-fill" style={{ width: `${b.pct}%`, background: b.color }}/>
              </div>
              <span className="lp-bar-pct">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {[
        {
          bg: '#FEE2E2', icon: <Icons.Alert size={15} style={{ color: '#B91C1C' }} />,
          label: 'Aadhaar — no legal basis · Blocked',
          sub: 'OBL3-C3 · Reviewer flagged',
          badge: 'Critical', badgeClass: 'badge badge-high',
        },
        {
          bg: 'var(--risk-med-bg)', icon: <Icons.Edit size={15} style={{ color: '#92400E' }} />,
          label: 'Privacy notice — needs revision',
          sub: 'OBL1-C1 · Reviewer commented',
          badge: 'Review', badgeClass: 'badge badge-med',
        },
        {
          bg: 'var(--green-soft)', icon: <Icons.Check size={15} style={{ color: 'var(--green-dim)' }} />,
          label: 'Privacy policy v3 — approved',
          sub: 'OBL2-C1 · Implemented',
          badge: 'Done', badgeClass: 'badge badge-low',
        },
      ].map((fi, i) => (
        <div key={i} className="lp-fi-row">
          <div className="lp-fi-ic" style={{ background: fi.bg }}>{fi.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lp-fi-label">{fi.label}</div>
            <div className="lp-fi-sub">{fi.sub}</div>
          </div>
          <span className={fi.badgeClass}>{fi.badge}</span>
        </div>
      ))}

      <div className="lp-hcard-footer">Sign in to review all 30 controls</div>
    </div>
  );
}

export default function Landing({ onLogin }) {
  return (
    <div className="lp-root">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <BrandLogo />
          </div>
          <button type="button" className="btn btn-primary" onClick={onLogin}>
            Sign in <Icons.ChevronRight size={16} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="lp-hero">
        <div>
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-dot"/>
            India DPDP Act 2023 · Expert reviewed
          </div>

          <h1 className="lp-h1">
            Your <span className="lp-gc">compliance</span><br/>
            journey,<br/>
            simplified
          </h1>

          <p className="lp-sub">
            Manage privacy, security, and regulatory compliance across DPDP, ISO 27001, SOC 2, NIST,
            and more — from a single intelligent platform.
          </p>

          <div className="lp-cta-btns">
            <button type="button" className="btn btn-primary lp-cta" onClick={onLogin}>
              Sign in to your workspace <Icons.ChevronRight size={16} />
            </button>
          </div>

          <div className="lp-proof">
            <div>
              <div className="lp-proof-num">80+</div>
              <div className="lp-proof-lbl">Controls across<br/>8 DPDP obligations</div>
            </div>
            <div className="lp-proof-div"/>
            <div>
              <div className="lp-proof-num">100%</div>
              <div className="lp-proof-lbl">DPDP Act<br/>obligation coverage</div>
            </div>
            <div className="lp-proof-div"/>
            <div>
              <div className="lp-proof-num">CIPP/E</div>
              <div className="lp-proof-lbl">Certified reviewers<br/>on every account</div>
            </div>
          </div>
        </div>

        <AdminPreviewCard />
      </div>

      {/* ── Feature cards ── */}
      <div className="lp-features">
        {[
          {
            icon: <Icons.Upload size={20} />,
            title: 'Upload evidence',
            desc: 'Upload PDFs, policies, and screenshots for each control. Files are versioned and time-stamped automatically.',
          },
          {
            icon: <Icons.Users size={20} />,
            title: 'Collaborate with reviewers',
            desc: 'Your CIPP/E-certified reviewer leaves inline comments on each control. Respond, revise, and resubmit — all in one thread.',
          },
          {
            icon: <Icons.Chart size={20} />,
            title: 'Track your score',
            desc: 'Watch your compliance score improve in real time as controls are verified and approved. No spreadsheets needed.',
          },
          {
            icon: <Icons.Report size={20} />,
            title: 'Generate an audit report',
            desc: 'Download a certified compliance report once all controls are complete — ready to share with regulators or customers.',
          },
        ].map(f => (
          <div key={f.title} className="lp-feature-card">
            <div className="lp-feature-icon">{f.icon}</div>
            <div className="lp-feature-title">{f.title}</div>
            <div className="lp-feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Footer CTA ── */}
      <div className="lp-footer-cta">
        <div className="lp-footer-cta-inner">
          <div>
            <h2 className="lp-footer-h2">Ready to start your compliance journey?</h2>
            <p className="lp-footer-p">Join organizations already using Assurify to manage DPDP, ISO 27001, SOC 2, and more.</p>
          </div>
          <button type="button" className="btn btn-primary lp-cta" onClick={onLogin}>
            Sign in <Icons.ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
