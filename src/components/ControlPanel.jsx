import { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, useDialog } from '../ui';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OBL_META, STATUS_META, statusClass, statusLabel } from '../data/controls';
import { GAPP_PRINCIPLE_LABELS } from '../config/obligations';
import { can } from '../lib/permissions';
import { createComment, getComments } from '../api/services/comments';
import { reviewControl, saveObservationRecommendation } from '../api/services/controls';
import { listDocuments, downloadFile } from '../api/services/fileManager';

/* ── Helpers ───────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date(), diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function normaliseApiComment(c) {
  return {
    id: String(c.id ?? c.comment_id ?? Date.now()),
    type: 'comment',
    user: c.commenter ?? c.commenter_name ?? c.user_name ?? c.username ?? c.user ?? 'User',
    role: String(c.role ?? (c.reviewer_id != null ? 'reviewer' : c.is_reviewer ? 'reviewer' : 'customer')).toLowerCase(),
    at: c.created_at ?? c.timestamp ?? c.at ?? new Date().toISOString(),
    msg: c.comment ?? c.message ?? c.text ?? '',
  };
}

function normaliseDoc(d) {
  return {
    id: String(d.id ?? d.file_id ?? Date.now()),
    name: d.file_name ?? d.name ?? d.filename ?? d.original_name ?? 'Document',
    url: d.file_url ?? d.url ?? d.download_url ?? d.file_path
      ?? d.signed_url ?? d.s3_url ?? d.storage_url ?? d.public_url ?? d.document_url ?? null,
    uploadedAt: d.created_at ?? d.uploaded_at ?? d.at ?? new Date().toISOString(),
    uploadedBy: d.uploaded_by ?? d.user_name ?? d.uploader ?? null,
  };
}

/* ── SVG Icons ── */
const IconChat = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconFiles = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);
const IconObservation = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="12" y1="9" x2="8" y2="9" />
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ── Status dot ── */
const STATUS_DOT_COLORS = {
  pending_review: '#94A3B8',
  in_progress: '#3B82F6',
  implemented: '#22C55E',
  needs_discussion: '#F59E0B',
  blocked: '#EF4444',
  not_applicable: '#8B5CF6',
};
function StatusDot({ status }) {
  const color = STATUS_DOT_COLORS[status] ?? STATUS_DOT_COLORS.pending_review;
  return (
    <span
      title={statusLabel(status)}
      style={{
        display: 'inline-block', flexShrink: 0,
        width: 11, height: 11, borderRadius: '50%',
        background: color, cursor: 'default',
        boxShadow: `0 0 0 3px ${color}30`,
      }}
    />
  );
}

/* ── Doc status badge ──────────────────────────────────── */
function DocStatusBadge({ status }) {
  const styles = {
    approved: { background: 'var(--green-soft)', color: 'var(--green-dim)', border: '1px solid var(--green-mid)' },
    needs_revision: { background: 'var(--risk-high-bg)', color: 'var(--risk-high-text)', border: '1px solid var(--risk-high-border)' },
    under_review: { background: 'var(--risk-med-bg)', color: 'var(--risk-med-text)', border: '1px solid var(--risk-med-border)' },
  };
  const labels = { approved: '✓ Approved', needs_revision: 'Needs revision', under_review: 'Under review' };
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, display: 'inline-block', ...(styles[status] ?? styles.under_review) }}>
      {labels[status] ?? 'Under review'}
    </span>
  );
}

/* ── Activity item ─────────────────────────────────────── */
function ActivityItem({ act }) {
  const ini = act.user === 'System' ? '⬡' : act.user.split(' ').map(w => w[0]).join('').slice(0, 2);
  const roleLabel = act.role === 'admin' ? 'Admin' : act.role === 'reviewer' ? 'Reviewer' : act.role === 'customer' ? 'Customer' : 'System';
  return (
    <div className="act-item">
      <div className={`act-avatar ${act.role === 'reviewer' ? 'admin' : act.role}`}>{ini}</div>
      <div className="act-body">
        <div className="act-header">
          <span className="act-name">{act.user}</span>
          <span className={`act-role-badge ${act.role === 'reviewer' ? 'admin' : act.role}`}>{roleLabel}</span>
          <span className="act-time">{formatDate(act.at)}</span>
        </div>
        <div className="act-msg">{act.msg}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <div className="act-avatar admin">AG</div>
      <div className="typing-indicator">
        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
      </div>
    </div>
  );
}

