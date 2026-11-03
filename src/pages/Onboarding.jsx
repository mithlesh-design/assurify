import { useState } from 'react';
import { useApp } from '../context/AppContext';

const STEPS = [
  { label: 'Company',   title: 'Tell us about your company',       sub: 'This helps us understand your DPDP context. All 29 controls load regardless of your answers.' },
  { label: 'Data',      title: 'What personal data do you collect?', sub: 'Select all that apply. Helps your reviewer prioritise high-risk controls first.' },
  { label: 'Practices', title: 'Current privacy measures',          sub: 'A quick snapshot of where you stand today.' },
  { label: 'Goals',     title: 'Your compliance goals',             sub: 'What are you trying to achieve with DPDP compliance?' },
  { label: 'Ready',     title: 'Your assessment is ready',          sub: 'All 29 DPDP controls loaded. Reviewer: Anshul Gupta CAPP.' },
];

const DATA_TYPES   = ['Name & email', 'Phone number', 'Aadhaar / PAN', 'Bank data', 'Health data', 'Location data', 'Biometric', 'Device IDs', 'Children data', 'HR data'];
const GOAL_OPTIONS = ['Achieve full DPDP compliance', 'Prepare for DPDP audit', 'Respond to regulatory enquiry', 'Improve customer trust', 'Board requirement', 'Prevent DPB penalties'];

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 7V11M7 9H11" stroke="#00C853" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function Onboarding() {
  const { completeOnboarding, controls } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    company:    'Acme Technologies',
    industry:   'SaaS / Technology',
    size:       '51–200',
    dataTypes:  ['Name & email', 'Phone number', 'Aadhaar / PAN'],
    practices:  {},
    goals:      ['Achieve full DPDP compliance'],
  });

  const toggle = (key, val) => setForm(f => {
    const arr = f[key];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    return { ...f, [key]: next };
  });

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const finish = () => completeOnboarding(form);

  const impl = controls.filter(c => c.status === 'implemented').length;

  return (
    <div className="ob-root">
      <div className="ob-wrap">
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, background: 'var(--green)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark /></div>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>Appzlogic</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="ob-progress">
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div className={`ob-step ${i < step ? 'done' : i === step ? 'current' : ''}`}>
                <div className="ob-step-dot">
                  {i < step ? '✓' : i + 1}
                </div>
                <div className="ob-step-label">{s.label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`ob-connector${i < step ? ' done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="ob-card">
          <h2 className="ob-title">{STEPS[step].title}</h2>
          <p className="ob-sub">{STEPS[step].sub}</p>

          {/* Step 0 — Company */}
          {step === 0 && (
            <div>
              <div className="ob-field">
                <label className="ob-label">Company name</label>
                <input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="ob-field">
                <label className="ob-label">Industry</label>
                <select className="input" style={{ height: 42 }} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                  {['E-commerce', 'Fintech', 'Healthcare', 'SaaS / Technology', 'BFSI', 'Manufacturing', 'Other'].map(v =>
                    <option key={v}>{v}</option>
                  )}
                </select>
              </div>
              <div className="ob-field">
                <label className="ob-label">Employees</label>
                <div className="ob-options-grid">
                  {['1–50', '51–200', '201–500', '500+'].map(v => (
                    <label key={v} className={`ob-option${form.size === v ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, size: v }))}>
                      <input type="radio" name="size" checked={form.size === v} readOnly /> {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Data types */}
          {step === 1 && (
            <div className="ob-options-grid">
              {DATA_TYPES.map(v => (
                <label key={v} className={`ob-option${form.dataTypes.includes(v) ? ' selected' : ''}`} onClick={() => toggle('dataTypes', v)}>
                  <input type="checkbox" checked={form.dataTypes.includes(v)} readOnly /> {v}
                </label>
              ))}
            </div>
          )}

          {/* Step 2 — Practices */}
          {step === 2 && (
            <div>
              {[
                'Do you have a privacy notice?',
                'Have you appointed a Grievance Officer?',
                'Do you have a data breach response plan?',
                'Do you process children\'s data?',
                'Do you transfer data outside India?',
              ].map((q, i) => {
                const k = 'q' + i;
                return (
                  <div key={i} className="ob-field">
                    <label className="ob-label">{q}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Yes', 'No'].map(opt => (
                        <label
                          key={opt}
                          className={`ob-option${form.practices[k] === (opt === 'Yes') ? ' selected' : ''}`}
                          style={{ flex: 1 }}
                          onClick={() => setForm(f => ({ ...f, practices: { ...f.practices, [k]: opt === 'Yes' } }))}
                        >
                          <input type="radio" checked={form.practices[k] === (opt === 'Yes')} readOnly /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div className="ob-options-grid">
              {GOAL_OPTIONS.map(v => (
                <label key={v} className={`ob-option${form.goals.includes(v) ? ' selected' : ''}`} onClick={() => toggle('goals', v)}>
                  <input type="checkbox" checked={form.goals.includes(v)} readOnly /> {v}
                </label>
              ))}
            </div>
          )}

          {/* Step 4 — Ready */}
          {step === 4 && (
            <div>
              <div className="ob-summary-grid">
                <div className="ob-summary-item"><div className="ob-summary-key">Company</div><div className="ob-summary-val">{form.company}</div></div>
                <div className="ob-summary-item"><div className="ob-summary-key">Industry</div><div className="ob-summary-val">{form.industry}</div></div>
                <div className="ob-summary-item"><div className="ob-summary-key">Employees</div><div className="ob-summary-val">{form.size}</div></div>
                <div className="ob-summary-item"><div className="ob-summary-key">Data subjects</div><div className="ob-summary-val">~10,000–100,000</div></div>
              </div>
              <div style={{ background: 'var(--green-soft)', border: '1px solid var(--green-mid)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginTop: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>✓ Assessment ready</div>
                <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65 }}>
                  <strong>29 DPDP controls</strong> loaded. <strong>{impl} controls</strong> already have documentation.
                  Reviewer: <strong>Anshul Gupta, CAPP</strong>. All controls start as <strong>Pending Review</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="ob-nav">
            {step > 0
              ? <button className="btn btn-ghost" onClick={back}>← Back</button>
              : <div />
            }
            {step < STEPS.length - 1
              ? <button className="btn btn-primary" onClick={next}>Continue →</button>
              : <button className="btn btn-primary" onClick={finish}>View my assessment →</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
