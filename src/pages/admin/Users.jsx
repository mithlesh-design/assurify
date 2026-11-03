import { useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '../../api/services/auth';
import { getUserFiles } from '../../api/services/profile';

/* ── Role badge ─────────────────────────────────────── */
const ROLE_COLORS = {
  reviewer: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  user:     { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
};
function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] ?? { bg: 'var(--bg)', color: 'var(--slate)', border: 'var(--border)' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize', display: 'inline-block',
    }}>
      {role}
    </span>
  );
}

/* ── Star Rating ─────────────────────────────────────── */
function StarRating({ value }) {
  if (value == null) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>;
  const n = Math.round(Number(value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= n ? '#F59E0B' : 'none'}
          stroke={i <= n ? '#F59E0B' : '#CFD8EF'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize: 11, color: 'var(--slate)', marginLeft: 2 }}>{Number(value).toFixed(1)}</span>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────── */
function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, border: `${size < 20 ? 2 : 3}px solid var(--border)`,
      borderTop: `${size < 20 ? 2 : 3}px solid var(--green)`, borderRadius: '50%',
      animation: 'spin .8s linear infinite',
    }} />
  );
}

/* ── File icon SVG ───────────────────────────────────── */
function FileIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

/* ── Documents modal ─────────────────────────────────── */
function DocumentsModal({ user, onClose }) {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await getUserFiles(user.id));
    } catch (err) {
      setError(err.message ?? 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,27,64,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose} />

      {/* Panel */}
      <div style={{
        position: 'relative', background: 'var(--white)', borderRadius: 'var(--r-lg)',
        padding: 0, width: 540, maxWidth: '92vw', maxHeight: '80vh',
        boxShadow: '0 24px 64px rgba(14,27,64,0.22)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'var(--green-soft)', color: 'var(--green-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700,
          }}>
            {user.initials}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {user.name}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--slate)' }}>
              {user.designation ? `${user.designation} · ` : ''}{user.email}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, color: 'var(--slate)', lineHeight: 1, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Sub-header */}
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Certificates &amp; Documents
          </span>
          {!loading && !error && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
              <Spinner size={28} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading documents…</span>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--risk-high-text)', marginBottom: 12 }}>{error}</p>
              <button className="btn btn-secondary" onClick={load} style={{ fontSize: 12 }}>Retry</button>
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: 'var(--muted)',
              }}>
                <FileIcon size={22} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No documents uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
              {files.map((f, i) => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                  borderBottom: i < files.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--green-soft)', color: 'var(--green-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileIcon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      Uploaded {formatDate(f.uploadedAt)}
                    </div>
                  </div>
                  {f.url ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--green-dim)',
                        textDecoration: 'none', padding: '5px 12px', borderRadius: 6,
                        background: 'var(--green-soft)', border: '1px solid var(--green-mid)',
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      View
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>No link</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create user modal ───────────────────────────────── */
function CreateUserModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--white)',
        borderRadius: 'var(--r-lg)', padding: '28px 32px', width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--black)' }}>Create user</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--slate)', lineHeight: 1,
          }}>✕</button>
        </div>
        <div className="auth-field">
          <label className="auth-field-label">Full name</label>
          <input type="text" className="input" placeholder="e.g. Priya Sharma" />
        </div>
        <div className="auth-field">
          <label className="auth-field-label">Email address</label>
          <input type="email" className="input" placeholder="user@assurify.in" />
        </div>
        <div className="auth-field">
          <label className="auth-field-label">Role</label>
          <select className="input" style={{ cursor: 'pointer' }}>
            <option value="reviewer">Reviewer</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="auth-field" style={{ marginBottom: 22 }}>
          <label className="auth-field-label">Password</label>
          <input type="password" className="input" placeholder="Min. 6 characters" />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            Create user
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0', textAlign: 'center' }}>
          Create user API is in progress.
        </p>
      </div>
    </div>
  );
}

/* ── Users page ─────────────────────────────────────── */
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [docsUser,   setDocsUser]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setError(err.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const allRoles = ['all', ...new Set(users.map(u => u.role))];

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.designation ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  return (
    <div className="page">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ width: 260, height: 36, fontSize: 13 }}
          placeholder="Search by name, email or designation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {allRoles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: '5px 14px', borderRadius: 'var(--r-pill)',
              border: `1px solid ${roleFilter === r ? 'var(--green)' : 'var(--border)'}`,
              background: roleFilter === r ? 'var(--green-soft)' : 'var(--white)',
              color: roleFilter === r ? 'var(--green-dim)' : 'var(--slate)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
              {r === 'all' ? `All (${users.length})` : `${r} (${users.filter(u => u.role === r).length})`}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowCreate(true)}
        >
          + Create user
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{
            width: 26, height: 26, border: '3px solid var(--border)',
            borderTop: '3px solid var(--green)', borderRadius: '50%',
            animation: 'spin .8s linear infinite', margin: '0 auto 12px',
          }} />
          Loading users…
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
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Rating</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
                    No users found.
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  {/* Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--green-soft)', color: 'var(--green-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {u.initials}
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--black)', whiteSpace: 'nowrap' }}>{u.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ color: 'var(--slate)', fontSize: 13 }}>{u.email}</td>

                  {/* Designation */}
                  <td style={{ fontSize: 13, color: 'var(--ink2)' }}>
                    {u.designation
                      ? <span style={{ fontWeight: 500 }}>{u.designation}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>
                    }
                  </td>

                  {/* Rating */}
                  <td><StarRating value={u.rating} /></td>

                  {/* Role */}
                  <td><RoleBadge role={u.role} /></td>

                  {/* Status */}
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                      background: u.isActive ? 'var(--green-soft)' : 'var(--bg)',
                      color: u.isActive ? 'var(--green-dim)' : 'var(--muted)',
                      border: `1px solid ${u.isActive ? 'var(--green-mid)' : 'var(--border)'}`,
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Joined date */}
                  <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(u.joinedAt)}
                  </td>

                  {/* View Documents */}
                  <td>
                    <button
                      onClick={() => setDocsUser(u)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600, padding: '5px 12px',
                        borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--white)', color: 'var(--slate)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'border-color .15s, color .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green-dim)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--slate)'; }}
                    >
                      <FileIcon size={13} />
                      View docs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {docsUser   && <DocumentsModal  user={docsUser} onClose={() => setDocsUser(null)} />}
    </div>
  );
}
