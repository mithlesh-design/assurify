import { useState, useEffect } from 'react';
import { useApp }       from '../context/AppContext';
import { fetchTenants } from '../api/services/tenants';
import { Button, EmptyState, ErrorState, Icons, LoadingState, Modal } from '../ui';

/**
 * Workspace (tenant) chooser.
 * Shown after sign-in until a workspace is chosen, and again from the sidebar's
 * "Switch workspace" action — in that case `onCancel` returns to the current one.
 */
export default function TenantSelectModal({ onCancel, onDone, currentId }) {
  const { user, selectTenant, logout } = useApp();

  const [tenants,   setTenants]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error,     setError]     = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchTenants()
      .then(setTenants)
      .catch((err) => setError(err?.message ?? 'Failed to load workspaces.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSelect = (tenant) => {
    if (selecting) return;
    setSelecting(tenant.id);
    selectTenant(tenant);
    onDone?.(tenant);
    /* First-run: the modal unmounts automatically once AppContext sets the tenant */
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <Modal
      title={onCancel ? 'Switch workspace' : 'Choose your workspace'}
      subtitle={onCancel
        ? 'Pick the client workspace you want to work in.'
        : `Welcome${firstName ? `, ${firstName}` : ''}. Choose the client workspace you want to review.`}
      icon={<Icons.Building size={18} />}
      onClose={onCancel}
      dismissible={!!onCancel}
      size="md"
      footer={onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
    >
      {loading && <LoadingState compact label="Loading workspaces…" />}

      {error && <ErrorState title="Couldn't load your workspaces" message={error} onRetry={load} />}

      {!loading && !error && tenants.length === 0 && (
        <EmptyState
          compact
          icon={<Icons.Building size={20} />}
          title="No workspace assigned yet"
          description="Your account doesn't have a client workspace yet. Ask your administrator to assign one, then sign in again."
          action={<Button onClick={logout} icon={<Icons.Signout size={15} />}>Sign out</Button>}
        />
      )}

      {!loading && tenants.length > 0 && (
        <ul className="choice-list" aria-label="Workspaces">
          {tenants.map((t) => {
            const isSelecting = selecting === t.id;
            const isCurrent = currentId != null && String(currentId) === String(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={`choice-item${isSelecting || isCurrent ? ' is-selected' : ''}`}
                  onClick={() => (isCurrent ? onCancel?.() : handleSelect(t))}
                  disabled={!!selecting && !isSelecting}
                  aria-busy={isSelecting || undefined}
                  aria-current={isCurrent || undefined}
                >
                  <span className="choice-avatar" aria-hidden="true">{t.name.slice(0, 2).toUpperCase()}</span>
                  <span className="choice-body">
                    <span className="choice-title">{t.name}{isCurrent && <span className="choice-tag">Current</span>}</span>
                    {t.description && <span className="choice-sub">{t.description}</span>}
                  </span>
                  {isSelecting
                    ? <span className="loading-spinner" aria-hidden="true" />
                    : <Icons.ChevronRight size={16} className="choice-arrow" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && tenants.length > 1 && !onCancel && (
        <p className="field-hint" style={{ textAlign: 'center', marginTop: 16 }}>
          You can switch workspaces later from the menu.
        </p>
      )}
    </Modal>
  );
}
