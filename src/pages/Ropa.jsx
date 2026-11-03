/**
 * pages/Ropa.jsx
 * RoPA (Records of Processing Activities) module.
 *
 * Two tabs:
 *   "Register"  — searchable/filterable list of all processing activities
 *   "Dashboard" — summary stats + DPDPA/GDPR completeness checklist
 *
 * Clicking a row opens RopaDetail (full-page, handled by parent App.jsx).
 * Header "Add activity" button opens the multi-step add modal.
 */

import { Children, cloneElement, isValidElement, useState, useEffect, useMemo, useCallback, useId, useRef } from 'react';
import {
  Icons, Button, Modal, Progress, Badge, EmptyState, ErrorState, FilterChips, LoadingState, PageActions, SearchInput, useDialog,
} from '../ui';
import { downloadCsv, formatDate, formatNumber, humanize } from '../lib/format';
import {
  fetchRopaRecords, fetchRopaDashboard, fetchRopaQuestions, createRopaRecord, upsertRopaResponses,
} from '../api/services/ropa';
import {
  STATUS_META, SENSITIVITY_META, DPA_STATUS_META, NOTICE_STATUS_META,
  LEGAL_BASIS_DPDPA, LEGAL_BASIS_GDPR, DATA_CATEGORIES, RIGHTS_OPTIONS,
  CHECKLIST_ITEMS, STATUS_OPTIONS,
} from '../data/ropa';
import RopaQuestionFields from '../components/RopaQuestionFields';
import { encodeRopaAnswer, questionsForSections, ROPA_SECTION_GROUPS } from '../data/ropaQuestions';

/* ═══════════════════════════════════════════════════════════
   Shared mini-components
═══════════════════════════════════════════════════════════ */

const STATUS_TONE = { active: 'success', inactive: 'neutral', under_review: 'warning' };
function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.active;
  return <Badge tone={STATUS_TONE[status] ?? 'success'} dot>{m.label}</Badge>;
}

const SENSITIVITY_TONE = { high: 'danger', medium: 'warning', low: 'success' };
function SensitivityBadge({ level }) {
  if (!level) return <span className="dt-muted">—</span>;
  const key = String(level).toLowerCase();
  const m = SENSITIVITY_META[key] ?? SENSITIVITY_META.low;
  return <Badge tone={SENSITIVITY_TONE[key] ?? 'success'} dot>{m.label}</Badge>;
}

const DPA_TONE = { yes: 'success', no: 'danger', pending: 'warning' };
function DpaBadge({ status }) {
  if (!status) return <span className="dt-muted">—</span>;
  const m = DPA_STATUS_META[status] ?? DPA_STATUS_META.pending;
  return <Badge tone={DPA_TONE[status] ?? 'warning'}>{m.label}</Badge>;
}

/* ═══════════════════════════════════════════════════════════
   Stat tile (register view)
═══════════════════════════════════════════════════════════ */

