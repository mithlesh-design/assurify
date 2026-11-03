import { useApp } from '../context/AppContext';

export default function ProfileIncompleteModal({ onComplete, onDismiss }) {
  const { user } = useApp();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} className="app-modal-overlay">
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(2px)' }} />

      {/* Card */}
      <div style={{
        position: 'relative', background: 'var(--white)',
        borderRadius: 'var(--r-lg)', padding: '40px 36px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        textAlign: 'center', animation: 'fadeUp .25s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--green-soft)', border: '2px solid var(--green-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>
          Complete your profile
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6 }}>
          Hi {user?.name?.split(' ')[0] ?? 'there'}! Add your designation, bio and certificates to
          get the most out of Appzlogic.
        </p>

        {/* Steps preview */}
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--r-md)',
          padding: '14px 18px', marginBottom: 28, textAlign: 'left',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {[
            { n: '1', label: 'Add designation & bio description' },
            { n: '2', label: 'Upload certificates & credentials' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--green)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>{s.n}</div>
              <span style={{ fontSize: 13, color: 'var(--ink)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15, fontWeight: 700 }}
            onClick={onComplete}
          >
            Complete profile →
          </button>
          {/* <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', height: 40, fontSize: 13 }}
            onClick={onDismiss}
          >
            Remind me later
          </button> */}
        </div>
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
