import { useMemo, useRef, useState } from 'react';
import {
  Badge, Button, EmptyState, Icons, Modal, PageActions, SearchInput, useDialog,
} from '../ui';
import { daysUntil, formatDate } from '../lib/format';

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
  Grievance: 'Route through the organization’s published grievance redressal mechanism and record the response and escalation information provided.',
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
    received: '2026-10-20',
    due: '2026-11-19',
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
    received: '2026-10-17',
    due: '2026-11-16',
    activeStep: 'Review requested correction',
    status: 'In review',
    verification: 'Verified',
    channel: 'Email',
    description: 'The Data Principal has asked to update an outdated phone number on the account.',
    systems: ['Customer portal', 'CRM', 'Customer support platform'],
    dataTypes: ['Identity & contact'],
    representative: false,
    outcome: 'Not decided',
    notes: [{ date: '2026-10-18', text: 'Identity verified through the existing authenticated account.' }],
  },
  {
    id: 'DPR-2026-016',
    title: 'Erasure · Marketing profile',
    type: 'Erasure of personal data',
    name: 'Kabir Nair',
    email: 'kabir.nair@example.com',
    received: '2026-10-12',
    due: '2026-11-11',
    activeStep: 'Erasure in progress',
    status: 'Action in progress',
    verification: 'Verified',
    channel: 'Web form',
    description: 'Request to erase the marketing profile and associated preference data.',
    systems: ['Marketing platform', 'CRM'],
    dataTypes: ['Marketing preferences', 'Identity & contact'],
    representative: false,
    outcome: 'Not decided',
    notes: [{ date: '2026-10-13', text: 'Retention checks are underway for records that may need to be retained under applicable law.' }],
  },
  {
    id: 'DPR-2026-015',
    title: 'Grievance · Unresolved account issue',
    type: 'Grievance',
    name: 'Anaya Rao',
    email: 'anaya.rao@example.com',
    received: '2026-10-08',
    due: '2026-11-07',
    activeStep: 'Response issued',
    status: 'Completed',
    verification: 'Verified',
    channel: 'Grievance officer',
    description: 'Grievance concerning an earlier request to correct account information.',
    systems: ['Customer portal', 'CRM'],
    dataTypes: ['Identity & contact', 'Account details'],
    representative: false,
    outcome: 'Fulfilled in full',
    notes: [{ date: '2026-10-15', text: 'Response sent to the verified contact address and case closed.' }],
  },
  {
    id: 'DPR-2026-014',
    title: 'Access request · Submitted by representative',
    type: 'Access to personal data',
    name: 'Rohan Das',
    email: 'rohan.das@example.com',
    received: '2026-10-02',
    due: '2026-11-01',
    activeStep: 'Decline communicated',
    status: 'Declined',
    verification: 'Unable to verify',
    channel: 'Email',
    description: 'Request submitted by a representative. The submitted authority could not be validated.',
    systems: ['Customer portal'],
    dataTypes: ['Identity & contact'],
    representative: true,
    outcome: 'Declined',
    notes: [{ date: '2026-10-05', text: 'Request declined after reasonable verification steps could not confirm the representative’s authority. The response explained how to submit a verifiable request.' }],
  },
];

function localDateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function displayDate(value) {
  return value ? formatDate(value, value) : '';
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/* Internal target date with urgency for open cases */
function TargetDate({ request }) {
  if (!request.due) return <span className="dt-muted">Set per policy</span>;
  const open = !['Completed', 'Declined'].includes(request.status);
  const days = daysUntil(request.due);
  return (
    <span className="deadline-cell">
      <span className="dt-nowrap">{displayDate(request.due)}</span>
      {open && days != null && (days < 0
        ? <Badge tone="danger">Overdue {Math.abs(days)}d</Badge>
        : days <= 7 ? <Badge tone="warning">{days === 0 ? 'Due today' : `Due in ${days}d`}</Badge> : null)}
    </span>
  );
}

function StatusBadge({ status }) {
  const tone = status === 'Completed' ? 'success'
    : status === 'Declined' ? 'danger'
      : status === 'Awaiting information' ? 'warning'
        : status === 'Identity verification' ? 'violet'
          : 'info';
  return <Badge tone={tone} dot>{status}</Badge>;
}

function VerificationBadge({ verification }) {
  const tone = verification === 'Verified' ? 'success' : verification === 'Unable to verify' ? 'danger' : 'warning';
  return <Badge tone={tone}>{verification === 'Verified' ? <Icons.Check size={12} /> : null}{verification}</Badge>;
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

function Field({ label, hint, error, required, className = '', children }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}{required && <span className="field-required" aria-hidden="true">*</span>}</span>
      {children}
      {error ? <span className="field-error" role="alert"><Icons.Alert size={13} />{error}</span> : hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function MultiSelect({ label, options, value, onChange, hint }) {
  function toggle(item) {
    onChange(value.includes(item) ? value.filter(option => option !== item) : [...value, item]);
  }
  return (
    <fieldset className="rights-multiselect">
      <legend>{label}</legend>
      {hint && <p>{hint}</p>}
      <div>{options.map(item => <button type="button" key={item} className={value.includes(item) ? 'selected' : ''} aria-pressed={value.includes(item)} onClick={() => toggle(item)}><span>{value.includes(item) && <Icons.Check size={12} />}</span>{item}</button>)}</div>
    </fieldset>
  );
}

function RequestWizard({ onClose, onCreate }) {
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', type: REQUEST_TYPES[0], channel: 'Customer portal',
    received: localDateValue(), due: '', description: '', verification: 'Pending',
    representative: false, systems: [], dataTypes: [], notes: '', outcome: 'Not decided',
  });
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const steps = ['Request & identity', 'Scope & handling', 'Review'];
  const dueDateHint = 'Use the target date from your organization’s approved response policy. This is not a statutory deadline calculator.';
  const nameError = !form.name.trim() ? 'Enter the Data Principal’s name.' : '';
  const emailError = !form.email.trim() ? 'Enter a contact email so you can respond.' : !isValidEmail(form.email) ? 'Enter a valid email address, like name@example.com.' : '';
  const stepOneValid = !nameError && !emailError;

  function createRequest() {
    onCreate({
      id: `DPR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      title: `${form.type} · ${form.name.trim()}`,
      type: form.type,
      name: form.name.trim(),
      email: form.email.trim(),
      received: form.received,
      due: form.due,
      activeStep: form.verification === 'Verified' ? 'Triage request' : 'Verify identity and authority',
      status: form.verification === 'Verified' ? 'Received' : 'Identity verification',
      verification: form.verification,
      channel: form.channel,
      description: form.description.trim(),
      systems: form.systems,
      dataTypes: form.dataTypes,
      representative: form.representative,
      outcome: 'Not decided',
      notes: form.notes.trim() ? [{ date: form.received, text: form.notes.trim() }] : [],
    });
  }

  return (
    <div className="rights-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} className="rights-wizard" role="dialog" aria-modal="true" aria-labelledby="rights-wizard-title">
        <header className="rights-wizard-header">
          <div className="rights-wizard-heading"><span><Icons.Users size={19} /></span><div><small>DATA PRINCIPAL RIGHTS</small><h2 id="rights-wizard-title">Register a rights request</h2></div></div>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close request form"><Icons.X size={18} /></button>
        </header>
        <div className="rights-stepper" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>{steps.map((label, index) => <div key={label} aria-current={step === index ? 'step' : undefined} className={`rights-step${step === index ? ' active' : ''}${index < step ? ' complete' : ''}`}><span>{index < step ? <Icons.Check size={13} /> : `0${index + 1}`}</span><b>{label}</b></div>)}</div>
        <div className="rights-wizard-body">
          {step === 0 && <div className="rights-form-section">
            <div className="rights-section-heading"><span><Icons.Clipboard size={17} /></span><div><h3>Request and Data Principal</h3><p>Record the request as received. Avoid collecting identity documents or extra personal data unless necessary.</p></div></div>
            <div className="rights-form-grid">
              <Field label="Data Principal’s name" required error={showErrors ? nameError : ''}><input data-autofocus className="input" aria-invalid={showErrors && !!nameError} required value={form.name} onChange={event => update('name', event.target.value)} placeholder="Name as provided by the requester" /></Field>
              <Field label="Contact email" required error={showErrors ? emailError : ''}><input className="input" aria-invalid={showErrors && !!emailError} type="email" required value={form.email} onChange={event => update('email', event.target.value)} placeholder="name@example.com" /></Field>
              <Field label="Right being exercised" className="span-2"><select className="select" value={form.type} onChange={event => update('type', event.target.value)}>{REQUEST_TYPES.map(type => <option key={type}>{type}</option>)}</select></Field>
              <div className="rights-guidance span-2"><Icons.Shield size={15} /><span>{RIGHT_GUIDANCE[form.type]}</span></div>
              <Field label="Received through"><select className="select" value={form.channel} onChange={event => update('channel', event.target.value)}>{CHANNELS.map(channel => <option key={channel}>{channel}</option>)}</select></Field>
              <Field label="Date received"><input className="input" type="date" value={form.received} onChange={event => update('received', event.target.value)} /></Field>
              <Field label="Request summary" className="span-2"><textarea className="textarea" rows={3} value={form.description} onChange={event => update('description', event.target.value)} placeholder="Capture what the person is asking for, in their own terms where possible." /></Field>
            </div>
            <div className="rights-representative">
              <label><input type="checkbox" checked={form.representative} onChange={event => update('representative', event.target.checked)} /><span><b>Submitted by an authorized representative</b><small>Record the representative’s authority check separately. Do not retain more evidence than needed.</small></span></label>
            </div>
            <div className="rights-privacy-note"><Icons.Lock size={16} /><span>Keep contact details limited to what is needed to verify, communicate about, and fulfil this request.</span></div>
          </div>}
          {step === 1 && <div className="rights-form-section">
            <div className="rights-section-heading"><span className="teal"><Icons.Shield size={17} /></span><div><h3>Verification, scope & handling</h3><p>Establish a proportionate verification path and identify where to look before sharing or changing data.</p></div></div>
            <div className="rights-verification-card">
              <div><b>Identity / authority verification</b><small>Use a proportionate method. Do not request additional information if identity is already clear.</small></div>
              <select className="select" aria-label="Verification status" value={form.verification} onChange={event => update('verification', event.target.value)}><option>Pending</option><option>Verified</option><option>Unable to verify</option></select>
            </div>
            <MultiSelect label="Systems to search or action" hint="Select relevant systems only; confirm with system owners before responding." options={SYSTEMS} value={form.systems} onChange={value => update('systems', value)} />
            <MultiSelect label="Potential personal data categories" hint="For triage only. Confirm what is actually held before a response is issued." options={DATA_TYPES} value={form.dataTypes} onChange={value => update('dataTypes', value)} />
            <div className="rights-form-grid rights-handling-grid">
              <Field label="Internal target response date" hint={dueDateHint}><input className="input" type="date" value={form.due} onChange={event => update('due', event.target.value)} /></Field>
              <Field label="Initial handling note" hint="Internal note only. Do not include unnecessary personal data."><textarea className="textarea" rows={2} value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Verification method, routing, or next action" /></Field>
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
        <footer className="rights-wizard-footer"><span>STEP {step + 1} <i>/</i> {steps.length}</span><div>
          {step > 0
            ? <Button icon={<Icons.ChevronLeft size={15} />} onClick={() => setStep(current => current - 1)}>Back</Button>
            : <Button variant="ghost" onClick={onClose}>Cancel</Button>}
          {step < 2
            ? <Button variant="primary" onClick={() => {
                if (step === 0 && !stepOneValid) { setShowErrors(true); dialogRef.current?.querySelector('[aria-invalid="true"], input')?.focus(); return; }
                setStep(current => current + 1);
              }}>Continue <Icons.ChevronRight size={15} /></Button>
            : <Button variant="primary" icon={<Icons.Check size={15} />} disabled={!stepOneValid} onClick={createRequest}>Add to register</Button>}
        </div></footer>
      </section>
    </div>
  );
}

function RequestDetails({ request, onClose, onUpdate }) {
  const [nextStatus, setNextStatus] = useState(request.status);
  const [verification, setVerification] = useState(request.verification);
  const [outcome, setOutcome] = useState(request.outcome ?? 'Not decided');
  const [note, setNote] = useState('');

  const unchanged = nextStatus === request.status && verification === request.verification
    && outcome === (request.outcome ?? 'Not decided') && !note.trim();
  /* Explain why saving is blocked instead of silently disabling the button */
  const blockReason = unchanged ? 'Change a field or add a case note to save an update.'
    : (nextStatus === 'Declined' || outcome === 'Declined' || outcome === 'Partially fulfilled') && !note.trim()
      ? 'Add a case note explaining the rationale for a decline or partial response.'
      : nextStatus === 'Completed' && outcome === 'Not decided'
        ? 'Choose a response outcome before marking the request completed.'
        : '';

  function saveUpdate() {
    onUpdate(request.id, nextStatus, verification, outcome, note.trim());
    setNote('');
  }

  return (
    <Modal
      title={request.title}
      subtitle={`${request.id} · Received ${displayDate(request.received)}`}
      icon={<Icons.Users size={18} />}
      onClose={onClose}
      size="lg"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="detail-badges"><StatusBadge status={request.status} /><VerificationBadge verification={request.verification} /><Badge>{request.channel}</Badge></div>
      <p className="detail-description">{request.description || 'No request summary provided.'}</p>
      <dl className="detail-list">
        {[
          ['Data Principal', request.name],
          ['Contact', <a key="e" className="text-link" href={`mailto:${request.email}`}>{request.email}</a>],
          ['Right requested', request.type],
          ['Internal target date', <TargetDate key="t" request={request} />],
          ['Submitted by representative', request.representative ? 'Yes · authority should be verified' : 'No'],
          ['Decision outcome', request.outcome ?? 'Not decided'],
          ['Systems', request.systems.join(', ') || 'Not yet identified'],
          ['Potential data categories', request.dataTypes.join(', ') || 'Not yet identified'],
        ].map(([label, value]) => <div className="detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>

      <section className="case-update">
        <h3>Update case</h3>
        <p>Record verification, the decision outcome, next step, and an internal handling note.</p>
        <div className="form-grid">
          <Field label="Status"><select className="select" value={nextStatus} onChange={event => setNextStatus(event.target.value)}>{CASE_STATUSES.map(status => <option key={status}>{status}</option>)}</select></Field>
          <Field label="Identity / authority verification"><select className="select" value={verification} onChange={event => setVerification(event.target.value)}><option>Pending</option><option>Verified</option><option>Unable to verify</option></select></Field>
          <Field label="Response / decision outcome" className="span-2"><select className="select" value={outcome} onChange={event => setOutcome(event.target.value)}><option>Not decided</option><option>Fulfilled in full</option><option>Partially fulfilled</option><option>Declined</option><option>Withdrawn by requester</option></select></Field>
          <Field label="Case note" className="span-2" hint="Record a clear rationale for a partial fulfilment or decline. Verify identity or representative authority before disclosing personal data."><textarea className="textarea" rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Verification, searches, clarification, decision rationale, or response dispatch" /></Field>
        </div>
        <div className="case-update-actions">
          {blockReason && <span className="field-hint" role="status">{blockReason}</span>}
          <Button variant="primary" icon={<Icons.Check size={15} />} disabled={!!blockReason} onClick={saveUpdate}>Save case update</Button>
        </div>
      </section>

      <section className="case-history">
        <h3>Case history</h3>
        {request.notes.length ? (
          <ol className="timeline">
            {request.notes.map((entry, index) => <li key={`${entry.date}-${index}`}><small>{displayDate(entry.date)}</small><p>{entry.text}</p></li>)}
          </ol>
        ) : <p className="dt-muted">No internal case notes have been recorded yet.</p>}
      </section>
      <div className="info-note"><Icons.Lock size={15} />Request data in this preview is kept in memory and is not sent to a server.</div>
    </Modal>
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
        notes: entryText ? [{ date: new Date().toISOString().slice(0, 10), text: entryText }, ...request.notes] : request.notes,
      };
    }));
    onAction(`Request ${id} updated.`);
  }

  function resetFilters() {
    setQuery('');
    setStatusFilter('All statuses');
    setTypeFilter('All request types');
  }

  const filtersActive = query || statusFilter !== 'All statuses' || typeFilter !== 'All request types';

  return (
    <div className="page rights-page">
      <PageActions>
        <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => setWizardOpen(true)}>Register a request</Button>
      </PageActions>

      <section className="page-intro">
        <span className="page-intro-icon"><Icons.Users size={20} /></span>
        <div>
          <span className="page-intro-eyebrow">Data Principal rights · DPDP Act</span>
          <h2>Rights request register</h2>
          <p>Receive, verify, assess, and respond to access, correction, erasure, grievance, nomination, and consent-withdrawal requests — with a clear record of every step.</p>
        </div>
      </section>

      <section className="rights-metrics" aria-label="Rights request overview">
        <MetricCard icon={Icons.Clipboard} label="Total requests" value={requests.length} detail="All cases" tone="blue" />
        <MetricCard icon={Icons.Clock} label="Open requests" value={openCount} detail="In progress" tone="amber" />
        <MetricCard icon={Icons.Check} label="Completed" value={completedCount} detail="Response issued" tone="green" />
        <MetricCard icon={Icons.X} label="Declined" value={declinedCount} detail="Rationale recorded" tone="rose" />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <SearchInput value={query} onChange={setQuery} label="Search requests" placeholder="Search by reference, name, email, or request type" />
          <select className="select" aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All statuses</option>{activeStatuses.map(status => <option key={status}>{status}</option>)}<option>Completed</option><option>Declined</option></select>
          <select className="select" aria-label="Filter by request type" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option>All request types</option>{REQUEST_TYPES.map(type => <option key={type}>{type}</option>)}</select>
          {filtersActive && <Button size="sm" variant="ghost" onClick={resetFilters}>Clear filters</Button>}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<Icons.Search size={20} />}
            title={requests.length ? 'No requests match your search' : 'No requests yet'}
            description={requests.length ? 'Try a different search or clear the selected filters.' : 'Register a request to start the log.'}
            action={requests.length ? <Button size="sm" onClick={resetFilters}>Clear filters</Button> : <Button size="sm" variant="primary" onClick={() => setWizardOpen(true)}>Register a request</Button>}
          />
        ) : (
          <table className="data-table">
            <thead><tr>
              <th scope="col">Request</th>
              <th scope="col" className="dt-col-secondary">Received</th>
              <th scope="col" className="dt-col-secondary">Active step</th>
              <th scope="col">Verification</th>
              <th scope="col">Status</th>
              <th scope="col">Target date</th>
              <th scope="col"><span className="sr-only">Open case</span></th>
            </tr></thead>
            <tbody>
              {filtered.map(request => (
                <tr key={request.id} className="is-clickable" tabIndex={0} onClick={() => setSelectedId(request.id)} onKeyDown={event => { if (event.key === 'Enter') setSelectedId(request.id); }}>
                  <td className="dt-primary">
                    <div className="dt-title">{request.title}</div>
                    <div className="dt-sub"><span>{request.type}</span><span>{request.name}</span><span className="dt-mono">{request.id}</span></div>
                    <div className="dt-sub dt-fold"><span>Received {displayDate(request.received)}</span><span>{request.activeStep}</span></div>
                  </td>
                  <td className="dt-col-secondary dt-nowrap" data-label="Received">{displayDate(request.received)}</td>
                  <td className="dt-col-secondary" data-label="Active step">{request.activeStep}</td>
                  <td data-label="Verification"><VerificationBadge verification={request.verification} /></td>
                  <td data-label="Status"><StatusBadge status={request.status} /></td>
                  <td data-label="Target date"><TargetDate request={request} /></td>
                  <td className="dt-actions">
                    <Button size="sm" variant="ghost" aria-label={`Open ${request.id}`} onClick={event => { event.stopPropagation(); setSelectedId(request.id); }}>
                      Open <Icons.ChevronRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <footer className="table-footer">
          <span>Showing <b>{filtered.length}</b> of <b>{requests.length}</b> requests</span>
          <span>Target dates follow internal policy; confirm applicable statutory requirements separately.</span>
        </footer>
      </section>

      <div className="info-note"><Icons.Lock size={15} /><span>Preview — case data is held in memory only and isn't sent to a server.</span></div>
      {wizardOpen && <RequestWizard onClose={() => setWizardOpen(false)} onCreate={createRequest} />}
      {selectedRequest && <RequestDetails request={selectedRequest} onClose={() => setSelectedId(null)} onUpdate={updateRequest} />}
    </div>
  );
}
