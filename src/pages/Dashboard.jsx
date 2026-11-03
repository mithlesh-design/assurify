import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Progress, Button, Icons, Modal } from '../ui';
import { OBL_META, statusLabel, statusClass } from '../data/controls';
import { GAPP_PRINCIPLE_LABELS } from '../config/obligations';
import ControlPanel from '../components/ControlPanel';

/* ── Status meta ─────────────────────────────────────── */
const STATUS_PRIORITY = { blocked: 0, needs_discussion: 1, in_progress: 2, pending_review: 3, not_applicable: 4, implemented: 5 };

const STATUS_DOT = {
  blocked:          '#EF4444',
  needs_discussion: '#F59E0B',
  in_progress:      '#3B82F6',
  pending_review:   '#8B5CF6',
  not_applicable:   '#94A3B8',
  implemented:      '#10B981',
};

/* ── Score donut ──────────────────────────────────────── */
function ScoreDonut({ score }) {
  const r   = 46;
  const circ = 2 * Math.PI * r;
  const dash  = circ * (score / 100);
  const gap   = circ - dash;
  const color = score >= 80 ? 'var(--green)' : score >= 50 ? '#F59E0B' : '#EF4444';
  const textColor = score >= 80 ? 'var(--green-dim)' : score >= 50 ? '#B45309' : '#DC2626';

  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="55" cy="55" r={r} fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        {/* Arc */}
        <circle cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray .6s ease, stroke .4s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>%</div>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ─────────────────────────────────── */
const IcoShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Stat tile ────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, sub, color, accent }) {
  return (
    <div className="stat-tile" style={{
      borderLeft: `3px solid ${accent}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: 16, top: 16, opacity: 0.1,
        color: accent, transform: 'scale(2.2)', transformOrigin: 'top right',
      }}>
        <Icon />
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${accent}18`, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Icon />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color ?? 'var(--ink)',
        lineHeight: 1, marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Dashboard Page
═══════════════════════════════════════════════════════ */
const DEFAULT_ASSESSMENT_PLAN = { plannedStart: '2026-09-01', targetDate: '2026-12-15' };
const WORKSTREAMS = [
  { id: 'kickoff', name: 'Assessment planning & kickoff', owner: 'DPO / Privacy Lead', dependency: 'Sponsor approval and scope', due: '2026-09-15', route: 'questionnaire' },
  { id: 'questionnaire', name: 'Stakeholder questionnaire', owner: 'Department Owner', dependency: 'Kickoff and scope', due: '2026-10-23', route: 'questionnaire' },
  { id: 'ropa', name: 'RoPA & processing discovery', owner: 'Process Owners', dependency: 'Questionnaire responses', due: '2026-10-30', route: 'ropa' },
  { id: 'vendors', name: 'Third-party due diligence', owner: 'Procurement', dependency: 'Processor inventory in RoPA', due: '2026-11-06', route: 'vendors' },
  { id: 'meetings', name: 'Department meetings', owner: 'DPO / Privacy Lead', dependency: 'Stakeholder identification', due: '2026-11-13', route: 'meetings' },
  { id: 'evidence', name: 'Evidence collection', owner: 'Control Owners', dependency: 'Assessment requests issued', due: '2026-11-20', route: 'evidence' },
  { id: 'assessment', name: 'Control review & validation', owner: 'Reviewer', dependency: 'Evidence and RoPA available', due: '2026-11-27', route: 'assessment' },
  { id: 'remediation', name: 'Findings remediation', owner: 'Control Owners', dependency: 'Review findings assigned', due: '2026-12-04', route: 'assessment' },
  { id: 'approval', name: 'Final approval & closure', owner: 'CTO / Sponsor', dependency: 'Remediation validated', due: '2026-12-15', route: 'compliance-report' },
];
const OWNER_OPTIONS = ['CTO / Sponsor', 'DPO / Privacy Lead', 'Department Owner', 'Process Owners', 'Control Owners', 'IT / Security', 'Legal', 'Procurement', 'Reviewer'];
const COMMAND_PLAN_KEY = 'dpdpa-assessment-command-plan';

function localDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function displayDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function loadCommandPlan() {
  try { return { ...DEFAULT_ASSESSMENT_PLAN, ...JSON.parse(localStorage.getItem(COMMAND_PLAN_KEY) || '{}') }; }
  catch { return DEFAULT_ASSESSMENT_PLAN; }
}
function loadOwners() {
  try { return JSON.parse(localStorage.getItem(`${COMMAND_PLAN_KEY}-owners`) || '{}'); }
  catch { return {}; }
}
function loadTaskDates() {
  try { return JSON.parse(localStorage.getItem(`${COMMAND_PLAN_KEY}-dates`) || '{}'); }
  catch { return {}; }
}

function AssessmentCommandCenter({ controls, score, meetings, evidence, ropaSummary, questionnaireSummary, vendorSummary, onNavigate, onOpenControl }) {
  const [plan, setPlan] = useState(loadCommandPlan);
  const [owners, setOwners] = useState(loadOwners);
  const [taskDates, setTaskDates] = useState(loadTaskDates);
  const [showPlan, setShowPlan] = useState(false);
  const [planDraft, setPlanDraft] = useState(plan);
  const today = localDateValue(new Date());
  const completedControls = controls.filter(c => c.status === 'implemented' || c.status === 'not_applicable').length;
  const blockers = controls.filter(c => c.status === 'blocked');
  const discussions = controls.filter(c => c.status === 'needs_discussion');
  const submittedEvidence = evidence.filter(item => item.files?.length || ['Uploaded', 'Approved'].includes(item.status));
  const openEvidence = evidence.filter(item => !item.files?.length && !['Uploaded', 'Approved'].includes(item.status));
  const overdueEvidence = openEvidence.filter(item => item.deadline && item.deadline < today);
  const vendorExceptions = vendorSummary?.loaded ? vendorSummary.missing + vendorSummary.pending + vendorSummary.expired : 0;
  const sourcesPendingSync = [ropaSummary, questionnaireSummary, vendorSummary].some(summary => !summary?.loaded);
  const actualStart = controls.flatMap(c => c.acts || []).filter(a => a.role !== 'system' && a.at).map(a => a.at.slice(0, 10)).sort()[0] || '';
  const planDays = Math.max(1, (new Date(`${plan.targetDate}T00:00:00`) - new Date(`${plan.plannedStart}T00:00:00`)) / 86400000);
  const elapsedDays = Math.max(0, (new Date(`${today}T00:00:00`) - new Date(`${plan.plannedStart}T00:00:00`)) / 86400000);
  const schedulePct = Math.min(100, Math.round((elapsedDays / planDays) * 100));
  const daysRemaining = Math.ceil((new Date(`${plan.targetDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
  const forecast = blockers.length || overdueEvidence.length || vendorExceptions || (score + 12 < schedulePct) ? 'At risk' : sourcesPendingSync ? 'Data incomplete' : 'On track';
  const forecastReason = blockers.length
    ? `${blockers.length} blocked control${blockers.length === 1 ? '' : 's'} need an owner and resolution date.`
    : overdueEvidence.length
    ? `${overdueEvidence.length} evidence request${overdueEvidence.length === 1 ? '' : 's'} passed the deadline.`
    : vendorExceptions
    ? `${vendorExceptions} third-party DPA exception${vendorExceptions === 1 ? '' : 's'} need follow-up.`
    : sourcesPendingSync
    ? 'Open Onboarding responses, RoPA, and vendor assessment to load their current source summaries.'
    : score + 12 < schedulePct
    ? 'Control completion is trailing the elapsed assessment schedule.'
    : 'Current control progress is keeping pace with the scheduled window.';
  const savePlan = e => {
    e.preventDefault();
    if (planDraft.targetDate <= planDraft.plannedStart) return;
    setPlan(planDraft); localStorage.setItem(COMMAND_PLAN_KEY, JSON.stringify(planDraft)); setShowPlan(false);
  };
  const assignOwner = (id, owner) => {
    const next = { ...owners, [id]: owner };
    setOwners(next); localStorage.setItem(`${COMMAND_PLAN_KEY}-owners`, JSON.stringify(next));
  };
  const updateTaskDate = (id, date) => {
    const next = { ...taskDates, [id]: date };
    setTaskDates(next); localStorage.setItem(`${COMMAND_PLAN_KEY}-dates`, JSON.stringify(next));
  };
  const workstreams = WORKSTREAMS.map(item => {
    let status = 'Planned'; let progress = 0; let detail = 'Waiting on upstream work';
    if (item.id === 'kickoff') { status = actualStart ? 'Complete' : 'Not started'; progress = actualStart ? 100 : 0; detail = actualStart ? `Activity recorded ${displayDate(actualStart)}` : 'No assessment activity recorded'; }
    if (item.id === 'questionnaire') { status = questionnaireSummary?.loaded ? questionnaireSummary.total ? questionnaireSummary.unanswered ? 'In progress' : 'Complete' : 'Not started' : questionnaireSummary?.error ? 'Source unavailable' : 'Not synced'; progress = questionnaireSummary?.loaded && questionnaireSummary.total ? Math.round(questionnaireSummary.answered / questionnaireSummary.total * 100) : 0; detail = questionnaireSummary?.loaded ? `${questionnaireSummary.answered} of ${questionnaireSummary.total} questions answered` : questionnaireSummary?.error ? 'Questionnaire source could not be loaded' : 'Open Onboarding responses to load source data'; }
    if (item.id === 'ropa') { status = ropaSummary?.loaded ? ropaSummary.total ? 'In progress' : 'Not started' : ropaSummary?.error ? 'Source unavailable' : 'Not synced'; progress = ropaSummary?.loaded && ropaSummary.total ? 50 : 0; detail = ropaSummary?.loaded ? `${ropaSummary.total} processing activities · ${ropaSummary.high_sensitivity} high sensitivity` : ropaSummary?.error ? 'RoPA source could not be loaded' : 'Open the RoPA register to load source data'; }
    if (item.id === 'vendors') { status = vendorSummary?.loaded ? vendorSummary.total ? vendorExceptions ? 'Needs action' : 'In progress' : 'Not started' : vendorSummary?.error ? 'Source unavailable' : 'Not synced'; detail = vendorSummary?.loaded ? `${vendorSummary.total} vendors · ${vendorExceptions} DPA exceptions` : vendorSummary?.error ? 'Third-party source could not be loaded' : 'Open vendor assessment to load source data'; }
    if (item.id === 'meetings') { status = meetings.length ? 'In progress' : 'Not started'; detail = `${meetings.length} meeting${meetings.length === 1 ? '' : 's'} recorded`; }
    if (item.id === 'evidence') { status = overdueEvidence.length ? 'Overdue' : openEvidence.length ? 'In progress' : 'Complete'; progress = evidence.length ? Math.round((submittedEvidence.length / evidence.length) * 100) : 0; detail = `${submittedEvidence.length} of ${evidence.length} requests uploaded${overdueEvidence.length ? ` · ${overdueEvidence.length} overdue` : ''}`; }
    if (item.id === 'assessment') { status = completedControls === controls.length && controls.length ? 'Complete' : controls.some(c => c.status !== 'pending_review') ? 'In progress' : 'Not started'; progress = controls.length ? Math.round((completedControls / controls.length) * 100) : 0; detail = `${completedControls} of ${controls.length} controls implemented or not applicable`; }
    if (item.id === 'remediation') { status = blockers.length ? 'Blocked' : discussions.length ? 'Needs action' : completedControls ? 'In progress' : 'Planned'; progress = controls.length ? Math.round((completedControls / controls.length) * 100) : 0; detail = `${blockers.length} blocked · ${discussions.length} need discussion`; }
    if (item.id === 'approval') { status = completedControls === controls.length && controls.length && !blockers.length && !openEvidence.length ? 'Ready for review' : 'Planned'; detail = 'Starts after reviews and remediation are complete'; }
    const due = item.id === 'approval' ? plan.targetDate : taskDates[item.id] || item.due;
    const overdue = due < today && !['Complete', 'Ready for review'].includes(status);
    return { ...item, due, owner: owners[item.id] || item.owner, status: overdue && status !== 'Blocked' ? 'Overdue' : status, progress, detail, overdue };
  });
  const urgentItems = [
    ...blockers.slice(0, 3).map(control => ({ id: `control-${control.id}`, title: control.name, detail: control.recommendation || control.desc || 'Resolve the blocker and record the target resolution date.', owner: 'Control owner', priority: 'Blocked', action: 'Open control', onClick: () => onOpenControl(control.id) })),
    ...overdueEvidence.slice(0, 3).map(request => ({ id: `evidence-${request.id}`, title: request.name, detail: `${request.department} · deadline ${displayDate(request.deadline)}`, owner: request.department, priority: 'Overdue', action: 'Review request', onClick: () => onNavigate('evidence') })),
    ...(vendorExceptions ? [{ id: 'vendor-exceptions', title: 'Third-party DPA follow-up', detail: `${vendorExceptions} vendor record${vendorExceptions === 1 ? '' : 's'} with missing, pending, or expired DPAs`, owner: 'Procurement', priority: 'Decision needed', action: 'Review vendors', onClick: () => onNavigate('vendors') }] : []),
    ...discussions.slice(0, Math.max(0, 4 - blockers.length - overdueEvidence.length)).map(control => ({ id: `discussion-${control.id}`, title: control.name, detail: control.recommendation || 'A decision or guidance is needed to continue.', owner: 'Reviewer + control owner', priority: 'Decision needed', action: 'Review', onClick: () => onOpenControl(control.id) })),
  ].slice(0, 5);
  const stateClass = status => status.toLowerCase().replace(/[^a-z]+/g, '-');

  return <section className="command-center" aria-label="DPDPA assessment command centre">
    <div className="cc-hero">
      <div className="cc-hero-top"><div><span className="cc-eyebrow"><Icons.Shield size={14}/> ASSESSMENT LIFECYCLE</span><h2>Current assessment</h2><p>Plan, delivery, evidence, and issues in one operational view.</p></div><div className="cc-hero-tools"><span className={`cc-forecast cc-forecast-${stateClass(forecast)}`}><i/>{forecast}</span><Button onClick={() => { setPlanDraft(plan); setShowPlan(true); }}>Update assessment plan</Button></div></div>
      <div className="cc-plan-strip"><div><span>Planned start</span><strong>{displayDate(plan.plannedStart)}</strong></div><div className="cc-plan-actual"><span>Actual start</span><strong>{actualStart ? displayDate(actualStart) : 'Not recorded'}</strong></div><div><span>Committed completion</span><strong>{displayDate(plan.targetDate)}</strong></div><div className="cc-countdown"><span>Time remaining</span><strong>{daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}</strong></div></div>
      <div className="cc-schedule-track"><div className="cc-schedule-label"><span>Schedule elapsed</span><strong>{schedulePct}%</strong></div><div className="cc-schedule-bar"><span style={{ width: `${schedulePct}%` }}/></div><div className="cc-forecast-note"><Icons.Alert size={15}/><span><strong>{forecast}:</strong> {forecastReason} This directional signal uses schedule pace, overdue evidence, source freshness, and known blockers.</span></div>
    </div>
    </div>
    <div className="cc-snapshot-grid">
      <button className="cc-snapshot" onClick={() => onNavigate('assessment')}><span className="cc-snapshot-icon cc-blue"><Icons.Shield size={17}/></span><span className="cc-snapshot-copy"><small>Controls complete</small><strong>{completedControls}<em> / {controls.length}</em></strong><span>{score}% overall score</span></span><span className="cc-snapshot-arrow"><Icons.ChevronRight size={16}/></span></button>
      <button className="cc-snapshot" onClick={() => onNavigate('evidence')}><span className="cc-snapshot-icon cc-amber"><Icons.File size={17}/></span><span className="cc-snapshot-copy"><small>Evidence outstanding</small><strong>{openEvidence.length}</strong><span>{submittedEvidence.length} uploaded · {overdueEvidence.length} overdue</span></span><span className="cc-snapshot-arrow"><Icons.ChevronRight size={16}/></span></button>
      <button className="cc-snapshot" onClick={() => onNavigate('meetings')}><span className="cc-snapshot-icon cc-green"><Icons.Calendar size={17}/></span><span className="cc-snapshot-copy"><small>Meetings recorded</small><strong>{meetings.length}</strong><span>Department engagement</span></span><span className="cc-snapshot-arrow"><Icons.ChevronRight size={16}/></span></button>
      <button className="cc-snapshot" onClick={() => onNavigate(blockers.length || discussions.length ? 'assessment' : overdueEvidence.length ? 'evidence' : vendorExceptions ? 'vendors' : 'assessment')}><span className="cc-snapshot-icon cc-red"><Icons.Alert size={17}/></span><span className="cc-snapshot-copy"><small>Management interventions</small><strong>{blockers.length + overdueEvidence.length + discussions.length + vendorExceptions}</strong><span>{blockers.length} blocked · {overdueEvidence.length} overdue · {vendorExceptions} vendor DPA exceptions</span></span><span className="cc-snapshot-arrow"><Icons.ChevronRight size={16}/></span></button>
    </div>
    <div className="cc-main-grid">
      <section className="card cc-workplan"><header className="cc-section-head"><div><span className="cc-section-label">SEQUENCE & ACCOUNTABILITY</span><h3>Assessment workplan</h3><p>Dependencies, proposed owners, and module-linked progress</p></div><span className="cc-progress-chip">{workstreams.filter(w => ['Complete', 'Ready for review'].includes(w.status)).length} / {workstreams.length} closed</span></header>
        <div className="cc-workplan-list">{workstreams.map((work, index) => <article key={work.id} className={`cc-work-row${work.overdue ? ' cc-work-overdue' : ''}`}><div className="cc-step-number">{index + 1}</div><div className="cc-work-info"><div className="cc-work-name">{work.name}<span className={`cc-state cc-state-${stateClass(work.status)}`}>{work.status}</span></div><div className="cc-work-detail">{work.detail}</div><div className="cc-work-dependency"><span>Depends on</span>{work.dependency}</div>{['assessment', 'evidence', 'questionnaire'].includes(work.id) && <div className="cc-work-progress"><span style={{ width: `${work.progress}%` }}/></div>}</div><div className="cc-work-owner"><label htmlFor={`cc-owner-${work.id}`}>Accountable owner</label><select id={`cc-owner-${work.id}`} value={work.owner} onChange={e => assignOwner(work.id, e.target.value)}>{OWNER_OPTIONS.map(owner => <option key={owner}>{owner}</option>)}</select></div><div className="cc-work-due"><label htmlFor={`cc-date-${work.id}`}>Target date</label><input id={`cc-date-${work.id}`} aria-label={`Target date for ${work.name}`} type="date" value={work.due} disabled={work.id === 'approval'} onChange={e => updateTaskDate(work.id, e.target.value)} /></div><button className="cc-work-open" onClick={() => onNavigate(work.route)} aria-label={`Open ${work.name}`}><Icons.ChevronRight size={17}/></button></article>)}</div>
      </section>
      <aside className="card cc-interventions"><header className="cc-section-head"><div><span className="cc-section-label">MANAGEMENT ATTENTION</span><h3>Intervention queue</h3><p>Issues that may affect the committed date</p></div><span className="cc-attention-count">{urgentItems.length}</span></header>
        {urgentItems.length ? <div className="cc-urgent-list">{urgentItems.map(item => <article key={item.id} className="cc-urgent-item"><span className={`cc-urgent-mark cc-mark-${stateClass(item.priority)}`}><Icons.Alert size={14}/></span><div className="cc-urgent-copy"><strong>{item.title}</strong><span>{item.detail}</span><small>Owner: {item.owner}</small><button onClick={item.onClick}>{item.action} <Icons.ArrowUpRight size={13}/></button></div><span className={`cc-priority cc-priority-${stateClass(item.priority)}`}>{item.priority}</span></article>)}</div> : <div className="cc-queue-clear"><span><Icons.Check size={18}/></span><strong>No open blockers detected</strong><p>Keep reviewing evidence and control status to maintain the forecast.</p></div>}
        <div className="cc-queue-footer"><span>Need a management decision?</span><button onClick={() => onNavigate('meetings')}>Schedule a review <Icons.ArrowUpRight size={13}/></button></div>
      </aside>
    </div>
    <section className="cc-module-hub"><div className="cc-hub-head"><div><span className="cc-section-label">CONNECTED WORKSPACES</span><h3>Assessment work areas</h3></div><span>Open a source module to review its underlying records</span></div><div className="cc-module-grid">{[
      { id: 'assessment', label: 'DPDPA gap assessment', hint: 'Control status and findings', icon: 'Shield', stat: `${completedControls}/${controls.length} complete` },
      { id: 'questionnaire', label: 'Onboarding responses', hint: 'Business inputs and scope', icon: 'File', stat: questionnaireSummary?.loaded ? `${questionnaireSummary.unanswered} unanswered` : 'Open to sync status' },
      { id: 'ropa', label: 'RoPA register', hint: 'Processing activities and owners', icon: 'Database', stat: ropaSummary?.loaded ? `${ropaSummary.total} activities` : 'Open to sync status' },
      { id: 'meetings', label: 'Meetings tracker', hint: 'Department engagement', icon: 'Calendar', stat: `${meetings.length} recorded` },
      { id: 'evidence', label: 'Evidence tracker', hint: 'Requests and supporting records', icon: 'Folder', stat: `${openEvidence.length} outstanding` },
      { id: 'vendors', label: 'Third-party assessment', hint: 'Processor and vendor review', icon: 'Building', stat: vendorSummary?.loaded ? `${vendorExceptions} DPA exceptions` : 'Open to sync status' },
      { id: 'policies', label: 'Policy library', hint: 'Policy publication and review cycles', icon: 'File', stat: 'Review policies' },
    ].map(module => { const ModuleIcon = Icons[module.icon]; return <button key={module.id} className="cc-module-card" onClick={() => onNavigate(module.id)}><span className="cc-module-icon"><ModuleIcon size={17}/></span><span className="cc-module-copy"><strong>{module.label}</strong><small>{module.hint}</small></span><span className="cc-module-status">{module.stat}</span><Icons.ArrowUpRight size={14} className="cc-module-arrow"/></button>; })}</div></section>
    {showPlan && <Modal title="Assessment schedule" onClose={() => setShowPlan(false)} footer={<><Button onClick={() => setShowPlan(false)}>Cancel</Button><Button variant="primary" type="submit" form="cc-plan-form">Save schedule</Button></>}><form id="cc-plan-form" className="cc-plan-form" onSubmit={savePlan}><p>Set the committed assessment window. Dates are saved in this browser and do not update a server.</p><label>Planned start<input className="input" required type="date" value={planDraft.plannedStart} onChange={e => setPlanDraft(value => ({ ...value, plannedStart: e.target.value }))}/></label><label>Target completion<input className="input" required min={planDraft.plannedStart} type="date" value={planDraft.targetDate} onChange={e => setPlanDraft(value => ({ ...value, targetDate: e.target.value }))}/></label>{planDraft.targetDate <= planDraft.plannedStart && <span className="cc-plan-error" role="alert">Target completion must be after the planned start.</span>}</form></Modal>}
  </section>;
}

function PageDashboard({ onNavigate, meetings = [], evidence = [], ropaSummary, questionnaireSummary, vendorSummary }) {
  const { controls, controlsLoading, complianceScore, user } = useApp();
  const [openCtrl, setOpenCtrl] = useState(null);
  const openCtrlData = openCtrl ? controls.find(c => c.id === openCtrl) : null;

  const score       = complianceScore();
  const implemented = controls.filter(c => c.status === 'implemented').length;
  const pending     = controls.filter(c => c.status === 'pending_review').length;
  const inProgress  = controls.filter(c => c.status === 'in_progress').length;
  const critical    = controls.filter(c => c.status === 'blocked' || c.status === 'needs_discussion').length;

  const scoreBarColor = score >= 80 ? 'var(--green)' : score >= 50 ? '#F59E0B' : '#EF4444';

  const priorityItems = controls
    .filter(c => c.status === 'blocked' || c.status === 'needs_discussion')
    .slice(0, 6);

  const oblGroups = (() => {
    const seen = new Set();
    const list = [];
    controls.forEach(c => {
      if (c.obl && !seen.has(c.obl)) {
        seen.add(c.obl);
        list.push({
          id:   c.obl,
          name: GAPP_PRINCIPLE_LABELS[c.obl]
                ?? OBL_META.find(o => o.id === c.obl)?.name
                ?? c.obl.replace(/_/g, ' '),
        });
      }
    });
    return list;
  })();

  const oblProgress = oblGroups.map(obl => {
    const cs   = controls.filter(c => c.obl === obl.id);
    const done = cs.filter(c => c.status === 'implemented' || c.status === 'not_applicable').length;
    const pct  = cs.length > 0 ? Math.round((done / cs.length) * 100) : 0;
    const tone = pct >= 70 ? 'low' : pct >= 30 ? 'med' : 'high';
    return { id: obl.id, name: obl.name, pct, tone };
  });

  const activityRows = [...controls]
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9))
    .slice(0, 8);

  const firstName = (user?.name ?? 'there').split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (controlsLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid var(--border)',
            borderTop: '3px solid var(--green)', borderRadius: '50%',
            animation: 'spin .8s linear infinite', margin: '0 auto 14px',
          }} />
          Loading compliance data…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AssessmentCommandCenter controls={controls} score={score} meetings={meetings} evidence={evidence} ropaSummary={ropaSummary} questionnaireSummary={questionnaireSummary} vendorSummary={vendorSummary} onNavigate={onNavigate} onOpenControl={setOpenCtrl} />

      {/* ══ Hero welcome banner ═══════════════════════════ */}
      {/* <div style={{
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(135deg, var(--black) 0%, #253A8E 60%, #1a6080 100%)',
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        
        <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 120, bottom: -50, width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(0,170,191,0.1)', pointerEvents: 'none' }} />

        
        <ScoreDonut score={score} />

       
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            Welcome back, {firstName} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
            {today}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1, height: 6, borderRadius: 99,
              background: 'rgba(255,255,255,0.12)',
              maxWidth: 320,
            }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${score}%`, background: scoreBarColor,
                transition: 'width .6s ease',
              }} />
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}>
              {implemented}/{controls.length} controls complete
            </div>
          </div>
        </div>

        
        <button
          className="btn"
          style={{
            flexShrink: 0, background: 'rgba(255,255,255,0.12)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => onNavigate('assessment')}
        >
          View assessment <IcoArrow />
        </button>
      </div> */}

      {/* ══ Stat tiles ════════════════════════════════════ */}
      {/* ══ Two-column ════════════════════════════════════ */}
      <div className="two-col" style={{ marginBottom: 24 }}>

        {/* Obligation progress */}
        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Obligation progress</h3>
              <div className="card-subtitle">{oblGroups.length} principle{oblGroups.length !== 1 ? 's' : ''} tracked</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('assessment')}>
              Full assessment <IcoChevron />
            </button>
          </div>

          <div style={{ padding: '4px 20px 16px' }}>
            {oblGroups.length === 0 ? (
              <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                No controls loaded yet.
              </div>
            ) : oblProgress.map((o) => {
              const pctColor = o.pct >= 70 ? 'var(--green-dim)' : o.pct >= 30 ? '#B45309' : '#DC2626';
              return (
                <button
                  key={o.id}
                  onClick={() => onNavigate('assessment')}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 8px', textAlign: 'left',
                    border: 'none', background: 'transparent', borderRadius: 'var(--r-sm)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* ID tag */}
                  {/* <span style={{
                    fontSize: 12, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                    background: 'var(--green-soft)', color: 'var(--green-dim)',
                    border: '1px solid var(--green-mid)', letterSpacing: '0.03em',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {o.id.replace(/_/g, '-')}
                  </span> */}
                  {/* Name */}
                  <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.name}
                  </span>
                  {/* Progress bar */}
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <Progress value={o.pct} tone={o.tone} />
                  </div>
                  {/* Pct */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: pctColor,
                    minWidth: 36, textAlign: 'right' }}>
                    {o.pct}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority actions */}
        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Priority actions</h3>
              <div className="card-subtitle">Blocked &amp; needs discussion</div>
            </div>
            {priorityItems.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('assessment')}>
                All controls <IcoChevron />
              </button>
            )}
          </div>

          <div style={{ padding: '4px 0 8px' }}>
            {priorityItems.length === 0 ? (
              <div style={{
                padding: '32px 20px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--green-soft)', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IcoCheck />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>All clear!</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No critical issues — great progress</div>
              </div>
            ) : priorityItems.map((c, i) => {
              const isBlocked = c.status === 'blocked';
              const dotColor  = isBlocked ? '#EF4444' : '#F59E0B';
              const bgColor   = isBlocked ? '#FEF2F2' : '#FFFBEB';
              const tagColor  = isBlocked ? { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' }
                                           : { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenCtrl(c.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '4px 8px', width: '100%', textAlign: 'left',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderBottom: i < priorityItems.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = bgColor}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: dotColor,
                    flexShrink: 0, marginTop: 5,
                    boxShadow: `0 0 0 3px ${dotColor}22`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {c.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                        background: tagColor.bg, color: tagColor.text, border: `1px solid ${tagColor.border}`,
                      }}>
                        {isBlocked ? 'Blocked' : 'Needs discussion'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--slate)' }}>
                        {GAPP_PRINCIPLE_LABELS[c.obl] ?? c.obl?.replace(/_/g, ' ') ?? c.id}
                      </span>
                    </div>
                  </div>
                  <IcoChevron />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ Controls activity ═════════════════════════════ */}
      <div className="card">
        <div className="card-header">
          <div style={{ flex: 1 }}>
            <h3 className="card-title">Controls activity</h3>
            <div className="card-subtitle">
              {controls.length} control{controls.length !== 1 ? 's' : ''} · sorted by urgency
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('assessment')}>
            View all <IcoChevron />
          </button>
        </div>

        {activityRows.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No controls loaded. Select a tenant workspace to load controls.
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 12, padding: '8px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}>
              {['Control', 'Status', 'Obligation'].map(h => (
                <div key={h} style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {activityRows.map((c, i) => {
              const dot     = STATUS_DOT[c.status] ?? '#94A3B8';
              const oblName = GAPP_PRINCIPLE_LABELS[c.obl] ?? c.obl?.replace(/_/g, ' ') ?? '—';
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenCtrl(c.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: 12, padding: '11px 20px', alignItems: 'center',
                    width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
                    borderBottom: i < activityRows.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name + dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: dot,
                      flexShrink: 0, boxShadow: `0 0 0 2px ${dot}22`,
                    }} />
                    <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span className={`status-badge ${statusClass(c.status)}`}
                    style={{ fontSize: 12, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    {statusLabel(c.status)}
                  </span>
                  {/* Obligation */}
                  <span style={{
                    fontSize: 12, color: 'var(--slate)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                  }}>
                    {oblName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Control detail panel ══════════════════════════ */}
      {openCtrlData && (
        <ControlPanel ctrl={openCtrlData} onClose={() => setOpenCtrl(null)} />
      )}

    </div>
  );
}

export default PageDashboard;
