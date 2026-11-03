/**
 * pages/RopaDetail.jsx
 * Full-page view for a single RoPA processing activity.
 *
 * Tabs: Overview | Legal Basis | Data & Collection | Storage & Retention |
 *       Third Parties | Security | DPIA | Rights & Audit
 *
 * Each tab has an "Edit section" button that opens a focused edit modal.
 */

import { useState, useEffect, useCallback } from 'react';
import { Icons, Button, Modal } from '../ui';
import {
  fetchRopaRecord, fetchRopaQuestions, fetchRopaResponses, updateRopaRecord, upsertRopaResponses,
} from '../api/services/ropa';
import {
  STATUS_META, SENSITIVITY_META, DPA_STATUS_META,
  LEGAL_BASIS_DPDPA, LEGAL_BASIS_GDPR,
} from '../data/ropa';
import RopaQuestionFields from '../components/RopaQuestionFields';
import {
  decodeRopaAnswer, encodeRopaAnswer, questionsForSections, ROPA_SECTION_GROUPS,
} from '../data/ropaQuestions';

/* ═══════════════════════════════════════════════════════════
   Small display helpers
═══════════════════════════════════════════════════════════ */

function Pill({ value, meta }) {
  const m = meta[value] ?? Object.values(meta)[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, padding: '3px 10px',
      borderRadius: 'var(--r-pill)',
      background: m.bg, color: m.text, border: `1px solid ${m.border}`,
    }}>
      {m.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />}
      {m.label}
    </span>
  );
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  const on = !!value;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--r-pill)',
      background: on ? '#ECFDF5' : '#F1F5F9',
      color:      on ? '#065F46' : '#475569',
      border:     `1px solid ${on ? '#A7F3D0' : '#CBD5E1'}`,
    }}>
      {on ? trueLabel : falseLabel}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{children ?? <span style={{ color: 'var(--muted)' }}>—</span>}</div>
    </div>
  );
}

function SectionCard({ title, onEdit, children }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
        {onEdit && (
          <Button size="sm" icon={<Icons.Edit size={13} />} onClick={onEdit} style={{ fontSize: 12 }}>Edit</Button>
        )}
      </div>
      <div style={{ padding: '4px 20px 8px' }}>
        {children}
      </div>
    </div>
  );
}

function TagList({ items }) {
  if (!items?.length) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {(Array.isArray(items) ? items : [items]).map(item => (
        <span key={item} style={{
          fontSize: 12, padding: '3px 9px', borderRadius: 'var(--r-pill)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--ink)', fontWeight: 500,
        }}>{item}</span>
      ))}
    </div>
  );
}

function QuestionInfoRows({ questions, sections, values }) {
  return questionsForSections(questions, sections).map(question => {
    const answer = values[question.field_name];
    let content = answer === '' ? null : answer;
    if (typeof answer === 'boolean') content = <BoolBadge value={answer} />;
    else if (Array.isArray(answer)) content = <TagList items={answer} />;
    else if (typeof answer === 'string') content = answer.replaceAll('_', ' ');
    return <InfoRow key={question.id ?? question.field_name} label={question.display_text}>{content}</InfoRow>;
  });
}

async function getRopaDetailData(processId) {
  const [process, questions, responses] = await Promise.all([
    fetchRopaRecord(processId),
    fetchRopaQuestions(),
    fetchRopaResponses(processId),
  ]);
  const questionById = new Map(questions.map(question => [String(question.id), question]));
  const answers = {};
  responses.forEach(response => {
    const question = questionById.get(String(response.question_id ?? response.id));
    const fieldName = question?.field_name ?? response.field_name;
    if (fieldName) answers[fieldName] = decodeRopaAnswer(response.answer, question?.answer_type ?? response.answer_type);
  });
  if (Object.hasOwn(answers, 'children_data')) answers.childrens_data = answers.children_data;
  return { record: { ...process, ...answers }, questions, answers };
}

