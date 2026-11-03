import { useState } from 'react';
import { Badge, Button, Icons, Modal } from '../ui';
import { createMeeting, createEvidence, uploadMeetingFiles, uploadEvidenceFiles, deleteEvidence } from '../api/services/meetEvidence';

const DEPARTMENTS = ['Human Resources', 'Information Technology', 'Finance', 'Legal', 'Operations', 'Marketing', 'Customer Support'];
const blankMeeting = () => ({ department: '', date: '', attendees: '', purpose: '', followUp: '', documents: [], evidenceIds: [] });
const blankEvidence = () => ({ name: '', department: '', purpose: '', requestedDate: new Date().toISOString().slice(0, 10), deadline: '', files: [], source: 'meeting' });
const names = files => files.map(f => typeof f === 'string' ? f : f.name);

export default function MeetingsTracker({ meetings, setMeetings, evidence, setEvidence, onAction }) {
  const [showAdd, setShowAdd] = useState(false);
  const [meetingForm, setMeetingForm] = useState(blankMeeting());
  const [drawer, setDrawer] = useState(null);
  const [request, setRequest] = useState(blankEvidence());
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [filters, setFilters] = useState({ department: '', date: '', query: '' });
  const update = (key, value) => setMeetingForm(f => ({ ...f, [key]: value }));

  const addMeeting = async e => {
    e.preventDefault();
    try {
      const meeting = await createMeeting(meetingForm);
      const documents = meetingForm.documents;
      if (documents.length && meeting.id) await uploadMeetingFiles(meeting.id, documents);
      const created = { ...meeting, id: meeting.id ?? `m${Date.now()}`, documents, evidenceIds: [] };
      setMeetings(rows => [created, ...rows]);
      setShowAdd(false);
      setMeetingForm(blankMeeting());
      onAction?.('Meeting added.');
    } catch (error) { setNotice(error.message || 'Could not create meeting.'); }
  };
  const addRequest = async e => {
    e.preventDefault();
    if (request.deadline < request.requestedDate) { setNotice('Deadline must be on or after the requested date.'); return; }
    try {
      const record = await createEvidence({ ...request, type: 'Document' });
      const created = { ...record, ...request, id: record.id ?? `e${Date.now()}`, status: 'Requested', source: 'meeting' };
      if (request.files.length && created.id) await uploadEvidenceFiles(created.id, request.files);
      setEvidence(rows => [created, ...rows]);
      if (drawer?.meetingId) setMeetings(rows => rows.map(m => m.id === drawer.meetingId ? { ...m, evidenceIds: [...(m.evidenceIds ?? []), created.id] } : m));
      setDrawer(null); setRequest(blankEvidence()); setNotice(''); onAction?.('Evidence request created.');
    } catch (error) { setNotice(error.message || 'Could not create evidence request.'); }
  };
  const upload = (files, cb) => cb(current => [...current, ...Array.from(files || [])]);
  const uploadEvidence = async (id, files) => {
    const selected = Array.from(files || []); if (!selected.length) return;
    try {
      await uploadEvidenceFiles(id, selected);
      setEvidence(rows => rows.map(r => r.id === id ? { ...r, files: [...(r.files ?? []), ...selected], status: 'Uploaded' } : r));
      onAction?.(`${selected.length} evidence file${selected.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) { setNotice(error.message || 'Could not upload evidence files.'); }
  };
  const uploadMeetingDocuments = async (meetingId, files) => {
    const selected = Array.from(files || []); if (!selected.length) return;
    try {
      await uploadMeetingFiles(meetingId, selected);
      setMeetings(rows => rows.map(m => m.id === meetingId ? { ...m, documents: [...(m.documents ?? []), ...selected] } : m));
      onAction?.(`${selected.length} document${selected.length > 1 ? 's' : ''} uploaded.`);
    } catch (error) { setNotice(error.message || 'Could not upload meeting documents.'); }
  };
  const removeEvidence = async id => {
    try {
      await deleteEvidence(id);
      setEvidence(rows => rows.filter(r => r.id !== id));
      setMeetings(rows => rows.map(m => ({ ...m, evidenceIds: (m.evidenceIds ?? []).filter(e => e !== id) })));
      setConfirm(null); onAction?.('Evidence request deleted.');
    } catch (error) { setNotice(error.message || 'Could not delete evidence request.'); }
  };
  const textField = (label, key, type = 'text', required = true) => <label className="field-label">{label}{required && <span className="tracker-required"> *</span>}<input className="input" type={type} required={required} value={request[key]} onChange={e => setRequest(f => ({ ...f, [key]: e.target.value }))} /></label>;
  const filteredMeetings = meetings.filter(m => (!filters.department || m.department === filters.department) && (!filters.date || m.date === filters.date) && (!filters.query || `${m.department} ${m.attendees} ${m.purpose || ''}`.toLowerCase().includes(filters.query.toLowerCase())));
  const documentCount = meetings.reduce((total, meeting) => total + meeting.documents.length, 0);
  const requestCount = meetings.reduce((total, meeting) => total + meeting.evidenceIds.length, 0);

  return <div className="page-content tracker-page">
    <div className="tracker-intro"><p>Keep meeting notes, supporting documents, and evidence requests together.</p><Button variant="primary" icon={<Icons.Plus size={15}/>} onClick={() => setShowAdd(true)}>Add Meeting</Button></div>
    <div className="tracker-stats tracker-meeting-stats"><div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-blue"><Icons.Calendar size={18}/></div><div><span>Meetings held</span><strong>{meetings.length}</strong></div></div><div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-green"><Icons.File size={18}/></div><div><span>Documents collected</span><strong>{documentCount}</strong></div></div><div className="card tracker-stat"><div className="tracker-stat-icon tracker-stat-amber"><Icons.Clipboard size={18}/></div><div><span>Linked evidence requests</span><strong>{requestCount}</strong></div></div></div>
    <section className="card tracker-table-card" aria-label="Meetings">
      <div className="tracker-card-head"><div><h3>Meetings</h3><p>{filteredMeetings.length} of {meetings.length} meetings</p></div></div>
      <div className="tracker-filters" aria-label="Filter meetings"><label className="tracker-filter-field">Department<select className="input" value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}><option value="">All departments</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></label><label className="tracker-filter-field">Meeting date<input className="input" type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}/></label><label className="tracker-filter-field tracker-filter-search">Search department, attendees<input className="input" type="search" placeholder="Search meetings" value={filters.query} onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}/></label><button className="tracker-clear-filters" onClick={() => setFilters({ department: '', date: '', query: '' })} disabled={!filters.department && !filters.date && !filters.query}>Clear filters</button></div>
      <div className="tracker-table-scroll"><table className="tracker-table"><thead><tr><th>Department</th><th>Attendees</th><th>Date</th><th>Documents</th><th>Evidence</th></tr></thead><tbody>
        {filteredMeetings.map(m => { const linked = evidence.filter(e => m.evidenceIds.includes(e.id)); return <tr key={m.id}><td><strong>{m.department}</strong>{m.purpose && <span className="tracker-cell-note">{m.purpose}</span>}{m.followUp && <span className="tracker-cell-note">Follow-up: {m.followUp}</span>}</td><td>{m.attendees}</td><td>{m.date}</td><td><button className="tracker-link" onClick={() => setDrawer({ type: 'documents', meetingId: m.id })}>{m.documents.length} {m.documents.length === 1 ? 'document' : 'documents'} <Icons.ChevronRight size={14}/></button></td><td><button className="tracker-link" onClick={() => setDrawer({ type: 'evidence', meetingId: m.id })}>{linked.length} {linked.length === 1 ? 'request' : 'requests'} <Icons.ChevronRight size={14}/></button></td></tr>; })}
        {!filteredMeetings.length && <tr><td colSpan="5" className="tracker-empty">{meetings.length ? 'No meetings match these filters.' : 'No meetings yet. Add a meeting to get started.'}</td></tr>}
      </tbody></table></div>
    </section>
    {showAdd && <Modal title="Add meeting" onClose={() => setShowAdd(false)} footer={<><Button onClick={() => setShowAdd(false)}>Cancel</Button><Button variant="primary" type="submit" form="meeting-form">Add Meeting</Button></>}>
      <form id="meeting-form" className="tracker-form" onSubmit={addMeeting}><label className="field-label">Department <span className="tracker-required">*</span><select className="input" required value={meetingForm.department} onChange={e => update('department', e.target.value)}><option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></label><label className="field-label">Date <span className="tracker-required">*</span><input className="input" type="date" required value={meetingForm.date} onChange={e => update('date', e.target.value)}/></label><label className="field-label">Attendees <span className="tracker-required">*</span><textarea className="input tracker-textarea" required value={meetingForm.attendees} onChange={e => update('attendees', e.target.value)} placeholder="Add attendee names"/></label><label className="field-label">Meeting purpose <span className="tracker-optional">Optional</span><input className="input" value={meetingForm.purpose} onChange={e => update('purpose', e.target.value)} placeholder="e.g. Review data retention practices"/></label><label className="field-label">Decisions and follow-up <span className="tracker-optional">Optional</span><textarea className="input tracker-textarea" value={meetingForm.followUp} onChange={e => update('followUp', e.target.value)} placeholder="Record decisions, owners, or next steps"/></label><label className="field-label">Documents <span className="tracker-optional">Optional</span><input className="input tracker-file" type="file" multiple onChange={e => update('documents', [...meetingForm.documents, ...Array.from(e.target.files || [])])}/></label><label className="field-label">Evidence <span className="tracker-optional">Optional</span><span className="tracker-help">Create evidence requests after saving the meeting.</span></label></form>
    </Modal>}
    {drawer && <div className="tracker-overlay" onMouseDown={e => { if (e.target === e.currentTarget) { setDrawer(null); setNotice(''); } }}><aside className="tracker-drawer" role="dialog" aria-modal="true" aria-labelledby="meeting-drawer-title"><div className="tracker-drawer-head"><div><span className="tracker-eyebrow">{meetings.find(m => m.id === drawer.meetingId)?.department}</span><h2 id="meeting-drawer-title">{drawer.type === 'documents' ? 'Meeting documents' : 'Evidence requests'}</h2></div><button className="icon-btn" aria-label="Close drawer" onClick={() => { setDrawer(null); setNotice(''); }}><Icons.X size={18}/></button></div>
      {drawer.type === 'documents' ? <div className="tracker-drawer-body"><p className="tracker-help">Documents shared during this meeting.</p><div className="tracker-file-list">{(meetings.find(m => m.id === drawer.meetingId)?.documents || []).map((f, i) => <div className="tracker-file-item" key={`${f.name || f}-${i}`}><Icons.File size={17}/><span>{f.name || f}</span></div>)}</div><label className="tracker-upload"><Icons.Upload size={17}/><span>Upload documents</span><input type="file" multiple onChange={e => { const selected = Array.from(e.target.files || []); if (selected.length) uploadMeetingDocuments(drawer.meetingId, selected); e.target.value = ''; }}/></label></div> : <div className="tracker-drawer-body"><p className="tracker-help">Requests linked to this meeting are also listed in Evidence Tracker.</p>{notice && <div className="tracker-inline-error" role="alert">{notice}</div>}<div className="tracker-linked-list">{evidence.filter(r => meetings.find(m => m.id === drawer.meetingId)?.evidenceIds.includes(r.id)).map(r => <div className="tracker-linked-card" key={r.id}><div className="tracker-linked-top"><strong>{r.name}</strong><button className="tracker-icon-danger" aria-label={`Delete ${r.name}`} onClick={() => setConfirm(r)}><Icons.Trash size={15}/></button></div><div className="tracker-help">Due {r.deadline} · {names(r.files).length} file(s)</div>{r.purpose && <p className="tracker-help">Purpose: {r.purpose}</p>}<label className="tracker-upload tracker-upload-small"><Icons.Upload size={15}/><span>Upload evidence document</span><input type="file" multiple onChange={e => { uploadEvidence(r.id, e.target.files); e.target.value = ''; }}/></label></div>)}</div><form className="tracker-form tracker-drawer-form" onSubmit={addRequest}><h3>New evidence request</h3>{textField('Evidence name', 'name')}<label className="field-label">Department <span className="tracker-required">*</span><select className="input" required value={request.department} onChange={e => setRequest(f => ({ ...f, department: e.target.value }))}><option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></label><label className="field-label">Request purpose <span className="tracker-optional">Optional</span><textarea className="input tracker-textarea" value={request.purpose} onChange={e => setRequest(f => ({ ...f, purpose: e.target.value }))} placeholder="Why is this evidence needed?"/></label>{textField('Requested date', 'requestedDate', 'date')}{textField('Deadline', 'deadline', 'date')}<label className="field-label">Documents <span className="tracker-optional">Optional</span><input className="input tracker-file" type="file" multiple onChange={e => upload(e.target.files, files => setRequest(f => ({ ...f, files })))} /></label><div className="tracker-privacy-note"><Icons.Shield size={16}/><span>Request only the information needed for this purpose. Ask the department to redact unrelated personal data before sharing.</span></div><Button variant="primary" type="submit">Create request</Button></form></div>}</aside></div>}
    {confirm && <Modal title="Delete evidence request?" onClose={() => setConfirm(null)} footer={<><Button onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => removeEvidence(confirm.id)}>Delete request</Button></>}><p>“{confirm.name}” and its uploaded files will be removed from Evidence Tracker. This cannot be undone.</p></Modal>}
  </div>;
}
