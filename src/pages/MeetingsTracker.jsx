import { useState } from 'react';
import {
  Badge, Button, ConfirmDialog, Drawer, EmptyState, Field, Icons, Modal, PageActions, SearchInput, fileLabel,
} from '../ui';
import { createMeeting, createEvidence, uploadMeetingFiles, uploadEvidenceFiles, deleteEvidence } from '../api/services/meetEvidence';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { DEPARTMENTS, EvidenceDeadline } from './EvidenceTracker';

const today = () => new Date().toISOString().slice(0, 10);
const blankMeeting = () => ({ department: '', date: '', attendees: '', purpose: '', followUp: '', documents: [], evidenceIds: [] });
const blankEvidence = () => ({ name: '', department: '', purpose: '', requestedDate: today(), deadline: '', files: [], source: 'meeting' });
const EMPTY_FILTERS = { department: '', date: '', query: '' };

export default function MeetingsTracker({ meetings, setMeetings, evidence, setEvidence }) {
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [meetingForm, setMeetingForm] = useState(blankMeeting());
  const [drawer, setDrawer] = useState(null);
  const [request, setRequest] = useState(blankEvidence());
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const update = (key, value) => setMeetingForm(f => ({ ...f, [key]: value }));
  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const drawerMeeting = drawer ? meetings.find(m => m.id === drawer.meetingId) : null;

  const openDrawer = (type, meeting) => {
    setNotice('');
    setRequest({ ...blankEvidence(), department: meeting.department || '' });
    setDrawer({ type, meetingId: meeting.id });
  };
  const closeDrawer = () => { setDrawer(null); setNotice(''); };

  const addMeeting = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const meeting = await createMeeting(meetingForm);
      const documents = meetingForm.documents;
      if (documents.length && meeting.id) await uploadMeetingFiles(meeting.id, documents);
      const created = { ...meeting, id: meeting.id ?? `m${Date.now()}`, documents, evidenceIds: [] };
      setMeetings(rows => [created, ...rows]);
      setShowAdd(false);
      setMeetingForm(blankMeeting());
      setNotice('');
      toast.success('Meeting added. You can now request evidence from it.');
    } catch (error) {
      setNotice(error.message || 'Could not create the meeting.');
    } finally { setSaving(false); }
  };

  const addRequest = async e => {
    e.preventDefault();
    if (request.deadline < request.requestedDate) { setNotice('The deadline must be on or after the requested date.'); return; }
    setSaving(true);
    try {
      const record = await createEvidence({ ...request, type: 'Document', meeting_id: drawer?.meetingId });
      const created = { ...record, ...request, id: record.id ?? `e${Date.now()}`, status: 'Requested', source: 'meeting' };
      if (request.files.length && created.id) await uploadEvidenceFiles(created.id, request.files);
      setEvidence(rows => [created, ...rows]);
      if (drawer?.meetingId) setMeetings(rows => rows.map(m => m.id === drawer.meetingId ? { ...m, evidenceIds: [...(m.evidenceIds ?? []), created.id] } : m));
      setRequest({ ...blankEvidence(), department: drawerMeeting?.department || '' });
      setNotice('');
      toast.success('Evidence request created and added to the Evidence tracker.');
    } catch (error) {
      setNotice(error.message || 'Could not create the evidence request.');
    } finally { setSaving(false); }
  };

  const uploadEvidence = async (id, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    try {
      await uploadEvidenceFiles(id, selected);
      setEvidence(rows => rows.map(r => r.id === id ? { ...r, files: [...(r.files ?? []), ...selected], status: 'Uploaded' } : r));
      toast.success(`${selected.length} evidence file${selected.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) { toast.error(error.message || 'Could not upload evidence files.'); }
  };

  const uploadMeetingDocuments = async (meetingId, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    try {
      await uploadMeetingFiles(meetingId, selected);
      setMeetings(rows => rows.map(m => m.id === meetingId ? { ...m, documents: [...(m.documents ?? []), ...selected] } : m));
      toast.success(`${selected.length} document${selected.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) { toast.error(error.message || 'Could not upload meeting documents.'); }
  };

  const removeEvidence = async id => {
    try {
      await deleteEvidence(id);
      setEvidence(rows => rows.filter(r => r.id !== id));
      setMeetings(rows => rows.map(m => ({ ...m, evidenceIds: (m.evidenceIds ?? []).filter(e => e !== id) })));
      setConfirm(null);
      toast.success('Evidence request deleted.');
    } catch (error) { toast.error(error.message || 'Could not delete the evidence request.'); }
  };

  const filteredMeetings = meetings.filter(m =>
    (!filters.department || m.department === filters.department)
    && (!filters.date || m.date === filters.date)
    && (!filters.query || `${m.department} ${m.attendees} ${m.purpose || ''}`.toLowerCase().includes(filters.query.toLowerCase())));
  const filtersActive = Object.values(filters).some(Boolean);
  const documentCount = meetings.reduce((total, meeting) => total + (meeting.documents ?? []).length, 0);
  const requestCount = meetings.reduce((total, meeting) => total + (meeting.evidenceIds ?? []).length, 0);
  const linkedEvidence = drawerMeeting ? evidence.filter(r => (drawerMeeting.evidenceIds ?? []).includes(r.id)) : [];

  return (
    <div className="page tracker-page">
      <PageActions>
        <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => { setNotice(''); setShowAdd(true); }}>Add meeting</Button>
      </PageActions>

      <p className="page-lead">Keep meeting notes, supporting documents, and the evidence requests that come out of them together.</p>

      <div className="tracker-stats tracker-meeting-stats">
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-blue"><Icons.Calendar size={18} /></div><div><span>Meetings held</span><strong>{meetings.length}</strong></div></div>
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-green"><Icons.File size={18} /></div><div><span>Documents collected</span><strong>{documentCount}</strong></div></div>
        <div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-amber"><Icons.Clipboard size={18} /></div><div><span>Linked evidence requests</span><strong>{requestCount}</strong></div></div>
      </div>

      <section className="table-card" aria-label="Meetings">
        <div className="table-card-head">
          <div><h2 className="table-card-title">Meetings</h2><p className="table-card-sub">{filteredMeetings.length} of {meetings.length} meetings</p></div>
        </div>
        <div className="table-toolbar" aria-label="Filter meetings">
          <SearchInput value={filters.query} onChange={v => setFilter('query', v)} label="Search meetings" placeholder="Search department, attendees, or purpose" />
          <select className="select" aria-label="Filter by department" value={filters.department} onChange={e => setFilter('department', e.target.value)}><option value="">All departments</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
          <input className="input table-toolbar-date" type="date" aria-label="Filter by meeting date" value={filters.date} onChange={e => setFilter('date', e.target.value)} />
          {filtersActive && <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>}
        </div>

        {!filteredMeetings.length ? (
          <EmptyState
            compact
            icon={<Icons.Calendar size={20} />}
            title={meetings.length ? 'No meetings match these filters' : 'No meetings yet'}
            description={meetings.length ? 'Try a different search or clear the filters.' : 'Add a meeting to record attendees, decisions, and the evidence you need.'}
            action={meetings.length
              ? <Button size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
              : <Button size="sm" variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAdd(true)}>Add meeting</Button>}
          />
        ) : (
          <table className="data-table">
            <thead><tr>
              <th scope="col">Meeting</th>
              <th scope="col" className="dt-col-secondary">Attendees</th>
              <th scope="col">Date</th>
              <th scope="col">Documents</th>
              <th scope="col">Evidence</th>
            </tr></thead>
            <tbody>
              {filteredMeetings.map(m => {
                const linked = evidence.filter(e => (m.evidenceIds ?? []).includes(e.id));
                const docs = (m.documents ?? []).length;
                return (
                  <tr key={m.id}>
                    <td className="dt-primary">
                      <div className="dt-title">{m.department}</div>
                      {m.purpose && <div className="dt-sub"><span className="dt-clamp">{m.purpose}</span></div>}
                      {m.followUp && <div className="dt-sub"><span className="dt-clamp">Follow-up: {m.followUp}</span></div>}
                      <div className="dt-sub dt-fold"><span>{m.attendees || 'No attendees recorded'}</span></div>
                    </td>
                    <td className="dt-col-secondary" data-label="Attendees">{m.attendees || <span className="dt-muted">—</span>}</td>
                    <td className="dt-nowrap" data-label="Date">{formatDate(m.date)}</td>
                    <td data-label="Documents">
                      <Button size="sm" variant="secondary" icon={<Icons.File size={14} />} onClick={() => openDrawer('documents', m)}>
                        {docs} {docs === 1 ? 'document' : 'documents'}
                      </Button>
                    </td>
                    <td data-label="Evidence">
                      <Button size="sm" variant="secondary" icon={<Icons.Clipboard size={14} />} onClick={() => openDrawer('evidence', m)}>
                        {linked.length} {linked.length === 1 ? 'request' : 'requests'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {showAdd && (
        <Modal
          title="Add meeting"
          icon={<Icons.Calendar size={18} />}
          onClose={() => !saving && setShowAdd(false)}
          footer={<><Button onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button><Button variant="primary" type="submit" form="meeting-form" loading={saving}>Add meeting</Button></>}
        >
          <form id="meeting-form" className="form-stack" onSubmit={addMeeting}>
            {notice && <div className="error-state" role="alert"><Icons.Alert size={16} /><div><p style={{ margin: 0 }}>{notice}</p></div></div>}
            <div className="form-grid">
              <Field label="Department" required>
                <select className="select" value={meetingForm.department} onChange={e => update('department', e.target.value)}><option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
              </Field>
              <Field label="Date" required>
                <input className="input" type="date" value={meetingForm.date} onChange={e => update('date', e.target.value)} />
              </Field>
            </div>
            <Field label="Attendees" required hint="Separate names with commas.">
              <textarea className="textarea" rows={2} value={meetingForm.attendees} onChange={e => update('attendees', e.target.value)} placeholder="e.g. Sara Lee, Daniel Brooks" />
            </Field>
            <Field label="Meeting purpose" optional>
              <input className="input" value={meetingForm.purpose} onChange={e => update('purpose', e.target.value)} placeholder="e.g. Review data retention practices" />
            </Field>
            <Field label="Decisions and follow-up" optional>
              <textarea className="textarea" rows={3} value={meetingForm.followUp} onChange={e => update('followUp', e.target.value)} placeholder="Record decisions, owners, or next steps" />
            </Field>
            <Field label="Documents" optional hint="You can request evidence from this meeting after saving it.">
              <label className="upload-zone">
                <Icons.Upload size={16} />
                <span>{meetingForm.documents.length ? `${meetingForm.documents.length} file${meetingForm.documents.length > 1 ? 's' : ''} selected — add more` : 'Choose meeting documents'}</span>
                <input type="file" multiple onChange={e => update('documents', [...meetingForm.documents, ...Array.from(e.target.files || [])])} />
              </label>
            </Field>
          </form>
        </Modal>
      )}

      {drawer && drawerMeeting && (
        <Drawer
          eyebrow={`${drawerMeeting.department} · ${formatDate(drawerMeeting.date)}`}
          title={drawer.type === 'documents' ? 'Meeting documents' : 'Evidence requests'}
          onClose={closeDrawer}
          width={560}
        >
          {drawer.type === 'documents' ? (
            <>
              <p className="field-hint" style={{ marginTop: 0 }}>Documents shared during this meeting.</p>
              {(drawerMeeting.documents ?? []).length ? (
                <ul className="file-list">{drawerMeeting.documents.map((f, i) => <li className="file-list-item" key={`${fileLabel(f)}-${i}`}><span className="file-list-icon"><Icons.File size={16} /></span><div className="file-list-body"><div className="file-list-name">{fileLabel(f)}</div></div></li>)}</ul>
              ) : <EmptyState compact icon={<Icons.File size={20} />} title="No documents yet" description="Upload the notes or files shared during this meeting." />}
              <label className="upload-zone" style={{ marginTop: 12 }}>
                <Icons.Upload size={16} /><span>Upload documents</span>
                <input type="file" multiple onChange={e => { uploadMeetingDocuments(drawerMeeting.id, e.target.files); e.target.value = ''; }} />
              </label>
            </>
          ) : (
            <>
              <p className="field-hint" style={{ marginTop: 0 }}>Requests linked to this meeting are also listed in the Evidence tracker.</p>
              {linkedEvidence.length > 0 && (
                <ul className="linked-list">
                  {linkedEvidence.map(r => (
                    <li className="linked-card" key={r.id}>
                      <div className="linked-card-top">
                        <strong>{r.name}</strong>
                        <Button size="sm" variant="danger-ghost" icon={<Icons.Trash size={14} />} aria-label={`Delete ${r.name}`} onClick={() => setConfirm(r)} />
                      </div>
                      <div className="dt-sub"><EvidenceDeadline record={r} /><span>{(r.files ?? []).length} file{(r.files ?? []).length === 1 ? '' : 's'}</span></div>
                      {r.purpose && <p className="field-hint">Purpose: {r.purpose}</p>}
                      <label className="upload-zone upload-zone-sm">
                        <Icons.Upload size={14} /><span>Upload evidence document</span>
                        <input type="file" multiple onChange={e => { uploadEvidence(r.id, e.target.files); e.target.value = ''; }} />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <form className="form-stack drawer-form" onSubmit={addRequest}>
                <h3 className="drawer-form-title">New evidence request</h3>
                {notice && <div className="error-state" role="alert"><Icons.Alert size={16} /><div><p style={{ margin: 0 }}>{notice}</p></div></div>}
                <Field label="Evidence name" required>
                  <input className="input" data-autofocus value={request.name} onChange={e => setRequest(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Retention schedule" />
                </Field>
                <Field label="Department" required>
                  <select className="select" value={request.department} onChange={e => setRequest(f => ({ ...f, department: e.target.value }))}><option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
                </Field>
                <Field label="Request purpose" optional>
                  <textarea className="textarea" rows={2} value={request.purpose} onChange={e => setRequest(f => ({ ...f, purpose: e.target.value }))} placeholder="Why is this evidence needed?" />
                </Field>
                <div className="form-grid">
                  <Field label="Requested date" required><input className="input" type="date" value={request.requestedDate} onChange={e => setRequest(f => ({ ...f, requestedDate: e.target.value }))} /></Field>
                  <Field label="Deadline" required><input className="input" type="date" min={request.requestedDate} value={request.deadline} onChange={e => setRequest(f => ({ ...f, deadline: e.target.value }))} /></Field>
                </div>
                <Field label="Documents" optional>
                  <label className="upload-zone">
                    <Icons.Upload size={16} />
                    <span>{request.files.length ? `${request.files.length} file${request.files.length > 1 ? 's' : ''} selected` : 'Choose files to attach'}</span>
                    <input type="file" multiple onChange={e => setRequest(f => ({ ...f, files: [...f.files, ...Array.from(e.target.files || [])] }))} />
                  </label>
                </Field>
                <div className="privacy-note"><Icons.Shield size={16} /><span>Request only the information needed for this purpose. Ask the department to redact unrelated personal data before sharing.</span></div>
                <div><Button variant="primary" type="submit" loading={saving} icon={<Icons.Plus size={15} />}>Create request</Button></div>
              </form>
            </>
          )}
        </Drawer>
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete this evidence request?"
          message={<>“{confirm.name}” and its uploaded files will be removed from the Evidence tracker. This can’t be undone.</>}
          confirmLabel="Delete request"
          onConfirm={() => removeEvidence(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
