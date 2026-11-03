import { useState } from 'react';
import {
  Badge, Button, ConfirmDialog, Drawer, EmptyState, Field, Icons, Modal, PageActions, RowActions, SearchInput, fileLabel,
} from '../ui';
import { createEvidence, updateEvidence, deleteEvidence, uploadEvidenceFiles } from '../api/services/meetEvidence';
import { useToast } from '../context/ToastContext';
import { daysUntil, formatDate } from '../lib/format';

export const DEPARTMENTS = ['Human Resources', 'Information Technology', 'Finance', 'Legal', 'Operations', 'Marketing', 'Customer Support'];
const STATUSES = ['Requested', 'Uploaded', 'Approved', 'Rejected', 'Re-request', 'Overdue'];
export const EVIDENCE_STATUS_TONE = { Requested: 'warning', Uploaded: 'info', Approved: 'success', Rejected: 'danger', 'Re-request': 'violet', Overdue: 'danger' };
const today = () => new Date().toISOString().slice(0, 10);
const blankForm = () => ({ name: '', department: '', purpose: '', requestedDate: today(), deadline: '', files: [] });
const EMPTY_FILTERS = { query: '', department: '', status: '', source: '' };

function statusOf(record) {
  return record.status || (record.files.length ? 'Uploaded' : record.deadline && record.deadline < today() ? 'Overdue' : 'Requested');
}

/* Deadline with urgency for requests that are still outstanding */
export function EvidenceDeadline({ record }) {
  if (!record.deadline) return <span className="dt-muted">No deadline</span>;
  const status = statusOf(record);
  const outstanding = ['Requested', 'Re-request', 'Overdue'].includes(status);
  const days = daysUntil(record.deadline);
  return (
    <span className="deadline-cell">
      <span className="dt-nowrap">{formatDate(record.deadline)}</span>
      {outstanding && days != null && (days < 0
        ? <Badge tone="danger">Overdue {Math.abs(days)}d</Badge>
        : days <= 3 ? <Badge tone="warning">{days === 0 ? 'Due today' : `Due in ${days}d`}</Badge> : null)}
    </span>
  );
}

