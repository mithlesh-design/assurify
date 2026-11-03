import { useMemo, useRef, useState } from 'react';
import {
  Badge, Button, EmptyState, Icons, Modal, PageActions, SearchInput, useDialog,
} from '../ui';
import { daysUntil, formatDate, formatNumber } from '../lib/format';

const INITIAL_BREACHES = [
  {
    id: 'BR-2026-004',
    title: 'Unauthorized access to customer support exports',
    system: 'Customer support platform',
    type: 'Unauthorized access',
    status: 'Under investigation',
    severity: 'High',
    discovered: '2026-10-21',
    deadline: '2026-10-23',
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
    discovered: '2026-10-18',
    deadline: '2026-10-20',
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
    discovered: '2026-10-12',
    deadline: '',
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
    discovered: '2026-10-02',
    deadline: '',
    people: '14',
    description: 'An employee laptop was reported missing. Device encryption and remote lock were confirmed; no unauthorized access was detected.',
    source: 'Employee report',
    owner: 'IT · N. Kapoor',
  },
];

const STATUS_OPTIONS = ['All statuses', 'Reported', 'Under triage', 'Under investigation', 'Notification pending', 'Closed'];
const INCIDENT_TYPES = ['API exposure', 'Unauthorized access', 'Data disclosure', 'Misconfiguration', 'Lost device', 'Ransomware', 'Other'];
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
  return <Badge tone={tone} dot>{status}</Badge>;
}

const SEVERITY_TONE = { high: 'danger', medium: 'warning', low: 'success' };
function SeverityBadge({ severity }) {
  return <Badge tone={SEVERITY_TONE[severity.toLowerCase()] ?? 'neutral'} dot>{severity}</Badge>;
}

/* Board notification deadline with urgency for open incidents */
function DeadlineCell({ breach }) {
  if (!breach.deadline) return <span className="dt-muted">{breach.status === 'Closed' ? '—' : 'To be assessed'}</span>;
  const days = daysUntil(breach.deadline);
  const open = breach.status !== 'Closed';
  return (
    <span className="deadline-cell">
      <span className="dt-nowrap">{formatDate(breach.deadline)}</span>
      {open && days != null && (
        days < 0 ? <Badge tone="danger">Overdue {Math.abs(days)}d</Badge>
          : days <= 3 ? <Badge tone="warning">{days === 0 ? 'Due today' : `Due in ${days}d`}</Badge>
          : null
      )}
    </span>
  );
}

const peopleLabel = (value) => (value === '' || value == null ? 'Not assessed' : formatNumber(value));

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

