import { useMemo, useState } from 'react';
import { Icons } from '../ui';

const REQUEST_TYPES = [
  'Access to personal data',
  'Correction or completion',
  'Erasure of personal data',
  'Grievance',
  'Nomination',
  'Withdraw consent',
];
const CASE_STATUSES = ['Received', 'Identity verification', 'In review', 'Awaiting information', 'Action in progress', 'Completed', 'Declined'];
const SYSTEMS = ['Customer portal', 'CRM', 'Customer support platform', 'Payment platform', 'HR information system', 'Marketing platform'];
const DATA_TYPES = ['Identity & contact', 'Account details', 'Transaction history', 'Support communications', 'Marketing preferences', 'Employment records'];
const CHANNELS = ['Email', 'Web form', 'Customer portal', 'Postal mail', 'In person', 'Grievance officer'];
const RIGHT_GUIDANCE = {
  'Access to personal data': 'Provide the prescribed summary of personal data and processing activities, including relevant identities and disclosures, subject to applicable rules and exceptions.',
  'Correction or completion': 'Assess the requested correction, completion, or update against reliable information and propagate changes where required.',
  'Erasure of personal data': 'Assess erasure where the purpose is no longer served or consent is withdrawn, while checking lawful retention requirements and other applicable exceptions.',
  Grievance: 'Route through the organisation’s published grievance redressal mechanism and record the response and escalation information provided.',
  Nomination: 'Record and verify a nomination for exercise of rights in the circumstances provided under applicable law.',
  'Withdraw consent': 'Route to the relevant consent and processing systems; explain any effect on services and assess processing that may rely on another lawful basis.',
};

const INITIAL_REQUESTS = [
  {
    id: 'DPR-2026-018',
    title: 'Access request · Customer account',
    type: 'Access to personal data',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    received: '20 Oct 2026',
    due: '19 Nov 2026',
    activeStep: 'Identity verification',
    status: 'Identity verification',
    verification: 'Pending',
    channel: 'Customer portal',
    description: 'Request for a summary of personal data held and details of processing and sharing.',
    systems: ['Customer portal', 'CRM'],
    dataTypes: ['Identity & contact', 'Account details'],
    representative: false,
    outcome: 'Not decided',
    notes: [],
  },
  {
    id: 'DPR-2026-017',
    title: 'Correction · Contact information',
    type: 'Correction or completion',
    name: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    received: '17 Oct 2026',
    due: '16 Nov 2026',
    activeStep: 'Review requested correction',
    status: 'In review',
    verification: 'Verified',
    channel: 'Email',
    description: 'The Data Principal has asked to update an outdated phone number on the account.',
    systems: ['Customer portal', 'CRM', 'Customer support platform'],
    dataTypes: ['Identity & contact'],
    representative: false,
    outcome: 'Not decided',
    notes: [{ date: '18 Oct 2026', text: 'Identity verified through the existing authenticated account.' }],
  },
  {
    id: 'DPR-2026-016',
    title: 'Erasure · Marketing profile',
    type: 'Erasure of personal data',
    name: 'Kabir Nair',
    email: 'kabir.nair@example.com',
    received: '12 Oct 2026',
    due: '11 Nov 2026',
    activeStep: 'Erasure in progress',
    status: 'Action in progress',
    verification: 'Verified',
    channel: 'Web form',
    description: 'Request to erase the marketing profile and associated preference data.',
    systems: ['Marketing platform', 'CRM'],
    dataTypes: ['Marketing preferences', 'Identity & contact'],
    representative: false,
    outcome: 'Not decided',
    notes: [{ date: '13 Oct 2026', text: 'Retention checks are underway for records that may need to be retained under applicable law.' }],
  },
  {
    id: 'DPR-2026-015',
    title: 'Grievance · Unresolved account issue',
    type: 'Grievance',
    name: 'Anaya Rao',
    email: 'anaya.rao@example.com',
    received: '08 Oct 2026',
    due: '07 Nov 2026',
    activeStep: 'Response issued',
    status: 'Completed',
    verification: 'Verified',
    channel: 'Grievance officer',
    description: 'Grievance concerning an earlier request to correct account information.',
    systems: ['Customer portal', 'CRM'],
    dataTypes: ['Identity & contact', 'Account details'],
    representative: false,
    outcome: 'Fulfilled in full',
    notes: [{ date: '15 Oct 2026', text: 'Response sent to the verified contact address and case closed.' }],
  },
  {
    id: 'DPR-2026-014',
    title: 'Access request · Submitted by representative',
    type: 'Access to personal data',
    name: 'Rohan Das',
    email: 'rohan.das@example.com',
    received: '02 Oct 2026',
    due: '01 Nov 2026',
    activeStep: 'Decline communicated',
    status: 'Declined',
    verification: 'Unable to verify',
    channel: 'Email',
    description: 'Request submitted by a representative. The submitted authority could not be validated.',
    systems: ['Customer portal'],
    dataTypes: ['Identity & contact'],
    representative: true,
    outcome: 'Declined',
    notes: [{ date: '05 Oct 2026', text: 'Request declined after reasonable verification steps could not confirm the representative’s authority. The response explained how to submit a verifiable request.' }],
  },
];

function localDateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const tone = status === 'Completed' ? 'success'
    : status === 'Declined' ? 'danger'
      : status === 'Awaiting information' ? 'warning'
        : status === 'Identity verification' ? 'violet'
          : 'info';
  return <span className={`rights-status rights-status-${tone}`}><i />{status}</span>;
}

function VerificationBadge({ verification }) {
  const tone = verification === 'Verified' ? 'verified' : verification === 'Unable to verify' ? 'failed' : 'pending';
  return <span className={`rights-verification rights-verification-${tone}`}><i />{verification}</span>;
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className={`rights-metric rights-metric-${tone}`}>
      <div className="rights-metric-top"><span><Icon size={18} /></span><small>{detail}</small></div>
      <strong>{value}</strong>
      <div>{label}</div>
    </div>
  );
}

function Field({ label, hint, className = '', children }) {
  return <label className={`rights-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function MultiSelect({ label, options, value, onChange, hint }) {
  function toggle(item) {
    onChange(value.includes(item) ? value.filter(option => option !== item) : [...value, item]);
  }
  return (
    <fieldset className="rights-multiselect">
      <legend>{label}</legend>
      {hint && <p>{hint}</p>}
      <div>{options.map(item => <button type="button" key={item} className={value.includes(item) ? 'selected' : ''} onClick={() => toggle(item)}><span>{value.includes(item) && <Icons.Check size={12} />}</span>{item}</button>)}</div>
    </fieldset>
  );
}

function RequestWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', email: '', type: REQUEST_TYPES[0], channel: 'Customer portal',
    received: localDateValue(), due: '', description: '', verification: 'Pending',
    representative: false, systems: [], dataTypes: [], notes: '', outcome: 'Not decided',
  });
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const steps = ['Request & identity', 'Scope & handling', 'Review'];
  const dueDateHint = 'Use the target date from your organisation’s approved response policy. This is not a statutory deadline calculator.';

  function createRequest() {
    onCreate({
      id: `DPR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      title: `${form.type} · ${form.name.trim()}`,
      type: form.type,
      name: form.name.trim(),
      email: form.email.trim(),
      received: displayDate(form.received),
      due: form.due ? displayDate(form.due) : 'Set per policy',
      activeStep: form.verification === 'Verified' ? 'Triage request' : 'Verify identity and authority',
      status: form.verification === 'Verified' ? 'Received' : 'Identity verification',
      verification: form.verification,
      channel: form.channel,
      description: form.description.trim(),
      systems: form.systems,
      dataTypes: form.dataTypes,
      representative: form.representative,
      outcome: 'Not decided',
      notes: form.notes.trim() ? [{ date: displayDate(form.received), text: form.notes.trim() }] : [],
    });
  }

  return (
    <div className="rights-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="rights-wizard" role="dialog" aria-modal="true" aria-labelledby="rights-wizard-title">
        <header className="rights-wizard-header">
          <div className="rights-wizard-heading"><span><Icons.Users size={19} /></span><div><small>DATA PRINCIPAL RIGHTS</small><h2 id="rights-wizard-title">Register a rights request</h2></div></div>
          <button type="button" className="rights-icon-button" onClick={onClose} aria-label="Close request form"><Icons.X size={18} /></button>
        </header>
        <div className="rights-stepper">{steps.map((label, index) => <div key={label} className={`rights-step${step === index ? ' active' : ''}${index < step ? ' complete' : ''}`}><span>{index < step ? <Icons.Check size={13} /> : `0${index + 1}`}</span><b>{label}</b></div>)}</div>
        <div className="rights-wizard-body">
          {step === 0 && <div className="rights-form-section">
            <div className="rights-section-heading"><span><Icons.Clipboard size={17} /></span><div><h3>Request and Data Principal</h3><p>Record the request as received. Avoid collecting identity documents or extra personal data unless necessary.</p></div></div>
            <div className="rights-form-grid">
              <Field label="Data Principal’s name"><input autoFocus required value={form.name} onChange={event => update('name', event.target.value)} placeholder="Name as provided by the requester" /></Field>
              <Field label="Contact email"><input type="email" required value={form.email} onChange={event => update('email', event.target.value)} placeholder="name@example.com" /></Field>
              <Field label="Right being exercised" className="span-2"><select value={form.type} onChange={event => update('type', event.target.value)}>{REQUEST_TYPES.map(type => <option key={type}>{type}</option>)}</select></Field>
              <div className="rights-guidance span-2"><Icons.Shield size={15} /><span>{RIGHT_GUIDANCE[form.type]}</span></div>
              <Field label="Received through"><select value={form.channel} onChange={event => update('channel', event.target.value)}>{CHANNELS.map(channel => <option key={channel}>{channel}</option>)}</select></Field>
              <Field label="Date received"><input type="date" value={form.received} onChange={event => update('received', event.target.value)} /></Field>
              <Field label="Request summary" className="span-2"><textarea rows={3} value={form.description} onChange={event => update('description', event.target.value)} placeholder="Capture what the person is asking for, in their own terms where possible." /></Field>
            </div>
            <div className="rights-representative">
              <label><input type="checkbox" checked={form.representative} onChange={event => update('representative', event.target.checked)} /><span><b>Submitted by an authorised representative</b><small>Record the representative’s authority check separately. Do not retain more evidence than needed.</small></span></label>
            </div>
            <div className="rights-privacy-note"><Icons.Lock size={16} /><span>Keep contact details limited to what is needed to verify, communicate about, and fulfil this request.</span></div>
          </div>}
          {step === 1 && <div className="rights-form-section">
            <div className="rights-section-heading"><span className="teal"><Icons.Shield size={17} /></span><div><h3>Verification, scope & handling</h3><p>Establish a proportionate verification path and identify where to look before sharing or changing data.</p></div></div>
            <div className="rights-verification-card">
              <div><b>Identity / authority verification</b><small>Use a proportionate method. Do not request additional information if identity is already clear.</small></div>
              <select aria-label="Verification status" value={form.verification} onChange={event => update('verification', event.target.value)}><option>Pending</option><option>Verified</option><option>Unable to verify</option></select>
            </div>
            <MultiSelect label="Systems to search or action" hint="Select relevant systems only; confirm with system owners before responding." options={SYSTEMS} value={form.systems} onChange={value => update('systems', value)} />
            <MultiSelect label="Potential personal data categories" hint="For triage only. Confirm what is actually held before a response is issued." options={DATA_TYPES} value={form.dataTypes} onChange={value => update('dataTypes', value)} />
            <div className="rights-form-grid rights-handling-grid">
              <Field label="Internal target response date" hint={dueDateHint}><input type="date" value={form.due} onChange={event => update('due', event.target.value)} /></Field>
              <Field label="Initial handling note" hint="Internal note only. Do not include unnecessary personal data."><textarea rows={2} value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Verification method, routing, or next action" /></Field>
            </div>
            <div className="rights-info-callout"><Icons.Alert size={16} /><span>Check the applicable Act, rules, exemptions, retention obligations, and your approved policy before deciding how to fulfil or decline a request. A target date here is an internal tracker only.</span></div>
          </div>}
          {step === 2 && <div className="rights-review">
            <div className="rights-review-banner"><span><Icons.Shield size={20} /></span><div><b>Review before adding to the register</b><p>This creates a local preview record only. Confirm identity and authority before disclosing, correcting, or erasing data.</p></div></div>
            <div className="rights-review-card">
              <div className="rights-review-head"><div><small>REQUEST SUMMARY</small><h3>{form.type} · {form.name || 'Unnamed requester'}</h3></div><StatusBadge status={form.verification === 'Verified' ? 'Received' : 'Identity verification'} /></div>
              <p>{form.description || 'No request summary provided.'}</p>
              <div className="rights-review-grid">
                <div><small>Data Principal</small><b>{form.name || 'Not provided'}</b></div><div><small>Contact</small><b>{form.email || 'Not provided'}</b></div>
                <div><small>Received</small><b>{displayDate(form.received) || 'Not provided'}</b></div><div><small>Channel</small><b>{form.channel}</b></div>
                <div><small>Verification</small><b>{form.verification}{form.representative ? ' · Representative submission' : ''}</b></div><div><small>Internal target date</small><b>{form.due ? displayDate(form.due) : 'Not set'}</b></div>
                <div><small>Systems</small><b>{form.systems.join(', ') || 'Not yet identified'}</b></div><div><small>Data categories</small><b>{form.dataTypes.join(', ') || 'Not yet identified'}</b></div>
              </div>
            </div>
            <div className="rights-info-callout"><Icons.Lock size={16} /><span>Never disclose another person’s data. Assess applicable exceptions and third-party information, and document the rationale for any partial response or refusal.</span></div>
          </div>}
        </div>
        <footer className="rights-wizard-footer"><span>STEP {step + 1} <i>/</i> {steps.length}</span><div>{step > 0 && <button type="button" className="rights-button secondary" onClick={() => setStep(current => current - 1)}><Icons.ChevronLeft size={15} />Back</button>}{step < 2 ? <button type="button" className="rights-button primary" disabled={step === 0 && (!form.name.trim() || !form.email.trim())} onClick={() => setStep(current => current + 1)}>Continue<Icons.ChevronRight size={15} /></button> : <button type="button" className="rights-button primary" disabled={!form.name.trim() || !form.email.trim()} onClick={createRequest}><Icons.Check size={15} />Add to register</button>}</div></footer>
      </section>
    </div>
  );
}

