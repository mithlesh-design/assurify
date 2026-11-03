import { useState, useEffect } from 'react';
import { fetchTenants } from '../../api/services/tenants';
import { getUser } from '../../api/services/profile';

/* ── Tiny helpers ───────────────────────────────────── */
function fmt(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return null; }
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
      fontSize: size * 0.33, fontWeight: 700,
    }}>
      {initials(tenant.name)}
    </div>
  );
}

/* ── Status badge ───────────────────────────────────── */
function StatusBadge({ active }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: active ? 'var(--green-soft)' : 'var(--bg)',
      color: active ? 'var(--green-dim)' : 'var(--muted)',
      border: `1px solid ${active ? 'var(--green-mid)' : 'var(--border)'}`,
      whiteSpace: 'nowrap',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── Pill tag ────────────────────────────────────────── */
function Pill({ children, color = 'var(--slate)', bg = 'var(--surface)', border = 'var(--border)' }) {
  if (!children) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 'var(--r-pill)',
      background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

/* ── URL cell — truncated with copy ────────────────── */
function UrlCell({ url }) {
  const [copied, setCopied] = useState(false);
  if (!url) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <span style={{
        fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: 200,
      }} title={url}>
        {url}
      </span>
      <button
        onClick={handleCopy}
        title="Copy URL"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: copied ? 'var(--green-dim)' : 'var(--muted)', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ── Detail modal ────────────────────────────────────── */
function TenantDetailModal({ tenant, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const Row = ({ label, value }) => {
    if (!value) return null;
    return (
      <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
        <span style={{ width: 130, flexShrink: 0, fontSize: 12, color: 'var(--muted)', fontWeight: 500, paddingTop: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, wordBreak: 'break-all' }}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,27,64,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--white)', borderRadius: 'var(--r-lg)',
        width: 500, maxWidth: '92vw', maxHeight: '82vh', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(14,27,64,0.22)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <TenantAvatar tenant={tenant} size={44} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{tenant.name}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge active={tenant.isActive} />
              {tenant.plan && (
                <Pill bg="#EDE9FE" color="#5B21B6" border="#C4B5FD">{tenant.plan}</Pill>
              )}
              {tenant.industry && (
                <Pill>{tenant.industry}</Pill>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, color: 'var(--slate)', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 24px' }}>
          {tenant.description && (
            <p style={{ fontSize: 13, color: 'var(--slate)', margin: '14px 0', lineHeight: 1.6 }}>
              {tenant.description}
            </p>
          )}
          <Row label="Tenant ID" value={tenant.id} />
          <Row label="Assigned Reviewer" value={tenant.reviewer} />
          <Row label="Reviewer Email" value={tenant.reviewerEmail} />
          <Row label="Contact Email" value={tenant.email} />
          <Row label="Phone" value={tenant.phone} />
          <Row label="API URL" value={tenant.url} />
          <Row label="Industry" value={tenant.industry} />
          <Row label="Plan" value={tenant.plan} />
          <Row label="City" value={tenant.city} />
          <Row label="Country" value={tenant.country} />
          <Row label="Created" value={fmt(tenant.createdAt)} />
        </div>
      </div>
    </div>
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

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ width: 260, height: 36, fontSize: 13 }}
          placeholder="Search by name, email or industry…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: `All (${tenants.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'inactive', label: `Inactive (${inactiveCount})` },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
              padding: '5px 14px', borderRadius: 'var(--r-pill)', fontFamily: 'inherit',
              border: `1px solid ${statusFilter === f.key ? 'var(--green)' : 'var(--border)'}`,
              background: statusFilter === f.key ? 'var(--green-soft)' : 'var(--white)',
              color: statusFilter === f.key ? 'var(--green-dim)' : 'var(--slate)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--slate)' }}>
          {filtered.length} tenant{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{
            width: 26, height: 26, border: '3px solid var(--border)',
            borderTop: '3px solid var(--green)', borderRadius: '50%',
            animation: 'spin .8s linear infinite', margin: '0 auto 12px',
          }} />
          Loading tenants…
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--risk-high-text)', marginBottom: 12 }}>{error}</div>
          <button className="btn btn-secondary" onClick={load}>Retry</button>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Assigned Reviewer</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Industry</th>
                <th>Plan</th>
                <th>API URL</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
                    No tenants found.
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTenant(t)}>

                  {/* Tenant name + description */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TenantAvatar tenant={t} size={32} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </div>
                        {t.description && (
                          <div style={{
                            fontSize: 12, color: 'var(--muted)', marginTop: 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
                          }}>
                            {t.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Assigned Reviewer */}
                  <td>
                    {t.reviewer ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: '#EFF6FF', color: '#1D4ED8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {t.reviewer.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                            {t.reviewer}
                          </div>
                          {t.reviewerEmail && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              {t.reviewerEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
                        background: 'var(--risk-med-bg)', color: 'var(--risk-med-text)',
                        border: '1px solid var(--risk-med-border)',
                      }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Email */}
                  <td style={{ fontSize: 13, color: 'var(--slate)' }}>
                    {t.email
                      ? <a href={`mailto:${t.email}`} onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--green-dim)', textDecoration: 'none' }}>{t.email}</a>
                      : <span style={{ color: 'var(--muted)' }}>—</span>
                    }
                  </td>

                  {/* Phone */}
                  <td style={{ fontSize: 13, color: 'var(--slate)' }}>
                    {t.phone ?? <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>

                  {/* Industry */}
                  <td>
                    {t.industry
                      ? <Pill>{t.industry}</Pill>
                      : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                    }
                  </td>

                  {/* Plan */}
                  <td>
                    {t.plan
                      ? <Pill bg="#EDE9FE" color="#5B21B6" border="#C4B5FD">{t.plan}</Pill>
                      : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                    }
                  </td>

                  {/* API URL */}
                  <td onClick={e => e.stopPropagation()}>
                    <UrlCell url={t.url} />
                  </td>

                  {/* Status */}
                  <td><StatusBadge active={t.isActive} /></td>

                  {/* Created date */}
                  <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmt(t.createdAt) ?? '—'}
                  </td>

                  {/* View detail chevron */}
                  <td>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailTenant && (
        <TenantDetailModal tenant={detailTenant} onClose={() => setDetailTenant(null)} />
      )}
    </div>
  );
}
