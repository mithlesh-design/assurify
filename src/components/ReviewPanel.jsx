/**
 * components/ReviewPanel.jsx
 *
 * Presentational building blocks shared by the review side panels
 * (ControlPanel for assessment controls, VendorControlPanel for vendor
 * sub-controls). Business logic stays in those panels; these parts only
 * render and report user intent.
 */

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, EmptyState, Field, Icons, LoadingState } from '../ui';
import { useToast } from '../context/ToastContext';
import { downloadFile } from '../api/services/fileManager';
import { dayKey, dayLabel, formatDate, formatTime } from '../lib/format';

/* ── Header ───────────────────────────────────────────────
   eyebrow (context) · title · status control + reference chip · close */
export function PanelHeader({ titleId, eyebrow, code, title, status, reference, onClose }) {
  return (
    <header className="cp-header">
      <div className="cp-header-top">
        <span className="cp-eyebrow">
          <span className="cp-eyebrow-text">{eyebrow}</span>
          {code && <span className="cp-eyebrow-code">{code}</span>}
        </span>
        <button type="button" className="cp-close" onClick={onClose} aria-label="Close panel">
          <Icons.X size={16} />
        </button>
      </div>
      <h2 id={titleId} className="cp-title">{title}</h2>
      {(status || reference) && (
        <div className="cp-header-meta">
          {status}
          {reference && <span className="cp-ref-chip" title="Reference">{reference}</span>}
        </div>
      )}
    </header>
  );
}

/* Labeled status pop-up (reviewers) or read-only badge (customers) */
export function StatusControl({ children, label = 'Status' }) {
  return (
    <span className="cp-status">
      <span className="cp-status-label">{label}</span>
      {children}
    </span>
  );
}

/* ── Segmented control (tabs) ─────────────────────────────
   tabs: [{ id, label, icon, count }] — full tab semantics and arrow keys */
