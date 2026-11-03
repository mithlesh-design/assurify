import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge, Button, Icons, Modal } from '../ui';
import {
  createPolicy,
  deletePolicy,
  deletePolicyFiles,
  downloadPolicyFiles,
  fetchPolicies,
  fetchPolicy,
  fetchPolicySummary,
  normalizePolicy,
  updatePolicy,
  uploadPolicyFile,
} from '../api/services/policies';

const POLICY_TYPES = [
  { name: 'Privacy Notice', category: 'Notice and transparency', requirement: 'Mandatory', section: 'Section 5, Rule 3' },
  { name: 'Cookie Policy', category: 'Notice and transparency', requirement: 'Recommended', section: 'Sections 5 and 6' },
  { name: 'Consent Management Policy', category: 'Consent', requirement: 'Mandatory', section: 'Section 6' },
  { name: 'Data Principal Rights Policy', category: 'Data principal rights', requirement: 'Mandatory', section: 'Sections 11–14' },
  { name: "Children’s Data and Parental Consent Policy", category: 'Children’s data', requirement: 'Mandatory', section: 'Section 9' },
  { name: 'Data Security Safeguards Policy', category: 'Security safeguards', requirement: 'Mandatory', section: 'Section 8(5), Rule 6' },
  { name: 'Access Control and Logging Policy', category: 'Security safeguards', requirement: 'Recommended', section: 'Section 8(5)' },
  { name: 'Breach Response and Notification Policy', category: 'Breach management', requirement: 'Mandatory', section: 'Section 8(6), Rule 7' },
  { name: 'Data Processor and Vendor Management Policy', category: 'Processor management', requirement: 'Mandatory', section: 'Section 8(2)' },
  { name: 'Cross-Border Transfer Policy', category: 'Data transfers', requirement: 'Recommended', section: 'Section 16' },
  { name: 'DPIA and Periodic Audit Policy', category: 'Governance and assurance', requirement: 'Recommended', section: 'Sections 10 and 27' },
];

const POLICY_STATUSES = ['Draft', 'In review', 'Published', 'Not started'];
const POLICY_CATEGORIES = [...new Set(POLICY_TYPES.map(type => type.category)), 'Other'];
const POLICY_TABS = [
  { id: 'all', label: 'All policies' },
  { id: 'mandatory', label: 'Mandatory' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'needs_attention', label: 'Needs attention' },
];

