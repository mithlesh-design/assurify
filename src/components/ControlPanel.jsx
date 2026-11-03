import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Icons, useDialog } from '../ui';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { OBL_META, STATUS_META, statusClass, statusLabel } from '../data/controls';
import { GAPP_PRINCIPLE_LABELS } from '../config/obligations';
import { can } from '../lib/permissions';
import { createComment, getComments } from '../api/services/comments';
import { reviewControl, saveObservationRecommendation } from '../api/services/controls';
import { listDocuments } from '../api/services/fileManager';
import { InlineDropdown } from './VendorUi';
import {
  ActivityFeed, Composer, DocumentList, ObservationsSection, PanelHeader, PanelSection, SegmentedTabs, StatusControl,
} from './ReviewPanel';

/* ── Helpers ───────────────────────────────────────────── */
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
  const [obsText, setObsText] = useState(ctrl.remarks ?? '');
  const [recText, setRecText] = useState(ctrl.recommendation ?? '');
  const [draftObs, setDraftObs] = useState('');
  const [draftRec, setDraftRec] = useState('');
  const [obsEditing, setObsEditing] = useState(false);
  const [obsSaving, setObsSaving] = useState(false);

  const bodyRef = useRef(null);

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
    setStatusUpdating(true);
    const oldLabel = statusLabel(ctrl.status);
    const newLabel = statusLabel(newStatus);
    const statusMsg = `Status changed from "${oldLabel}" to "${newLabel}" by ${user?.name ?? 'Reviewer'}.`;
    try {
      await reviewControl(ctrl.id, newStatus, tenant?.url);
      updateStatus(ctrl.id, newStatus);
      /* Persist as a comment so customer portal activity feed shows it.
         updateStatus() already adds the status event to this control's feed. */
      try { await createComment(ctrl.id, statusMsg); } catch { }
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

  const commentCount = displayActs.filter(a => a.type === 'comment' || !a.type).length;
  const statusLabelText = statusLabel(ctrl.status);
  const tabs = [
    { id: 'chat', label: 'Activity', icon: Icons.Message, count: commentCount },
    { id: 'docs', label: 'Documents', icon: Icons.File, count: docs.length },
    { id: 'obs', label: 'Observations', icon: Icons.Clipboard },
  ];

  return (
    <>
      <div className="cp-backdrop" onClick={onClose} />
      <div className="cp-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="cp-panel-title" tabIndex={-1}>

        <PanelHeader
          titleId="cp-panel-title"
          eyebrow={ctrl.oblLabel || oblName || 'Control'}
          code={ctrl.oblId || (/\d/.test(ctrl.obl ?? '') ? ctrl.obl : null)}
          title={ctrl.name}
          reference={ctrl.req}
          onClose={onClose}
          status={(
            <StatusControl>
              {isAdmin ? (
                <InlineDropdown
                  label="Change status"
                  options={STATUS_META.map(s => s.label)}
                  current={statusLabelText}
                  saving={statusUpdating}
                  onSelect={(label) => {
                    const next = STATUS_META.find(s => s.label === label)?.value;
                    if (next) handleStatusSelect(next);
                  }}
                  renderBadge={() => (
                    <span className={`status-badge status-badge-button ${statusClass(ctrl.status)}`}>
                      {statusUpdating ? 'Updating…' : statusLabelText}
                      <Icons.ChevronDown size={13} />
                    </span>
                  )}
                />
              ) : (
                <span className={`status-badge ${statusClass(ctrl.status)}`}>{statusLabelText}</span>
              )}
            </StatusControl>
          )}
        />

        <SegmentedTabs tabs={tabs} value={activeTab} onChange={handleTabChange} label="Control sections" panelId="cp-tabpanel" />

        <div className="cp-body" ref={bodyRef} tabIndex={0} id="cp-tabpanel" role="tabpanel" aria-labelledby={`cp-tab-${activeTab}`}>

          {activeTab === 'chat' && (
            <>
              {ctrl.desc && (
                <PanelSection title={staticMode ? 'Assessment criteria' : 'Requirement'}>
                  <div className="cp-req-box">{ctrl.desc}</div>
                </PanelSection>
              )}
              <PanelSection title="Activity & discussion">
                <ActivityFeed acts={displayActs} loading={loadingCmts} currentUserName={user?.name} />
              </PanelSection>
            </>
          )}

          {activeTab === 'docs' && (
            <PanelSection title={docs.length ? `${docs.length} document${docs.length !== 1 ? 's' : ''}` : null}>
              <DocumentList docs={docs} loading={loadingDocs} emptyDescription="Evidence files uploaded by the organization for this control will appear here." />
            </PanelSection>
          )}

          {activeTab === 'obs' && (
            <ObservationsSection
              obsText={obsText}
              recText={recText}
              editing={obsEditing}
              draftObs={draftObs}
              draftRec={draftRec}
              onDraftObs={setDraftObs}
              onDraftRec={setDraftRec}
              onEdit={startObsEdit}
              onCancel={cancelObsEdit}
              onSave={handleSaveObs}
              saving={obsSaving}
              canEdit={isAdmin}
            />
          )}
        </div>

        {activeTab === 'chat' && (
          <Composer
            value={comment}
            onChange={setComment}
            onSend={handleSend}
            sending={sending}
            placeholder="Add a comment, question, or note…"
            secondary={!isAdmin ? (
              <Button size="sm" variant="ghost" icon={<Icons.Help size={15} />} onClick={handleHelp}>
                Request reviewer help
              </Button>
            ) : null}
          />
        )}

      </div>
    </>
  );
}