/* Form field wrapper — the control receives the shared .input/.select/.textarea class */
function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}{required && <span className="field-required" aria-hidden="true">*</span>}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function ChoiceGrid({ options, selected, onToggle }) {
  return (
    <div className="breach-choice-grid">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button key={option} type="button" className={`breach-choice${active ? ' selected' : ''}`} aria-pressed={active} onClick={() => onToggle(option)}>
            <span className="breach-choice-check">{active && <Icons.Check size={12} />}</span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function BreachWizard({ onClose, onCreate }) {
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
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
      discovered: form.discovered,
      deadline: '',
      people: form.people === '' ? '' : Number(form.people),
      description: form.description.trim(),
      source: form.source,
      owner: 'Privacy · Unassigned',
    });
  }

  return (
    <div className="breach-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} className="breach-wizard" role="dialog" aria-modal="true" aria-labelledby="breach-wizard-title">
        <header className="breach-wizard-header">
          <div className="breach-wizard-heading">
            <span className="breach-wizard-icon"><Icons.Alert size={18} /></span>
            <div><span className="breach-eyebrow">INCIDENT INTAKE</span><h2 id="breach-wizard-title">Report a data breach</h2></div>
          </div>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close report form"><Icons.X size={18} /></button>
        </header>
        <div className="breach-stepper" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
          {steps.map((label, index) => (
            <div className={`breach-step${index === step ? ' active' : ''}${index < step ? ' complete' : ''}`} key={label} aria-current={index === step ? 'step' : undefined}>
              <span>{index < step ? <Icons.Check size={13} /> : `0${index + 1}`}</span><b>{label}</b>
            </div>
          ))}
        </div>
        <div className="breach-wizard-body">
          {step === 0 && (
            <div className="breach-form-section">
              <div className="breach-section-heading"><span className="breach-section-icon"><Icons.Clipboard size={17} /></span><div><h3>Incident details</h3><p>Start with what happened and how it came to light.</p></div></div>
              <div className="breach-form-grid">
                <Field label="Incident title" required className="span-2"><input data-autofocus className="input" aria-invalid={showErrors && !form.title.trim()} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Unauthorized access to customer records" />{showErrors && !form.title.trim() && <span className="field-error" role="alert"><Icons.Alert size={13} />Enter a short title so the incident can be identified in the register.</span>}</Field>
                <Field label="Description" className="span-2"><textarea className="textarea" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe what is known so far. You can update this as the investigation progresses." rows={3} /></Field>
                <Field label="Incident type"><select className="select" value={form.incidentType} onChange={e => update('incidentType', e.target.value)}>{INCIDENT_TYPES.map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="How was this discovered?"><select className="select" value={form.source} onChange={e => update('source', e.target.value)}>{SOURCES.map(item => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Date discovered"><input className="input" type="date" value={form.discovered} onChange={e => update('discovered', e.target.value)} /></Field>
                <Field label="Date incident occurred"><input className="input" type="date" value={form.occurred} onChange={e => update('occurred', e.target.value)} /></Field>
                <Field label="System / process affected" className="span-2"><select className="select" value={form.system} onChange={e => update('system', e.target.value)}><option value="">Select a system or process</option>{SYSTEMS.map(item => <option key={item}>{item}</option>)}</select></Field>
              </div>
              <div className="breach-section-heading classification-heading"><span className="breach-section-icon purple"><Icons.Shield size={17} /></span><div><h3>Initial classification</h3><p>Record an initial view. These details can be refined during triage.</p></div></div>
              <div className="breach-form-grid">
                <Field label="Classification status"><select className="select" value={form.status} onChange={e => update('status', e.target.value)}><option>Suspected security incident</option><option>Confirmed personal data breach</option><option>Not a personal data breach</option><option>Under assessment</option></select></Field>
                <Field label="Potential impact"><select className="select" value={form.impact} onChange={e => update('impact', e.target.value)}><option>Confidentiality</option><option>Integrity</option><option>Availability</option><option>Multiple impact types</option><option>Under assessment</option></select></Field>
                <Field label="Estimated people affected"><input className="input" type="number" min="0" value={form.people} onChange={e => update('people', e.target.value)} placeholder="e.g. 1200" /></Field>
                <Field label="Estimated records affected"><input className="input" type="number" min="0" value={form.records} onChange={e => update('records', e.target.value)} placeholder="e.g. 2400" /></Field>
                <Field label="Became aware at"><input className="input" type="datetime-local" value={form.awareAt} onChange={e => update('awareAt', e.target.value)} /></Field>
                <Field label="Classification rationale" className="span-2"><textarea className="textarea" value={form.rationale} onChange={e => update('rationale', e.target.value)} placeholder="Add the reasoning behind your initial classification." rows={2} /></Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="breach-form-section">
              <div className="breach-section-heading"><span className="breach-section-icon teal"><Icons.Share size={17} /></span><div><h3>Responsibility & affected scope</h3><p>Map the parties and data potentially involved. Select any that apply.</p></div></div>
              <div className="breach-flow">
                <div className="breach-flow-column"><div className="breach-flow-label">YOUR ORGANIZATION</div><div className="breach-flow-node primary-node"><span className="breach-flow-node-icon"><Icons.Building size={16} /></span><div><b>Appzlogic Mobility Solutions</b><small>Data fiduciary</small></div><Icons.Check size={15} /></div><div className="breach-flow-hint">Incident owner · Privacy team</div></div>
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
                  <div><small>System / process</small><b>{form.system || 'To be confirmed'}</b></div><div><small>Date discovered</small><b>{formatDate(form.discovered, 'Not provided')}</b></div>
                  <div><small>Potential impact</small><b>{form.impact}</b></div><div><small>People affected</small><b>{peopleLabel(form.people)}</b></div>
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
            {step > 0
              ? <Button onClick={() => setStep(current => current - 1)} icon={<Icons.ChevronLeft size={15} />}>Back</Button>
              : <Button variant="ghost" onClick={onClose}>Cancel</Button>}
            {step < 2
              ? <Button variant="primary" onClick={() => {
                  if (step === 0 && !form.title.trim()) { setShowErrors(true); dialogRef.current?.querySelector('input')?.focus(); return; }
                  setStep(current => current + 1);
                }}>Continue <Icons.ChevronRight size={15} /></Button>
              : <Button variant="primary" icon={<Icons.Check size={15} />} disabled={!form.title.trim()} onClick={createIncident}>Create breach record</Button>}
          </div>
        </footer>
      </section>
    </div>
  );
}

function DetailPanel({ breach, onClose }) {
  if (!breach) return null;
  return (
    <Modal
      title={breach.title}
      subtitle={`${breach.id} · ${breach.type}`}
      icon={<Icons.Alert size={18} />}
      onClose={onClose}
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="detail-badges"><StatusBadge status={breach.status} /><SeverityBadge severity={breach.severity} /></div>
      <p className="detail-description">{breach.description}</p>
      <dl className="detail-list">
        {[
          ['System / process', breach.system],
          ['Discovered', formatDate(breach.discovered)],
          ['Board deadline', <DeadlineCell key="d" breach={breach} />],
          ['Estimated people affected', peopleLabel(breach.people)],
          ['Reported by', breach.source],
          ['Incident owner', breach.owner],
        ].map(([label, value]) => <div className="detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="info-note"><Icons.Lock size={15} />Incident records are currently stored in this browser session only.</div>
    </Modal>
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

  const filtersActive = query || status !== 'All statuses' || severity !== 'All severity' || type !== 'All incident types';

  return (
    <div className="page breach-page">
      <PageActions>
        <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => setWizardOpen(true)}>Report a breach</Button>
      </PageActions>

      <section className="page-intro">
        <span className="page-intro-icon"><Icons.Shield size={20} /></span>
        <div>
          <span className="page-intro-eyebrow">Incident response</span>
          <h2>Breach register</h2>
          <p>Log, investigate, and track personal data breaches under the DPDP Act — and see which incidents need action next.</p>
        </div>
      </section>

      <section className="breach-metrics" aria-label="Breach metrics">
        <MetricCard icon={Icons.Clipboard} label="Total reported" value={breaches.length} note="All time" tone="blue" />
        <MetricCard icon={Icons.Pulse} label="In progress" value={openCount} note="Needs attention" tone="teal" />
        <MetricCard icon={Icons.Alert} label="High severity" value={highCount} note="Priority review" tone="rose" />
        <MetricCard icon={Icons.Bell} label="Notifications pending" value={pendingCount} note="Action required" tone="amber" />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <SearchInput value={query} onChange={setQuery} label="Search incidents" placeholder="Search by ID, title, system, or description" />
          <select className="select" aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}>{STATUS_OPTIONS.map(item => <option key={item}>{item}</option>)}</select>
          <select className="select" aria-label="Filter by severity" value={severity} onChange={event => setSeverity(event.target.value)}>{['All severity', 'High', 'Medium', 'Low'].map(item => <option key={item}>{item}</option>)}</select>
          <select className="select" aria-label="Filter by incident type" value={type} onChange={event => setType(event.target.value)}>{['All incident types', ...INCIDENT_TYPES].map(item => <option key={item}>{item}</option>)}</select>
          {filtersActive && <Button size="sm" variant="ghost" onClick={resetFilters}>Clear filters</Button>}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<Icons.Search size={20} />}
            title={breaches.length ? 'No incidents match these filters' : 'No incidents reported'}
            description={breaches.length ? 'Try a different search or clear your filters.' : 'Report a breach to start the register.'}
            action={breaches.length ? <Button size="sm" onClick={resetFilters}>Clear filters</Button> : <Button size="sm" variant="primary" onClick={() => setWizardOpen(true)}>Report a breach</Button>}
          />
        ) : (
          <table className="data-table">
            <thead><tr>
              <th scope="col">Incident</th>
              <th scope="col">Status</th>
              <th scope="col">Severity</th>
              <th scope="col" className="dt-col-secondary">System / process</th>
              <th scope="col" className="dt-col-secondary">Discovered</th>
              <th scope="col">People affected</th>
              <th scope="col">Board deadline</th>
              <th scope="col"><span className="sr-only">Open record</span></th>
            </tr></thead>
            <tbody>{filtered.map(item => (
              <tr key={item.id} className="is-clickable" tabIndex={0} onClick={() => setSelectedBreach(item)} onKeyDown={event => { if (event.key === 'Enter') setSelectedBreach(item); }}>
                <td className="dt-primary">
                  <div className="dt-title">{item.title}</div>
                  <div className="dt-sub"><span className="dt-mono">{item.id}</span><span>{item.type}</span></div>
                  <div className="dt-sub dt-fold"><span>{item.system}</span><span>Discovered {formatDate(item.discovered)}</span></div>
                </td>
                <td data-label="Status"><StatusBadge status={item.status} /></td>
                <td data-label="Severity"><SeverityBadge severity={item.severity} /></td>
                <td className="dt-col-secondary" data-label="System">{item.system}</td>
                <td className="dt-col-secondary dt-nowrap" data-label="Discovered">{formatDate(item.discovered)}</td>
                <td className="dt-num" data-label="People affected">{peopleLabel(item.people)}</td>
                <td data-label="Board deadline"><DeadlineCell breach={item} /></td>
                <td className="dt-actions">
                  <Button size="sm" variant="ghost" aria-label={`View ${item.id}`} onClick={event => { event.stopPropagation(); setSelectedBreach(item); }}>
                    View <Icons.ChevronRight size={14} />
                  </Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <div className="table-footer">
          <span>Showing <b>{filtered.length}</b> of <b>{breaches.length}</b> incidents</span>
          <span className="info-inline"><Icons.Lock size={14} />Preview — incident data stays in this browser session and isn't sent to a server.</span>
        </div>
      </section>

      {wizardOpen && <BreachWizard onClose={() => setWizardOpen(false)} onCreate={createBreach} />}
      {selectedBreach && <DetailPanel breach={selectedBreach} onClose={() => setSelectedBreach(null)} />}
    </div>
  );
}
