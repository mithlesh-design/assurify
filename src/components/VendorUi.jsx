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

/* ── Inline dropdown (DPA / response status) ───────────
   Badge-styled trigger with a keyboard-accessible menu. The menu is fixed-
   positioned so table containers never clip it, and flips up near the bottom. */
export function InlineDropdown({ options, current, onSelect, renderBadge, saving, label = 'Change status' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState(null);
  const menuRef = useRef(null);
  const btnRef  = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const menuH = menuRef.current?.offsetHeight || options.length * 41 + 12;
      const below = r.bottom + 6 + menuH <= window.innerHeight - 8;
      setPos({
        top: below ? r.bottom + 6 : Math.max(8, r.top - 6 - menuH),
        left: Math.min(Math.max(8, r.left), window.innerWidth - 208),
      });
    };
    place();
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); btnRef.current?.focus(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll('[role="menuitemradio"]') ?? [])];
        const i = items.indexOf(document.activeElement);
        items[(e.key === 'ArrowDown' ? i + 1 : i - 1 + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    requestAnimationFrame(() => menuRef.current?.querySelector('[aria-checked="true"], [role="menuitemradio"]')?.focus());
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, options.length]);

  return (
    <span className="inline-dropdown">
      <button
        ref={btnRef}
        type="button"
        className="inline-dropdown-trigger"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        disabled={saving}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${current ?? 'not set'}`}
        aria-busy={saving || undefined}
      >
        {renderBadge(current)}
      </button>
      {open && (
        <div ref={menuRef} role="menu" className="row-actions-menu" style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }} onClick={e => e.stopPropagation()}>
          {options.map(opt => {
            const selected = opt.toLowerCase() === current?.toLowerCase();
            return (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`row-actions-item${selected ? ' is-selected' : ''}`}
                onClick={() => { setOpen(false); if (!selected) onSelect(opt); }}
              >
                <span className="row-actions-icon">{selected ? <Icons.Check size={14} /> : <span style={{ width: 14 }} />}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

/* ── DPA status badge ─────────────────────────────────── */
export function DpaBadge({ status, chevron }) {
  const meta = DPA_META[status?.toLowerCase()] ?? DPA_META.missing;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--r-pill)',
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.accent, flexShrink: 0 }} />
      DPA: {meta.label}
      {chevron && <Icons.ChevronDown size={12} style={{ opacity: 0.6 }} />}
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
        fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
        background: 'var(--surface)', color: 'var(--slate)', border: '1px solid var(--border)',
        flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        Pending {chevron && <Icons.ChevronDown size={12} style={{ opacity: 0.6 }} />}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {display} {chevron && <Icons.ChevronDown size={12} style={{ opacity: 0.6 }} />}
    </span>
  );
}
