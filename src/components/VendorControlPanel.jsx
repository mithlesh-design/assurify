/**
 * components/VendorControlPanel.jsx
 *
 * Side overlay for a single vendor sub-control — mirrors ControlPanel.jsx
 * (the "DPDPA assessment" panel). Manages:
 *   - response status (Compliant / Non-Compliant / In Progress / Not Applicable)
 *     via the existing, working updateVendorAssessment API
 *   - Activity (comments), Documents (upload/download), Observations &
 *     Recommendations — all via api/services/vendorControls.js, whose
 *     endpoints are still blank pending the new backend (see endpoints.js).
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, useDialog } from '../ui';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { can } from '../lib/permissions';
import { updateVendorAssessment } from '../api/services/vendors';
import {
  getVendorControlComments, createVendorControlComment,
  listVendorControlDocuments,
  saveVendorControlObservation,
} from '../api/services/vendorControls';
import { downloadFile } from '../api/services/fileManager';
import { STATUS_DISPLAY, DISPLAY_TO_API, API_TO_DISPLAY, RESP_META } from '../data/vendors';
import { RespBadge } from './VendorUi';

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

/* Activity feed entries come back as { type: 'comment' | 'log', created_at, data }.
   We only surface 'comment' entries here — 'log' entries are system audit lines
   with no dedicated UI yet. Also tolerates a flat (un-wrapped) comment object. */
function normaliseActivity(raw) {
  const d = raw.data ?? raw;
  return {
    id: String(d.id ?? d.comment_id ?? Date.now()),
    user: d.commenter ?? d.commenter_name ?? d.user_name ?? d.username ?? d.user ?? 'User',
    role: String(d.role ?? (d.reviewer_id != null ? 'reviewer' : d.is_reviewer ? 'reviewer' : 'customer')).toLowerCase(),
    at: d.created_at ?? raw.created_at ?? d.timestamp ?? d.at ?? new Date().toISOString(),
    msg: d.comment ?? d.message ?? d.text ?? '',
  };
}