export function SegmentedTabs({ tabs, value, onChange, label, panelId }) {
  const refs = useRef({});
  const onKeyDown = (e) => {
    const i = tabs.findIndex(t => t.id === value);
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    if (e.key === 'Home') next = tabs[0];
    if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      onChange(next.id);
      refs.current[next.id]?.focus();
    }
  };
  return (
    <div className="cp-tabs">
      <div className="cp-segmented" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map(t => {
          const selected = t.id === value;
          const I = t.icon;
          return (
            <button
              key={t.id}
              ref={el => { refs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={`cp-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={`cp-segment${selected ? ' is-selected' : ''}`}
              onClick={() => onChange(t.id)}
            >
              {I && <I size={15} />}
              <span>{t.label}</span>
              {t.count > 0 && <span className="cp-segment-count">{t.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Section with a quiet sentence-case heading ─────────── */
export function PanelSection({ title, action, children, className = '' }) {
  return (
    <section className={`cp-section ${className}`.trim()}>
      {(title || action) && (
        <div className="cp-section-head">
          {title && <h3 className="cp-section-title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Activity feed ───────────────────────────────────────── */
const ROLE_WORD = { admin: 'Reviewer', reviewer: 'Reviewer', customer: 'Customer', user: 'Customer', system: 'System' };
const initialsOf = (name = '') => name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/* Status changes may arrive as dedicated events or as plain comments */
const STATUS_TEXT = [
  /^Status changed from "(.+)" to "(.+)"(?: by .+)?\.?$/i,
  /^Status:\s*(.+?)\s*→\s*(.+)$/i,
];
function parseStatusChange(msg = '') {
  for (const re of STATUS_TEXT) {
    const m = msg.trim().match(re);
    if (m) return { from: m[1], to: m[2] };
  }
  return null;
}

function eventKind(act) {
  if (parseStatusChange(act.msg)) return 'status';
  if (act.type && act.type !== 'comment') return act.type;
  if (act.role === 'system' || act.user === 'System') return 'system';
  return null;
}

const EVENT_ICON = { status: Icons.Refresh, upload: Icons.Upload, request: Icons.Help, system: Icons.Info };

function EventItem({ act, kind }) {
  const I = EVENT_ICON[kind] ?? Icons.Info;
  const change = parseStatusChange(act.msg);
  const lowerFirst = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  let text;
  if (change) {
    text = <><strong>{act.user}</strong> changed status <span className="cp-event-change">{change.from}<Icons.ArrowRight size={13} aria-label="to" />{change.to}</span></>;
  } else if (kind === 'system') {
    text = act.msg;
  } else {
    text = <><strong>{act.user}</strong> {lowerFirst(act.msg)}</>;
  }
  return (
    <li className={`cp-event cp-event-${kind}`}>
      <span className="cp-event-icon" aria-hidden="true"><I size={13} /></span>
      <span className="cp-event-text">{text}</span>
      <time className="cp-event-time" dateTime={act.at}>{formatTime(act.at)}</time>
    </li>
  );
}

function MessageItem({ act, isOwn }) {
  const roleKey = String(act.role || 'customer').toLowerCase();
  const tone = roleKey === 'admin' || roleKey === 'reviewer' ? 'reviewer' : 'customer';
  return (
    <li className={`cp-message${isOwn ? ' is-own' : ''}`}>
      <span className={`cp-avatar tone-${tone}`} aria-hidden="true">{initialsOf(act.user)}</span>
      <div className="cp-message-body">
        <div className="cp-message-meta">
          <span className="cp-message-name">{isOwn ? 'You' : act.user}</span>
          <span className="cp-message-role">{ROLE_WORD[roleKey] ?? 'Customer'}</span>
          <time className="cp-message-time" dateTime={act.at}>{formatTime(act.at)}</time>
        </div>
        <div className="cp-bubble">{act.msg}</div>
      </div>
    </li>
  );
}

/* The same status change can arrive twice (local event + persisted comment):
   keep one when user, from → to match within two minutes */
function dedupeStatusChanges(acts) {
  const seen = [];
  return acts.filter(act => {
    const change = parseStatusChange(act.msg);
    if (!change) return true;
    const t = new Date(act.at).getTime();
    const dup = seen.some(s => s.user === act.user && s.from === change.from && s.to === change.to && Math.abs(s.t - t) < 120000);
    if (!dup) seen.push({ user: act.user, ...change, t });
    return !dup;
  });
}

export function ActivityFeed({ acts: rawActs, loading, currentUserName, emptyTitle, emptyDescription }) {
  const acts = dedupeStatusChanges(rawActs);
  if (loading) return <LoadingState compact label="Loading activity…" />;
  if (!acts.length) {
    return (
      <EmptyState
        compact
        icon={<Icons.Message size={20} />}
        title={emptyTitle ?? 'No discussion yet'}
        description={emptyDescription ?? 'Ask a question or leave a note below — everyone on this control will see it here.'}
      />
    );
  }
  let lastDay = null;
  return (
    <ol className="cp-feed" aria-label="Activity and discussion">
      {acts.map(act => {
        const key = dayKey(act.at);
        const showDay = key !== lastDay;
        lastDay = key;
        const kind = eventKind(act);
        return (
          <Fragment key={act.id}>
            {showDay && (
              <li className="cp-day" aria-hidden={false}>
                <span>{dayLabel(act.at)}</span>
              </li>
            )}
            {kind
              ? <EventItem act={act} kind={kind} />
              : <MessageItem act={act} isOwn={!!currentUserName && act.user === currentUserName} />}
          </Fragment>
        );
      })}
    </ol>
  );
}

/* ── Composer ──────────────────────────────────────────────
   Auto-growing field with the send button inside, bottom-aligned.
   ⌘/Ctrl + Enter sends; Enter adds a new line. */
const IS_MAC = typeof navigator !== 'undefined'
  && /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
const MAX_HEIGHT = 152;

export function Composer({ value, onChange, onSend, sending, placeholder = 'Write a message…', secondary }) {
  const ref = useRef(null);
  const canSend = !!value.trim() && !sending;

  /* Grow with content up to ~6 lines, then scroll */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  const send = async () => {
    if (!canSend) return;
    await onSend();
    ref.current?.focus();
  };

  return (
    <div className="cp-footer">
      <div className={`cp-composer${sending ? ' is-sending' : ''}`}>
        <label htmlFor="cp-composer-input" className="sr-only">Message</label>
        <textarea
          id="cp-composer-input"
          ref={ref}
          rows={1}
          className="cp-composer-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby="cp-composer-hint"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
          }}
        />
        <button
          type="button"
          className="cp-send"
          onClick={send}
          disabled={!canSend}
          aria-label={sending ? 'Sending message' : 'Send message'}
          title={IS_MAC ? 'Send (⌘ Enter)' : 'Send (Ctrl + Enter)'}
        >
          {sending ? <span className="btn-spinner-inline" aria-hidden="true" /> : <Icons.ArrowUp size={18} stroke={2.2} />}
        </button>
      </div>
      <div className="cp-footer-row">
        <span className="cp-hint" id="cp-composer-hint">
          <kbd>{IS_MAC ? '⌘' : 'Ctrl'}</kbd><kbd>Enter</kbd> to send
        </span>
        {secondary}
      </div>
    </div>
  );
}

/* ── Documents ───────────────────────────────────────────── */
function DocumentRow({ doc }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try { await downloadFile(doc.id, doc.name); }
    catch (err) { toast.error(err?.message ?? 'Could not download the document.'); }
    finally { setDownloading(false); }
  };
  return (
    <li className="cp-doc">
      <span className="cp-doc-icon" aria-hidden="true"><Icons.File size={17} /></span>
      <div className="cp-doc-info">
        <div className="cp-doc-name" title={doc.name}>{doc.name}</div>
        <div className="cp-doc-meta">{doc.uploadedBy ? `${doc.uploadedBy} · ` : ''}{formatDate(doc.uploadedAt)}</div>
      </div>
      <Button size="sm" icon={<Icons.Download size={14} />} onClick={download} loading={downloading} aria-label={`Download ${doc.name}`}>
        Download
      </Button>
    </li>
  );
}

export function DocumentList({ docs, loading, emptyDescription }) {
  if (loading) return <LoadingState compact label="Loading documents…" />;
  if (!docs.length) {
    return (
      <EmptyState
        compact
        icon={<Icons.Folder size={20} />}
        title="No documents yet"
        description={emptyDescription ?? 'Evidence files uploaded for this control will appear here.'}
      />
    );
  }
  return <ul className="cp-doc-list">{docs.map(doc => <DocumentRow key={doc.id} doc={doc} />)}</ul>;
}

/* ── Observations & recommendations ─────────────────────── */
export function ObservationsSection({
  obsText, recText, editing, draftObs, draftRec, onDraftObs, onDraftRec,
  onEdit, onCancel, onSave, saving, canEdit,
}) {
  const firstRef = useRef(null);
  useEffect(() => { if (editing) firstRef.current?.focus(); }, [editing]);

  if (editing) {
    return (
      <PanelSection title={obsText || recText ? 'Edit observations' : 'Add observations'}>
        <div className="form-stack">
          <Field label="Observation" hint="What you found when reviewing the evidence.">
            <textarea ref={firstRef} className="textarea" rows={4} value={draftObs} onChange={e => onDraftObs(e.target.value)} placeholder="e.g. The notice lists purposes but not retention periods." />
          </Field>
          <Field label="Recommendation" hint="What the organization should do next.">
            <textarea className="textarea" rows={4} value={draftRec} onChange={e => onDraftRec(e.target.value)} placeholder="e.g. Add a retention period for each data category." />
          </Field>
          <div className="cp-form-actions">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={onSave} loading={saving}>Save</Button>
          </div>
        </div>
      </PanelSection>
    );
  }

  if (!obsText && !recText) {
    return (
      <EmptyState
        compact
        icon={<Icons.Clipboard size={20} />}
        title="No observations yet"
        description={canEdit ? 'Record what you found and what the organization should change.' : 'The reviewer’s observations and recommendations will appear here.'}
        action={canEdit ? <Button size="sm" variant="primary" icon={<Icons.Plus size={14} />} onClick={onEdit}>Add observation</Button> : null}
      />
    );
  }

  return (
    <PanelSection
      title="Observations & recommendations"
      action={canEdit ? <Button size="sm" variant="ghost" icon={<Icons.Edit size={14} />} onClick={onEdit}>Edit</Button> : null}
    >
      <div className="cp-obs">
        <div className="cp-obs-card">
          <div className="cp-obs-label">Observation</div>
          <p className={obsText ? '' : 'is-empty'}>{obsText || 'No observation added.'}</p>
        </div>
        <div className="cp-obs-card">
          <div className="cp-obs-label">Recommendation</div>
          <p className={recText ? '' : 'is-empty'}>{recText || 'No recommendation added.'}</p>
        </div>
      </div>
    </PanelSection>
  );
}
