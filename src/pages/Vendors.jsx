import { useState, useEffect, useMemo, useCallback } from 'react';
import { Icons, Button, Modal, Progress, PageActions } from '../ui';
import { fetchVendors, createVendor, fetchVendorAssessment, updateVendorDpaStatus } from '../api/services/vendors';
import { brandColor, normalizeVendor, riskTone, riskTextColor, DPA_OPTIONS, DPA_META, CATEGORY_LABELS } from '../data/vendors';
import { InlineDropdown, DpaBadge } from '../components/VendorUi';
import VendorDetail from './VendorDetail';

/* ── Inline SVG icons for stat tiles ─────────────────── */
const IcoAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ── Stat tile ────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, sub, color, accent }) {
  return (
    <div className="stat-tile" style={{ borderLeft: `3px solid ${accent}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 14, top: 14, opacity: 0.08, color: accent, transform: 'scale(2)', transformOrigin: 'top right' }}>
        <Icon />
      </div>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: color ?? 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{sub}</div>
    </div>
  );
}

/* ── Shared grid columns: header + card rows must match ─ */
const VENDOR_GRID = '52px 1fr 160px 220px 170px 36px';

/* ── Vendor card row — clicking it opens the dedicated vendor page ── */
function VendorCard({ vendor, onSelect, onDpaChange }) {
  const [savingDpa, setSavingDpa] = useState(false);

  async function handleDpaSelect(newLabel) {
    const lower = newLabel.toLowerCase();
    const prev  = vendor.dpaStatus;
    onDpaChange(vendor.id, lower);
    setSavingDpa(true);
    try {
      await updateVendorDpaStatus(vendor.id, newLabel);
    } catch {
      onDpaChange(vendor.id, prev);
    } finally {
      setSavingDpa(false);
    }
  }

  const hasScore  = vendor.compliancePct !== null && vendor.totalCount;
  const avatarCol = brandColor(vendor.name);
  const catCol    = brandColor(vendor.category);
  const dpaMeta   = DPA_META[vendor.dpaStatus?.toLowerCase()] ?? DPA_META.missing;

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${dpaMeta.accent}`,
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Row — same grid as header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: VENDOR_GRID,
          alignItems: 'center',
          gap: 0,
          padding: '14px 18px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => onSelect(vendor.id)}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; }}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Col 1 — Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: avatarCol.bg, border: `1.5px solid ${avatarCol.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: avatarCol.text,
          letterSpacing: '-0.01em', flexShrink: 0,
        }}>
          {vendor.avatar}
        </div>

        {/* Col 2 — Vendor name + email */}
        <div style={{ paddingRight: 16, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vendor.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {vendor.email}
          </div>
        </div>

        {/* Col 3 — Category */}
        <div style={{ paddingRight: 16 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 11px',
            borderRadius: 'var(--r-pill)',
            background: catCol.bg, color: catCol.text, border: `1px solid ${catCol.border}`,
            whiteSpace: 'nowrap', display: 'inline-block',
          }}>
            {vendor.category}
          </span>
        </div>

        {/* Col 4 — Assessment */}
        <div style={{ paddingRight: 16 }}>
          {hasScore ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {vendor.totalAnswered}/{vendor.totalCount} questions
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: riskTextColor(vendor.compliancePct) }}>
                  {vendor.compliancePct}%
                </span>
              </div>
              <Progress value={vendor.compliancePct} tone={riskTone(vendor.compliancePct)} thickness="thin" />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Not assessed yet</span>
            </div>
          )}
        </div>

        {/* Col 5 — DPA status */}
        <div onClick={e => e.stopPropagation()}>
          <InlineDropdown
            options={DPA_OPTIONS}
            current={vendor.dpaStatus}
            onSelect={handleDpaSelect}
            saving={savingDpa}
            renderBadge={() => <DpaBadge status={vendor.dpaStatus} chevron />}
          />
        </div>

        {/* Col 6 — Open chevron */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.Chevron size={13} style={{ color: 'var(--slate)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Add vendor form ────────────────────────────────── */
const EMPTY_FORM = { vendor_name: '', vendor_category: '', vendor_email: '', vendor_phone: '' };

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

/* ═══════════════════════════════════════════════════════
   Vendors page
═══════════════════════════════════════════════════════ */
function PageVendors({ onAction, onSummary }) {
  const [vendors, setVendors]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [filter, setFilter]                     = useState('all');
  const [query, setQuery]                       = useState('');
  const [showAdd, setShowAdd]                   = useState(false);
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [saving, setSaving]                     = useState(false);
  const [formError, setFormError]               = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const raw        = await fetchVendors();
      const normalized = (Array.isArray(raw) ? raw : []).map(normalizeVendor);
      const results    = await Promise.allSettled(normalized.map(v => fetchVendorAssessment(v.id)));
      const enriched    = normalized.map((v, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          return { ...v, compliancePct: Math.round(r.value.compliance_percentage ?? 0), totalAnswered: r.value.total_answered ?? 0, totalCount: r.value.total_count ?? 0 };
        }
        return v;
      });
      setVendors(enriched);
      setError(null);
    } catch (err) {
      setError(err.message ?? 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const counts = useMemo(() => ({
    all:            vendors.length,
    missing:        vendors.filter(v => v.dpaStatus === 'missing').length,
    pending:        vendors.filter(v => v.dpaStatus === 'pending').length,
    signed:         vendors.filter(v => v.dpaStatus === 'signed').length,
    expired:        vendors.filter(v => v.dpaStatus === 'expired').length,
    'not required': vendors.filter(v => v.dpaStatus === 'not required').length,
  }), [vendors]);

  useEffect(() => {
    onSummary?.({ loaded: !loading && !error, error: error || null, total: vendors.length, ...counts });
  }, [onSummary, loading, error, vendors, counts]);

  const filtered = vendors.filter(v => {
    if (filter !== 'all' && v.dpaStatus !== filter) return false;
    if (query && !v.name.toLowerCase().includes(query.toLowerCase()) &&
        !v.category.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function handleDpaChange(vendorId, newStatus) {
    setVendors(vs => vs.map(v => v.id === vendorId ? { ...v, dpaStatus: newStatus } : v));
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleAddVendor() {
    if (!form.vendor_name.trim())  { setFormError('Vendor name is required'); return; }
    if (!form.vendor_email.trim()) { setFormError('Email is required'); return; }
    setSaving(true); setFormError(null);
    try {
      await createVendor(form);
      await loadAll();
      setShowAdd(false);
      setForm(EMPTY_FORM);
      onAction?.('Vendor added successfully');
    } catch (err) {
      setFormError(err.message ?? 'Failed to add vendor');
    } finally {
      setSaving(false);
    }
  }

  const FILTERS = [
    { id: 'all',          label: 'All',          dot: null },
    { id: 'missing',      label: 'Missing',      dot: '#EF4444' },
    { id: 'pending',      label: 'Pending',      dot: '#F59E0B' },
    { id: 'signed',       label: 'Signed',       dot: '#10B981' },
    { id: 'expired',      label: 'Expired',      dot: '#F97316' },
    { id: 'not required', label: 'Not Required', dot: '#94A3B8' },
  ];

  /* ── Dedicated vendor page ── */
  const selectedVendor = selectedVendorId ? vendors.find(v => v.id === selectedVendorId) : null;
  if (selectedVendor) {
    return (
      <VendorDetail
        vendor={selectedVendor}
        onAction={onAction}
        onBack={() => { setSelectedVendorId(null); loadAll(); }}
      />
    );
  }

  return (
    <>
      <div className="page">

        {/* ══ Stat tiles ══════════════════════════════════ */}
        <div className="stat-grid-3" style={{ marginBottom: 24 }}>
          <StatTile
            icon={IcoAlert} label="Missing DPAs" value={counts.missing}
            sub={counts.missing > 0 ? 'Action required' : 'None outstanding'}
            color={counts.missing > 0 ? '#DC2626' : 'var(--green-dim)'}
            accent={counts.missing > 0 ? '#EF4444' : '#10B981'}
          />
          <StatTile
            icon={IcoClock} label="Pending signature" value={counts.pending}
            sub="Awaiting vendor signature"
            color={counts.pending > 0 ? '#B45309' : 'var(--slate)'}
            accent="#F59E0B"
          />
          <StatTile
            icon={IcoShield} label="Signed & compliant" value={counts.signed}
            sub="DPAs in force"
            color="var(--green-dim)"
            accent="#10B981"
          />
        </div>

        {/* ══ Search + filter bar ══════════════════════════ */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 240px', maxWidth: 340 }}>
            <Icons.Search size={15} style={{ color: 'var(--muted)' }} />
            <input placeholder="Search vendors or categories…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="assess-filter-bar" style={{ marginBottom: 0, flex: '1 1 auto' }}>
            {FILTERS.map(f => (
              <button key={f.id} className={`assess-chip${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}>
                {f.dot && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                    background: filter === f.id ? 'rgba(255,255,255,0.8)' : f.dot,
                  }} />
                )}
                {f.label}
                <span className="assess-chip-count">{counts[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══ Vendor list ══════════════════════════════════ */}
        {loading ? (
          <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading vendors &amp; assessments…</span>
          </div>
        ) : error ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontWeight: 700, color: 'var(--risk-high-text)', marginBottom: 4 }}>Failed to load vendors</div>
            <div style={{ fontSize: 13, color: 'var(--risk-high-text)', opacity: 0.75 }}>{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcoShield />
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              {query ? 'No vendors match your search.' : 'No vendors in this category.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Column header — must use same VENDOR_GRID as card rows */}
            <div style={{
              display: 'grid', gridTemplateColumns: VENDOR_GRID,
              alignItems: 'center', gap: 0,
              padding: '4px 18px 10px',
              borderBottom: '1px solid var(--border-soft)',
            }}>
              {[
                { label: '',           style: {} },
                { label: 'Vendor',     style: { paddingRight: 16 } },
                { label: 'Category',   style: { paddingRight: 16 } },
                { label: 'Assessment', style: { paddingRight: 16 } },
                { label: 'DPA Status', style: {} },
                { label: '',           style: {} },
              ].map((col, i) => (
                <div key={i} style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  ...col.style,
                }}>
                  {col.label}
                </div>
              ))}
            </div>

            {filtered.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                onSelect={setSelectedVendorId}
                onDpaChange={handleDpaChange}
              />
            ))}
          </div>
        )}

        <PageActions>
          <Button variant="primary" icon={<Icons.Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add vendor
          </Button>
        </PageActions>

        {/* ══ Add vendor modal ══════════════════════════════ */}
        {showAdd && (
          <Modal
            title="Add vendor"
            icon={<Icons.Building size={18} style={{ color: 'var(--green)' }} />}
            onClose={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormError(null); }}
            footer={<>
              <Button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormError(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleAddVendor} disabled={saving}>
                {saving ? 'Adding…' : 'Add vendor'}
              </Button>
            </>}
          >
            {formError && (
              <div style={{
                padding: '10px 14px', marginBottom: 14, borderRadius: 'var(--r-md)',
                background: 'var(--risk-high-bg)', color: 'var(--risk-high-text)',
                border: '1px solid var(--risk-high-border)', fontSize: 13,
              }}>
                {formError}
              </div>
            )}

            <label className="field-label">Vendor name *</label>
            <input className="input" name="vendor_name" placeholder="e.g. Stripe" value={form.vendor_name} onChange={handleFormChange} />

            <div style={{ height: 12 }} />
            <label className="field-label">Category</label>
            <select className="input" name="vendor_category" value={form.vendor_category} onChange={handleFormChange}
              style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236575A0' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
              <option value="">Select a category…</option>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div style={{ height: 12 }} />
            <label className="field-label">DPA contact email *</label>
            <input className="input" name="vendor_email" type="email" placeholder="privacy@vendor.com" value={form.vendor_email} onChange={handleFormChange} />

            <div style={{ height: 12 }} />
            <label className="field-label">Phone</label>
            <input className="input" name="vendor_phone" placeholder="+91 XXXXXXXXXX" value={form.vendor_phone} onChange={handleFormChange} />
          </Modal>
        )}
      </div>
    </>
  );
}

export default PageVendors;
