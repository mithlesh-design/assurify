import { useMemo, useState } from 'react';
import { Icons } from '../ui';

const INITIAL_BREACHES = [
  {
    id: 'BR-2026-004',
    title: 'Unauthorised access to customer support exports',
    system: 'Customer support platform',
    type: 'Unauthorised access',
    status: 'Under investigation',
    severity: 'High',
    discovered: '21 Oct 2026',
    deadline: '23 Oct 2026',
    people: '1,240',
    description: 'An unusual download pattern was flagged in a support export workspace. Access has been contained while the investigation confirms the scope.',
    source: 'Security monitoring',
    owner: 'Security · A. Mehta',
  },
  {
    id: 'BR-2026-003',
    title: 'Customer records sent to an incorrect recipient',
    system: 'CRM',
    type: 'Data disclosure',
    status: 'Notification pending',
    severity: 'High',
    discovered: '18 Oct 2026',
    deadline: '20 Oct 2026',
    people: '86',
    description: 'A support attachment containing customer contact information was sent to an unintended external recipient.',
    source: 'Customer complaint',
    owner: 'Privacy · P. Shah',
  },
  {
    id: 'BR-2026-002',
    title: 'Temporary exposure of analytics workspace',
    system: 'Analytics workspace',
    type: 'Misconfiguration',
    status: 'Under triage',
    severity: 'Medium',
    discovered: '12 Oct 2026',
    deadline: '—',
    people: '320',
    description: 'A workspace permission setting may have exposed pseudonymised product analytics to a wider internal group.',
    source: 'Internal audit',
    owner: 'IT · R. Iyer',
  },
  {
    id: 'BR-2026-001',
    title: 'Lost device containing encrypted employee data',
    system: 'Endpoint device',
    type: 'Lost device',
    status: 'Closed',
    severity: 'Low',
    discovered: '02 Oct 2026',
    deadline: '—',
    people: '14',
    description: 'An employee laptop was reported missing. Device encryption and remote lock were confirmed; no unauthorised access was detected.',
    source: 'Employee report',
    owner: 'IT · N. Kapoor',
  },
];

const STATUS_OPTIONS = ['All statuses', 'Reported', 'Under triage', 'Under investigation', 'Notification pending', 'Closed'];
const INCIDENT_TYPES = ['API exposure', 'Unauthorised access', 'Data disclosure', 'Misconfiguration', 'Lost device', 'Ransomware', 'Other'];
const SOURCES = ['Security monitoring', 'Customer complaint', 'Employee report', 'Internal audit', 'Vendor notification', 'Other'];
const DATA_CATEGORIES = ['Identity & contact', 'Financial information', 'Account credentials', 'Health information', 'Location data', 'Employee records'];
const SYSTEMS = ['Customer support platform', 'CRM', 'Analytics workspace', 'Payment platform', 'HR information system'];
const PROCESSORS = ['Cloud hosting provider', 'Customer support provider', 'Payment processor'];
const ACTIVITIES = ['Customer support', 'Account management', 'Payment processing', 'Workforce administration'];

function localDateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function StatusBadge({ status }) {
  const tone = status === 'Closed' ? 'success' : status === 'Notification pending' ? 'danger' : status === 'Under investigation' ? 'warning' : 'info';
  return <span className={`breach-status breach-status-${tone}`}><i />{status}</span>;
}

function SeverityBadge({ severity }) {
  const tone = severity.toLowerCase();
  return <span className={`breach-severity breach-severity-${tone}`}><i />{severity}</span>;
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className={`breach-metric breach-metric-${tone}`}>
      <div className="breach-metric-top">
        <span className="breach-metric-icon"><Icon size={17} /></span>
        <span className="breach-metric-note">{note}</span>
      </div>
      <div className="breach-metric-value">{value}</div>
      <div className="breach-metric-label">{label}</div>
    </div>
  );
}

