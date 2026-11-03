/**
 * components/VendorUi.jsx — shared vendor (TPRM) JSX components.
 *
 * Used by pages/Vendors.jsx, pages/VendorDetail.jsx and
 * components/VendorControlPanel.jsx.
 */

import { useState, useEffect, useRef } from 'react';
import { Icons } from '../ui';
import { API_TO_DISPLAY, RESP_META, DPA_META } from '../data/vendors';

/* ── Category icons ───────────────────────────────────── */
export const CAT_ICONS = {
  datacollection:         <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="4" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="4" y1="7.5" x2="11" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="4" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  datastorage:            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="3.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 3.5V7.5c0 1.1 2.24 2 5 2s5-.9 5-2V3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 7.5v4c0 1.1 2.24 2 5 2s5-.9 5-2v-4" stroke="currentColor" strokeWidth="1.3"/></svg>,
  data_usage:             <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="7.5" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="4.5" width="3" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><rect x="10.5" y="1.5" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  thirdpartysubprocessor: <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="2.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="7.5" y1="5.5" x2="2.5" y2="10" stroke="currentColor" strokeWidth="1.3"/><line x1="7.5" y1="5.5" x2="12.5" y2="10" stroke="currentColor" strokeWidth="1.3"/></svg>,
  security:               <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L2 3.5v4c0 2.8 2.4 5.4 5.5 6 3.1-.6 5.5-3.2 5.5-6v-4L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 7.5l1.8 1.8L10.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  incidentbreach:         <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L1.5 13h12L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><line x1="7.5" y1="5.5" x2="7.5" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="10.5" r="0.7" fill="currentColor"/></svg>,
  dataprincipalrights:    <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  governance:             <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="7" width="12" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 7L7.5 2l6 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="6" y="9.5" width="3" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  operational:            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><line x1="7.5" y1="2" x2="7.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="7.5" y1="11" x2="7.5" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="2" y1="7.5" x2="4" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="11" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

/* ── Inline dropdown (DPA / response status) ─────────── */
export function InlineDropdown({ options, current, onSelect, renderBadge, saving }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const btnRef  = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleToggle(e) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={handleToggle}
        style={{ background: 'none', border: 'none', padding: 0, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}
        disabled={saving}>
        {renderBadge(current)}
      </button>
      {open && (
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, right: pos.right,
          background: 'var(--white)', border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-md)', boxShadow: '0 12px 36px rgba(0,0,0,0.16)',
          minWidth: 178, zIndex: 9999, overflow: 'hidden',
        }}>
          {options.map((opt, i) => (
            <button key={opt}
              onClick={e => { e.stopPropagation(); setOpen(false); onSelect(opt); }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                background: opt.toLowerCase() === current?.toLowerCase() ? 'var(--surface)' : 'transparent',
                border: 'none', borderBottom: i < options.length - 1 ? '1px solid var(--border-soft)' : 'none',
                cursor: 'pointer', fontSize: 13,
                fontWeight: opt.toLowerCase() === current?.toLowerCase() ? 700 : 500,
                color: 'var(--ink)', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (opt.toLowerCase() !== current?.toLowerCase()) e.currentTarget.style.background = 'var(--surface)'; }}
              onMouseLeave={e => { if (opt.toLowerCase() !== current?.toLowerCase()) e.currentTarget.style.background = 'transparent'; }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DPA status badge ─────────────────────────────────── */
export function DpaBadge({ status, chevron }) {
  const meta = DPA_META[status?.toLowerCase()] ?? DPA_META.missing;
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--r-pill)',
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.accent, flexShrink: 0 }} />
      DPA: {meta.label}
      {chevron && <Icons.Chevron size={10} style={{ opacity: 0.5 }} />}
    </span>
  );
}

/* ── Response compliance badge ────────────────────────── */
export function RespBadge({ apiValue, chevron }) {
  const display = API_TO_DISPLAY[apiValue] ?? null;
  const meta    = display ? RESP_META[display] : null;
  if (!meta) {
    return (
      <span style={{
        fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
        background: 'var(--surface)', color: 'var(--slate)', border: '1px solid var(--border)',
        flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        Pending {chevron && <Icons.Chevron size={9} style={{ opacity: 0.5 }} />}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {display} {chevron && <Icons.Chevron size={9} style={{ opacity: 0.5 }} />}
    </span>
  );
}