function RequestDetails({ request, onClose, onUpdate }) {
  const [nextStatus, setNextStatus] = useState(request.status);
  const [verification, setVerification] = useState(request.verification);
  const [outcome, setOutcome] = useState(request.outcome ?? 'Not decided');
  const [note, setNote] = useState('');

  function saveUpdate() {
    onUpdate(request.id, nextStatus, verification, outcome, note.trim());
    setNote('');
  }

  return (
    <div className="rights-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="rights-detail-modal" role="dialog" aria-modal="true" aria-labelledby="rights-detail-title">
        <header className="rights-detail-header"><div><small>{request.id} · RECEIVED {request.received}</small><h2 id="rights-detail-title">{request.title}</h2></div><button type="button" className="rights-icon-button" onClick={onClose} aria-label="Close request details"><Icons.X size={18} /></button></header>
        <div className="rights-detail-badges"><StatusBadge status={request.status} /><VerificationBadge verification={request.verification} /><span className="rights-channel-badge">{request.channel}</span></div>
        <p className="rights-detail-description">{request.description || 'No request summary provided.'}</p>
        <div className="rights-detail-grid">
          <div><small>Data Principal</small><b>{request.name}</b></div><div><small>Contact</small><b>{request.email}</b></div>
          <div><small>Right requested</small><b>{request.type}</b></div><div><small>Internal target date</small><b>{request.due}</b></div>
          <div><small>Submitted by representative</small><b>{request.representative ? 'Yes · authority should be verified' : 'No'}</b></div><div><small>Decision outcome</small><b>{request.outcome ?? 'Not decided'}</b></div>
          <div className="span-2"><small>Systems</small><b>{request.systems.join(', ') || 'Not yet identified'}</b></div>
          <div className="span-2"><small>Potential data categories</small><b>{request.dataTypes.join(', ') || 'Not yet identified'}</b></div>
        </div>
        <section className="rights-case-update"><div><h3>Update case</h3><p>Record verification, the decision outcome, next step, and an internal handling note.</p></div>
          <label>Status<select value={nextStatus} onChange={event => setNextStatus(event.target.value)}>{CASE_STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
          <label>Identity / authority verification<select value={verification} onChange={event => setVerification(event.target.value)}><option>Pending</option><option>Verified</option><option>Unable to verify</option></select></label>
          <label>Response / decision outcome<select value={outcome} onChange={event => setOutcome(event.target.value)}><option>Not decided</option><option>Fulfilled in full</option><option>Partially fulfilled</option><option>Declined</option><option>Withdrawn by requester</option></select></label>
          <label>Case note<textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Record verification, searches, clarification, decision rationale, or response dispatch." /></label>
          <p className="rights-decision-hint">Record a clear rationale and response details for a partial fulfilment or decline. Verify identity or representative authority before disclosing personal data.</p>
          <button type="button" className="rights-button primary" disabled={(nextStatus === request.status && verification === request.verification && outcome === (request.outcome ?? 'Not decided') && !note.trim()) || ((nextStatus === 'Declined' || outcome === 'Declined' || outcome === 'Partially fulfilled') && !note.trim()) || (nextStatus === 'Completed' && outcome === 'Not decided')} onClick={saveUpdate}><Icons.Check size={15} />Save case update</button>
        </section>
        <section className="rights-timeline"><h3>Case history</h3>{request.notes.length ? request.notes.map((entry, index) => <div key={`${entry.date}-${index}`}><span /><small>{entry.date}</small><p>{entry.text}</p></div>) : <p className="rights-no-history">No internal case notes have been recorded yet.</p>}</section>
        <div className="rights-detail-disclaimer"><Icons.Lock size={15} />Request data in this preview is kept in memory and is not sent to a server.</div>
      </section>
    </div>
  );
}

export default function DataRights({ onAction = () => {} }) {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [typeFilter, setTypeFilter] = useState('All request types');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selectedRequest = requests.find(request => request.id === selectedId) ?? null;

  const filtered = useMemo(() => requests.filter(request => {
    const searchable = `${request.id} ${request.title} ${request.name} ${request.email} ${request.type}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (statusFilter === 'All statuses' || request.status === statusFilter)
      && (typeFilter === 'All request types' || request.type === typeFilter);
  }), [requests, query, statusFilter, typeFilter]);
  const openCount = requests.filter(request => !['Completed', 'Declined'].includes(request.status)).length;
  const completedCount = requests.filter(request => request.status === 'Completed').length;
  const declinedCount = requests.filter(request => request.status === 'Declined').length;
  const activeStatuses = CASE_STATUSES.filter(status => !['Completed', 'Declined'].includes(status));

  function createRequest(request) {
    setRequests(current => [request, ...current]);
    setWizardOpen(false);
    onAction('Rights request added to the local register.');
  }

  function updateRequest(id, status, verification, outcome, note) {
    const activeStep = status === 'Completed' ? 'Response issued'
      : status === 'Declined' ? 'Decline communicated'
        : status === 'Identity verification' ? 'Verify identity and authority'
          : status === 'Awaiting information' ? 'Clarification requested'
            : status === 'Action in progress' ? 'Fulfilment in progress'
              : status === 'In review' ? 'Assess request and applicable exceptions'
                : 'Triage request';
    setRequests(current => current.map(request => {
      if (request.id !== id) return request;
      const changes = [];
      if (request.status !== status) changes.push(`Status changed to ${status}.`);
      if (request.verification !== verification) changes.push(`Identity / authority verification updated to ${verification}.`);
      if ((request.outcome ?? 'Not decided') !== outcome) changes.push(`Response outcome recorded as ${outcome}.`);
      const entryText = note || changes.join(' ');
      return {
        ...request,
        status,
        activeStep,
        verification,
        outcome,
        notes: entryText ? [{ date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), text: entryText }, ...request.notes] : request.notes,
      };
    }));
    onAction(`Request ${id} updated.`);
  }

  function resetFilters() {
    setQuery('');
    setStatusFilter('All statuses');
    setTypeFilter('All request types');
  }

  return (
    <main className="rights-page">
      <section className="rights-hero">
        <div className="rights-hero-content">
          <div className="rights-hero-kicker"><span /> DATA PRINCIPAL RIGHTS · DPDPA</div>
          <h2>Every request.<br /><em>Handled with care.</em></h2>
          <p>A thoughtful, traceable workflow for receiving, verifying, assessing, and responding to Data Principal rights requests.</p>
          <button type="button" className="rights-hero-button" onClick={() => setWizardOpen(true)}><Icons.Plus size={16} />Register a request<Icons.ChevronRight size={15} /></button>
        </div>
        <div className="rights-hero-art" aria-hidden="true"><div className="rights-art-orbit orbit-one" /><div className="rights-art-orbit orbit-two" /><div className="rights-art-orbit orbit-three" /><div className="rights-art-card"><div className="rights-art-card-top"><span><Icons.Users size={19} /></span><i /></div><div className="rights-art-line long" /><div className="rights-art-line" /><div className="rights-art-check"><Icons.Check size={15} /></div></div><div className="rights-art-chip chip-one"><Icons.Shield size={14} /> Identity first</div><div className="rights-art-chip chip-two"><Icons.Clock size={14} /> Track every step</div></div>
        <div className="rights-hero-footer"><span>PRIVACY RIGHTS WORKSPACE</span><span><i /> REQUESTS HANDLED WITH ACCOUNTABILITY</span></div>
      </section>

      <div className="rights-page-heading"><div><small>CASE MANAGEMENT</small><h2>Rights request register</h2><p>One place to track each request from receipt through response.</p></div><span><Icons.Refresh size={14} /> Updated just now</span></div>

      <section className="rights-metrics" aria-label="Rights request overview">
        <MetricCard icon={Icons.Clipboard} label="Total requests" value={requests.length} detail="All cases" tone="blue" />
        <MetricCard icon={Icons.Clock} label="Open requests" value={openCount} detail="In progress" tone="amber" />
        <MetricCard icon={Icons.Check} label="Completed" value={completedCount} detail="Response issued" tone="green" />
        <MetricCard icon={Icons.X} label="Declined" value={declinedCount} detail="Rationale recorded" tone="rose" />
      </section>

      <section className="rights-register">
        <header className="rights-register-head"><div><div className="rights-register-title"><span><Icons.Users size={17} /></span><h2>Data Principal requests</h2><b>{requests.length}</b></div><p>Manage access, correction, erasure, grievances, nominations, and consent withdrawal.</p></div><button type="button" className="rights-button primary" onClick={() => setWizardOpen(true)}><Icons.Plus size={15} />New request</button></header>
        <div className="rights-toolbar"><label className="rights-search"><Icons.Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by reference, name, email, or request type" /></label><select aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All statuses</option>{activeStatuses.map(status => <option key={status}>{status}</option>)}<option>Completed</option><option>Declined</option></select><select aria-label="Filter by request type" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option>All request types</option>{REQUEST_TYPES.map(type => <option key={type}>{type}</option>)}</select>{(query || statusFilter !== 'All statuses' || typeFilter !== 'All request types') && <button type="button" className="rights-clear" onClick={resetFilters}>Clear filters</button>}</div>
        <div className="rights-table-wrap"><table className="rights-table"><thead><tr><th>Request</th><th>Requested on</th><th>Right exercised</th><th>Active step</th><th>Verification</th><th>Status</th><th>Target date</th><th><span className="sr-only">Open case</span></th></tr></thead><tbody>
          {filtered.map(request => <tr key={request.id} onClick={() => setSelectedId(request.id)}><td><div className="rights-request-cell"><span><Icons.File size={16} /></span><div><b>{request.title}</b><small>{request.name} <i /> {request.id}</small></div></div></td><td>{request.received}</td><td><span className="rights-type-chip">{request.type}</span></td><td><span className="rights-active-step">{request.activeStep}</span></td><td><VerificationBadge verification={request.verification} /></td><td><StatusBadge status={request.status} /></td><td className={request.due === 'Set per policy' ? 'rights-date-missing' : ''}>{request.due}</td><td><button type="button" className="rights-open-button" aria-label={`Open ${request.id}`} onClick={event => { event.stopPropagation(); setSelectedId(request.id); }}><Icons.ChevronRight size={16} /></button></td></tr>)}
        </tbody></table>
          {filtered.length === 0 && <div className="rights-empty"><span><Icons.Search size={20} /></span><b>No requests match your search</b><p>Try a different search or clear the selected filters.</p><button type="button" className="rights-clear" onClick={resetFilters}>Clear filters</button></div>}
        </div>
        <footer className="rights-table-footer"><span>Showing <b>{filtered.length ? 1 : 0}–{filtered.length}</b> of <b>{filtered.length}</b> requests</span><span>Target dates follow internal policy; confirm applicable statutory requirements separately.</span></footer>
      </section>

      <div className="rights-privacy-footer"><Icons.Lock size={15} /><span>Static preview · Case data is held in memory only and is not sent to a server.</span><span>Purpose limitation · Data minimisation · Accountability</span></div>
      {wizardOpen && <RequestWizard onClose={() => setWizardOpen(false)} onCreate={createRequest} />}
      {selectedRequest && <RequestDetails request={selectedRequest} onClose={() => setSelectedId(null)} onUpdate={updateRequest} />}
    </main>
  );
}