function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`breach-field ${className}`}>
      <span className="breach-field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ChoiceGrid({ options, selected, onToggle }) {
  return (
    <div className="breach-choice-grid">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button key={option} type="button" className={`breach-choice${active ? ' selected' : ''}`} onClick={() => onToggle(option)}>
            <span className="breach-choice-check">{active && <Icons.Check size={12} />}</span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function BreachWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', incidentType: 'API exposure', source: 'Security monitoring',
    discovered: localDateValue(), occurred: '', system: '', status: 'Suspected security incident',
    impact: 'Confidentiality', people: '', records: '', awareAt: '', rationale: '',
    dataCategories: [], processors: [], activities: [], principals: [], personalData: [],
  });
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggle = (key, value) => update(key, form[key].includes(value) ? form[key].filter(item => item !== value) : [...form[key], value]);
  const steps = ['Details & classification', 'Responsibility & scope', 'Review'];

  function createIncident() {
    onCreate({
      id: `BR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      title: form.title.trim(),
      system: form.system || 'System to be confirmed',
      type: form.incidentType,
      status: 'Reported',
      severity: Number(form.people) >= 1000 ? 'High' : 'Medium',
      discovered: new Date(`${form.discovered}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      deadline: 'To be assessed',
      people: form.people ? Number(form.people).toLocaleString('en-IN') : 'Not assessed',
      description: form.description.trim(),
      source: form.source,
      owner: 'Privacy · Unassigned',
    });
  }

  return (
    <div className="breach-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="breach-wizard" role="dialog" aria-modal="true" aria-labelledby="breach-wizard-title">
        <header className="breach-wizard-header">
          <div className="breach-wizard-heading">
            <span className="breach-wizard-icon"><Icons.Alert size={18} /></span>
            <div><span className="breach-eyebrow">INCIDENT INTAKE</span><h2 id="breach-wizard-title">Report a data breach</h2></div>
          </div>
          <button type="button" className="breach-icon-button" onClick={onClose} aria-label="Close report form"><Icons.X size={18} /></button>
        </header>
        <div className="breach-stepper" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((label, index) => (
            <div className={`breach-step${index === step ? ' active' : ''}${index < step ? ' complete' : ''}`} key={label}>
              <span>{index < step ? <Icons.Check size={13} /> : `0${index + 1}`}</span><b>{label}</b>
            </div>
          ))}
        </div>
        <div className="breach-wizard-body">
          {step === 0 && (
            <div className="breach-form-section">
              <div className="breach-section-heading"><span className="breach-section-icon"><Icons.Clipboard size={17} /></span><div><h3>Incident details</h3><p>Start with what happened and how it came to light.</p></div></div>
              <div className="breach-form-grid">
                <Field label="Incident title" className="span-2"><input autoFocus value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Unauthorised access to customer records" /></Field>
                <Field label="Description" className="span-2"><textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe what is known so far. You can update this as the investigation progresses." rows={3} /></Field>
                <Field label="Incident type"><select value={form.incidentType} onChange={e => update('incidentType', e.target.value)}>{INCIDENT_TYPES.map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="How was this discovered?"><select value={form.source} onChange={e => update('source', e.target.value)}>{SOURCES.map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Date discovered"><input type="date" value={form.discovered} onChange={e => update('discovered', e.target.value)} /></Field>
                <Field label="Date incident occurred"><input type="date" value={form.occurred} onChange={e => update('occurred', e.target.value)} /></Field>
                <Field label="System / process affected" className="span-2"><select value={form.system} onChange={e => update('system', e.target.value)}><option value="">Select a system or process</option>{SYSTEMS.map(item => <option key={item}>{item}</option>)}</select></Field>
              </div>
              <div className="breach-section-heading classification-heading"><span className="breach-section-icon purple"><Icons.Shield size={17} /></span><div><h3>Initial classification</h3><p>Record an initial view. These details can be refined during triage.</p></div></div>
              <div className="breach-form-grid">
                <Field label="Classification status"><select value={form.status} onChange={e => update('status', e.target.value)}><option>Suspected security incident</option><option>Confirmed personal data breach</option><option>Not a personal data breach</option><option>Under assessment</option></select></Field>
                <Field label="Potential impact"><select value={form.impact} onChange={e => update('impact', e.target.value)}><option>Confidentiality</option><option>Integrity</option><option>Availability</option><option>Multiple impact types</option><option>Under assessment</option></select></Field>
                <Field label="Estimated people affected"><input type="number" min="0" value={form.people} onChange={e => update('people', e.target.value)} placeholder="e.g. 1200" /></Field>
                <Field label="Estimated records affected"><input type="number" min="0" value={form.records} onChange={e => update('records', e.target.value)} placeholder="e.g. 2400" /></Field>
                <Field label="Became aware at"><input type="datetime-local" value={form.awareAt} onChange={e => update('awareAt', e.target.value)} /></Field>
                <Field label="Classification rationale" className="span-2"><textarea value={form.rationale} onChange={e => update('rationale', e.target.value)} placeholder="Add the reasoning behind your initial classification." rows={2} /></Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="breach-form-section">
              <div className="breach-section-heading"><span className="breach-section-icon teal"><Icons.Share size={17} /></span><div><h3>Responsibility & affected scope</h3><p>Map the parties and data potentially involved. Select any that apply.</p></div></div>
              <div className="breach-flow">
                <div className="breach-flow-column"><div className="breach-flow-label">YOUR ORGANISATION</div><div className="breach-flow-node primary-node"><span className="breach-flow-node-icon"><Icons.Building size={16} /></span><div><b>Appzlogic Mobility Solutions</b><small>Data fiduciary</small></div><Icons.Check size={15} /></div><div className="breach-flow-hint">Incident owner · Privacy team</div></div>
                <div className="breach-flow-connector"><span /><Icons.ChevronRight size={15} /><span /></div>
                <div className="breach-flow-column"><div className="breach-flow-label">DATA PROCESSORS</div><ChoiceGrid options={PROCESSORS} selected={form.processors} onToggle={value => toggle('processors', value)} /></div>
                <div className="breach-flow-connector"><span /><Icons.ChevronRight size={15} /><span /></div>
                <div className="breach-flow-column"><div className="breach-flow-label">PROCESSING ACTIVITIES</div><ChoiceGrid options={ACTIVITIES} selected={form.activities} onToggle={value => toggle('activities', value)} /></div>
              </div>
              <div className="breach-scope-grid">
                <div className="breach-scope-card"><div className="breach-scope-card-title"><span className="breach-scope-mark green"><Icons.Users size={15} /></span><div><b>Affected people</b><small>Who may be impacted?</small></div></div><ChoiceGrid options={['Customers', 'Employees', 'Vendors', 'Children']} selected={form.principals} onToggle={value => toggle('principals', value)} /></div>
                <div className="breach-scope-card"><div className="breach-scope-card-title"><span className="breach-scope-mark amber"><Icons.Database size={15} /></span><div><b>Personal data involved</b><small>What data may be affected?</small></div></div><ChoiceGrid options={DATA_CATEGORIES} selected={form.personalData} onToggle={value => toggle('personalData', value)} /></div>
              </div>
              <div className="breach-info-callout"><Icons.Lock size={16} /><span>Scope selections are for initial triage only. Confirmed affected parties and data can be updated as facts emerge.</span></div>
            </div>
          )}
          {step === 2 && (
            <div className="breach-review">
              <div className="breach-review-banner"><span><Icons.Shield size={20} /></span><div><b>Take a moment to review</b><p>This creates a local draft in the breach register. You can refine the details later.</p></div></div>
              <div className="breach-review-card">
                <div className="breach-review-title"><div><span className="breach-eyebrow">INCIDENT SUMMARY</span><h3>{form.title || 'Untitled incident'}</h3></div><SeverityBadge severity={Number(form.people) >= 1000 ? 'High' : 'Medium'} /></div>
                <p className="breach-review-description">{form.description || 'No description provided.'}</p>
                <div className="breach-review-grid">
                  <div><small>Incident type</small><b>{form.incidentType}</b></div><div><small>Source</small><b>{form.source}</b></div>
                  <div><small>System / process</small><b>{form.system || 'To be confirmed'}</b></div><div><small>Date discovered</small><b>{form.discovered || 'Not provided'}</b></div>
                  <div><small>Potential impact</small><b>{form.impact}</b></div><div><small>People affected</small><b>{form.people ? Number(form.people).toLocaleString('en-IN') : 'Not assessed'}</b></div>
                </div>
              </div>
              <div className="breach-review-card scope-review"><div className="breach-eyebrow">RESPONSIBILITY & SCOPE</div><div className="breach-review-grid">
                <div><small>Processors</small><b>{form.processors.join(', ') || 'None selected'}</b></div><div><small>Processing activities</small><b>{form.activities.join(', ') || 'None selected'}</b></div>
                <div><small>Affected people</small><b>{form.principals.join(', ') || 'To be assessed'}</b></div><div><small>Personal data</small><b>{form.personalData.join(', ') || 'To be assessed'}</b></div>
              </div></div>
              <div className="breach-info-callout"><Icons.Clock size={16} /><span>Notification requirements and deadlines should be assessed by your privacy team based on confirmed facts and applicable law.</span></div>
            </div>
          )}
        </div>
        <footer className="breach-wizard-footer">
          <span className="breach-step-caption">STEP {step + 1} <i>/</i> {steps.length}</span>
          <div>
            {step > 0 && <button type="button" className="breach-button secondary" onClick={() => setStep(current => current - 1)}><Icons.ChevronLeft size={15} />Back</button>}
            {step < 2 ? <button type="button" className="breach-button primary" disabled={step === 0 && !form.title.trim()} onClick={() => setStep(current => current + 1)}>Continue<Icons.ChevronRight size={15} /></button> : <button type="button" className="breach-button primary" disabled={!form.title.trim()} onClick={createIncident}><Icons.Check size={15} />Create breach record</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}

function DetailPanel({ breach, onClose }) {
  if (!breach) return null;
  return (
    <div className="breach-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="breach-detail-modal" role="dialog" aria-modal="true" aria-labelledby="breach-detail-title">
        <div className="breach-detail-head"><div><span className="breach-eyebrow">{breach.id}</span><h2 id="breach-detail-title">{breach.title}</h2></div><button type="button" className="breach-icon-button" onClick={onClose} aria-label="Close incident details"><Icons.X size={18} /></button></div>
        <div className="breach-detail-badges"><StatusBadge status={breach.status} /><SeverityBadge severity={breach.severity} /></div>
        <p className="breach-detail-description">{breach.description}</p>
        <div className="breach-review-grid">
          <div><small>System / process</small><b>{breach.system}</b></div><div><small>Incident type</small><b>{breach.type}</b></div>
          <div><small>Discovered</small><b>{breach.discovered}</b></div><div><small>Board deadline</small><b>{breach.deadline}</b></div>
          <div><small>Estimated people affected</small><b>{breach.people}</b></div><div><small>Reported by</small><b>{breach.source}</b></div>
          <div><small>Incident owner</small><b>{breach.owner}</b></div>
        </div>
        <div className="breach-detail-note"><Icons.Lock size={16} />Incident records are currently stored in this session only.</div>
      </section>
    </div>
  );
}

export default function DataBreach({ onAction = () => {} }) {
  const [breaches, setBreaches] = useState(INITIAL_BREACHES);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [severity, setSeverity] = useState('All severity');
  const [type, setType] = useState('All incident types');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState(null);

  const filtered = useMemo(() => breaches.filter(item => {
    const text = `${item.id} ${item.title} ${item.system} ${item.description}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (status === 'All statuses' || item.status === status)
      && (severity === 'All severity' || item.severity === severity)
      && (type === 'All incident types' || item.type === type);
  }), [breaches, query, status, severity, type]);
  const openCount = breaches.filter(item => item.status !== 'Closed').length;
  const highCount = breaches.filter(item => item.severity === 'High' && item.status !== 'Closed').length;
  const pendingCount = breaches.filter(item => item.status === 'Notification pending').length;
  const resetFilters = () => { setQuery(''); setStatus('All statuses'); setSeverity('All severity'); setType('All incident types'); };
  const createBreach = (record) => {
    setBreaches(current => [record, ...current]);
    setWizardOpen(false);
    onAction('Breach record created locally.');
  };

  return (
    <main className="breach-page">
      <section className="breach-hero">
        <div className="breach-hero-content">
          <div className="breach-hero-kicker"><span /><span>INCIDENT RESPONSE, IN ONE PLACE</span></div>
          <h2>Stay ahead of<br /><em>every incident.</em></h2>
          <p>A clear view of reported breaches, investigation progress, and the next action your team needs to take.</p>
          <div className="breach-hero-actions">
            <button type="button" className="breach-hero-button" onClick={() => setWizardOpen(true)}><Icons.Plus size={16} />Report a breach<Icons.ChevronRight size={15} /></button>
            <span><Icons.Lock size={13} />Private incident workspace</span>
          </div>
        </div>
        <div className="breach-hero-art" aria-hidden="true">
          <div className="breach-orbit orbit-one" /><div className="breach-orbit orbit-two" /><div className="breach-orbit orbit-three" />
          <div className="breach-hero-shield"><Icons.Shield size={54} /><span><Icons.Check size={19} /></span></div>
          <div className="breach-art-chip chip-top"><span className="pulse-dot" />Response centre <b>ACTIVE</b></div>
          <div className="breach-art-chip chip-bottom"><Icons.Clock size={15} /><span><b>{openCount} active</b><small>incidents in progress</small></span></div>
          <div className="breach-art-spark spark-one" /><div className="breach-art-spark spark-two" />
        </div>
        <div className="breach-hero-footer"><span>DPDPA INCIDENT REGISTER</span><span><span className="breach-live-dot" /> WORKSPACE READY</span></div>
      </section>

      <div className="breach-page-heading"><div><span className="breach-eyebrow">YOUR RESPONSE AT A GLANCE</span><h2>Incident overview</h2></div><span className="breach-updated"><Icons.Refresh size={13} /> Updated just now</span></div>
      <section className="breach-metrics" aria-label="Breach metrics">
        <MetricCard icon={Icons.Clipboard} label="Total reported" value={breaches.length} note="All time" tone="blue" />
        <MetricCard icon={Icons.Pulse} label="In progress" value={openCount} note="Needs attention" tone="teal" />
        <MetricCard icon={Icons.Alert} label="High severity" value={highCount} note="Priority review" tone="rose" />
        <MetricCard icon={Icons.Bell} label="Notifications pending" value={pendingCount} note="Action required" tone="amber" />
      </section>

      <section className="breach-register">
        <div className="breach-register-head">
          <div><div className="breach-register-title"><span className="breach-register-mark"><Icons.Shield size={16} /></span><h2>Breach register</h2><span className="breach-record-count">{breaches.length}</span></div><p>Log, review, and track data breach incidents under DPDPA.</p></div>
          <button type="button" className="breach-button primary register-add" onClick={() => setWizardOpen(true)}><Icons.Plus size={15} />Report new breach</button>
        </div>
        <div className="breach-toolbar">
          <label className="breach-search"><Icons.Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by ID, title, system, or description…" /></label>
          <select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}>{STATUS_OPTIONS.map(item => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by severity" value={severity} onChange={event => setSeverity(event.target.value)}>{['All severity', 'High', 'Medium', 'Low'].map(item => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by incident type" value={type} onChange={event => setType(event.target.value)}>{['All incident types', ...INCIDENT_TYPES].map(item => <option key={item}>{item}</option>)}</select>
          {(query || status !== 'All statuses' || severity !== 'All severity' || type !== 'All incident types') && <button type="button" className="breach-clear" onClick={resetFilters}>Clear filters</button>}
        </div>
        <div className="breach-table-wrap">
          <table className="breach-table">
            <thead><tr><th>Incident</th><th>Status</th><th>Severity</th><th>System / process</th><th>Discovered</th><th>People affected</th><th>Board deadline</th><th><span className="sr-only">Open record</span></th></tr></thead>
            <tbody>{filtered.map(item => (
              <tr key={item.id} onClick={() => setSelectedBreach(item)}>
                <td><div className="breach-incident-cell"><span className="breach-row-icon"><Icons.File size={15} /></span><div><b>{item.title}</b><small><span>{item.id}</span><i />{item.type}</small></div></div></td>
                <td><StatusBadge status={item.status} /></td><td><SeverityBadge severity={item.severity} /></td>
                <td className="breach-system">{item.system}</td><td className="breach-date">{item.discovered}</td>
                <td className="breach-people"><Icons.Users size={14} />{item.people}</td>
                <td><span className={item.deadline === '—' ? 'breach-no-deadline' : 'breach-deadline'}>{item.deadline}</span></td>
                <td><button type="button" className="breach-row-open" aria-label={`View ${item.id}`} onClick={event => { event.stopPropagation(); setSelectedBreach(item); }}><Icons.ChevronRight size={15} /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <div className="breach-empty"><span><Icons.Search size={20} /></span><b>No incidents match these filters</b><p>Try a different search or clear your filters.</p><button type="button" className="breach-clear" onClick={resetFilters}>Clear filters</button></div>}
        </div>
        <div className="breach-table-footer"><span>Showing <b>{filtered.length ? 1 : 0}–{filtered.length}</b> of <b>{filtered.length}</b> incidents</span><div className="breach-pagination"><button type="button" disabled aria-label="Previous page"><Icons.ChevronLeft size={15} /></button><span>Page <b>1</b> of 1</span><button type="button" disabled aria-label="Next page"><Icons.ChevronRight size={15} /></button></div></div>
      </section>
      <div className="breach-disclaimer"><Icons.Lock size={14} /><span>Static preview · Incident data stays in this browser session and is not sent to a server.</span><span>DPDPA · Incident response</span></div>

      {wizardOpen && <BreachWizard onClose={() => setWizardOpen(false)} onCreate={createBreach} />}
      {selectedBreach && <DetailPanel breach={selectedBreach} onClose={() => setSelectedBreach(null)} />}
    </main>
  );
}
