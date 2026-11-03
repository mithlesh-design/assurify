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
import {
  ActivityFeed, Composer, DocumentList, PanelHeader, PanelSection, SegmentedTabs, StatusControl,
} from './ReviewPanel';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { can } from '../lib/permissions';
import { updateVendorAssessment } from '../api/services/vendors';
import {
  getVendorControlComments, createVendorControlComment,
  listVendorControlDocuments,
  saveVendorControlObservation,
} from '../api/services/vendorControls';
import { STATUS_DISPLAY, DISPLAY_TO_API, API_TO_DISPLAY } from '../data/vendors';
import { InlineDropdown, RespBadge } from './VendorUi';

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

  /* Status update state */
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

  const tabs = [
    { id: 'chat', label: 'Activity', icon: Icons.Message, count: displayActs.length },
    { id: 'docs', label: 'Documents', icon: Icons.File, count: docs.length },
    /* Observations tab hidden until its endpoint ships (see vendorControls.js) */
  ];

  return (
    <>
      <div className="cp-backdrop" onClick={onClose} />
      <div className="cp-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cp-panel-title" tabIndex={-1}>

        <PanelHeader
          titleId="cp-panel-title"
          eyebrow={[subControl.vendorName, subControl.categoryLabel].filter(Boolean).join(' · ') || 'Vendor control'}
          title={subControl.title}
          reference={subControl.code}
          onClose={onClose}
          status={(
            <StatusControl label="Response">
              {isAdmin ? (
                <InlineDropdown
                  label="Change response"
                  options={STATUS_DISPLAY}
                  current={API_TO_DISPLAY[response]}
                  saving={statusUpdating}
                  onSelect={handleStatusSelect}
                  renderBadge={() => <RespBadge apiValue={response} chevron />}
                />
              ) : (
                <RespBadge apiValue={response} />
              )}
            </StatusControl>
          )}
        />

        <SegmentedTabs tabs={tabs} value={activeTab} onChange={handleTabChange} label="Control sections" panelId="cp-tabpanel" />

        <div className="cp-body" ref={bodyRef} tabIndex={0} id="cp-tabpanel" role="tabpanel" aria-labelledby={`cp-tab-${activeTab}`}>
          {activeTab === 'chat' && (
            <>
              {subControl.description && (
                <PanelSection title="Requirement">
                  <div className="cp-req-box">{subControl.description}</div>
                </PanelSection>
              )}
              <PanelSection title="Activity & discussion">
                <ActivityFeed
                  acts={displayActs}
                  loading={loadingCmts}
                  currentUserName={user?.name}
                  emptyDescription="Ask the vendor a question or leave a note for your team — the conversation stays with this control."
                />
              </PanelSection>
            </>
          )}

          {activeTab === 'docs' && (
            <PanelSection title={docs.length ? `${docs.length} document${docs.length !== 1 ? 's' : ''}` : null}>
              <DocumentList docs={docs} loading={loadingDocs} emptyDescription="Documents shared for this vendor control will appear here." />
            </PanelSection>
          )}
        </div>

        {activeTab === 'chat' && (
          <Composer
            value={comment}
            onChange={setComment}
            onSend={handleSend}
            sending={sending}
            placeholder="Add a comment, question, or note…"
          />
        )}
      </div>
    </>
  );
}
