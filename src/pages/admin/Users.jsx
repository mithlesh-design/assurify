import { useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '../../api/services/auth';
import { getUserFiles } from '../../api/services/profile';
import {
  Badge, Button, EmptyState, ErrorState, FilterChips, Icons, LoadingState, Modal, RowActions, SearchInput,
} from '../../ui';
import { formatDate, humanize } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

/* ── Role badge ─────────────────────────────────────── */
const ROLE_TONES = { reviewer: 'info', user: 'success' };
function RoleBadge({ role }) {
  return <Badge tone={ROLE_TONES[role] ?? 'neutral'}>{role === 'user' ? 'Customer' : humanize(role)}</Badge>;
}

/* ── Star rating ─────────────────────────────────────── */
function StarRating({ value }) {
  if (value == null) return <span className="dt-muted">—</span>;
  const n = Math.round(Number(value));
  return (
    <span className="star-rating" aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"
          fill={i <= n ? '#F59E0B' : 'none'} stroke={i <= n ? '#F59E0B' : '#CFD8EF'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span>{Number(value).toFixed(1)}</span>
    </span>
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

  return (
    <Modal
      title={user.name}
      subtitle={`${user.designation ? `${user.designation} · ` : ''}${user.email}`}
      icon={<span className="dt-avatar round">{user.initials}</span>}
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="section-label-row">
        <span className="section-label">Certificates &amp; documents</span>
        {!loading && !error && <span className="dt-muted">{files.length} file{files.length !== 1 ? 's' : ''}</span>}
      </div>
      {loading ? (
        <LoadingState compact label="Loading documents…" />
      ) : error ? (
        <ErrorState title="Couldn't load documents" message={error} onRetry={load} />
      ) : files.length === 0 ? (
        <EmptyState compact icon={<Icons.File size={20} />} title="No documents yet" description="This user hasn't uploaded any certificates." />
      ) : (
        <ul className="file-list">
          {files.map(f => (
            <li key={f.id} className="file-list-item">
              <span className="file-list-icon"><Icons.File size={16} /></span>
              <div className="file-list-body">
                <div className="file-list-name" title={f.name}>{f.name}</div>
                <div className="file-list-meta">Uploaded {formatDate(f.uploadedAt)}</div>
              </div>
              {f.url ? (
                <a className="btn btn-secondary btn-sm" href={f.url} target="_blank" rel="noopener noreferrer">
                  <Icons.Download size={14} /> View
                </a>
              ) : (
                <span className="dt-muted">No link</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/* ── Users page ─────────────────────────────────────── */
/* Note: account creation is not offered here until the create-user API is
   available — showing a form that cannot be submitted only frustrates admins. */
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [docsUser,   setDocsUser]   = useState(null);
  const toast = useToast();

  const copyEmail = (email) => {
    navigator.clipboard?.writeText(email)
      .then(() => toast.success('Email address copied.'))
      .catch(() => toast.error('Could not copy. Please copy it manually.'));
  };

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

  const roles = [...new Set(users.map(u => u.role))];

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.designation ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="page">
      <div className="table-card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or designation" />
          <FilterChips
            label="Filter users by role"
            value={roleFilter}
            onChange={setRoleFilter}
            items={[
              { key: 'all', label: 'All', count: users.length },
              ...roles.map(r => ({ key: r, label: r === 'user' ? 'Customers' : `${humanize(r)}s`, count: users.filter(u => u.role === r).length })),
            ]}
          />
          <span className="table-toolbar-end" aria-live="polite">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading users…" />
        ) : error ? (
          <div style={{ padding: 20 }}><ErrorState title="Couldn't load users" message={error} onRetry={load} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<Icons.Users size={22} />}
            title={users.length ? 'No users match your filters' : 'No users yet'}
            description={users.length ? 'Try a different search term or role.' : 'Reviewers and customer users appear here once their accounts exist.'}
            action={users.length ? <Button size="sm" onClick={() => { setSearch(''); setRoleFilter('all'); }}>Clear filters</Button> : null}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className="dt-col-secondary">Designation</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col" className="dt-col-secondary">Rating</th>
                <th scope="col" className="dt-col-secondary">Joined</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className="dt-primary">
                    <div className="dt-primary-inner">
                      <span className="dt-avatar round" aria-hidden="true">{u.initials}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="dt-title">{u.name}</div>
                        <div className="dt-sub"><a className="text-link" href={`mailto:${u.email}`}>{u.email}</a></div>
                        <div className="dt-sub dt-fold">
                          {u.designation && <span>{u.designation}</span>}
                          <span>Joined {formatDate(u.joinedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="dt-col-secondary" data-label="Designation">
                    {u.designation || <span className="dt-muted">—</span>}
                  </td>
                  <td data-label="Role"><RoleBadge role={u.role} /></td>
                  <td data-label="Status">
                    <Badge tone={u.isActive ? 'success' : 'neutral'} dot>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="dt-col-secondary" data-label="Rating"><StarRating value={u.rating} /></td>
                  <td className="dt-col-secondary dt-nowrap dt-muted" data-label="Joined">{formatDate(u.joinedAt)}</td>
                  <td className="dt-actions">
                    <span className="dt-actions-inner">
                      <Button size="sm" variant="secondary" icon={<Icons.File size={14} />} onClick={() => setDocsUser(u)}>
                        Documents
                      </Button>
                      <RowActions
                        label={`More actions for ${u.name}`}
                        items={[
                          { label: 'View documents', icon: <Icons.File size={15} />, onClick: () => setDocsUser(u) },
                          { label: 'Copy email address', icon: <Icons.Copy size={15} />, onClick: () => copyEmail(u.email) },
                          { label: 'Send email', icon: <Icons.Mail size={15} />, onClick: () => { window.location.href = `mailto:${u.email}`; } },
                        ]}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {docsUser && <DocumentsModal user={docsUser} onClose={() => setDocsUser(null)} />}
    </div>
  );
}
