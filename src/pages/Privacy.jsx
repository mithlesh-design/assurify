import { useState, useEffect } from 'react';
import { Icons, Badge, Button, Progress } from '../ui';

function PrivacyDraft({ onReset, onAction }) {
  const [published, setPublished] = useState(false);

  return (
    <div className="page">
      <div className="two-col" style={{ alignItems: 'start' }}>
        <div className="card" style={{ position: 'sticky', top: 88 }}>
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Notice sections</h3>
              <div className="card-subtitle">DPDP Act Section 5 compliant</div>
            </div>
            <Badge tone="low" dot>Draft ready</Badge>
          </div>
          <div style={{ padding: '8px 8px 12px' }}>
            {[
              'Identity of Data Fiduciary',
              'Categories of personal data',
              'Purposes of processing',
              'Legal basis for processing',
              'Data Principal rights',
              'Withdrawal of consent',
              'Grievance officer',
              'Data Protection Board',
            ].map((s, i) => (
              <button key={s} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                fontSize: 13, color: i === 0 ? 'var(--primary-text)' : 'var(--text-muted)',
                background: i === 0 ? 'var(--primary-soft)' : 'transparent',
                width: '100%', textAlign: 'left', borderRadius: 6,
                fontWeight: i === 0 ? 600 : 500,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: 'var(--bg-elev)', border: '1px solid var(--border)',
                  display: 'grid', placeItems: 'center', fontSize: 10,
                  fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)',
                }}>{i + 1}</span>
                {s}
              </button>
            ))}
          </div>
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" icon={<Icons.Send size={14} />}
              onClick={() => { setPublished(true); onAction('Privacy notice published'); }}>
              {published ? 'Published ✓' : 'Publish notice'}
            </Button>
            <Button icon={<Icons.Download size={14} />}>Download PDF</Button>
            <Button variant="ghost" size="sm" icon={<Icons.Refresh size={13} />} onClick={onReset}>
              Regenerate
            </Button>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Privacy Notice — Acme Technologies Pvt Ltd</h3>
              <div className="card-subtitle">Generated 28 May 2026 · v1.0 · Effective on publish</div>
            </div>
            <Button size="sm" icon={<Icons.Edit size={13} />}>Edit</Button>
          </div>
          <div style={{ padding: '24px 28px', lineHeight: 1.65, color: 'var(--text-muted)', fontSize: 13.5 }}>
            <div style={{
              fontSize: 11.5, color: 'var(--text-subtle)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
            }}>Section 1 of 8</div>
            <h2 style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.01em', fontWeight: 600 }}>
              Identity of the Data Fiduciary
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--text)' }}>Acme Technologies Pvt Ltd</strong> (referred to as
              "Acme", "we", "us", or "our") is the Data Fiduciary responsible for the processing of your
              personal data under the Digital Personal Data Protection Act, 2023.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--text)' }}>Registered office:</strong> Block 4, Manyata Tech Park,
              Bengaluru, Karnataka, India 560045.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--text)' }}>Grievance Officer:</strong> Rajesh Kumar,
              dpo@acme.example, +91 80 4321 0000.
            </p>

            <div style={{
              background: 'var(--primary-soft)', border: '1px solid var(--primary-border)',
              padding: '12px 14px', borderRadius: 8, marginTop: 18,
              fontSize: 12.5, color: 'var(--primary-text)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Icons.Sparkles size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                Section identified <strong>14 data sources</strong> requiring disclosure. The next section will
                enumerate each category — scroll down to review.
              </span>
            </div>

            <h2 style={{ fontSize: 18, color: 'var(--text)', margin: '32px 0 12px', letterSpacing: '-0.01em', fontWeight: 600 }}>
              Categories of personal data processed
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              We process the following categories of personal data in connection with our services:
            </p>
            <ul style={{ margin: '0 0 12px', paddingLeft: 22 }}>
              <li><strong style={{ color: 'var(--text)' }}>Identity data:</strong> name, date of birth, gender.</li>
              <li><strong style={{ color: 'var(--text)' }}>Contact data:</strong> email, phone number, address.</li>
              <li><strong style={{ color: 'var(--text)' }}>Government identifiers:</strong> Aadhaar, PAN where required.</li>
              <li><strong style={{ color: 'var(--text)' }}>Financial data:</strong> payment instrument details processed via Razorpay.</li>
              <li><strong style={{ color: 'var(--text)' }}>Usage data:</strong> log files, device identifiers, telemetry.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PagePrivacy({ onAction }) {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state !== 'generating') return;
    let t = 0;
    const id = setInterval(() => {
      t += 4;
      if (t >= 100) {
        clearInterval(id);
        setProgress(100);
        setTimeout(() => setState('done'), 250);
      } else {
        setProgress(t);
      }
    }, 280);
    return () => clearInterval(id);
  }, [state]);

  const generate = () => {
    setProgress(0);
    setState('generating');
  };

  if (state === 'done') {
    return <PrivacyDraft onReset={() => setState('idle')} onAction={onAction} />;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 720, margin: '20px auto 0' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 20px',
            borderRadius: 16, background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'grid', placeItems: 'center',
            border: '1px solid var(--primary-border)',
            position: 'relative',
          }}>
            <Icons.File size={28} />
            {state === 'generating' && (
              <span style={{
                position: 'absolute', inset: -6, borderRadius: 18,
                border: '2px solid var(--primary)', borderTopColor: 'transparent',
                animation: 'spin 900ms linear infinite',
              }} />
            )}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 8px' }}>
            {state === 'generating' ? 'Drafting your privacy notice…' : 'Generate a DPDP Section 5 privacy notice'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 auto 24px', maxWidth: '44ch', lineHeight: 1.55 }}>
            {state === 'generating'
              ? 'Synthesising company profile, data inventory, and Section 5 requirements.'
              : 'AI generates a compliant notice from your company profile and data inventory. Review and edit before publishing.'}
          </p>

          {state === 'generating' ? (
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <Progress value={progress} tone="primary" thickness="thick" />
              <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                {progress < 25 ? 'Reading company profile…'
                  : progress < 50 ? 'Indexing 14 data sources…'
                  : progress < 80 ? 'Mapping to Section 5 requirements…'
                  : 'Composing final notice…'}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                {[
                  { i: <Icons.Building size={16} />, t: 'Company profile auto-filled' },
                  { i: <Icons.Database size={16} />, t: 'Data sources from inventory' },
                  { i: <Icons.Shield size={16} />, t: 'DPDP Section 5 template' },
                ].map((x, i) => (
                  <div key={i} style={{
                    padding: '14px 14px', border: '1px solid var(--border)',
                    borderRadius: 10, background: 'var(--bg)', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <span style={{ color: 'var(--primary)' }}>{x.i}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35 }}>{x.t}</span>
                  </div>
                ))}
              </div>
              <Button variant="primary" icon={<Icons.Sparkles size={15} />} onClick={generate}>
                Generate with AI
              </Button>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-subtle)' }}>
                Powered by Claude claude-sonnet-4-20250514 · ~15 seconds
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default PagePrivacy;