export default function EvidenceTracker({ evidence, setEvidence, onAction }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState(blankForm);

  const uploaded = evidence.filter(r => ['Uploaded', 'Approved'].includes(statusOf(r)) || r.files.length > 0).length;
  const overdue = evidence.filter(r => statusOf(r) === 'Overdue' || (['Requested', 'Re-request'].includes(statusOf(r)) && r.deadline && r.deadline < today())).length;
  const filteredEvidence = evidence.filter(r =>
    (!filters.query || `${r.name} ${r.purpose ?? ''} ${r.department}`.toLowerCase().includes(filters.query.toLowerCase()))
    && (!filters.department || r.department === filters.department)
    && (!filters.status || statusOf(r) === filters.status)
    && (!filters.source || (r.source === 'meeting' ? 'Meeting' : 'Direct') === filters.source));
  const filtersActive = Object.values(filters).some(Boolean);
  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const closeForm = () => { if (saving) return; setOpen(false); setNotice(''); };

  const add = async e => {
    e.preventDefault();
    if (form.deadline < form.requestedDate) { setNotice('The deadline must be on or after the requested date.'); return; }
    setSaving(true);
    try {
      const record = await createEvidence({ ...form, type: 'Document' });
      const created = { ...record, ...form, id: record.id ?? `e${Date.now()}`, status: 'Requested', source: 'tracker' };
      if (form.files.length && created.id) await uploadEvidenceFiles(created.id, form.files);
      setEvidence(rows => [created, ...rows]);
      setOpen(false);
      setNotice('');
      setForm(blankForm());
      toast.success('Evidence request created.');
    } catch (error) {
      setNotice(error.message || 'Could not create the evidence request.');
    } finally { setSaving(false); }
  };

  const upload = async (id, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    try {
      await uploadEvidenceFiles(id, selected);
      setEvidence(rows => rows.map(r => r.id === id ? { ...r, files: [...(r.files ?? []), ...selected], status: 'Uploaded' } : r));
      setView(v => (v && v.id === id ? { ...v, files: [...(v.files ?? []), ...selected], status: 'Uploaded' } : v));
      toast.success(`${selected.length} evidence file${selected.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) { toast.error(error.message || 'Could not upload evidence files.'); }
  };

  const changeStatus = async (id, status) => {
    const record = evidence.find(r => r.id === id);
    try {
      if (record) await updateEvidence(id, { ...record, status });
      setEvidence(rows => rows.map(r => r.id === id ? { ...r, status } : r));
      onAction?.(`Status changed to ${status}.`);
    } catch (error) { toast.error(error.message || 'Could not update the evidence status.'); }
  };

  const remove = async id => {
    try {
      await deleteEvidence(id);
      setEvidence(rows => rows.filter(r => r.id !== id));
      setConfirm(null);
      toast.success('Evidence request deleted.');
    } catch (error) { toast.error(error.message || 'Could not delete the evidence request.'); }
  };

  const pickFile = (id) => document.getElementById(`evidence-upload-${id}`)?.click();

  return (
    <div className="page tracker-page">
      <PageActions>
        <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => setOpen(true)}>Request evidence</Button>
      </PageActions>

      <p className="page-lead">Track evidence requests across departments and meetings, and see what is still outstanding.</p>

      <div className="tracker-stats">
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-blue"><Icons.Clipboard size={18} /></div><div><span>Total requested</span><strong>{evidence.length}</strong></div></div>
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-green"><Icons.Check size={18} /></div><div><span>Uploaded</span><strong>{uploaded}</strong></div></div>
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-amber"><Icons.Clock size={18} /></div><div><span>Outstanding</span><strong>{evidence.length - uploaded}</strong>{overdue > 0 && <small className="tracker-stat-alert">{overdue} overdue</small>}</div></div>
      </div>

      <section className="table-card">
        <div className="table-card-head">
          <div><h2 className="table-card-title">Evidence requests</h2><p className="table-card-sub">Requests from meetings and direct requests in one place.</p></div>
          <Badge>{filteredEvidence.length} of {evidence.length}</Badge>
        </div>
        <div className="table-toolbar" aria-label="Filter evidence requests">
          <SearchInput value={filters.query} onChange={v => setFilter('query', v)} label="Search evidence requests" placeholder="Search by name, purpose, or department" />
          <select className="select" aria-label="Filter by department" value={filters.department} onChange={e => setFilter('department', e.target.value)}><option value="">All departments</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
          <select className="select" aria-label="Filter by status" value={filters.status} onChange={e => setFilter('status', e.target.value)}><option value="">All statuses</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select>
          <select className="select" aria-label="Filter by request source" value={filters.source} onChange={e => setFilter('source', e.target.value)}><option value="">All sources</option><option>Meeting</option><option>Direct</option></select>
          {filtersActive && <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>}
        </div>

        {!filteredEvidence.length ? (
          <EmptyState
            compact
            icon={<Icons.Clipboard size={20} />}
            title={evidence.length ? 'No evidence requests match these filters' : 'No evidence requests yet'}
            description={evidence.length ? 'Try a different search or clear the filters.' : 'Request evidence from a department to start tracking it here.'}
            action={evidence.length
              ? <Button size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
              : <Button size="sm" variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setOpen(true)}>Request evidence</Button>}
          />
        ) : (
          <table className="data-table">
            <thead><tr>
              <th scope="col">Evidence</th>
              <th scope="col" className="dt-col-secondary">Department</th>
              <th scope="col" className="dt-col-secondary">Requested</th>
              <th scope="col">Deadline</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>
              {filteredEvidence.map(r => {
                const status = statusOf(r);
                return (
                  <tr key={r.id}>
                    <td className="dt-primary">
                      <button type="button" className="dt-title dt-title-link" onClick={() => setView(r)}>{r.name}</button>
                      {r.purpose && <div className="dt-sub"><span className="dt-clamp">{r.purpose}</span></div>}
                      <div className="dt-sub">
                        <span>{r.source === 'meeting' ? 'Meeting request' : 'Direct request'}</span>
                        <span>{(r.files ?? []).length} file{(r.files ?? []).length === 1 ? '' : 's'}</span>
                      </div>
                      <div className="dt-sub dt-fold"><span>{r.department}</span><span>Requested {formatDate(r.requestedDate)}</span></div>
                    </td>
                    <td className="dt-col-secondary" data-label="Department">{r.department}</td>
                    <td className="dt-col-secondary dt-nowrap" data-label="Requested">{formatDate(r.requestedDate)}</td>
                    <td data-label="Deadline"><EvidenceDeadline record={r} /></td>
                    <td data-label="Status">
                      <select
                        className={`select input-sm status-select tone-${EVIDENCE_STATUS_TONE[status] ?? 'neutral'}`}
                        aria-label={`Status for ${r.name}`}
                        value={status}
                        onChange={e => changeStatus(r.id, e.target.value)}
                      >
                        {STATUSES.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </td>
                    <td className="dt-actions">
                      <span className="dt-actions-inner">
                        <Button size="sm" variant="ghost" icon={<Icons.Upload size={14} />} onClick={() => pickFile(r.id)} aria-label={`Upload files for ${r.name}`}>
                          <span className="hide-below-lg">Upload</span>
                        </Button>
                        <input id={`evidence-upload-${r.id}`} type="file" multiple hidden onChange={e => { upload(r.id, e.target.files); e.target.value = ''; }} />
                        <RowActions
                          label={`More actions for ${r.name}`}
                          items={[
                            { label: 'View details', icon: <Icons.Eye size={15} />, onClick: () => setView(r) },
                            { label: 'Upload files', icon: <Icons.Upload size={15} />, onClick: () => pickFile(r.id) },
                            { label: 'Delete request', icon: <Icons.Trash size={15} />, danger: true, onClick: () => setConfirm(r) },
                          ]}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {open && (
        <Drawer
          eyebrow="Evidence management"
          title="Request evidence"
          onClose={closeForm}
          footer={<><Button onClick={closeForm} disabled={saving}>Cancel</Button><Button variant="primary" type="submit" form="evidence-request-form" loading={saving}>Create request</Button></>}
        >
          <form id="evidence-request-form" className="form-stack" onSubmit={add}>
            <p className="field-hint" style={{ margin: 0 }}>Assign evidence to a department and set a clear due date.</p>
            {notice && <div className="error-state" role="alert"><Icons.Alert size={16} /><div><p style={{ margin: 0 }}>{notice}</p></div></div>}
            <Field label="Evidence name" required>
              <input className="input" data-autofocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Access control policy" />
            </Field>
            <Field label="Department" required>
              <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Request purpose" optional>
              <textarea className="textarea" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Why is this evidence needed?" />
            </Field>
            <div className="form-grid">
              <Field label="Requested date" required>
                <input className="input" type="date" value={form.requestedDate} onChange={e => setForm(f => ({ ...f, requestedDate: e.target.value }))} />
              </Field>
              <Field label="Deadline" required>
                <input className="input" type="date" min={form.requestedDate} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </Field>
            </div>
            <Field label="Documents" optional hint="Attach files already available for this request.">
              <label className="upload-zone">
                <Icons.Upload size={16} />
                <span>{form.files.length ? `${form.files.length} file${form.files.length > 1 ? 's' : ''} selected — add more` : 'Choose files to attach'}</span>
                <input type="file" multiple onChange={e => setForm(f => ({ ...f, files: [...f.files, ...Array.from(e.target.files || [])] }))} />
              </label>
            </Field>
            {form.files.length > 0 && <div className="chip-list">{form.files.map((f, i) => <Badge key={`${f.name}-${i}`}><Icons.File size={12} />{f.name}</Badge>)}</div>}
            <div className="privacy-note"><Icons.Shield size={16} /><span>Request only the information needed for this purpose. Ask the department to redact unrelated personal data before sharing.</span></div>
          </form>
        </Drawer>
      )}

      {view && (
        <Modal title={view.name} subtitle={view.department} icon={<Icons.Clipboard size={18} />} onClose={() => setView(null)} footer={<Button onClick={() => setView(null)}>Close</Button>}>
          <dl className="detail-list">
            {[
              ['Status', <Badge key="s" tone={EVIDENCE_STATUS_TONE[statusOf(view)] ?? 'neutral'} dot>{statusOf(view)}</Badge>],
              ['Requested', formatDate(view.requestedDate)],
              ['Deadline', <EvidenceDeadline key="d" record={view} />],
              ['Request source', view.source === 'meeting' ? 'Meeting' : 'Direct'],
              ['Purpose', view.purpose || '—'],
            ].map(([label, value]) => <div className="detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <div className="section-label-row" style={{ marginTop: 16 }}><span className="section-label">Evidence documents</span></div>
          {(view.files ?? []).length ? (
            <ul className="file-list">{view.files.map((f, i) => <li className="file-list-item" key={`${fileLabel(f)}-${i}`}><span className="file-list-icon"><Icons.File size={16} /></span><div className="file-list-body"><div className="file-list-name">{fileLabel(f)}</div></div></li>)}</ul>
          ) : <p className="dt-muted" style={{ margin: '4px 0 12px' }}>No evidence documents uploaded yet.</p>}
          <label className="upload-zone" style={{ marginTop: 8 }}>
            <Icons.Upload size={16} /><span>Upload evidence</span>
            <input type="file" multiple onChange={e => { upload(view.id, e.target.files); e.target.value = ''; }} />
          </label>
          <div className="privacy-note" style={{ marginTop: 14 }}><Icons.Shield size={16} /><span>Review uploaded files for unrelated personal information before sharing them further.</span></div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete this evidence request?"
          message={<>“{confirm.name}” and its uploaded files will be permanently removed.</>}
          confirmLabel="Delete request"
          onConfirm={() => remove(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
