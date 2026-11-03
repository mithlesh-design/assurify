import { useState, useRef } from 'react';
import { Icons } from '../ui';
import { useApp }               from '../context/AppContext';
import { useToast }             from '../context/ToastContext';
import { updateUser, uploadCertificates } from '../api/services/profile';

/* ── File list item ─────────────────────────────────── */
function StagedFile({ file, onRemove }) {
  const ext = file.name.split('.').pop().toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)', background: 'var(--bg)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
        background: 'var(--green-soft)', color: 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800,
      }}>{ext}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', truncate: true,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {(file.size / 1024).toFixed(0)} KB
        </div>
      </div>
      <button onClick={() => onRemove(file)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 4px',
        flexShrink: 0,
      }} aria-label="Remove file"><Icons.X size={14} /></button>
    </div>
  );
}

/* ── Dropzone ───────────────────────────────────────── */
function Dropzone({ files, onChange }) {
  const inputRef  = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (incoming) => {
    const next = [...files];
    Array.from(incoming).forEach(f => {
      if (!next.find(x => x.name === f.name && x.size === f.size)) next.push(f);
    });
    onChange(next);
  };

  const removeFile = (f) => onChange(files.filter(x => x !== f));

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${isDragging ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)', padding: '28px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: isDragging ? 'var(--green-soft)' : 'var(--bg)',
          transition: 'all .15s',
          marginBottom: files.length ? 12 : 0,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>📎</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
          Click to upload or drag files here
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          PDF, PNG, JPG, DOCX — multiple files supported
        </div>
      </div>
      <input
        ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
        style={{ display: 'none' }}
        onChange={e => addFiles(e.target.files)}
      />
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f, i) => <StagedFile key={i} file={f} onRemove={removeFile} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ProfileSetup — onboarding completion page
═══════════════════════════════════════════════════════ */
export default function ProfileSetup({ onDone }) {
  const { user, markProfileComplete, updateUserProfile } = useApp();
  const toast = useToast();

  const [designation, setDesignation] = useState(user?.designation ?? '');
  const [bio,         setBio]         = useState(user?.bio          ?? '');
  const [files,       setFiles]       = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [step,        setStep]        = useState('details'); // 'details' | 'saving'

  const handleSave = async () => {
    if (!designation.trim()) { toast.warning('Please add your designation.'); return; }
    setSaving(true);
    setStep('saving');
    let detailsSaved = false;

    try {
      await updateUser(user.id, {
        username:    user.name,
        email:       user.email,
        designation: designation.trim(),
        bio_desp:    bio.trim(),
      });
      updateUserProfile({ username: user.name, email: user.email,
        designation: designation.trim(), bio_desp: bio.trim() });
      detailsSaved = true;
    } catch (err) {
      toast.error(`Failed to save details: ${err.message}`);
      setSaving(false); setStep('details');
      return;
    }

    if (files.length > 0) {
      try {
        await uploadCertificates(files);
      } catch (err) {
        toast.warning('Profile saved, but certificate upload failed. You can retry from your profile page.');
      }
    }

    markProfileComplete();
    toast.success('Profile completed! Welcome aboard 🎉');
    onDone?.();
  };

  return (
    <div style={{
      minHeight: '100%', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-soft)', border: '2px solid var(--green-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>
            Complete your profile
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--slate)' }}>
            Just a few more details and you'll be all set.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {['Professional details', 'Certificates'].map((label, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--green-dim)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{saving ? '✓' : i + 1}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 500, textAlign: 'center' }}>{label}</div>
            </div>
          ))}
        </div>

        {saving ? (
          /* ── Saving state ── */
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid var(--border)',
              borderTop: '4px solid var(--green)', borderRadius: '50%',
              animation: 'spin .8s linear infinite', margin: '0 auto 20px',
            }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Saving your profile…
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {files.length > 0 ? 'Uploading certificates too, please wait.' : 'Almost done.'}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '28px 28px 32px' }}>

            {/* Section 1: Details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 16 }}>
                Professional details
              </div>

              <div className="auth-field">
                <label className="auth-field-label">
                  Designation <span style={{ color: 'var(--risk-high-text)' }}>*</span>
                </label>
                <input
                  type="text" className="input"
                  placeholder="e.g. Senior Privacy Consultant"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                />
              </div>

              <div className="auth-field" style={{ marginBottom: 0 }}>
                <label className="auth-field-label">Bio description</label>
                <textarea
                  className="input"
                  style={{ minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="A brief description about your expertise and background…"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

            {/* Section 2: Certificates */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 6 }}>
                Certificates &amp; credentials
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Optional — you can also upload these later from your profile.
              </div>
              <Dropzone files={files} onChange={setFiles} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
                onClick={() => { markProfileComplete(); onDone?.(); }}
              >
                Skip for now
              </button>
              <button
                className="btn btn-primary"
                style={{ height: 42, paddingInline: 28, fontSize: 14, fontWeight: 700 }}
                onClick={handleSave}
                disabled={saving}
              >
                Save &amp; continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
