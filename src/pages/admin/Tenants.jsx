import { useState, useEffect, useRef } from 'react';
import { fetchTenants } from '../../api/services/tenants';
import { getUser } from '../../api/services/profile';
import {
  Badge, Button, EmptyState, ErrorState, FilterChips, Icons, LoadingState, Modal, SearchInput,
} from '../../ui';
import { formatDate } from '../../lib/format';

/* ── Tiny helpers ───────────────────────────────────── */
function fmt(iso) {
  return iso ? formatDate(iso, null) : null;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Avatar ─────────────────────────────────────────── */
function TenantAvatar({ tenant, size = 36 }) {
  if (tenant.logo) {
    return (
      <img
        src={tenant.logo}
        alt={tenant.name}
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: 'var(--green-soft)', color: 'var(--green-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(12, Math.round(size * 0.33)), fontWeight: 700,
    }}>
      {initials(tenant.name)}
    </div>
  );
}

/* ── Status badge ───────────────────────────────────── */
function StatusBadge({ active }) {
  return <Badge tone={active ? 'success' : 'neutral'} dot>{active ? 'Active' : 'Inactive'}</Badge>;
}

/* ── URL value with copy button (shown in the tenant details dialog) ── */
function UrlCell({ url }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!url) return <span className="dt-muted">—</span>;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(url).catch(() => { });
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span className="copy-value">
      <span className="dt-mono" title={url}>{url}</span>
      <button type="button" className="icon-btn copy-value-btn" onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy API URL'} title={copied ? 'Copied' : 'Copy'}>
        {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
      </button>
    </span>
  );
}

