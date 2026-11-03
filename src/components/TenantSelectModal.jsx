import { useState, useEffect } from 'react';
import { useApp }       from '../context/AppContext';
import { fetchTenants } from '../api/services/tenants';

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M9 3v18M15 3v18M3 9h18M3 15h18"/>
    </svg>
  );
}

export default function TenantSelectModal() {
  const { user, selectTenant, logout } = useApp();

  const [tenants,   setTenants]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    fetchTenants()
      .then(setTenants)
      .catch((err) => setError(err?.message ?? 'Failed to load workspaces.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (tenant) => {
    if (selecting) return;
    setSelecting(tenant.id);
    selectTenant(tenant);
    /* Modal unmounts automatically once AppContext sets tenant */
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,10,10,0.55)',
      backdropFilter: 'blur(3px)',
      zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} className="app-modal-overlay">
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--r-lg)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: 520,
        padding: '40px 36px 36px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--green-soft)',
            border: '1px solid var(--green-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--green-dim)', marginBottom: 16,
          }}>
            <BuildingIcon />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', margin: '0 0 6px' }}>
            Select your workspace
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--slate)', margin: 0, lineHeight: 1.55 }}>
            Welcome back, <strong>{user?.name}</strong>. Choose the tenant workspace
            you want to review compliance for.
          </p>
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--slate)', fontSize: 14 }}>
            <span className="btn-spinner" style={{ marginRight: 8 }} />
            Loading workspaces…
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', fontSize: 13, padding: '10px 14px',
            borderRadius: 'var(--r-md)', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 0 16px',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#FEF3C7', border: '1px solid #FDE68A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 22,
            }}>
              ⚠
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--black)', margin: '0 0 8px' }}>
              No tenant assigned
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--slate)', margin: '0 0 24px', lineHeight: 1.55 }}>
              Your account has no workspaces assigned.<br />
              Please contact your administrator.
            </p>
            <button
              onClick={logout}
              style={{
                padding: '9px 22px',
                background: 'var(--white)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r-md)',
                fontSize: 13.5, fontWeight: 600,
                color: 'var(--black)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Close &amp; Sign out
            </button>
          </div>
        )}

        {!loading && tenants.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tenants.map((t) => {
              const isSelecting = selecting === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  disabled={!!selecting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: isSelecting ? 'var(--green-soft)' : 'var(--white)',
                    border: `1.5px solid ${isSelecting ? 'var(--green-mid)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    cursor: selecting ? 'not-allowed' : 'pointer',
                    textAlign: 'left', width: '100%',
                    fontFamily: 'inherit',
                    transition: 'border-color .15s, background .15s',
                    opacity: selecting && !isSelecting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!selecting) {
                      e.currentTarget.style.borderColor = 'var(--green-mid)';
                      e.currentTarget.style.background  = 'var(--green-soft)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelecting) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background  = 'var(--white)';
                    }
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--green)', color: 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 2 }}>
                      {t.name}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: 'var(--slate)', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    )}
                  </div>

                  {/* State indicator */}
                  {isSelecting
                    ? <span className="btn-spinner" />
                    : <span style={{ fontSize: 16, color: 'var(--muted)' }}>›</span>
                  }
                </button>
              );
            })}
          </div>
        )}

        {/* Footer hint */}
        {!loading && tenants.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
            You can switch workspaces at any time from settings.
          </p>
        )}
      </div>
    </div>
  );
}
