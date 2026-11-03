import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Icons, Button, Modal, Progress, PageActions, EmptyState, ErrorState, Field, FilterChips, LoadingState, SearchInput,
} from '../ui';
import { humanize } from '../lib/format';
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

const categoryLabel = (category) => CATEGORY_LABELS[category] ?? humanize(category);

/* ── Vendor row — clicking it opens the dedicated vendor page ── */
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
  const open = () => onSelect(vendor.id);

  return (
    <tr className="is-clickable" tabIndex={0} onClick={open} onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}>
      <td className="dt-primary">
        <div className="dt-primary-inner">
          <span className="dt-avatar" style={{ background: avatarCol.bg, borderColor: avatarCol.border, color: avatarCol.text }} aria-hidden="true">{vendor.avatar}</span>
          <div style={{ minWidth: 0 }}>
            <div className="dt-title">{vendor.name}</div>
            <div className="dt-sub"><span className="dt-truncate">{vendor.email}</span></div>
            <div className="dt-sub dt-fold"><span>{categoryLabel(vendor.category)}</span></div>
          </div>
        </div>
      </td>
      <td className="dt-col-secondary" data-label="Category">{categoryLabel(vendor.category)}</td>
      <td data-label="Assessment" style={{ minWidth: 180 }}>
        {hasScore ? (
          <div className="assessment-meter">
            <div className="assessment-meter-top">
              <span>{vendor.totalAnswered}/{vendor.totalCount} answered</span>
              <strong style={{ color: riskTextColor(vendor.compliancePct) }}>{vendor.compliancePct}%</strong>
            </div>
            <Progress value={vendor.compliancePct} tone={riskTone(vendor.compliancePct)} thickness="thin" />
          </div>
        ) : (
          <span className="dt-muted">Not assessed yet</span>
        )}
      </td>
      <td data-label="DPA status" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <InlineDropdown
          options={DPA_OPTIONS}
          current={vendor.dpaStatus}
          onSelect={handleDpaSelect}
          saving={savingDpa}
          renderBadge={() => <DpaBadge status={vendor.dpaStatus} chevron />}
        />
      </td>
      <td className="dt-actions">
        <Button size="sm" variant="ghost" aria-label={`Open ${vendor.name}`} onClick={e => { e.stopPropagation(); open(); }}>
          Open <Icons.ChevronRight size={14} />
        </Button>
      </td>
    </tr>
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

  /* Opening or leaving a vendor starts at the top of the page */
  useEffect(() => { window.scrollTo({ top: 0 }); }, [selectedVendorId]);

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
    const q = query.trim().toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.category.toLowerCase().includes(q)
        && !categoryLabel(v.category).toLowerCase().includes(q)) return false;
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
    if (!form.vendor_name.trim())  { setFormError('Enter the vendor’s name.'); return; }
    if (!form.vendor_email.trim()) { setFormError('Enter a DPA contact email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendor_email.trim())) { setFormError('Enter a valid email address, like privacy@vendor.com.'); return; }
    setSaving(true); setFormError(null);
    try {
      await createVendor(form);
      await loadAll();
      setShowAdd(false);
      setForm(EMPTY_FORM);
      onAction?.(`${form.vendor_name.trim()} added. Open it to start the assessment.`);
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
    { id: 'not required', label: 'Not required', dot: '#94A3B8' },
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
        <div className="tile-grid" style={{ marginBottom: 20 }}>
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

        {loading ? (
          <LoadingState label="Loading vendors and assessments…" />
        ) : error ? (
          <ErrorState title="Couldn't load vendors" message={error} onRetry={loadAll} />
        ) : (
          <section className="table-card">
            <div className="table-toolbar">
              <SearchInput value={query} onChange={setQuery} label="Search vendors" placeholder="Search vendors or categories" />
              <FilterChips
                label="Filter vendors by DPA status"
                value={filter}
                onChange={setFilter}
                items={FILTERS.map(f => ({ key: f.id, label: f.label, dot: f.dot, count: counts[f.id] ?? 0 }))}
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                compact
                icon={<IcoShield />}
                title={query ? 'No vendors match your search' : vendors.length ? 'No vendors with this DPA status' : 'No vendors yet'}
                description={vendors.length ? 'Try a different search or filter.' : 'Add the processors and service providers that handle personal data for you.'}
                action={vendors.length
                  ? <Button size="sm" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</Button>
                  : <Button size="sm" variant="primary" icon={<Icons.Plus size={14} />} onClick={() => setShowAdd(true)}>Add vendor</Button>}
              />
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th scope="col">Vendor</th>
                  <th scope="col" className="dt-col-secondary">Category</th>
                  <th scope="col">Assessment</th>
                  <th scope="col">DPA status</th>
                  <th scope="col"><span className="sr-only">Open</span></th>
                </tr></thead>
                <tbody>
                  {filtered.map(v => (
                    <VendorCard key={v.id} vendor={v} onSelect={setSelectedVendorId} onDpaChange={handleDpaChange} />
                  ))}
                </tbody>
              </table>
            )}
          </section>
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
            icon={<Icons.Building size={18} />}
            subtitle="Add a processor or service provider that handles personal data for you." 
            onClose={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormError(null); }}
            footer={<>
              <Button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormError(null); }}>Cancel</Button>
              <Button variant="primary" type="submit" form="add-vendor-form" loading={saving}>Add vendor</Button>
            </>}
          >
            <form id="add-vendor-form" className="form-stack" noValidate onSubmit={e => { e.preventDefault(); handleAddVendor(); }}>
              {formError && <div className="error-state" role="alert"><Icons.Alert size={16} /><div><p style={{ margin: 0 }}>{formError}</p></div></div>}
              <Field label="Vendor name" required>
                <input className="input" data-autofocus name="vendor_name" placeholder="e.g. Stripe" value={form.vendor_name} onChange={handleFormChange} />
              </Field>
              <Field label="Category" optional hint="Used to group the vendor assessment questions.">
                <select className="select" name="vendor_category" value={form.vendor_category} onChange={handleFormChange}>
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <div className="form-grid">
                <Field label="DPA contact email" required>
                  <input className="input" name="vendor_email" type="email" placeholder="privacy@vendor.com" value={form.vendor_email} onChange={handleFormChange} />
                </Field>
                <Field label="Phone" optional>
                  <input className="input" name="vendor_phone" type="tel" placeholder="+1 555 123 4567" value={form.vendor_phone} onChange={handleFormChange} />
                </Field>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </>
  );
}

export default PageVendors;