/* ═══════════════════════════════════════════════════════════
   Section-specific edit modals (inline lightweight forms)
═══════════════════════════════════════════════════════════ */

function EditModal({ title, onClose, onSave, saving, error, children }) {
  return (
    <Modal
      title={title}
      icon={<Icons.Edit size={18} style={{ color: 'var(--green)' }} />}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </>
      }
      width={560}
    >
      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 'var(--r-md)', background: 'var(--risk-high-bg)', color: 'var(--risk-high-text)', border: '1px solid var(--risk-high-border)', fontSize: 13 }}>
          {error}
        </div>
      )}
      {children}
    </Modal>
  );
}

function FL({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
  );
}
const FW = ({ children }) => <div style={{ marginBottom: 14 }}>{children}</div>;
const FR = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;

function Sel({ name, value, onChange, options, placeholder }) {
  return (
    <select className="input" name={name} value={value} onChange={onChange}
      style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236575A0' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab definitions
═══════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'legal',      label: 'Legal Basis' },
  { id: 'data',       label: 'Data & Collection' },
  { id: 'storage',    label: 'Storage & Retention' },
  { id: 'vendors',    label: 'Third Parties' },
  { id: 'security',   label: 'Security' },
  { id: 'dpia',       label: 'DPIA' },
  { id: 'rights',     label: 'Rights & Audit' },
];

const EDIT_TITLES = {
  purpose: 'Edit Purpose & Legal Basis',
  data: 'Edit Data & Collection',
  storage: 'Edit Storage & Retention',
  vendors: 'Edit Third Parties & Transfers',
  security: 'Edit Security Measures',
  dpia: 'Edit DPIA',
  rights: 'Edit Rights & Grievance',
};

/* ═══════════════════════════════════════════════════════════
   Main Detail Component
═══════════════════════════════════════════════════════════ */