function StatTile({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="stat-tile" style={{ borderLeft: `3px solid ${accent}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 14, top: 14, opacity: 0.07, color: accent, transform: 'scale(2.2)', transformOrigin: 'top right' }}>
        <Icon />
      </div>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{sub}</div>
    </div>
  );
}

/* ── Inline SVG icons for stat tiles ── */
const IcoFile    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoShield  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoAlert   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoGlobe   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

/* ═══════════════════════════════════════════════════════════
   Register table row
═══════════════════════════════════════════════════════════ */

function RecordRow({ record, onSelect }) {
  const open = () => onSelect(record.id);
  return (
    <tr className="is-clickable" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter') open(); }}>
      <td className="dt-primary">
        <div className="dt-title">{record.processing_activity}</div>
        <div className="dt-sub"><span className="dt-mono">{record.ropa_id}</span>{record.department && <span>{record.department}</span>}</div>
        <div className="dt-sub dt-fold">
          <span>Legal basis: {humanize(record.legal_basis_dpdpa)}</span>
          {record.data_principals && <span>{record.data_principals}</span>}
        </div>
      </td>
      <td data-label="Sensitivity"><SensitivityBadge level={record.sensitivity_level} /></td>
      <td className="dt-col-secondary" data-label="Legal basis">{humanize(record.legal_basis_dpdpa)}</td>
      <td className="dt-col-secondary" data-label="Data Principals">
        <div>{record.data_principals || <span className="dt-muted">—</span>}</div>
        {record.volume != null && record.volume !== '' && <div className="dt-sub">{formatNumber(record.volume)} individuals</div>}
      </td>
      <td data-label="DPA in place"><DpaBadge status={record.dpa_in_place} /></td>
      <td data-label="Status"><StatusBadge status={record.status} /></td>
      <td className="dt-actions">
        <Button size="sm" variant="ghost" aria-label={`Open ${record.ropa_id}`} onClick={e => { e.stopPropagation(); open(); }}>
          Open <Icons.ChevronRight size={14} />
        </Button>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════
   Alert banner
═══════════════════════════════════════════════════════════ */

function AlertBanner({ icon: Icon, label, count, accent }) {
  if (!count) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      borderRadius: 'var(--r-md)', background: `${accent}12`,
      border: `1px solid ${accent}40`, flexShrink: 0,
    }}>
      <span style={{ color: accent }}><Icon /></span>
      <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{count}</span>
      <span style={{ fontSize: 12.5, color: 'var(--slate)' }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Dashboard tab
═══════════════════════════════════════════════════════════ */

function DashboardTab({ stats }) {
  const checks = stats.checklist ?? {};
  const passCount = Object.values(checks).filter(value => value === true).length;
  const knownChecks = Object.values(checks).filter(value => typeof value === 'boolean').length;
  const totalChecks = CHECKLIST_ITEMS.length;

  /* Sensitivity breakdown */
  const sensBreakdown = [
    { label: 'High',   count: stats.high_sensitivity,                     color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Medium', count: stats.sensitivity_medium, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Low',    count: stats.sensitivity_low, color: '#10B981', bg: '#ECFDF5' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Key metrics grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Activities',      value: stats.total,          accent: '#00AABF', sub: `${stats.active} active` },
          { label: 'High Sensitivity',      value: stats.high_sensitivity, accent: '#EF4444', sub: 'Require extra care' },
          { label: 'DPIA Required',         value: stats.dpia_required,  accent: '#8B5CF6', sub: 'High-risk processing' },
          { label: 'Cross-Border Transfers',value: stats.cross_border,   accent: '#F59E0B', sub: 'Safeguards needed' },
        ].map(tile => (
          <div key={tile.label} style={{
            background: 'var(--white)', border: '1px solid var(--border)', borderLeft: `3px solid ${tile.accent}`,
            borderRadius: 'var(--r-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{tile.label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>{tile.value}</div>
            <div style={{ fontSize: 12, color: 'var(--slate)' }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Completeness checklist ── */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>Compliance Checklist</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>DPDPA 2023 &amp; GDPR requirements</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: knownChecks === totalChecks && passCount === totalChecks ? 'var(--green-dim)' : '#B45309' }}>{passCount}/{totalChecks}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>passed</div>
            </div>
          </div>
          {knownChecks < totalChecks && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Checklist status is not fully provided by the dashboard API.
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <Progress value={passCount} max={totalChecks} tone={knownChecks === totalChecks && passCount === totalChecks ? 'low' : 'med'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {CHECKLIST_ITEMS.map(item => {
              const passed = checks[item.id];
              const known = typeof passed === 'boolean';
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    background: !known ? 'var(--surface)' : passed ? 'var(--success-soft)' : '#FEF2F2',
                    border: `1.5px solid ${!known ? 'var(--border)' : passed ? 'var(--success-mid)' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!known
                      ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>–</span>
                      : passed
                      ? <Icons.Check size={11} style={{ color: 'var(--success)' }} />
                      : <Icons.X size={11} style={{ color: '#EF4444' }} />}
                  </div>
                  <span style={{ fontSize: 12.5, color: !known ? 'var(--muted)' : passed ? 'var(--ink)' : 'var(--slate)', lineHeight: 1.4 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Sensitivity breakdown ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Sensitivity Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sensBreakdown.map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{s.count ?? '—'} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>activities</span></span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--border-soft)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: s.color, width: `${stats.total && Number.isFinite(s.count) ? (s.count / stats.total) * 100 : 0}%`, transition: 'width .5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick action items ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Action Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Vendors missing DPAs', count: stats.missing_dpa, color: '#EF4444' },
                { label: 'Activities with notice not provided',      count: stats.notice_not_provided ?? 0, color: '#F59E0B' },
                { label: 'DPIA required but not started', count: stats.dpia_not_started, color: '#8B5CF6' },
                { label: 'Cross-border transfers without safeguards', count: stats.cross_border_without_safeguards, color: '#F59E0B' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${item.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.count ?? '—'}</span>
                  </div>
                  <span style={{ fontSize: 12.5, color: item.count == null ? 'var(--muted)' : item.count > 0 ? 'var(--ink)' : 'var(--muted)', fontWeight: item.count > 0 ? 600 : 400 }}>{item.label}</span>
                  {item.count === 0 && <Icons.Check size={14} style={{ color: 'var(--success)', marginLeft: 'auto', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Multi-step Add Activity modal
═══════════════════════════════════════════════════════════ */

const STEPS = [
  { label: 'Administration', sub: 'Activity, department, ownership' },
  { label: 'Purpose & Legal Basis', sub: 'Why & under which authority' },
  { label: 'Data & Collection', sub: 'What data, from whom, how' },
  { label: 'Storage & Retention', sub: 'Where stored, how long' },
  { label: 'Third Parties & Security', sub: 'Vendors, DPAs, safeguards' },
  { label: 'DPIA & Rights', sub: 'Risk assessment, data subject rights' },
];

const ADD_STEP_SECTIONS = [
  [],
  ROPA_SECTION_GROUPS.purpose,
  ROPA_SECTION_GROUPS.data,
  ROPA_SECTION_GROUPS.storage,
  [...ROPA_SECTION_GROUPS.vendors, ...ROPA_SECTION_GROUPS.security],
  [...ROPA_SECTION_GROUPS.dpia, ...ROPA_SECTION_GROUPS.rights],
];

function FieldLabel({ children, required, htmlFor }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}{required && <span className="field-required" aria-hidden="true">*</span>}
    </label>
  );
}

/* Wires the FieldLabel to the first form control inside the field */
function FormField({ children, style }) {
  const id = useId();
  let controlTagged = false;
  const isControl = (el) => ['input', 'select', 'textarea'].includes(el.type) || el.type === SelectInput;
  const mapped = Children.map(children, child => {
    if (!isValidElement(child)) return child;
    if (child.type === FieldLabel) return cloneElement(child, { htmlFor: child.props.htmlFor ?? id });
    if (!controlTagged && isControl(child)) { controlTagged = true; return cloneElement(child, { id: child.props.id ?? id }); }
    return child;
  });
  return <div style={{ marginBottom: 14, ...style }}>{mapped}</div>;
}

function FormRow({ children }) {
  return <div className="form-grid" style={{ gap: '0 12px' }}>{children}</div>;
}

function SelectInput({ id, name, value, onChange, options, placeholder }) {
  return (
    <select className="select" id={id} name={name} value={value} onChange={onChange}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function CheckboxRow({ name, checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange}
        style={{ width: 15, height: 15, accentColor: 'var(--green)', cursor: 'pointer' }} />
      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</span>
    </label>
  );
}

function MultiSelect({ options, selected, onChange, label }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const val = o.value ?? o;
        const lbl = o.label ?? o;
        const active = selected.includes(val);
        return (
          <button key={val} type="button"
            onClick={() => toggle(val)}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontWeight: active ? 700 : 500,
              background: active ? 'var(--green-soft)' : 'var(--surface)',
              color: active ? 'var(--green-dim)' : 'var(--slate)',
              border: `1.5px solid ${active ? 'var(--green-mid)' : 'var(--border)'}`,
              transition: 'all .12s',
            }}>
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

function AddActivityModal({ onClose, onSaved }) {
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState({
    processing_activity: '', process_description: '', department: '', process_owner: '', status: 'active',
  });
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  const [createdProcess, setCreatedProcess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetchRopaQuestions()
      .then(setQuestions)
      .catch(e => setQuestionsError(e.message ?? 'Failed to load RoPA questions.'))
      .finally(() => setQuestionsLoading(false));
  }, []);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const setVal = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const validate = () => {
    if (step === 0 && !form.processing_activity.trim()) return 'Activity name is required.';
    if (step === 0 && !form.department.trim()) return 'Department is required.';
    const requiredMissing = questionsForSections(questions, ADD_STEP_SECTIONS[step]).find(question => {
      if (!question.is_required) return false;
      const value = form[question.field_name];
      return value == null || value === '' || (Array.isArray(value) && value.length === 0);
    });
    if (requiredMissing) return `${requiredMissing.display_text || requiredMissing.field_name} is required.`;
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true); setError(null);
    let processCreated = !!createdProcess;
    try {
      let process = createdProcess;
      if (!process) {
        process = await createRopaRecord({
          process_name: form.processing_activity.trim(),
          process_description: form.process_description.trim(),
          department: form.department.trim(),
          process_owner: form.process_owner.trim(),
          status: form.status !== 'inactive',
        });
        setCreatedProcess(process);
        processCreated = true;
      }
      const responses = questions
        .filter(question => {
          const answer = form[question.field_name];
          return answer !== undefined && answer !== null && answer !== '' &&
            !(Array.isArray(answer) && answer.length === 0);
        })
        .map(question => ({ question_id: question.id, answer: encodeRopaAnswer(form[question.field_name]) }));
      if (responses.length) await upsertRopaResponses(process.id, responses);
      onSaved();
    } catch (e) {
      setError(`${processCreated ? 'The process was created, but its responses could not be saved. ' : ''}${e.message ?? 'Failed to save record.'}`);
    } finally {
      setSaving(false);
    }
  };

  const stepContent = [
    /* Step 0 — Administration */
    <>
      <FormField>
        <FieldLabel required>Status</FieldLabel>
        <SelectInput name="status" value={form.status} onChange={set}
          options={STATUS_OPTIONS.filter(option => option.value !== 'under_review')} />
      </FormField>
      <FormField>
        <FieldLabel required>Processing Activity Name</FieldLabel>
        <input className="input" name="processing_activity" value={form.processing_activity} onChange={set} placeholder="e.g. Employee Payroll Processing" />
      </FormField>
      <FormRow>
        <FormField>
          <FieldLabel required>Department</FieldLabel>
          <input className="input" name="department" value={form.department} onChange={set} placeholder="e.g. Human Resources" />
        </FormField>
        <FormField>
          <FieldLabel>Process Owner</FieldLabel>
          <input className="input" name="process_owner" value={form.process_owner} onChange={set} placeholder="e.g. HR Manager / DPO" />
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Process Description</FieldLabel>
        <textarea className="input" name="process_description" value={form.process_description} onChange={set}
          rows={3} style={{ resize: 'vertical' }} placeholder="Briefly describe this processing activity…" />
      </FormField>
    </>,

    /* Step 1 — Purpose & Legal Basis */
    <>
      <FormField>
        <FieldLabel required>Purpose of Processing</FieldLabel>
        <textarea className="input" name="purpose" value={form.purpose} onChange={set}
          rows={3} style={{ resize: 'vertical' }} placeholder="Describe why this data is processed…" />
      </FormField>
      <FormRow>
        <FormField>
          <FieldLabel required>Legal Basis (DPDPA 2023)</FieldLabel>
          <SelectInput name="legal_basis_dpdpa" value={form.legal_basis_dpdpa} onChange={set}
            placeholder="Select basis…"
            options={LEGAL_BASIS_DPDPA.map(l => ({ value: l.value, label: `${l.label} [${l.section}]` }))} />
        </FormField>
        <FormField>
          <FieldLabel>Legal Basis (GDPR)</FieldLabel>
          <SelectInput name="legal_basis_gdpr" value={form.legal_basis_gdpr} onChange={set}
            placeholder="Select basis…"
            options={LEGAL_BASIS_GDPR.map(l => ({ value: l.value, label: `${l.label} [${l.article}]` }))} />
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Consent Mechanism</FieldLabel>
        <input className="input" name="consent_mechanism" value={form.consent_mechanism} onChange={set} placeholder="e.g. Digital form with timestamp, N/A" />
      </FormField>
    </>,

    /* Step 2 — Data & Collection */
    <>
      <FormRow>
        <FormField>
          <FieldLabel>Data Principals</FieldLabel>
          <input className="input" name="data_principals" value={form.data_principals} onChange={set} placeholder="e.g. Customers, Employees" />
        </FormField>
        <FormField>
          <FieldLabel>Approximate Volume</FieldLabel>
          <input className="input" name="volume" value={form.volume} onChange={set} placeholder="e.g. ~12,000" />
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Data Categories</FieldLabel>
        <MultiSelect
          options={DATA_CATEGORIES.map(d => ({ value: d.value, label: d.label }))}
          selected={form.data_categories}
          onChange={v => setVal('data_categories', v)} />
      </FormField>
      <FormRow>
        <FormField>
          <FieldLabel>Sensitivity Level</FieldLabel>
          <SelectInput name="sensitivity_level" value={form.sensitivity_level} onChange={set}
            options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        </FormField>
        <FormField>
          <FieldLabel>Collection Source</FieldLabel>
          <input className="input" name="collection_source" value={form.collection_source} onChange={set} placeholder="e.g. Online form / HRMS / API" />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField>
          <FieldLabel>Notice Provided?</FieldLabel>
          <SelectInput name="notice_provided" value={form.notice_provided} onChange={set}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'in_progress', label: 'In Progress' }]} />
        </FormField>
        <FormField>
          <FieldLabel>Notice Reference</FieldLabel>
          <input className="input" name="notice_reference" value={form.notice_reference} onChange={set} placeholder="URL or document reference" />
        </FormField>
      </FormRow>
      <FormField>
        <CheckboxRow name="childrens_data" checked={form.childrens_data} onChange={set} label="This activity involves children's data (under 18)" />
      </FormField>
      {form.childrens_data && (
        <FormField>
          <FieldLabel>Children Safeguard Mechanism</FieldLabel>
          <input className="input" name="children_safeguard" value={form.children_safeguard} onChange={set} placeholder="e.g. Parental consent mechanism" />
        </FormField>
      )}
    </>,

    /* Step 3 — Storage & Retention */
    <>
      <FormRow>
        <FormField>
          <FieldLabel>Storage Location</FieldLabel>
          <input className="input" name="storage_location" value={form.storage_location} onChange={set} placeholder="e.g. Cloud (AWS S3), On-premise" />
        </FormField>
        <FormField>
          <FieldLabel>Storage Country</FieldLabel>
          <input className="input" name="storage_country" value={form.storage_country} onChange={set} placeholder="e.g. India, USA, EU" />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField>
          <FieldLabel>Retention Period</FieldLabel>
          <input className="input" name="retention_period" value={form.retention_period} onChange={set} placeholder="e.g. 7 years (Income Tax Act)" />
        </FormField>
        <FormField>
          <FieldLabel>Retention Basis</FieldLabel>
          <input className="input" name="retention_basis" value={form.retention_basis} onChange={set} placeholder="e.g. Statutory requirement" />
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Deletion Method</FieldLabel>
        <input className="input" name="deletion_method" value={form.deletion_method} onChange={set} placeholder="e.g. Secure wipe, Anonymisation, Archive" />
      </FormField>
      <FormField>
        <CheckboxRow name="data_localisation" checked={form.data_localisation} onChange={set} label="Data localisation compliant (DPDPA S.16)" />
      </FormField>
    </>,

    /* Step 4 — Third Parties & Security */
    <>
      <FormRow>
        <FormField>
          <FieldLabel>Third-Party Vendors</FieldLabel>
          <input className="input" name="third_party_vendors" value={form.third_party_vendors} onChange={set} placeholder="e.g. AWS, Razorpay, HubSpot" />
        </FormField>
        <FormField>
          <FieldLabel>Vendor Country</FieldLabel>
          <input className="input" name="vendor_country" value={form.vendor_country} onChange={set} placeholder="e.g. India / USA" />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField>
          <FieldLabel>DPA in Place?</FieldLabel>
          <SelectInput name="dpa_in_place" value={form.dpa_in_place} onChange={set}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'pending', label: 'Pending' }]} />
        </FormField>
        <FormField style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
          <CheckboxRow name="cross_border_transfer" checked={form.cross_border_transfer} onChange={set} label="Cross-border transfer" />
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Security Measures</FieldLabel>
        <input className="input" name="security_measures" value={form.security_measures} onChange={set} placeholder="e.g. AES-256, RBAC, MFA, Pen testing" />
      </FormField>
      <FormRow>
        <FormField>
          <FieldLabel>Encryption</FieldLabel>
          <SelectInput name="encryption" value={form.encryption} onChange={set}
            placeholder="Select…"
            options={[{ value: 'At Rest and In Transit', label: 'At Rest & In Transit' }, { value: 'At Rest Only', label: 'At Rest Only' }, { value: 'In Transit Only', label: 'In Transit Only' }, { value: 'None', label: 'None' }]} />
        </FormField>
        <FormField>
          <FieldLabel>Access Controls</FieldLabel>
          <input className="input" name="access_controls" value={form.access_controls} onChange={set} placeholder="e.g. RBAC + MFA" />
        </FormField>
      </FormRow>
    </>,

    /* Step 5 — DPIA & Rights */
    <>
      <FormField>
        <CheckboxRow name="dpia_required" checked={form.dpia_required} onChange={set} label="DPIA required for this activity" />
      </FormField>
      {form.dpia_required && (
        <FormRow>
          <FormField>
            <FieldLabel>DPIA Status</FieldLabel>
            <SelectInput name="dpia_status" value={form.dpia_status} onChange={set}
              placeholder="Select…"
              options={[{ value: 'completed', label: 'Completed' }, { value: 'in_progress', label: 'In Progress' }, { value: 'not_started', label: 'Not Started' }]} />
          </FormField>
          <FormField>
            <FieldLabel>DPIA Reference</FieldLabel>
            <input className="input" name="dpia_reference" value={form.dpia_reference} onChange={set} placeholder="e.g. DPIA-2026-001" />
          </FormField>
        </FormRow>
      )}
      <FormField>
        <FieldLabel>Rights Supported</FieldLabel>
        <MultiSelect options={RIGHTS_OPTIONS} selected={form.rights_supported} onChange={v => setVal('rights_supported', v)} />
      </FormField>
      <FormField>
        <FieldLabel>Grievance Channel</FieldLabel>
        <input className="input" name="grievance_channel" value={form.grievance_channel} onChange={set} placeholder="e.g. Internal HR / DPO / Grievance Officer" />
      </FormField>
      <FormField>
        <FieldLabel>Sensitive Data (specify)</FieldLabel>
        <input className="input" name="sensitive_data" value={form.sensitive_data} onChange={set} placeholder="e.g. Aadhaar, PAN, Bank account" />
      </FormField>
    </>,
  ];

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="add-activity-title" tabIndex={-1}
        style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-header-icon"><Icons.File size={18} /></span>
          <div className="modal-heading"><h3 className="modal-title" id="add-activity-title">Add processing activity</h3></div>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog"><Icons.X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, paddingBottom: 12, paddingTop: 12 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    background: i < step ? 'var(--green)' : i === step ? 'var(--green)' : 'var(--border)',
                    color: i <= step ? '#fff' : 'var(--muted)',
                    transition: 'background .2s',
                  }}>
                    {i < step ? <Icons.Check size={13} /> : i + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? 'var(--green-dim)' : 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                    {s.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 28, height: 1.5, background: i < step ? 'var(--green-mid)' : 'var(--border)', marginBottom: 16, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step sub-label */}
        <div style={{ padding: '12px 24px 0', fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{STEPS[step].label}</span> — {STEPS[step].sub}
        </div>

        {/* Body */}
        <div className="modal-body" tabIndex={0} aria-label="Activity details" style={{ overflowY: 'auto', flex: 1, paddingTop: 14 }}>
          {error && <div style={{ marginBottom: 14 }}><ErrorState title="Check this step" message={error} /></div>}
          {questionsError && (
            <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 'var(--r-md)', background: 'var(--risk-high-bg)', color: 'var(--risk-high-text)', border: '1px solid var(--risk-high-border)', fontSize: 13 }}>
              Could not load the process questions: {questionsError}
            </div>
          )}
          {step === 0
            ? stepContent[0]
            : questionsLoading
              ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading questions…</div>
              : <RopaQuestionFields questions={questions} sections={ADD_STEP_SECTIONS[step]} values={form} onChange={setVal} grouped />}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step > 0
            ? <Button onClick={() => { setError(null); setStep(s => s - 1); }}>Back</Button>
            : <Button onClick={onClose}>Cancel</Button>}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1
            ? <Button variant="primary" onClick={next} disabled={questionsLoading || !!questionsError}>Next step <Icons.ChevronRight size={15} /></Button>
            : <Button variant="primary" onClick={handleSave} loading={saving} disabled={questionsLoading || !!questionsError}>Save activity</Button>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════ */