function normaliseDoc(d) {
  return {
    id: String(d.id ?? d.file_id ?? Date.now()),
    name: d.file_name ?? d.name ?? d.filename ?? d.original_name ?? 'Document',
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
function StatusDot({ apiValue }) {
  const display = API_TO_DISPLAY[apiValue] ?? null;
  const color   = display ? RESP_META[display]?.dot : '#94A3B8';
  return (
    <span
      title={display ?? 'Pending'}
      style={{
        display: 'inline-block', flexShrink: 0,
        width: 11, height: 11, borderRadius: '50%',
        background: color, cursor: 'default',
        boxShadow: `0 0 0 3px ${color}30`,
      }}
    />
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

function DocItem({ doc }) {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadFile(doc.id, doc.name);
    } catch (err) {
      toast.error(err?.message ?? 'Failed to download document.');
    } finally { setDownloading(false); }
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
        <button className="cp-doc-btn" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VendorControlPanel
═══════════════════════════════════════════════════════ */
export default function VendorControlPanel({ subControl, onClose }) {
  const { user } = useApp();
  const toast = useToast();
  const perm = can(user);
  const isAdmin = perm.updateControlStatus();

  const [activeTab, setActiveTab] = useState('chat');
  const [response, setResponse]   = useState(subControl.response);

  /* Chat state */
  const [comment, setComment] = useState('');
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
  const [obsText, setObsText] = useState('');
  const [recText, setRecText] = useState('');
  const [draftObs, setDraftObs] = useState('');
  const [draftRec, setDraftRec] = useState('');
  const [obsEditing, setObsEditing] = useState(false);
  const [obsSaving, setObsSaving] = useState(false);

  const bodyRef = useRef(null);
  const statusDropRef = useRef(null);

  /* ── Fetch comments on open ── */
  useEffect(() => {
    let cancelled = false;
    setLoadingCmts(true);
    getVendorControlComments(subControl.assessment_id)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.activities ?? res?.comment ?? res?.results ?? []);
        setApiComments(list.filter(a => (a?.type ?? 'comment') === 'comment').map(normaliseActivity));
      })
      .catch(() => { if (!cancelled) setApiComments([]); })
      .finally(() => { if (!cancelled) setLoadingCmts(false); });
    return () => { cancelled = true; };
  }, [subControl.vendor_control_id]);

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

  const displayActs = useMemo(
    () => [...apiComments].sort((a, b) => new Date(a.at) - new Date(b.at)),
    [apiComments]
  );

  /* Scroll to bottom of chat on new message */
  useEffect(() => {
    if (activeTab === 'chat') {
      const el = bodyRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [displayActs.length, activeTab]);

  /* ── Load documents (lazy) ── */
  const loadDocs = async () => {
    if (docsFetched) return;
    setLoadingDocs(true);
    try {
      const res = await listVendorControlDocuments(subControl.vendor_control_id);
      const files = Array.isArray(res) ? res : (res?.files ?? res?.documents ?? res?.results ?? []);
      setDocs(files.map(normaliseDoc));
    } catch { /* blank endpoint until the new API ships */ }
    finally { setLoadingDocs(false); setDocsFetched(true); }
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
      const res = await createVendorControlComment(subControl.assessment_id, text);
      const raw = res?.data ?? res?.comment ?? res;
      const d = raw?.data ?? raw;
      const newAct = d && (d.id ?? d.comment_id)
        ? normaliseActivity(raw)
        : { id: 'e' + Date.now(), user: user?.name ?? 'User', role: user?.role ?? 'reviewer', at: new Date().toISOString(), msg: text };
      setApiComments(prev => [...prev, newAct]);
      setComment('');
      toast.success('Comment added.');
    } catch (err) {
      toast.error(err?.message ?? 'Failed to add comment.');
    } finally { setSending(false); }
  };

  /* ── Response status select ── */
  const handleStatusSelect = async (displayLabel) => {
    const apiValue = DISPLAY_TO_API[displayLabel];
    if (response === apiValue || statusUpdating) return;
    setStatusDropOpen(false);
    setStatusUpdating(true);
    const prev = response;
    setResponse(apiValue);
    try {
      await updateVendorAssessment(subControl.vendorId, [
        { vendor_control_id: subControl.vendor_control_id, response: apiValue, comments: null },
      ]);
      toast.success(`Status updated to "${displayLabel}".`);
    } catch (err) {
      setResponse(prev);
      toast.error(err?.message ?? 'Failed to update status.');
    } finally { setStatusUpdating(false); }
  };

  /* ── Observations ── */
  const startObsEdit = () => {
    setDraftObs(obsText);
    setDraftRec(recText);
    setObsEditing(true);
  };
  const cancelObsEdit = () => setObsEditing(false);

  const handleSaveObs = async () => {
    setObsSaving(true);
    try {
      await saveVendorControlObservation(subControl.vendor_control_id, draftObs, draftRec);
      setObsText(draftObs);
      setRecText(draftRec);
      setObsEditing(false);
      toast.success('Observations saved.');
    } catch (err) {
      toast.error(err?.message ?? 'Failed to save observations.');
    } finally { setObsSaving(false); }
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
          <div className="cp-obl-tag">{subControl.vendorName} · {subControl.categoryLabel}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 44, marginBottom: 8 }}>
            <StatusDot apiValue={response} />
            <h3 id="cp-panel-title" className="cp-ctrl-name" style={{ margin: 0, paddingRight: 0 }}>{subControl.title}</h3>
          </div>
          <div className="cp-ctrl-meta">
            {isAdmin ? (
              <div style={{ position: 'relative' }} ref={statusDropRef}>
                <button
                  onClick={() => !statusUpdating && setStatusDropOpen(v => !v)}
                  disabled={statusUpdating}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: 0, border: 'none', background: 'transparent', cursor: statusUpdating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  <RespBadge apiValue={response} />
                  {!statusUpdating && (
                    <span style={{ fontSize: 12, color: 'var(--slate)', transform: statusDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', display: 'inline-block' }}>▾</span>
                  )}
                </button>

                {statusDropOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 190, overflow: 'hidden',
                  }}>
                    {STATUS_DISPLAY.map(s => {
                      const active = API_TO_DISPLAY[response] === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusSelect(s)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', textAlign: 'left',
                            padding: '9px 14px', fontSize: 13,
                            fontFamily: 'inherit', border: 'none',
                            background: active ? 'var(--green-soft)' : 'transparent',
                            color: 'var(--black)', cursor: 'pointer',
                            fontWeight: active ? 600 : 400,
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--green-soft)' : 'transparent'; }}
                        >
                          {active && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓</span>}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <RespBadge apiValue={response} />
            )}
            <span className="cp-ctrl-ref">{subControl.code}</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cp-tabs">
          <button className={`cp-tab-btn${activeTab === 'chat' ? ' active' : ''}`} onClick={() => handleTabChange('chat')}>
            <IconChat /> Activity
          </button>
          <button className={`cp-tab-btn${activeTab === 'docs' ? ' active' : ''}`} onClick={() => handleTabChange('docs')}>
            <IconFiles /> Documents
            {docs.length > 0 && <span className="cp-tab-count">{docs.length}</span>}
          </button>
          {/* Observations tab disabled for now — endpoint pending.
          <button className={`cp-tab-btn${activeTab === 'obs' ? ' active' : ''}`} onClick={() => handleTabChange('obs')}>
            <IconObservation /> Observations
          </button>
          */}
        </div>

        {/* ── Body ── */}
        <div className="cp-body" ref={bodyRef} tabIndex={0} aria-label="Control details">

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              <div className="cp-section" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--white)' }}>
                <div className="cp-section-title">Requirement</div>
                <div className="cp-req-box">{subControl.description}</div>
              </div>

              <div className="cp-section" style={{ borderBottom: 'none' }}>
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
                    </div>
                  )
                }
              </div>
            </>
          )}

          {/* Documents tab */}
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
                      <div>No documents uploaded yet.</div>
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

          {/* Observations & Recommendations tab disabled for now — endpoint pending.
          {activeTab === 'obs' && (
            <div className="cp-section" style={{ borderBottom: 'none' }}>
              {obsEditing ? (
                <div className="cp-obs-form">
                  <div className="cp-obs-field">
                    <label className="cp-obs-label">Observation</label>
                    <textarea className="cp-obs-textarea" value={draftObs} onChange={e => setDraftObs(e.target.value)} placeholder="Enter observation…" />
                  </div>
                  <div className="cp-obs-field">
                    <label className="cp-obs-label">Recommendation</label>
                    <textarea className="cp-obs-textarea" value={draftRec} onChange={e => setDraftRec(e.target.value)} placeholder="Enter recommendation…" />
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
                    {obsText ? <div className="cp-obs-content">{obsText}</div> : <div className="cp-obs-content cp-obs-empty">No observation added.</div>}
                  </div>
                  <div className="cp-obs-block">
                    <div className="cp-obs-block-title">Recommendation</div>
                    {recText ? <div className="cp-obs-content">{recText}</div> : <div className="cp-obs-content cp-obs-empty">No recommendation added.</div>}
                  </div>
                </div>
              ) : (
                <div className="cp-docs-empty">
                  <div style={{ marginBottom: 8, color: "var(--slate)" }}><Icons.Clipboard size={26} /></div>
                  <div>No observations or recommendations yet.</div>
                  {isAdmin && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={startObsEdit}>
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          */}

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
          </div>
        )}

      </div>
    </>
  );
}
