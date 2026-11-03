import { useState, useEffect, useRef } from 'react';
import { useApp }   from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { getUser, updateUser, uploadCertificates, getUserFiles, deleteFile } from '../api/services/profile';

/* ── Spinner ────────────────────────────────────────── */
function Spin({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid var(--border)`,
      borderTop: `2.5px solid var(--green)`,
      borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0,
    }} />
  );
}

/* ── Uploaded cert row ───────────────────────────────── */
function CertRow({ cert, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ext = cert.name.split('.').pop().toUpperCase();

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(cert); }
    finally { setDeleting(false); setConfirm(false); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 'var(--r-sm)',
      border: `1px solid ${confirm ? '#FCA5A5' : 'var(--border)'}`,
      background: confirm ? '#FEF2F2' : 'var(--surface)',
      transition: 'all .15s',
    }}>
      {/* Ext badge */}
      <div style={{
        width: 34, height: 34, borderRadius: 7, flexShrink: 0,
        background: 'var(--green-soft)', color: 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 800, letterSpacing: '0.02em',
        border: '1px solid var(--green-mid)',
      }}>{ext}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cert.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
          {new Date(cert.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Actions */}
      {confirm ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, color: '#B91C1C', fontWeight: 600 }}>Delete?</span>
          <button onClick={handleDelete} disabled={deleting} style={{
            background: '#DC2626', color: '#fff', border: 'none',
            borderRadius: 5, padding: '3px 9px', fontSize: 11.5,
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {deleting ? <Spin size={11} /> : 'Yes'}
          </button>
          <button onClick={() => setConfirm(false)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 5,
            padding: '3px 8px', fontSize: 11.5, color: 'var(--slate)', cursor: 'pointer',
          }}>No</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {cert.url && (
            <a href={cert.url} download target="_blank" rel="noreferrer" style={{
              fontSize: 11.5, fontWeight: 600, color: 'var(--green)',
              textDecoration: 'none', padding: '3px 9px',
              border: '1px solid var(--green-mid)', borderRadius: 5,
              background: 'var(--green-soft)',
            }}>↓</a>
          )}
          <button onClick={() => setConfirm(true)} title="Delete" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: '3px',
            borderRadius: 4, transition: 'color .12s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >🗑</button>
        </div>
      )}
    </div>
  );
}

/* ── Staged (pending upload) row ──────────────────────── */
function StagedRow({ file, onRemove }) {
  const ext = file.name.split('.').pop().toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 'var(--r-sm)',
      border: '1px dashed var(--green-mid)', background: 'var(--green-soft)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 7, flexShrink: 0,
        background: '#fff', color: 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 800, border: '1px solid var(--green-mid)',
      }}>{ext}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green-dim)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--green-dim)', opacity: 0.7, marginTop: 1 }}>
          {(file.size / 1024).toFixed(0)} KB · Queued
        </div>
      </div>
      <button onClick={() => onRemove(file)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--green-dim)', fontSize: 15, lineHeight: 1, padding: '2px 4px',
      }}>✕</button>
    </div>
  );
}

/* ── Dropzone ───────────────────────────────────────── */
function Dropzone({ files, onChange }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const addFiles = (incoming) => {
    const next = [...files];
    Array.from(incoming).forEach(f => {
      if (!next.find(x => x.name === f.name && x.size === f.size)) next.push(f);
    });
    onChange(next);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)', padding: '18px 12px',
          textAlign: 'center', cursor: 'pointer',
          background: drag ? 'var(--green-soft)' : 'var(--surface)',
          transition: 'all .15s',
          marginBottom: files.length ? 10 : 0,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
          background: drag ? 'var(--green)' : 'var(--green-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={drag ? '#fff' : 'var(--green-dim)'} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
          Click or drag files here
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>PDF, PNG, JPG, DOCX</div>
      </div>
      <input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
        style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <StagedRow key={i} file={f} onRemove={file => onChange(files.filter(x => x !== file))} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Field label ─────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--slate)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Profile Page
═══════════════════════════════════════════════════════ */
export default function PageProfile() {
  const { user, updateUserProfile } = useApp();
  const toast = useToast();

  const [username,    setUsername]    = useState('');
  const [email,       setEmail]       = useState('');
  const [designation, setDesignation] = useState('');
  const [bio,         setBio]         = useState('');
  const [certs,       setCerts]       = useState([]);
  const [newFiles,    setNewFiles]    = useState([]);
  const [loadingUser,  setLoadingUser]  = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getUser(user.id)
      .then(d => {
        setUsername(d.username ?? d.name ?? user.name ?? '');
        setEmail(d.email ?? user.email ?? '');
        setDesignation(d.designation ?? user.designation ?? '');
        setBio(d.bio_desp ?? d.bio ?? user.bio ?? '');
      })
      .catch(() => {
        setUsername(user.name ?? '');
        setEmail(user.email ?? '');
        setDesignation(user.designation ?? '');
        setBio(user.bio ?? '');
      })
      .finally(() => setLoadingUser(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;
    getUserFiles(user.id)
      .then(setCerts)
      .catch(() => {})
      .finally(() => setLoadingCerts(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!username.trim()) { toast.warning('Name cannot be empty.'); return; }
    setSaving(true);
    let certError = false;

    try {
      await updateUser(user.id, {
        username:    username.trim(),
        email:       email.trim(),
        designation: designation.trim(),
        bio_desp:    bio.trim(),
      });
      updateUserProfile({ username: username.trim(), email: email.trim(),
        designation: designation.trim(), bio_desp: bio.trim() });
    } catch (err) {
      toast.error(`Failed to update profile: ${err.message}`);
      setSaving(false);
      return;
    }

    if (newFiles.length > 0) {
      try {
        await uploadCertificates(newFiles);
        getUserFiles(user.id).then(setCerts).catch(() => {});
        setNewFiles([]);
      } catch {
        certError = true;
        toast.warning('Profile saved but certificate upload failed. Please try again.');
      }
    }

    if (!certError) toast.success('Profile updated successfully.');
    setSaving(false);
  };

  const handleDeleteCert = async (cert) => {
    await deleteFile(cert.id);
    setCerts(prev => prev.filter(c => c.id !== cert.id));
    toast.success(`"${cert.name}" deleted.`);
  };

  const roleLabel = (user?.role ?? 'user') === 'reviewer' ? 'Reviewer' : 'User';

  return (
    <div className="page">

      {/* ══ Hero ══════════════════════════════════════════ */}
      <div style={{
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(135deg, var(--black) 0%, #253A8E 60%, #1a6080 100%)',
        padding: '32px 36px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 80, bottom: -60,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(0,170,191,0.12)', pointerEvents: 'none',
        }} />

        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'var(--green)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em',
          border: '3px solid rgba(255,255,255,0.25)',
          boxShadow: '0 0 0 4px rgba(0,170,191,0.3)',
        }}>
          {user?.initials ?? '?'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {loadingUser ? '—' : (username || user?.name)}
            </h2>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              background: 'rgba(0,170,191,0.25)', color: 'var(--green-mid)',
              border: '1px solid rgba(0,170,191,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {roleLabel}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>
            {loadingUser ? '' : (email || user?.email)}
          </div>
          {designation && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
              {designation}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 20, flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 28,
        }}>
          {[
            { label: 'Certificates', value: loadingCerts ? '—' : certs.length },
            { label: 'Status', value: 'Active' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Single Card ═══════════════════════════════════ */}
      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Column headers */}
        <div className="profile-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--green-soft)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>Personal information</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Update your details and bio</div>
            </div>
          </div>
          <div className="profile-divider" style={{ background: 'var(--border)' }} />
          <div style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--green-soft)', color: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Certificates
                {certs.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100,
                    background: 'var(--green-soft)', color: 'var(--green-dim)',
                    border: '1px solid var(--green-mid)',
                  }}>{certs.length}</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Upload and manage documents</div>
            </div>
          </div>
        </div>

        {/* ── Main body: two-column ── */}
        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', minHeight: 320 }}>

          {/* Left — form */}
          <div style={{ padding: '24px 28px' }}>
            {loadingUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Spin />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <FieldLabel>Full name</FieldLabel>
                    <input type="text" className="input" value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <FieldLabel>Email address</FieldLabel>
                    <input type="email" className="input" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <FieldLabel>Designation</FieldLabel>
                  <input type="text" className="input" value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Privacy Consultant" />
                </div>

                <div>
                  <FieldLabel>Bio description</FieldLabel>
                  <textarea className="input"
                    style={{ minHeight: 120, resize: 'vertical', lineHeight: 1.65 }}
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="A brief description about your expertise and background…" />
                </div>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div className="profile-divider" style={{ background: 'var(--border)' }} />

          {/* Right — certificates */}
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Dropzone files={newFiles} onChange={setNewFiles} />

            {loadingCerts ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <Spin size={20} />
              </div>
            ) : certs.length > 0 ? (
              <div>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: 'var(--muted)',
                  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Uploaded ({certs.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {certs.map(c => <CertRow key={c.id} cert={c} onDelete={handleDeleteCert} />)}
                </div>
              </div>
            ) : !newFiles.length ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '20px 0', gap: 8,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--border-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>
                  No certificates uploaded yet
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Footer: save button ── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)',
        }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {newFiles.length > 0
              ? `${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} ready to upload`
              : 'Changes will be saved to your account'}
          </span>
          <button
            className="btn btn-primary"
            style={{ height: 40, paddingInline: 28, fontSize: 14, fontWeight: 700, gap: 8 }}
            onClick={handleSave}
            disabled={saving || loadingUser}
          >
            {saving
              ? <><span className="btn-spinner" /> Saving…</>
              : <>Save changes →</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-divider { display: none !important; }
        }
      `}</style>
    </div>
  );
}