function numeric(summary, keys, fallback) {
  for (const key of keys) {
    const value = Number(summary?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function countsFromPolicies(policies) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: policies.length,
    required: policies.filter(policy => policy.requirement.toLowerCase() === 'mandatory').length,
    published: policies.filter(policy => policy.status.toLowerCase() === 'published').length,
    inProgress: policies.filter(policy => ['draft', 'in review', 'in_review'].includes(policy.status.toLowerCase())).length,
    needsAttention: policies.filter(policy => ['not started', 'needs attention'].includes(policy.status.toLowerCase()) || (policy.nextReview && policy.nextReview.slice(0, 10) < today)).length,
  };
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value).slice(0, 10) : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fileName(policy) {
  const file = policy.files?.[0];
  return file?.file_name ?? file?.filename ?? file?.name ?? policy.file_name ?? '';
}

function dateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateTimeValue(value) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function Policies({ onAction }) {
  const { user } = useApp();
  const [policies, setPolicies] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPolicies, setImportPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => {
    const today = dateInputValue(new Date());
    const nextReview = new Date();
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    return { name: '', category: '', requirement: 'Mandatory', section: '', owner: '', status: 'Draft', reviewDate: today, nextReview: dateInputValue(nextReview) };
  });
  const [busyPolicyId, setBusyPolicyId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteFilesTarget, setDeleteFilesTarget] = useState(null);
  const uploadRefs = useRef({});

  const loadPolicies = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');
    const params = {
      search,
      tab: tab === 'all' ? undefined : tab,
      status: statusFilter || undefined,
    };
    const [listResult, summaryResult] = await Promise.allSettled([
      fetchPolicies(params),
      fetchPolicySummary(),
    ]);

    if (listResult.status === 'fulfilled') setPolicies(listResult.value);
    else setError(listResult.reason?.message || 'Could not load the policy library.');
    setSummaryData(summaryResult.status === 'fulfilled' ? summaryResult.value : null);
    if (!quiet) setLoading(false);
  }, [search, tab, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadPolicies(); }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadPolicies, search]);

  const fallbackCounts = useMemo(() => countsFromPolicies(policies), [policies]);
  const summary = {
    total: numeric(summaryData, ['total', 'total_policies', 'policy_count'], fallbackCounts.total),
    required: numeric(summaryData, ['required', 'mandatory', 'mandatory_policies', 'required_policies'], fallbackCounts.required),
    published: numeric(summaryData, ['published', 'published_policies'], fallbackCounts.published),
    inProgress: numeric(summaryData, ['in_progress', 'in_progress_policies', 'under_review'], fallbackCounts.inProgress),
    needsAttention: numeric(summaryData, ['needs_attention', 'needs_attention_policies', 'not_started'], fallbackCounts.needsAttention),
  };

  const closeAdd = () => {
    if (saving) return;
    setAddOpen(false);
    setDraft({ name: '', category: '', requirement: 'Mandatory', section: '', owner: user?.name || '', status: 'Draft', reviewDate: dateInputValue(new Date()), nextReview: '' });
    setFormError('');
  };

  const openAdd = () => {
    const today = dateInputValue(new Date());
    const nextReview = new Date();
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    setDraft({ name: '', category: '', requirement: 'Mandatory', section: '', owner: user?.name || '', status: 'Draft', reviewDate: today, nextReview: dateInputValue(nextReview) });
    setFormError('');
    setAddOpen(true);
  };

  const closeImport = () => {
    if (saving) return;
    setImportOpen(false);
    setSelectedPolicyId('');
    setSelectedFile(null);
    setFormError('');
  };

  const openImport = async () => {
    setImportPolicies(policies);
    setSelectedPolicyId('');
    setSelectedFile(null);
    setFormError('');
    setImportOpen(true);
    try { setImportPolicies(await fetchPolicies()); }
    catch (requestError) { setFormError(requestError.message || 'Could not load existing policies.'); }
  };

  const saveNewPolicy = async event => {
    event.preventDefault();
    if (!draft.name.trim()) { setFormError('Enter a policy name.'); return; }
    if (!draft.category) { setFormError('Choose a policy category.'); return; }

    setSaving(true);
    setFormError('');
    try {
      await createPolicy({
        policy_name: draft.name.trim(),
        category: draft.category,
        requirement: draft.requirement,
        section_rule: draft.section.trim(),
        policy_owner: draft.owner.trim() || user?.name || user?.company || 'Policy owner',
        policy_status: draft.status,
        next_review_date: dateTimeValue(draft.nextReview),
        review_date: dateTimeValue(draft.reviewDate) || new Date().toISOString(),
      });
      onAction?.('Policy added to the library. Use Import policy to attach its document.');
      setAddOpen(false);
      await loadPolicies({ quiet: true });
    } catch (requestError) {
      setFormError(requestError.message || 'Could not create the policy record.');
    } finally {
      setSaving(false);
    }
  };

  const importPolicy = async event => {
    event.preventDefault();
    const existingPolicy = importPolicies.find(policy => String(policy.id) === String(selectedPolicyId));
    if (!existingPolicy) { setFormError('Choose an existing policy.'); return; }
    if (!selectedFile) { setFormError('Select the policy document to upload.'); return; }

    setSaving(true);
    setFormError('');
    try {
      await uploadPolicyFile(existingPolicy.id, selectedFile);
      onAction?.(`Document imported for ${existingPolicy.name}.`);
      setImportOpen(false);
      setSelectedPolicyId('');
      setSelectedFile(null);
      await loadPolicies({ quiet: true });
    } catch (requestError) {
      setFormError(requestError.message || 'Could not upload the policy document.');
    } finally { setSaving(false); }
  };

  const uploadForPolicy = async (policy, file) => {
    if (!file) return;
    setBusyPolicyId(policy.id);
    try {
      await uploadPolicyFile(policy.id, file);
      onAction?.(`Uploaded ${file.name}.`);
      await loadPolicies({ quiet: true });
    } catch (requestError) {
      onAction?.(requestError.message || 'Could not upload the policy document.');
    } finally {
      setBusyPolicyId(null);
    }
  };

  const openDetails = async policy => {
    setDetail({ ...policy, loading: true });
    setDetailLoading(true);
    try { setDetail(await fetchPolicy(policy.id)); }
    catch (requestError) { setDetail({ ...policy, detailError: requestError.message }); }
    finally { setDetailLoading(false); }
  };

  const changeStatus = async (policy, nextStatus) => {
    setBusyPolicyId(policy.id);
    try {
      await updatePolicy(policy.id, { policy_status: nextStatus });
      onAction?.('Policy status updated.');
      await loadPolicies({ quiet: true });
    } catch (requestError) {
      onAction?.(requestError.message || 'Could not update policy status.');
    } finally { setBusyPolicyId(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyPolicyId(deleteTarget.id);
    try {
      await deletePolicy(deleteTarget.id);
      onAction?.('Policy deleted.');
      setDeleteTarget(null);
      await loadPolicies({ quiet: true });
    } catch (requestError) { onAction?.(requestError.message || 'Could not delete policy.'); }
    finally { setBusyPolicyId(null); }
  };

  const handleDeleteFiles = async () => {
    if (!deleteFilesTarget) return;
    setBusyPolicyId(deleteFilesTarget.id);
    try {
      await deletePolicyFiles(deleteFilesTarget.id);
      onAction?.('Policy file removed.');
      setDeleteFilesTarget(null);
      await loadPolicies({ quiet: true });
    } catch (requestError) { onAction?.(requestError.message || 'Could not remove policy files.'); }
    finally { setBusyPolicyId(null); }
  };

  const handleDownload = async policy => {
    setBusyPolicyId(policy.id);
    try { await downloadPolicyFiles(policy.id); }
    catch (requestError) { onAction?.(requestError.message || 'Could not download the policy file.'); }
    finally { setBusyPolicyId(null); }
  };

  return <div className="page policy-page">
    <div className="policy-toolbar">
      <div className="policy-page-copy">
        <span className="policy-kicker"><Icons.File size={14}/> DPDP GOVERNANCE</span>
        <h2>Policy library</h2>
        <p>Import, track, and maintain the policies that support your DPDP compliance programme.</p>
      </div>
      <div className="policy-toolbar-actions">
        <Button icon={<Icons.Upload size={15}/>} onClick={openImport}>Import policy</Button>
        <Button variant="primary" icon={<Icons.Plus size={15}/>} onClick={openAdd}>Add policy</Button>
      </div>
    </div>

    <div className="policy-metrics">
      <article className="policy-metric"><span className="policy-metric-icon policy-metric-blue"><Icons.Clipboard size={17}/></span><div><span>Required policies</span><strong>{summary.required}</strong><small>Of {summary.total} in the library</small></div></article>
      <article className="policy-metric"><span className="policy-metric-icon policy-metric-green"><Icons.Check size={17}/></span><div><span>Published</span><strong className="policy-num-green">{summary.published}</strong><small>Approved and in effect</small></div></article>
      <article className="policy-metric"><span className="policy-metric-icon policy-metric-amber"><Icons.Clock size={17}/></span><div><span>In progress</span><strong className="policy-num-amber">{summary.inProgress}</strong><small>Draft or under review</small></div></article>
      <article className="policy-metric"><span className="policy-metric-icon policy-metric-red"><Icons.Alert size={17}/></span><div><span>Needs attention</span><strong className="policy-num-red">{summary.needsAttention}</strong><small>Not started or due for review</small></div></article>
    </div>

    <section className="card policy-library">
      <header className="policy-library-head">
        <div><h2>Policies</h2><p>Search and filter your organisation’s policy records.</p></div>
        <span className="policy-count">{summary.total} {summary.total === 1 ? 'policy' : 'policies'}</span>
      </header>
      <div className="policy-controls">
        <label className="policy-search"><Icons.Search size={16}/><input aria-label="Search policies" type="search" placeholder="Search by policy name, owner, or category" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className="policy-filter-list" role="group" aria-label="Filter policies">
          {POLICY_TABS.map(item => <button key={item.id} className={`policy-filter${tab === item.id ? ' active' : ''}`} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
        </div>
        <select className="input policy-status-select" aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {POLICY_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {error && <div className="policy-alert" role="alert"><Icons.Alert size={16}/><span>{error}</span><button className="policy-retry" onClick={() => loadPolicies()}>Retry</button></div>}
      {loading ? <div className="policy-loading"><span className="policy-spinner"/>Loading policy library…</div> : (
        <div className="policy-table-scroll">
          <table className="policy-table">
            <thead><tr><th>Policy</th><th>Requirement</th><th>Status</th><th>Owner</th><th>Next review</th><th>Document</th><th>Actions</th></tr></thead>
            <tbody>
              {policies.map(policy => <tr key={policy.id}>
                <td><div className="policy-name-cell"><span className="policy-row-icon"><Icons.File size={16}/></span><div><strong>{policy.name}</strong><span>{policy.category}{policy.section ? ` · ${policy.section}` : ''}</span></div></div></td>
                <td><Badge tone={policy.requirement.toLowerCase() === 'mandatory' ? 'info' : 'neutral'}>{policy.requirement}</Badge></td>
                <td><select className={`policy-status-control status-${policy.status.toLowerCase().replace(/[^a-z]+/g, '-')}`} aria-label={`Status for ${policy.name}`} disabled={busyPolicyId === policy.id} value={policy.status} onChange={event => changeStatus(policy, event.target.value)}>{POLICY_STATUSES.map(status => <option key={status}>{status}</option>)}</select></td>
                <td>{policy.owner || '—'}</td>
                <td>{displayDate(policy.nextReview)}</td>
                <td>{fileName(policy) ? <span className="policy-file-name" title={fileName(policy)}><Icons.Check size={13}/>{fileName(policy)}</span> : <span className="policy-no-file">No file uploaded</span>}</td>
                <td><div className="policy-actions">
                  <button className="policy-action" onClick={() => openDetails(policy)} aria-label={`View ${policy.name}`} title="View details"><Icons.Eye size={15}/></button>
                  <button className="policy-action" disabled={busyPolicyId === policy.id} onClick={() => uploadRefs.current[policy.id]?.click()} aria-label={`Upload file for ${policy.name}`} title="Upload or replace file"><Icons.Upload size={15}/></button>
                  <input ref={element => { uploadRefs.current[policy.id] = element; }} type="file" accept=".pdf,.doc,.docx,.odt" hidden onChange={event => { uploadForPolicy(policy, event.target.files?.[0]); event.target.value = ''; }}/>
                  <button className="policy-action" disabled={busyPolicyId === policy.id || !fileName(policy)} onClick={() => handleDownload(policy)} aria-label={`Download ${policy.name} file`} title="Download file"><Icons.Download size={15}/></button>
                  <button className="policy-action policy-action-delete" onClick={() => fileName(policy) ? setDeleteFilesTarget(policy) : setDeleteTarget(policy)} aria-label={`Delete ${policy.name}`} title={fileName(policy) ? 'Remove file' : 'Delete policy'}><Icons.Trash size={15}/></button>
                </div></td>
              </tr>)}
              {!policies.length && !error && <tr><td colSpan="7" className="policy-empty"><span className="policy-empty-icon"><Icons.Search size={20}/></span><strong>No policies match these filters</strong><span>Try another search, add a new policy, or import a document for an existing policy.</span><button onClick={() => { setSearch(''); setTab('all'); setStatusFilter(''); }}>Clear search and filters</button></td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <footer className="policy-library-foot"><span>{policies.length} policies shown</span><span><i className="policy-foot-dot"/> Synced with your policy service</span></footer>
    </section>

    {addOpen && <Modal title="Add a policy" onClose={closeAdd} width={620} footer={<><Button onClick={closeAdd} disabled={saving}>Cancel</Button><Button variant="primary" type="submit" form="policy-create-form" disabled={saving}>{saving ? 'Saving…' : 'Add policy'}</Button></>}>
      <form id="policy-create-form" className="policy-create-form" onSubmit={saveNewPolicy}>
        <p className="policy-modal-intro">Create the policy record first. You can attach its document later with Import policy.</p>
        <label className="field-label" htmlFor="policy-name">Policy name</label>
        <input id="policy-name" className="input" required autoFocus value={draft.name} onChange={event => setDraft(value => ({ ...value, name: event.target.value }))} placeholder="e.g. Privacy Notice" />
        <div className="policy-create-grid">
          <label className="field-label" htmlFor="policy-category">Category<select id="policy-category" className="input" required value={draft.category} onChange={event => setDraft(value => ({ ...value, category: event.target.value }))}><option value="">Select category</option>{POLICY_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
          <label className="field-label" htmlFor="policy-requirement">Requirement<select id="policy-requirement" className="input" value={draft.requirement} onChange={event => setDraft(value => ({ ...value, requirement: event.target.value }))}><option>Mandatory</option><option>Recommended</option></select></label>
          <label className="field-label" htmlFor="policy-status">Status<select id="policy-status" className="input" value={draft.status} onChange={event => setDraft(value => ({ ...value, status: event.target.value }))}>{POLICY_STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
          <label className="field-label" htmlFor="policy-owner">Policy owner<input id="policy-owner" className="input" value={draft.owner} onChange={event => setDraft(value => ({ ...value, owner: event.target.value }))} placeholder="Team or role responsible" /></label>
          <label className="field-label policy-create-wide" htmlFor="policy-section">DPDP section or rule<input id="policy-section" className="input" value={draft.section} onChange={event => setDraft(value => ({ ...value, section: event.target.value }))} placeholder="e.g. Section 8(5), Rule 6" /></label>
          <label className="field-label" htmlFor="policy-review-date">Review date<input id="policy-review-date" className="input" type="date" value={draft.reviewDate} onChange={event => setDraft(value => ({ ...value, reviewDate: event.target.value }))} /></label>
          <label className="field-label" htmlFor="policy-next-review">Next review<input id="policy-next-review" className="input" type="date" value={draft.nextReview} onChange={event => setDraft(value => ({ ...value, nextReview: event.target.value }))} /></label>
        </div>
        {formError && <div className="policy-form-error" role="alert"><Icons.Alert size={15}/>{formError}</div>}
      </form>
    </Modal>}

    {importOpen && <Modal title="Import a policy document" onClose={closeImport} width={560} footer={<><Button onClick={closeImport} disabled={saving}>Cancel</Button><Button variant="primary" type="submit" form="policy-import-form" disabled={saving || !importPolicies.length}>{saving ? 'Uploading…' : 'Import document'}</Button></>}>
      <form id="policy-import-form" className="policy-import-form" onSubmit={importPolicy}>
        <p className="policy-modal-intro">Attach a document to a policy already in your library. This will not create a new policy record.</p>
        <label className="field-label" htmlFor="existing-policy">Policy name</label>
        <select id="existing-policy" className="input" required value={selectedPolicyId} onChange={event => setSelectedPolicyId(event.target.value)}>
          <option value="">Select an existing policy</option>
          {importPolicies.map(policy => <option key={policy.id} value={policy.id}>{policy.name}</option>)}
        </select>
        {!importPolicies.length && <p className="policy-no-existing">Add a policy record before importing its document.</p>}
        {selectedPolicyId && <div className="policy-selected-meta"><span>{importPolicies.find(policy => String(policy.id) === String(selectedPolicyId))?.category}</span><Badge tone="info">Existing policy</Badge></div>}
        <label className="field-label policy-file-label" htmlFor="policy-import-file">Policy document</label>
        <label className={`policy-dropzone${selectedFile ? ' has-file' : ''}`} htmlFor="policy-import-file">
          <input id="policy-import-file" type="file" accept=".pdf,.doc,.docx,.odt" required onChange={event => setSelectedFile(event.target.files?.[0] ?? null)} />
          <span className="policy-dropzone-icon"><Icons.Upload size={19}/></span>
          <strong>{selectedFile?.name || 'Choose a policy file'}</strong>
          <small>{selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · click to replace` : 'PDF, DOC, DOCX, or ODT · select a file from your device'}</small>
        </label>
        {formError && <div className="policy-form-error" role="alert"><Icons.Alert size={15}/>{formError}</div>}
      </form>
    </Modal>}

    {detail && <Modal title="Policy details" onClose={() => setDetail(null)} width={620} footer={<Button onClick={() => setDetail(null)}>Close</Button>}>
      {detailLoading ? <div className="policy-loading"><span className="policy-spinner"/>Loading policy details…</div> : detail.detailError ? <div className="policy-form-error" role="alert">{detail.detailError}</div> : <div className="policy-detail-grid">
        <div><small>Policy name</small><strong>{normalizePolicy(detail).name}</strong></div><div><small>Category</small><strong>{normalizePolicy(detail).category}</strong></div>
        <div><small>Requirement</small><strong>{normalizePolicy(detail).requirement}</strong></div><div><small>Status</small><strong>{normalizePolicy(detail).status}</strong></div>
        <div><small>Policy owner</small><strong>{normalizePolicy(detail).owner || 'Not assigned'}</strong></div><div><small>Section / rule</small><strong>{normalizePolicy(detail).section || 'Not specified'}</strong></div>
        <div><small>Review date</small><strong>{displayDate(normalizePolicy(detail).reviewDate)}</strong></div><div><small>Next review</small><strong>{displayDate(normalizePolicy(detail).nextReview)}</strong></div>
      </div>}
    </Modal>}

    {deleteTarget && <Modal title="Delete policy?" onClose={() => setDeleteTarget(null)} footer={<><Button onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={busyPolicyId === deleteTarget.id}>Delete policy</Button></>}><p>Delete <strong>{deleteTarget.name}</strong> from the policy library? This action cannot be undone.</p></Modal>}
    {deleteFilesTarget && <Modal title="Remove policy file?" onClose={() => setDeleteFilesTarget(null)} footer={<><Button onClick={() => setDeleteFilesTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDeleteFiles} disabled={busyPolicyId === deleteFilesTarget.id}>Remove file</Button></>}><p>Remove the uploaded document for <strong>{deleteFilesTarget.name}</strong>? The policy record will remain in the library.</p></Modal>}
  </div>;
}