const FILTER_TABS = [
  { id: 'all',          label: 'All' },
  { id: 'active',       label: 'Active' },
  { id: 'inactive',     label: 'Inactive' },
  { id: 'under_review', label: 'Under review' },
  { id: 'high',         label: 'High sensitivity' },
];

function PageRopa({ onAction, onSelectRecord, onSummary }) {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0, active: 0, dpia_required: 0, high_sensitivity: 0, missing_dpa: 0,
    cross_border: 0, children_data: 0, notice_not_provided: 0,
  });
  const [dashboardError, setDashboardError] = useState(null);
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'dashboard'
  const [filter, setFilter]     = useState('all');
  const [query, setQuery]       = useState('');
  const [showAdd, setShowAdd]   = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRopaRecords();
      setRecords(data);
      setError(null);
    } catch (e) {
      setError(e.message ?? 'Failed to load RoPA records');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardStats(await fetchRopaDashboard());
      setDashboardError(null);
    } catch (e) {
      setDashboardError(e.message ?? 'Failed to load RoPA dashboard.');
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const stats = dashboardStats;

  useEffect(() => {
    onSummary?.({ loaded: !loading && !error && !dashboardError, error: error || dashboardError || null, ...stats });
  }, [onSummary, loading, error, dashboardError, stats]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filter === 'high' && String(r.sensitivity_level ?? '').toLowerCase() !== 'high') return false;
      if (filter !== 'all' && filter !== 'high' && r.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          String(r.processing_activity ?? '').toLowerCase().includes(q) ||
          String(r.department ?? '').toLowerCase().includes(q) ||
          String(r.ropa_id ?? '').toLowerCase().includes(q) ||
          r.data_principals?.toLowerCase().includes(q) ||
          r.legal_basis_dpdpa?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, filter, query]);

  const handleSaved = () => {
    setShowAdd(false);
    loadRecords();
    loadDashboard();
    onAction?.('Processing activity added successfully.');
  };

  /* Export the register (current filters applied) as a CSV file that opens in Excel */
  const exportRegister = () => {
    const rows = filtered.length ? filtered : records;
    downloadCsv(`RoPA-register-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
      { header: 'RoPA ID', value: r => r.ropa_id },
      { header: 'Processing activity', value: r => r.processing_activity },
      { header: 'Department', value: r => r.department },
      { header: 'Sensitivity', value: r => humanize(r.sensitivity_level, '') },
      { header: 'Legal basis (DPDPA)', value: r => humanize(r.legal_basis_dpdpa, '') },
      { header: 'Data Principals', value: r => r.data_principals },
      { header: 'Volume (individuals)', value: r => r.volume },
      { header: 'DPA in place', value: r => humanize(r.dpa_in_place, '') },
      { header: 'Status', value: r => STATUS_META[r.status]?.label ?? r.status },
      { header: 'Process owner', value: r => r.process_owner },
      { header: 'Last updated', value: r => (r.last_updated ? formatDate(r.last_updated, '') : '') },
    ]);
    onAction?.(`Exported ${rows.length} processing ${rows.length === 1 ? 'activity' : 'activities'} to CSV (opens in Excel).`);
  };

  return (
    <>
      <div className="page">
        <PageActions>
          <Button icon={<Icons.Download size={15} />} onClick={exportRegister} disabled={loading || !records.length} title="Download the register as a CSV file that opens in Excel">
            Export to Excel
          </Button>
          <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => setShowAdd(true)}>Add activity</Button>
        </PageActions>

        {/* ── Tab bar ──────────────────────────────────────── */}
        <div className="tabs page-tabs" role="tablist" aria-label="RoPA views">
          {[{ id: 'register', label: 'Register' }, { id: 'dashboard', label: 'Dashboard & checklist' }].map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id}
              className={`tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Loading / error ───────────────────────────────── */}
        {loading ? (
          <LoadingState label="Loading RoPA register…" />
        ) : error ? (
          <ErrorState title="Couldn't load processing activities" message={error} onRetry={loadRecords} />
        ) : activeTab === 'dashboard' ? (
          dashboardError
            ? <ErrorState title="Couldn't load the RoPA dashboard" message={dashboardError} onRetry={loadDashboard} />
            : <DashboardTab stats={stats} />
        ) : (
          <>
            {/* ── Stat tiles ──────────────────────────────── */}
            {dashboardError && (
              <div style={{ marginBottom: 14 }}><ErrorState title="Live dashboard counts are unavailable" message={dashboardError} onRetry={loadDashboard} /></div>
            )}
            <div className="tile-grid" style={{ marginBottom: 20 }}>
              <StatTile icon={IcoFile}   label="Total activities"   value={stats.total}           sub={`${stats.active} active`}       accent="#00AABF" />
              <StatTile icon={IcoAlert}  label="High sensitivity"   value={stats.high_sensitivity} sub="Require strict controls"       accent="#EF4444" />
              <StatTile icon={IcoShield} label="DPIA required"      value={stats.dpia_required}   sub="High-risk processing"          accent="#8B5CF6" />
              <StatTile icon={IcoGlobe}  label="Cross-border"       value={stats.cross_border}    sub="International transfers"       accent="#F59E0B" />
            </div>

            {/* ── Alert banners ────────────────────────────── */}
            {(stats.missing_dpa > 0 || stats.pending_dpa > 0 || stats.notice_not_provided > 0) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <AlertBanner icon={IcoAlert} label="vendors missing DPAs" count={stats.missing_dpa ?? 0} accent="#EF4444" />
                <AlertBanner icon={IcoAlert} label="activities with notice not provided" count={stats.notice_not_provided ?? 0} accent="#F59E0B" />
              </div>
            )}

            <section className="table-card">
              <div className="table-toolbar">
                <SearchInput value={query} onChange={setQuery} label="Search processing activities" placeholder="Search activities, departments, legal basis" />
                <FilterChips
                  label="Filter processing activities"
                  value={filter}
                  onChange={setFilter}
                  items={FILTER_TABS.map(f => ({
                    key: f.id,
                    label: f.label,
                    count: f.id === 'all' ? records.length : f.id === 'high' ? stats.high_sensitivity : records.filter(r => r.status === f.id).length,
                  }))}
                />
              </div>
              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  icon={<IcoFile />}
                  title={query ? 'No activities match your search' : records.length ? 'No processing activities in this category' : 'No processing activities yet'}
                  description={records.length ? 'Try another search term or filter.' : 'Add your first processing activity to start the register.'}
                  action={records.length
                    ? <Button size="sm" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</Button>
                    : <Button size="sm" variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAdd(true)}>Add activity</Button>}
                />
              ) : (
                <table className="data-table">
                  <thead><tr>
                    <th scope="col">Processing activity</th>
                    <th scope="col">Sensitivity</th>
                    <th scope="col" className="dt-col-secondary">Legal basis</th>
                    <th scope="col" className="dt-col-secondary">Data Principals</th>
                    <th scope="col">DPA</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Open</span></th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(r => <RecordRow key={r.id} record={r} onSelect={onSelectRecord} />)}
                  </tbody>
                </table>
              )}
            </section>

          </>
        )}
      </div>

      {/* ── Add Activity Modal ──────────────────────────── */}
      {showAdd && (
        <AddActivityModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

export default PageRopa;