function RopaDetail({ recordId, onBack, onAction }) {
  const [record, setRecord]     = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responseValues, setResponseValues] = useState({});
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab]           = useState('overview');
  const [editModal, setEditModal] = useState(null); // which section is being edited
  const [draft, setDraft]       = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  const loadRecord = useCallback(async () => {
    const data = await getRopaDetailData(recordId);
    setRecord(data.record);
    setQuestions(data.questions);
    setResponseValues(data.answers);
  }, [recordId]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    loadRecord()
      .catch(e => setLoadError(e.message ?? 'Failed to load processing activity.'))
      .finally(() => setLoading(false));
  }, [loadRecord]);

  const openEdit = (section) => {
    setDraft({ ...record });
    setSaveError(null);
    setEditModal(section);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      if (editModal === 'admin') {
        await updateRopaRecord(record.id, {
          process_name: draft.processing_activity,
          process_description: draft.process_description ?? '',
          department: draft.department,
          process_owner: draft.process_owner,
          status: draft.status !== 'inactive',
        });
      } else {
        const sectionQuestions = questionsForSections(questions, ROPA_SECTION_GROUPS[editModal] ?? []);
        const responses = sectionQuestions.map(question => ({
          question_id: question.id,
          answer: encodeRopaAnswer(draft[question.field_name]),
        }));
        await upsertRopaResponses(record.id, responses);
      }
      await loadRecord();
      setEditModal(null);
      onAction?.('Record updated successfully.');
    } catch (e) {
      setSaveError(e.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setDraft(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  };
  const setVal = (name, value) => setDraft(d => ({ ...d, [name]: value }));

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading record…</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{loadError ?? 'Record not found.'}</div>
        <Button onClick={onBack} style={{ marginTop: 16 }}>Back to register</Button>
      </div>
    );
  }

  const sensMeta = SENSITIVITY_META[String(record.sensitivity_level ?? '').toLowerCase()] ?? SENSITIVITY_META.medium;

  return (
    <div className="page">

      {/* ── Back button ─────────────────────────────────── */}
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', marginBottom: 20, padding: 0 }}
      >
        <Icons.ChevronLeft size={16} />
        Back to RoPA register
      </button>

      {/* ── Record header card ───────────────────────────── */}
      <div style={{
        background: 'var(--black)', borderRadius: 'var(--r-lg)',
        padding: '22px 26px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* ID badge */}
        <div style={{
          background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 'var(--r-md)', padding: '10px 16px', textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>RoPA ID</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>{record.ropa_id}</div>
        </div>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>{record.processing_activity}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>{record.department}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>{record.process_owner}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Updated {record.last_updated}</span>
          </div>
        </div>

        {/* Status + Sensitivity badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <Button
            size="sm"
            icon={<Icons.Edit size={13} />}
            onClick={() => openEdit('admin')}
            style={{ color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            Edit Process
          </Button>
          <Pill value={record.status} meta={STATUS_META} />
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px',
            borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
            background: `${sensMeta.dot}22`, color: sensMeta.text,
            border: `1px solid ${sensMeta.dot}44`,
          }}>
            {sensMeta.label} sensitivity
          </span>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              background: 'transparent', border: 'none', fontFamily: 'inherit',
              color: tab === t.id ? 'var(--green-dim)' : 'var(--muted)',
              borderBottom: `2.5px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
              marginBottom: -1, transition: 'color .14s, border-color .14s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          Tab content
      ══════════════════════════════════════════════════ */}

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Record Administration">
            <InfoRow label="Processing Activity">{record.processing_activity}</InfoRow>
            <InfoRow label="Process Description">{record.process_description}</InfoRow>
            <InfoRow label="Department">{record.department}</InfoRow>
            <InfoRow label="Process Owner">{record.process_owner}</InfoRow>
            <InfoRow label="Reviewed By">{record.reviewed_by}</InfoRow>
            <InfoRow label="Next Review">{record.next_review}</InfoRow>
            <InfoRow label="Status"><Pill value={record.status} meta={STATUS_META} /></InfoRow>
          </SectionCard>

          <SectionCard title="Quick Summary">
            <InfoRow label="Purpose">{record.purpose}</InfoRow>
            <InfoRow label="Data Principals">{record.data_principals} <span style={{ color: 'var(--muted)', fontSize: 12 }}>({record.volume} individuals)</span></InfoRow>
            <InfoRow label="Legal Basis (DPDPA)">{record.legal_basis_dpdpa}</InfoRow>
            <InfoRow label="Sensitivity"><Pill value={String(record.sensitivity_level ?? '').toLowerCase()} meta={SENSITIVITY_META} /></InfoRow>
            <InfoRow label="DPA in Place">{record.dpa_in_place ? <Pill value={record.dpa_in_place} meta={DPA_STATUS_META} /> : null}</InfoRow>
            <InfoRow label="DPIA Required">{typeof record.dpia_required === 'boolean' ? <BoolBadge value={record.dpia_required} /> : null}</InfoRow>
            <InfoRow label="Cross-Border Transfer">{record.cross_border_transfer}</InfoRow>
          </SectionCard>
        </div>
      )}

      {/* ── Legal Basis ── */}
      {tab === 'legal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Purpose & Legal Basis" onEdit={() => openEdit('purpose')}>
            <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.purpose} values={responseValues} />
          </SectionCard>

          {/* Reference table */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              Legal Basis Reference
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {['DPDPA Basis', 'DPDPA Section', 'GDPR Equivalent', 'GDPR Article'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LEGAL_BASIS_DPDPA.map((b, i) => {
                    const g = LEGAL_BASIS_GDPR[i];
                    const isMatch = b.value === record.legal_basis_dpdpa;
                    return (
                      <tr key={b.value} style={{ background: isMatch ? 'var(--green-soft)' : i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: isMatch ? 700 : 500, color: isMatch ? 'var(--green-dim)' : 'var(--ink)', borderBottom: '1px solid var(--border-soft)' }}>{b.label}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: 12, borderBottom: '1px solid var(--border-soft)' }}>{b.section}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--ink)', borderBottom: '1px solid var(--border-soft)' }}>{g?.label ?? '—'}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: 12, borderBottom: '1px solid var(--border-soft)' }}>{g?.article ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Data & Collection ── */}
      {tab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Data Principals" onEdit={() => openEdit('data')}>
            <QuestionInfoRows questions={questions} sections={['DATA PRINCIPALS']} values={responseValues} />
          </SectionCard>
          <SectionCard title="Data Categories & Sensitivity" onEdit={() => openEdit('data')}>
            <QuestionInfoRows questions={questions} sections={['DATA CATEGORIES']} values={responseValues} />
          </SectionCard>
          <SectionCard title="Collection & Notice" onEdit={() => openEdit('data')}>
            <QuestionInfoRows questions={questions} sections={['COLLECTION & NOTICE']} values={responseValues} />
          </SectionCard>
        </div>
      )}

      {/* ── Storage & Retention ── */}
      {tab === 'storage' && (
        <SectionCard title="Storage & Retention" onEdit={() => openEdit('storage')}>
          <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.storage} values={responseValues} />
        </SectionCard>
      )}

      {/* ── Third Parties ── */}
      {tab === 'vendors' && (
        <SectionCard title="Third-Party Vendors & Transfers" onEdit={() => openEdit('vendors')}>
          <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.vendors} values={responseValues} />
        </SectionCard>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
        <SectionCard title="Security Measures" onEdit={() => openEdit('security')}>
          <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.security} values={responseValues} />
        </SectionCard>
      )}

      {/* ── DPIA ── */}
      {tab === 'dpia' && (
        <SectionCard title="Data Protection Impact Assessment (DPIA)" onEdit={() => openEdit('dpia')}>
          <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.dpia} values={responseValues} />
        </SectionCard>
      )}

      {/* ── Rights & Audit ── */}
      {tab === 'rights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Data Principal Rights" onEdit={() => openEdit('rights')}>
            <QuestionInfoRows questions={questions} sections={ROPA_SECTION_GROUPS.rights} values={responseValues} />
          </SectionCard>

          <SectionCard title="Audit Trail">
            {record.audit_trail?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...record.audit_trail].reverse().map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: i < record.audit_trail.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  }}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                      {i < record.audit_trail.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 20 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{entry.change}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                        {entry.date} · by {entry.by}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>No audit entries yet.</div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          Edit modals
      ═══════════════════════════════════════════════════ */}

      {/* Admin edit */}
      {editModal === 'admin' && (
        <EditModal title="Edit Process Details" onClose={() => setEditModal(null)} onSave={handleSave} saving={saving} error={saveError}>
          <FW><FL required>Processing Activity Name</FL><input className="input" name="processing_activity" value={draft.processing_activity ?? ''} onChange={set} /></FW>
          <FR>
            <FW><FL>Department</FL><input className="input" name="department" value={draft.department ?? ''} onChange={set} /></FW>
            <FW><FL>Process Owner</FL><input className="input" name="process_owner" value={draft.process_owner ?? ''} onChange={set} /></FW>
          </FR>
          <FR>
            <FW><FL>Status</FL>
              <Sel name="status" value={draft.status ?? 'active'} onChange={set}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </FW>
            <FW><FL>Process Description</FL><input className="input" name="process_description" value={draft.process_description ?? ''} onChange={set} /></FW>
          </FR>
        </EditModal>
      )}

      {editModal && editModal !== 'admin' && (
        <EditModal title={EDIT_TITLES[editModal] ?? 'Edit Responses'} onClose={() => setEditModal(null)} onSave={handleSave} saving={saving} error={saveError}>
          <RopaQuestionFields
            questions={questions}
            sections={ROPA_SECTION_GROUPS[editModal] ?? []}
            values={draft}
            onChange={setVal}
            grouped={editModal === 'data'}
          />
        </EditModal>
      )}

    </div>
  );
}

export default RopaDetail;
