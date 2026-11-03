/**
 * pages/VendorDetail.jsx
 *
 * Dedicated page for a single vendor — opened from the vendor list
 * (pages/Vendors.jsx) when a vendor row is clicked.
 *
 *   - Header: vendor info, overall progress ring, DPA status dropdown
 *   - Below: vendor controls (grouped by category) with progress;
 *     clicking a control expands a dropdown of its sub-controls
 *   - Clicking a sub-control opens VendorControlPanel (side overlay)
 *     to manage comments, document upload and observations/recommendations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Icons, Progress } from '../ui';
import { fetchVendorAssessment, updateVendorDpaStatus } from '../api/services/vendors';
import { brandColor, riskTone, riskTextColor, DPA_OPTIONS, CATEGORY_LABELS } from '../data/vendors';
import { CAT_ICONS, InlineDropdown, DpaBadge, RespBadge } from '../components/VendorUi';
import VendorControlPanel from '../components/VendorControlPanel';

/* ── Score ring (custom — ui.jsx's ScoreRing label is hardcoded) ── */
function VendorScoreRing({ pct, size = 92, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safePct = Math.max(0, Math.min(100, pct));
  const offset = c - (safePct / 100) * c;
  const color = safePct < 40 ? '#EF4444' : safePct < 70 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: riskTextColor(safePct) }}>{Math.round(safePct)}%</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>score</span>
      </div>
    </div>
  );
}

function respDotColor(apiValue) {
  const colors = { Yes: '#10B981', No: '#EF4444', Partial: '#F59E0B', 'Not Applicable': '#94A3B8' };
  return colors[apiValue] ?? '#CBD5E1';
}

/* ── Control accordion (category) — expands to list sub-controls ── */
function ControlAccordion({ cat, vendorId, vendorName, onSubControlSelect }) {
  const [open, setOpen] = useState(false);
  const col = brandColor(cat.label);
  const pctColor = riskTextColor(cat.pct);

  return (
    <div style={{
      background: 'var(--white)', border: `1px solid ${open ? 'var(--green-mid)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      boxShadow: open ? '0 0 0 3px var(--green-soft), var(--shadow-sm)' : 'var(--shadow-sm)',
      transition: 'border-color 140ms, box-shadow 140ms',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: col.bg, color: col.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {CAT_ICONS[cat.key] ?? CAT_ICONS.operational}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{cat.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px', marginTop: 6 }}>
            <div style={{ width: 140, maxWidth: '100%' }}><Progress value={cat.pct} tone={riskTone(cat.pct)} thickness="thin" /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: pctColor }}>{cat.pct}%</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{cat.answered}/{cat.total} sub-controls</span>
          </div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: open ? 'var(--green-soft)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .12s' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={open ? 'var(--green)' : 'var(--slate)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 16px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cat.items.map(item => (
            <button
              key={item.assessment_id}
              className="ctrl-list-item"
              onClick={() => onSubControlSelect({ ...item, category: cat.key, categoryLabel: cat.label, vendorId, vendorName })}
            >
              <div className="status-bar" style={{ background: respDotColor(item.response) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ctrl-item-name">{item.title}</div>
                <div className="ctrl-item-desc">{item.code}</div>
              </div>
              <div className="ctrl-item-meta">
                <RespBadge apiValue={item.response} />
                <span className="ctrl-arrow"><Icons.Chevron size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VendorDetail page
═══════════════════════════════════════════════════════ */
function VendorDetail({ vendor, onBack, onAction }) {
  const [assessment, setAssessment]         = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [dpaStatus, setDpaStatus]           = useState(vendor.dpaStatus);
  const [savingDpa, setSavingDpa]           = useState(false);
  const [selectedSubControl, setSelectedSubControl] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchVendorAssessment(vendor.id)
      .then(data => { setAssessment(data); setError(null); })
      .catch(err => setError(err.message ?? 'Failed to load vendor assessment'))
      .finally(() => setLoading(false));
  }, [vendor.id]);

  useEffect(() => { load(); }, [load]);

  async function handleDpaSelect(newLabel) {
    const lower = newLabel.toLowerCase();
    const prev = dpaStatus;
    setDpaStatus(lower);
    setSavingDpa(true);
    try {
      await updateVendorDpaStatus(vendor.id, newLabel);
      onAction?.(`DPA status updated to "${newLabel}"`);
    } catch {
      setDpaStatus(prev);
    } finally {
      setSavingDpa(false);
    }
  }

  const categories = useMemo(() => {
    if (!assessment?.vendor_assessment) return [];
    const grouped = {};
    assessment.vendor_assessment.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = { total: 0, answered: 0, items: [] };
      grouped[item.category].total++;
      if (item.response) grouped[item.category].answered++;
      grouped[item.category].items.push(item);
    });
    return Object.entries(grouped).map(([key, val]) => ({
      key, label: CATEGORY_LABELS[key] ?? key.replace(/_/g, ' '),
      total: val.total, answered: val.answered, items: val.items,
      pct: val.total > 0 ? Math.round((val.answered / val.total) * 100) : 0,
    }));
  }, [assessment]);

  const overallPct      = Math.round(assessment?.compliance_percentage ?? 0);
  const overallAnswered = assessment?.total_answered ?? 0;
  const overallTotal    = assessment?.total_count ?? 0;
  const avatarCol = brandColor(vendor.name);
  const catCol    = brandColor(vendor.category);

  function handlePanelClose() {
    setSelectedSubControl(null);
    load();
  }

  return (
    <div className="page">
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 18, fontFamily: 'inherit' }}
      >
        <Icons.ChevronLeft size={14} /> Back to vendors
      </button>

      {/* Vendor header card */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)', padding: '22px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 320px', minWidth: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: avatarCol.bg,
            border: `1.5px solid ${avatarCol.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: avatarCol.text, flexShrink: 0,
          }}>
            {vendor.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{vendor.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{vendor.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 11px', borderRadius: 'var(--r-pill)',
                background: catCol.bg, color: catCol.text, border: `1px solid ${catCol.border}`,
              }}>
                {vendor.category}
              </span>
              <InlineDropdown
                options={DPA_OPTIONS}
                current={dpaStatus}
                onSelect={handleDpaSelect}
                saving={savingDpa}
                renderBadge={() => <DpaBadge status={dpaStatus} chevron />}
              />
            </div>
          </div>
        </div>

        {!loading && !error && overallTotal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <VendorScoreRing pct={overallPct} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Overall progress</div>
              <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>{overallAnswered} of {overallTotal} sub-controls answered</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls list */}
      {loading ? (
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading vendor controls…</span>
        </div>
      ) : error ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 'var(--r-lg)' }}>
          <div style={{ fontWeight: 700, color: 'var(--risk-high-text)', marginBottom: 4 }}>Failed to load vendor controls</div>
          <div style={{ fontSize: 13, color: 'var(--risk-high-text)', opacity: 0.75 }}>{error}</div>
        </div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          No assessment controls found for this vendor.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map(cat => (
            <ControlAccordion
              key={cat.key}
              cat={cat}
              vendorId={vendor.id}
              vendorName={vendor.name}
              onSubControlSelect={setSelectedSubControl}
            />
          ))}
        </div>
      )}

      {selectedSubControl && (
        <VendorControlPanel subControl={selectedSubControl} onClose={handlePanelClose} />
      )}
    </div>
  );
}

export default VendorDetail;