function DocItem({ doc }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadFile(doc.id, doc.name);
    } catch { }
    finally { setDownloading(false); }
  };

  return (
    <div className="cp-doc-item">
      <div className="cp-doc-icon"><Icons.File size={18} /></div>
      <div className="cp-doc-info">
        <div className="cp-doc-name">{doc.name}</div>
        <div className="cp-doc-meta">
          {doc.uploadedBy ? `${doc.uploadedBy} · ` : ''}{formatDate(doc.uploadedAt)}
        </div>
      </div>
      <div className="cp-doc-actions">
        <button
          className="cp-doc-btn"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ControlPanel
═══════════════════════════════════════════════════════ */
export default function ControlPanel({ ctrl, onClose, staticMode = false, onStaticComment }) {
  const { user, tenant, updateStatus, addComment, requestHelp } = useApp();
  const toast = useToast();
  const perm = can(user);
  const isAdmin = perm.updateControlStatus();
  const oblName = OBL_META.find(o => o.id === ctrl.obl)?.name
    ?? GAPP_PRINCIPLE_LABELS[ctrl.obl]
    ?? ctrl.obl?.replace(/_/g, ' ')
    ?? '';

  const [activeTab, setActiveTab] = useState('chat');

  /* Chat state */
  const [comment, setComment] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiComments, setApiComments] = useState([]);
  const [loadingCmts, setLoadingCmts] = useState(true);

  /* Status dropdown state */
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  /* Docs state */
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsFetched, setDocsFetched] = useState(false);

  /* Observations & Recommendations state */
  const [obsText, setObsText] = useState(ctrl.remarks ?? '');
  const [recText, setRecText] = useState(ctrl.recommendation ?? '');
  const [draftObs, setDraftObs] = useState('');
  const [draftRec, setDraftRec] = useState('');
  const [obsEditing, setObsEditing] = useState(false);
  const [obsSaving, setObsSaving] = useState(false);

  const bodyRef = useRef(null);
  const statusDropRef = useRef(null);

  /* ── Fetch comments on open ── */
  useEffect(() => {
    if (staticMode) {
      setApiComments((ctrl.acts ?? []).filter(activity => activity.type === 'comment'));
      setLoadingCmts(false);
      return undefined;
    }
    let cancelled = false;
    setLoadingCmts(true);
    getComments(ctrl.id)
      .then((res) => {
        if (cancelled) return;
        const activities = Array.isArray(res) ? res : (res?.activities ?? res?.comments ?? res?.results ?? []);
        const comments = activities
          .filter(a => !a.type || a.type === 'comment')
          .map(a => normaliseApiComment(a.data ?? a));
        setApiComments(comments);
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoadingCmts(false); });
    return () => { cancelled = true; };
  }, [ctrl.id, staticMode, ctrl.acts]);

  /* Close status dropdown on outside click */
  useEffect(() => {
    if (!statusDropOpen) return;
    const handler = (e) => {
      if (statusDropRef.current && !statusDropRef.current.contains(e.target))
        setStatusDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusDropOpen]);

  const displayActs = useMemo(() => {
    const nonComments = ctrl.acts.filter(a => a.type !== 'comment');
    return [...nonComments, ...apiComments].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [ctrl.acts, apiComments]);

  /* Scroll to bottom of chat on new message */
  useEffect(() => {
    if (activeTab === 'chat') {
      const el = bodyRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [displayActs.length, activeTab]);

  /* Typing indicator */
  useEffect(() => {
    const lastAct = displayActs[displayActs.length - 1];
    if (!isAdmin && lastAct?.role !== 'admin' && lastAct?.role !== 'reviewer') {
      const t = setTimeout(() => {
        setTyping(true);
        const t2 = setTimeout(() => setTyping(false), 2200);
        return () => clearTimeout(t2);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [displayActs.length, isAdmin]);

  /* ── Load documents (lazy) ── */
  const loadDocs = async () => {
    if (docsFetched) return;
    if (staticMode) {
      setDocs((ctrl.docs ?? []).map(normaliseDoc));
      setDocsFetched(true);
      return;
    }
    setLoadingDocs(true);
    try {
      const res = await listDocuments(ctrl.id);
      const files = Array.isArray(res) ? res : (res?.files ?? res?.documents ?? res?.results ?? []);
      setDocs(files.map(normaliseDoc));
    } catch { }
    finally { setLoadingDocs(false); setDocsFetched(true); }
  };

  const startObsEdit = () => {
    setDraftObs(obsText);
    setDraftRec(recText);
    setObsEditing(true);
  };

  const cancelObsEdit = () => setObsEditing(false);

  const handleSaveObs = async () => {
    setObsSaving(true);
    try {
      await saveObservationRecommendation(ctrl.id, draftObs, draftRec, tenant?.url);
      setObsText(draftObs);
      setRecText(draftRec);
      setObsEditing(false);
      toast.success('Observations saved.');
    } catch (err) {
      toast.error(err?.message ?? 'Failed to save observations.');
    } finally { setObsSaving(false); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'docs') loadDocs();
  };

  /* ── Send comment ── */
  const handleSend = async () => {
    const text = comment.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (staticMode) {
        const activity = { id: `gdpr-${Date.now()}`, type: 'comment', user: user?.name ?? 'User', role: 'customer', at: new Date().toISOString(), msg: text };
        onStaticComment?.(ctrl.id, text);
        setApiComments(previous => [...previous, activity]);
        setComment('');
        return;
      }
      const res = await createComment(ctrl.id, text);
      const newAct = res && (res.id ?? res.comment_id)
        ? normaliseApiComment(res)
        : { id: 'e' + Date.now(), type: 'comment', user: user?.name ?? 'User', role: user?.role ?? 'reviewer', at: new Date().toISOString(), msg: text };
      setApiComments(prev => [...prev, newAct]);
      setComment('');
      toast.success('Comment added.');
    } catch {
      addComment(ctrl.id, text);
      setComment('');
      toast.success('Comment added.');
    } finally { setSending(false); }
  };

  /* ── Status dropdown select ── */
  const handleStatusSelect = async (newStatus) => {
    if (ctrl.status === newStatus || statusUpdating) return;
    setStatusDropOpen(false);
    setStatusUpdating(true);
    const oldLabel = statusLabel(ctrl.status);
    const newLabel = statusLabel(newStatus);
    const statusMsg = `Status changed from "${oldLabel}" to "${newLabel}" by ${user?.name ?? 'Reviewer'}.`;
    try {
      await reviewControl(ctrl.id, newStatus, tenant?.url);
      updateStatus(ctrl.id, newStatus);
      /* Persist as a comment so customer portal activity feed shows it */
      try { await createComment(ctrl.id, statusMsg); } catch { }
      const statusAct = {
        id: 'sc' + Date.now(), type: 'status',
        user: user?.name ?? 'Reviewer', role: user?.role ?? 'reviewer',
        at: new Date().toISOString(),
        msg: statusMsg,
      };
      setApiComments(prev => [...prev, statusAct]);
      toast.success(`Status updated to "${newLabel}".`);
    } catch (err) {
      toast.error(err?.message ?? 'Failed to update status.');
    } finally { setStatusUpdating(false); }
  };

  const handleHelp = () => {
    if (staticMode) {
      const message = 'Help requested — please advise on the next steps to implement this control.';
      onStaticComment?.(ctrl.id, message);
      setApiComments(previous => [...previous, { id: `gdpr-${Date.now()}`, type: 'comment', user: user?.name ?? 'User', role: 'customer', at: new Date().toISOString(), msg: message }]);
      return;
    }
    requestHelp(ctrl.id);
    toast.info('Help request sent to reviewer.');
  };

  /* Escape closes the panel; focus moves into it and returns to the control row on close */
  const panelRef = useRef(null);
  useDialog(panelRef, onClose);

  return (
    <>
      <div className="cp-backdrop" onClick={onClose} />
      <div className="cp-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cp-panel-title" tabIndex={-1}>

        {/* ── Header ── */}
        <div className="cp-header">
          <button type="button" className="cp-close" onClick={onClose} aria-label="Close panel"><Icons.X size={16} /></button>
          <div className="cp-obl-tag">{ctrl.obl?.replace(/_/g, ' ')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 44, marginBottom: 8 }}>
            <StatusDot status={ctrl.status} />
            <h3 id="cp-panel-title" className="cp-ctrl-name" style={{ margin: 0, paddingRight: 0 }}>{ctrl.name}</h3>
          </div>
          <div className="cp-ctrl-meta">

            {/* Status — static badge or dropdown for reviewer/admin */}
            {isAdmin ? (
              <div style={{ position: 'relative' }} ref={statusDropRef}>
                <button
                  onClick={() => !statusUpdating && setStatusDropOpen(v => !v)}
                  disabled={statusUpdating}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: 0, border: 'none', background: 'transparent',
                    cursor: statusUpdating ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span className={`status-badge ${statusClass(ctrl.status)}`} style={{ pointerEvents: 'none' }}>
                    {statusUpdating ? 'Updating…' : statusLabel(ctrl.status)}
                  </span>
                  {!statusUpdating && (
                    <span style={{
                      fontSize: 12, color: 'var(--slate)',
                      transform: statusDropOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform .15s', display: 'inline-block',
                    }}>▾</span>
                  )}
                </button>

                {statusDropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 190, overflow: 'hidden',
                  }}>
                    {STATUS_META.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusSelect(s.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', textAlign: 'left',
                          padding: '9px 14px', fontSize: 13,
                          fontFamily: 'inherit', border: 'none',
                          background: ctrl.status === s.value ? 'var(--green-soft)' : 'transparent',
                          color: 'var(--black)', cursor: 'pointer',
                          fontWeight: ctrl.status === s.value ? 600 : 400,
                        }}
                        onMouseEnter={e => { if (ctrl.status !== s.value) e.currentTarget.style.background = 'var(--bg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ctrl.status === s.value ? 'var(--green-soft)' : 'transparent'; }}
                      >
                        {ctrl.status === s.value && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓</span>}
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className={`status-badge ${statusClass(ctrl.status)}`}>
                {statusLabel(ctrl.status)}
              </span>
            )}

            <span className="cp-ctrl-ref">{ctrl.req}</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cp-tabs">
          <button
            className={`cp-tab-btn${activeTab === 'chat' ? ' active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            <IconChat /> Activity
          </button>
          <button
            className={`cp-tab-btn${activeTab === 'docs' ? ' active' : ''}`}
            onClick={() => handleTabChange('docs')}
          >
            <IconFiles /> Documents
            {docs.length > 0 && <span className="cp-tab-count">{docs.length}</span>}
          </button>
          <button
            className={`cp-tab-btn${activeTab === 'obs' ? ' active' : ''}`}
            onClick={() => handleTabChange('obs')}
          >
            <IconObservation /> Observations
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cp-body" ref={bodyRef} tabIndex={0} aria-label="Control details">

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              {/* <div className="cp-section">
                <div className="cp-section-title">Assigned reviewer</div>
                <div className="cp-reviewer">
                  <div className="cp-reviewer-avatar">AG</div>
                  <div>
                    <div className="cp-reviewer-name">Anshul Gupta</div>
                    <div className="cp-reviewer-role">CAPP · Certified Privacy Professional · Appzlogic</div>
                  </div>
                </div>
              </div> */}

              {/* <div className="cp-section" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--white)' }}>
                <div className="cp-section-title">Requirement</div>
                <div className="cp-req-box">{ctrl.desc}</div>
              </div> */}

              <div className="cp-section" style={{ borderBottom: 'none' }}>
                {staticMode && ctrl.desc && <div className="cp-section">
                  <div className="cp-section-title">Assessment criteria</div>
                  <div className="cp-req-box">{ctrl.desc}</div>
                </div>}
                <div className="cp-section-title">Activity &amp; discussion</div>
                {loadingCmts
                  ? <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>Loading comments…</div>
                  : (
                    <div className="cp-activity">
                      {displayActs.length === 0 && (
                        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>
                          No messages yet.
                        </div>
                      )}
                      {displayActs.map(act => <ActivityItem key={act.id} act={act} />)}
                      {typing && <TypingIndicator />}
                    </div>
                  )
                }
              </div>
            </>
          )}

          {/* Documents tab — list only, no upload for reviewers */}
          {activeTab === 'docs' && (
            <div className="cp-section" style={{ borderBottom: 'none' }}>
              <div className="cp-section-title">
                Documents
                <span>({docs.length} file{docs.length !== 1 ? 's' : ''})</span>
              </div>
              {loadingDocs
                ? <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>Loading documents…</div>
                : docs.length === 0
                  ? (
                    <div className="cp-docs-empty">
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                      <div>No documents uploaded by the customer yet.</div>
                    </div>
                  )
                  : (
                    <div className="cp-doc-list">
                      {docs.map(doc => <DocItem key={doc.id} doc={doc} />)}
                    </div>
                  )
              }
            </div>
          )}

          {/* Observations & Recommendations tab */}
          {activeTab === 'obs' && (
            <div className="cp-section" style={{ borderBottom: 'none' }}>
              {obsEditing ? (
                <div className="cp-obs-form">
                  <div className="cp-obs-field">
                    <label className="cp-obs-label">Observation</label>
                    <textarea
                      className="cp-obs-textarea"
                      value={draftObs}
                      onChange={e => setDraftObs(e.target.value)}
                      placeholder="Enter observation…"
                    />
                  </div>
                  <div className="cp-obs-field">
                    <label className="cp-obs-label">Recommendation</label>
                    <textarea
                      className="cp-obs-textarea"
                      value={draftRec}
                      onChange={e => setDraftRec(e.target.value)}
                      placeholder="Enter recommendation…"
                    />
                  </div>
                  <div className="cp-obs-actions">
                    <button className="cp-doc-btn" onClick={cancelObsEdit} disabled={obsSaving}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveObs} disabled={obsSaving}>
                      {obsSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (obsText || recText) ? (
                <div className="cp-obs-view">
                  {isAdmin && (
                    <div className="cp-obs-edit-row">
                      <button className="cp-doc-btn" onClick={startObsEdit}>Edit</button>
                    </div>
                  )}
                  <div className="cp-obs-block">
                    <div className="cp-obs-block-title">Observation</div>
                    {obsText
                      ? <div className="cp-obs-content">{obsText}</div>
                      : <div className="cp-obs-content cp-obs-empty">No observation added.</div>
                    }
                  </div>
                  <div className="cp-obs-block">
                    <div className="cp-obs-block-title">Recommendation</div>
                    {recText
                      ? <div className="cp-obs-content">{recText}</div>
                      : <div className="cp-obs-content cp-obs-empty">No recommendation added.</div>
                    }
                  </div>
                </div>
              ) : (
                <div className="cp-docs-empty">
                  <div style={{ marginBottom: 8, color: "var(--slate)" }}><Icons.Clipboard size={26} /></div>
                  <div>No observations or recommendations yet.</div>
                  {isAdmin && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={startObsEdit}
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer (chat only) ── */}
        {activeTab === 'chat' && (
          <div className="cp-footer">
            <div className="cp-input-wrap">
              <textarea
                className="cp-comment-input"
                style={{ paddingRight: 46 }}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment, question, or note…"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
              />
              {/* Send icon inside textarea */}
              <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
                <button
                  onClick={handleSend}
                  disabled={sending || !comment.trim()}
                  title="Send (Ctrl+Enter)"
                  style={{
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: comment.trim() && !sending ? 'var(--green)' : 'var(--border)',
                    border: 'none', borderRadius: 'var(--r-sm)',
                    cursor: comment.trim() && !sending ? 'pointer' : 'default',
                    color: 'white', padding: 0, transition: 'background .15s',
                  }}
                >
                  {sending
                    ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                    : <IconSend />
                  }
                </button>
              </div>
            </div>
            {!isAdmin && (
              <div style={{ paddingTop: 6 }}>
                <button className="cp-help-btn" onClick={handleHelp}>🆘 Request admin help</button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
