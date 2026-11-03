import { useState } from 'react';
import { Icons, Badge, Button, StatTile } from '../ui';

const DEFAULT_PURPOSES = [
  { id: 'p1', label: 'Essential data processing', required: true, checked: true,
    desc: 'Account, security, fraud prevention' },
  { id: 'p2', label: 'Marketing communications', checked: false,
    desc: 'Email and SMS campaigns' },
  { id: 'p3', label: 'Product analytics & improvement', checked: false,
    desc: 'Usage telemetry, performance' },
  { id: 'p4', label: 'Third-party sharing (Salesforce, HubSpot)', checked: false,
    desc: 'Sync with CRM and marketing tools' },
  { id: 'p5', label: 'Personalisation & recommendations', checked: false,
    desc: 'Tailored content based on behaviour' },
];

function PageConsent({ onAction }) {
  const [tab, setTab] = useState('builder');
  const [purposes, setPurposes] = useState(DEFAULT_PURPOSES);
  const [bannerTitle, setBannerTitle] = useState('We value your privacy');
  const [bannerDesc, setBannerDesc] = useState(
    'Acme Technologies processes your data under the DPDP Act, 2023.'
  );

  const togglePurpose = (id) => {
    setPurposes((p) => p.map((x) => x.id === id && !x.required ? { ...x, checked: !x.checked } : x));
  };

  return (
    <div className="page">
      <div className="stat-grid">
        <StatTile label="Total consents" value="0" tone="danger" />
        <StatTile label="Accepted" value="0" />
        <StatTile label="Declined" value="0" />
        <StatTile label="Withdrawn" value="0" tone="ok" />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="banner danger">
          <div className="banner-icon"><Icons.Alert size={16} /></div>
          <div className="banner-body">
            <h4 className="banner-title">No consent records — action required</h4>
            <p className="banner-desc">
              Install the embed code on your website to start capturing consent under the DPDP Act.
            </p>
          </div>
          <Button variant="primary" icon={<Icons.Code size={14} />}
            onClick={() => onAction('Embed code copied to clipboard')}>
            Get embed code
          </Button>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 22, marginBottom: 18 }}>
        <button className={`tab${tab === 'builder' ? ' active' : ''}`} onClick={() => setTab('builder')}>
          <Icons.Settings size={14} /> Widget builder
        </button>
        <button className={`tab${tab === 'records' ? ' active' : ''}`} onClick={() => setTab('records')}>
          <Icons.Eye size={14} /> Consent records
        </button>
        <button className={`tab${tab === 'audit' ? ' active' : ''}`} onClick={() => setTab('audit')}>
          <Icons.Clock size={14} /> Audit log
        </button>
      </div>

      {tab === 'builder' && (
        <div className="two-col-balanced">
          <div className="card">
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <h3 className="card-title">Consent purposes</h3>
                <div className="card-subtitle">Toggle purposes shown in the consent widget</div>
              </div>
              <Button size="sm" icon={<Icons.Plus size={14} />}>Add purpose</Button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {purposes.map((p) => (
                <div
                  key={p.id}
                  className={`checkbox-row${p.checked ? ' checked' : ''}${p.required ? ' required' : ''}`}
                  onClick={() => togglePurpose(p.id)}
                >
                  <div className={`checkbox${p.checked ? ' checked' : ''}`}>
                    {p.checked && <Icons.Check size={11} />}
                  </div>
                  <div className="checkbox-row-body">
                    <div className="checkbox-row-title">
                      {p.label}
                      {p.required && (
                        <span style={{ fontSize: 12, marginLeft: 8, color: 'var(--text-subtle)', fontWeight: 500 }}>
                          · Required
                        </span>
                      )}
                    </div>
                    <div className="checkbox-row-sub">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <h4 className="card-title" style={{ marginBottom: 10 }}>Banner copy</h4>
              <label className="field-label">Headline</label>
              <input className="input" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
              <div style={{ height: 12 }} />
              <label className="field-label">Description</label>
              <textarea className="textarea" rows="3" value={bannerDesc}
                onChange={(e) => setBannerDesc(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="section-header" style={{ margin: '0 0 12px' }}>
              <h3>Live preview</h3>
              <span className="badge badge-info">Updates as you edit</span>
            </div>
            <div style={{
              background: 'oklch(95% 0.005 240)', padding: 28, borderRadius: 12,
              border: '1px dashed var(--border-strong)',
            }}>
              <div className="consent-preview">
                <div className="consent-preview-header" />
                <h4 className="consent-preview-title">{bannerTitle || 'We value your privacy'}</h4>
                <p className="consent-preview-desc">{bannerDesc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {purposes.map((p) => (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: 12.5, color: 'var(--text)',
                      opacity: p.required ? 0.7 : 1, cursor: p.required ? 'not-allowed' : 'pointer',
                    }}>
                      <div className={`checkbox${p.checked ? ' checked' : ''}`} style={{ width: 14, height: 14, borderRadius: 4 }}>
                        {p.checked && <Icons.Check size={9} />}
                      </div>
                      <span>{p.label}</span>
                      {p.required && <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>(required)</span>}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Button variant="primary" size="sm" style={{ justifyContent: 'center', width: '100%' }}>
                    Accept selected
                  </Button>
                  <Button size="sm" style={{ justifyContent: 'center', width: '100%' }}>
                    Decline optional
                  </Button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 12, textAlign: 'center' }}>
                  Powered by <span style={{ fontWeight: 600 }}>Appzlogic</span> · Section 5 compliant
                </div>
              </div>
            </div>
            <div style={{
              marginTop: 14, padding: 14, background: 'var(--bg-elev)',
              border: '1px solid var(--border)', borderRadius: 8,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Icons.Code size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Embed code</div>
                <code style={{
                  display: 'block', fontFamily: 'var(--font-mono)',
                  fontSize: 12, background: 'var(--bg)', padding: '8px 10px',
                  borderRadius: 6, color: 'var(--text-muted)', overflowX: 'auto',
                  border: '1px solid var(--border)',
                }}>
                  &lt;script src="//cdn.appzlogic.io/consent/v1.js" data-key="acme_prod"&gt;&lt;/script&gt;
                </code>
              </div>
              <Button size="sm" icon={<Icons.Copy size={13} />} onClick={() => onAction('Embed code copied')}>
                Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Icons.Eye size={24} /></div>
            <h3 className="empty-title">No consent records yet</h3>
            <p className="empty-desc">
              Once the embed code is live, consent decisions will appear here in real-time
              along with timestamp, IP, user-agent, and the purposes accepted.
            </p>
            <div className="empty-features">
              <div className="empty-feature">
                <strong>Tamper-evident log</strong><br />
                <span style={{ color: 'var(--text-subtle)' }}>Hash-chained records</span>
              </div>
              <div className="empty-feature">
                <strong>Export &amp; replay</strong><br />
                <span style={{ color: 'var(--text-subtle)' }}>CSV / JSON download</span>
              </div>
              <div className="empty-feature">
                <strong>Section 7 ready</strong><br />
                <span style={{ color: 'var(--text-subtle)' }}>Withdrawal trail</span>
              </div>
            </div>
            <Button variant="primary" icon={<Icons.Code size={14} />}
              onClick={() => onAction('Embed code copied to clipboard')}>
              Get embed code
            </Button>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Icons.Clock size={24} /></div>
            <h3 className="empty-title">Audit log</h3>
            <p className="empty-desc">
              Configuration changes (purposes added/removed, banner copy edits, embed key rotations)
              will be tracked here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageConsent;