/* ── Detail modal ────────────────────────────────────── */
function TenantDetailModal({ tenant, onClose }) {
  const rows = [
    ['Tenant ID', tenant.id],
    ['Assigned reviewer', tenant.reviewer],
    ['Reviewer email', tenant.reviewerEmail],
    ['Contact email', tenant.email],
    ['Phone', tenant.phone],
    ['API URL', tenant.url ? <UrlCell url={tenant.url} /> : null],
    ['Industry', tenant.industry],
    ['Plan', tenant.plan],
    ['City', tenant.city],
    ['Country', tenant.country],
    ['Created', fmt(tenant.createdAt)],
  ].filter(([, v]) => v);

  return (
    <Modal
      title={tenant.name}
      subtitle={tenant.description}
      icon={<TenantAvatar tenant={tenant} size={36} />}
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="detail-badges">
        <StatusBadge active={tenant.isActive} />
        {tenant.plan && <Badge tone="violet">{tenant.plan}</Badge>}
        {tenant.industry && <Badge>{tenant.industry}</Badge>}
      </div>
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

/* ── Tenants page ────────────────────────────────────── */
export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailTenant, setDetailTenant] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchTenants();

      /* Find tenants that have a reviewer ID but no resolved name */
      const missingIds = [
        ...new Set(list.filter(t => t.reviewerId && !t.reviewer).map(t => t.reviewerId)),
      ];

      if (missingIds.length === 0) {
        setTenants(list);
        return;
      }

      /* Parallel-fetch user details for all unresolved reviewer IDs */
      const results = await Promise.allSettled(missingIds.map(id => getUser(id)));

      /* Build id → { name, email } map from successful fetches */
      const idMap = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const u = r.value;
          idMap[missingIds[i]] = {
            name: u.username ?? u.name ?? u.email ?? null,
            email: u.email ?? null,
          };
        }
      });

      /* Merge resolved names into tenant list */
      setTenants(list.map(t => {
        if (t.reviewerId && !t.reviewer && idMap[t.reviewerId]) {
          return {
            ...t,
            reviewer: idMap[t.reviewerId].name,
            reviewerEmail: t.reviewerEmail ?? idMap[t.reviewerId].email,
          };
        }
        return t;
      }));
    } catch (err) {
      setError(err.message ?? 'Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.name.toLowerCase().includes(q)
      || (t.description ?? '').toLowerCase().includes(q)
      || (t.email ?? '').toLowerCase().includes(q)
      || (t.industry ?? '').toLowerCase().includes(q)
      || (t.reviewer ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active' && t.isActive)
      || (statusFilter === 'inactive' && !t.isActive);
    return matchSearch && matchStatus;
  });

  const activeCount = tenants.filter(t => t.isActive).length;
  const inactiveCount = tenants.filter(t => !t.isActive).length;

  return (
    <div className="page">
      <div className="table-card">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, industry or reviewer"
          />
          <FilterChips
            label="Filter tenants by status"
            value={statusFilter}
            onChange={setStatusFilter}
            items={[
              { key: 'all', label: 'All', count: tenants.length },
              { key: 'active', label: 'Active', count: activeCount },
              { key: 'inactive', label: 'Inactive', count: inactiveCount },
            ]}
          />
          <span className="table-toolbar-end" aria-live="polite">
            {filtered.length} tenant{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading tenants…" />
        ) : error ? (
          <div style={{ padding: 20 }}><ErrorState title="Couldn't load tenants" message={error} onRetry={load} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<Icons.Building size={22} />}
            title={tenants.length ? 'No tenants match your filters' : 'No tenants yet'}
            description={tenants.length ? 'Try a different search term or status filter.' : 'Tenants appear here once they are created.'}
            action={tenants.length ? <Button size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters</Button> : null}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Tenant</th>
                <th scope="col" className="dt-col-secondary">Assigned reviewer</th>
                <th scope="col" className="dt-col-secondary">Contact</th>
                <th scope="col">Plan</th>
                <th scope="col">Status</th>
                <th scope="col" className="dt-col-secondary">Created</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr
                  key={t.id}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => setDetailTenant(t)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setDetailTenant(t); }}
                  aria-label={`View details for ${t.name}`}
                >
                  <td className="dt-primary">
                    <div className="dt-primary-inner">
                      <TenantAvatar tenant={t} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div className="dt-title">{t.name}</div>
                        <div className="dt-sub">
                          {t.industry && <span>{t.industry}</span>}
                          {t.description && <span className="dt-truncate">{t.description}</span>}
                        </div>
                        <div className="dt-sub dt-fold">
                          <span>{t.reviewer ? `Reviewer: ${t.reviewer}` : 'No reviewer assigned'}</span>
                          {t.email && <span>{t.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="dt-col-secondary" data-label="Reviewer">
                    {t.reviewer ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.reviewer}</div>
                        {t.reviewerEmail && <div className="dt-sub">{t.reviewerEmail}</div>}
                      </div>
                    ) : (
                      <Badge tone="warning">Unassigned</Badge>
                    )}
                  </td>
                  <td className="dt-col-secondary" data-label="Contact">
                    {t.email || t.phone ? (
                      <div>
                        {t.email && (
                          <a className="text-link" href={`mailto:${t.email}`} onClick={e => e.stopPropagation()}>{t.email}</a>
                        )}
                        {t.phone && <div className="dt-sub">{t.phone}</div>}
                      </div>
                    ) : <span className="dt-muted">—</span>}
                  </td>
                  <td data-label="Plan">{t.plan ? <Badge tone="violet">{t.plan}</Badge> : <span className="dt-muted">—</span>}</td>
                  <td data-label="Status"><StatusBadge active={t.isActive} /></td>
                  <td className="dt-col-secondary dt-nowrap dt-muted" data-label="Created">{fmt(t.createdAt) ?? '—'}</td>
                  <td className="dt-actions">
                    <span className="dt-actions-inner">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetailTenant(t); }}>
                        View <Icons.ChevronRight size={14} />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailTenant && (
        <TenantDetailModal tenant={detailTenant} onClose={() => setDetailTenant(null)} />
      )}
    </div>
  );
}
