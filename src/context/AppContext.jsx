/**
 * context/AppContext.jsx
 *
 * Auth + tenant flow:
 *   1. App mounts → initAuth() runs:
 *        a) No stored user / no token → authReady, show Landing
 *        b) Token expired             → clear session, authReady, show Login
 *        c) Valid access token        → authReady, show app
 *   2. login() → loginUser() (tokens) + validateUser() (role + user_id)
 *   3. tenant === null → TenantSelectModal shown over dashboard
 *   4. selectTenant() → stores tenant, fetches controls with tenant URL
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialControls, statusLabel }  from '../data/controls';
import { loginUser, validateUser } from '../api/services/auth';
import { fetchControls }           from '../api/services/controls';
import { tokenStore }              from '../api/config';
import { isTokenExpired }          from '../lib/jwt';
import { can }                     from '../lib/permissions';

const AppContext = createContext(null);
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

const MOCK_USERS = {
  'admin@appzlogic.com':    { pw: 'admin123',    name: 'Anshul Gupta',   role: 'Admin',    username: 'Anshul Gupta' },
  'reviewer@appzlogic.com': { pw: 'reviewer123', name: 'Priya Reviewer', role: 'Reviewer', username: 'Priya Reviewer' },
};

/* ── localStorage helpers ─────────────────────────────── */
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function drop(...keys) { keys.forEach(k => localStorage.removeItem(k)); }

/* ── Normalise any user shape → UI shape ──────────────── */
function normaliseUser(raw) {
  const name     = raw.username || raw.name || raw.email || 'User';
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return {
    id:              raw.id              ?? raw.user_id ?? null,
    name,
    initials,
    email:           raw.email          ?? '',
    role:            (raw.role          || 'User').toLowerCase(),
    company:         raw.company        ?? 'Appzlogic',
    plan:            raw.role           ?? 'User',
    designation:     raw.designation    ?? '',
    bio:             raw.bio_desp       ?? raw.bio ?? '',
    /* is_completed from API, profileComplete from localStorage cache */
    profileComplete: raw.is_completed   ?? raw.profileComplete ?? true,
  };
}

/* ── Map API human-readable status labels → internal snake_case ── */
const API_STATUS_MAP = {
  'pending review':   'pending_review',
  'in progress':      'in_progress',
  'implemented':      'implemented',
  'need discussion':  'needs_discussion',
  'needs discussion': 'needs_discussion',
  'blocked':          'blocked',
  'not applicable':   'not_applicable',
};
const KNOWN_STATUSES = new Set([
  'pending_review','in_progress','implemented','needs_discussion','blocked','not_applicable',
]);
function parseApiStatus(raw) {
  if (!raw) return null;
  if (KNOWN_STATUSES.has(raw)) return raw;
  return API_STATUS_MAP[String(raw).toLowerCase().trim()] ?? null;
}

/* ── Normalise API controls response → internal shape ─── */
function normaliseControls(res) {
  /* Unwrap { controls: [...], compliance_percentage: ... } envelope */
  if (!Array.isArray(res) && Array.isArray(res?.controls)) res = res.controls;

  /* ── New grouped format: [{ Management: { controls:[...], total, completed, progress_percentage } }, ...] ── */
  if (Array.isArray(res) && res.length > 0) {
    const firstKey = res[0] && typeof res[0] === 'object' ? Object.keys(res[0])[0] : null;
    if (firstKey && Array.isArray(res[0][firstKey]?.controls)) {
      const flat = [];
      res.forEach(item => {
        const principle = Object.keys(item)[0];
        ;(item[principle].controls || []).forEach((c, ci) => {
          flat.push({
            id:             c.id     ?? c.control_id  ?? `${principle}-${ci}`,
            obl:            principle,
            oblId:          c.obligation  ?? c.obligation_id ??'',
            name:           c.control ?? c.name ?? c.title ?? c.control_name ?? '',
            req:            c.req    ?? c.reference   ?? c.dpdpa_ref     ?? '',
            desc:           c.desc   ?? c.description ?? c.control ?? '',
            status:         parseApiStatus(c.control_status ?? c.status) ?? 'pending_review',
            remarks:        c.remarks        ?? c.remark        ?? '',
            recommendation: c.recommendation ?? '',
            docs:           Array.isArray(c.docs) ? c.docs : [],
            acts:           Array.isArray(c.acts) ? c.acts : [],
          });
        });
      });
      return flat.length > 0 ? flat : null;
    }
  }

  /* ── Flat array or DRF { results: [...] } format ── */
  const raw = Array.isArray(res) ? res : (Array.isArray(res?.results) ? res.results : null);
  if (!raw || raw.length === 0) return null;
  const mapped = raw.map((c) => ({
    id:             c.id     ?? c.control_id  ?? '',
    obl:            c.obl    ?? c.obligation  ?? c.obligation_id ?? c.gapp_principle ?? '',
    name:           c.control ?? c.name ?? c.title ?? c.control_name ?? c.description ?? '',
    req:            c.req    ?? c.reference   ?? c.dpdpa_ref     ?? '',
    desc:           c.desc   ?? c.description ?? c.control ?? '',
    status:         parseApiStatus(c.control_status ?? c.status) ?? 'pending_review',
    remarks:        c.remarks        ?? c.remark        ?? '',
    recommendation: c.recommendation ?? '',
    docs:           Array.isArray(c.docs) ? c.docs : [],
    acts:           Array.isArray(c.acts) ? c.acts : [],
  }));
  return mapped.length > 0 ? mapped : null;
}

/* ── Optimistic user restore (sync, no clearing) ─────── */
function restoreUser() {
  const stored = load('az_user', null);
  if (!stored) return null;
  if (MOCK_ENABLED) return stored;
  /* Return stored user as-is — initAuth() will validate async */
  return tokenStore.getAccess() || tokenStore.getRefresh() ? stored : null;
}

/* ════════════════════════════════════════════════════════
   Provider
═══════════════════════════════════════════════════════ */
export function AppProvider({ children }) {
  const [user,        setUser]        = useState(restoreUser);
  const [tenant,      setTenant]      = useState(() => load('az_tenant', null));
  const [controls,        setControls]        = useState([]);
  const [controlsLoading, setControlsLoading] = useState(true);
  const [controlsError,   setControlsError]   = useState(null);
  const [authLoading,         setAuthLoading]         = useState(false);
  const [authReady,           setAuthReady]           = useState(false);
  const [sessionExpiredOnLoad, setSessionExpiredOnLoad] = useState(false);

  /* ── Async session validation on startup ──────────────
     Runs once on mount. Three outcomes:
       • token valid   → keep user, authReady
       • token expired + refresh ok → silent refresh, authReady
       • no valid tokens → clear session, authReady
  ─────────────────────────────────────────────────────── */
  useEffect(() => {
    function initAuth() {
      if (MOCK_ENABLED) { setAuthReady(true); return; }

      const stored = load('az_user', null);
      const access = tokenStore.getAccess();

      /* No session or token expired → clear and go to login */
      if (!stored || !access || isTokenExpired(access)) {
        /* Had tokens that are now expired → flag for session-expired message */
        const hadSession = !!stored && !!access;
        tokenStore.clearAll();
        drop('az_user', 'az_tenant');
        setUser(null); setTenant(null);
        if (hadSession) setSessionExpiredOnLoad(true);
        setAuthReady(true);
        return;
      }

      /* Valid token — restore session */
      setAuthReady(true);
    }

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch controls when user + tenant are available */
  useEffect(() => {
    /* Mock mode — demo controls so the assessment pages can be previewed without the backend */
    if (MOCK_ENABLED) {
      setControls(user && tenant ? createInitialControls() : []);
      setControlsLoading(false);
      return;
    }
    if (!user || !tenant) {
      setControlsLoading(false);
      return;
    }
    let cancelled = false;
    setControlsLoading(true);
    setControlsError(null);
    fetchControls(tenant.url)
      .then((res) => {
        if (cancelled) return;
        setControls(normaliseControls(res) ?? []);
      })
      .catch((err) => {
        if (!cancelled) setControlsError(err.message ?? 'Failed to load controls.');
      })
      .finally(() => {
        if (!cancelled) setControlsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Axios 401 event → clear session */
  useEffect(() => {
    const handler = () => {
      setUser(null); setTenant(null);
      tokenStore.clearAll();
      drop('az_user', 'az_tenant');
      window.location.hash = '';
    };
    window.addEventListener('az:session-expired', handler);
    return () => window.removeEventListener('az:session-expired', handler);
  }, []);

  /* ── Login ────────────────────────────────────────────
     Step 1 — loginUser()    → tokens + basic user
     Step 2 — validateUser() → confirmed role + user_id
  ─────────────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      let userData;

      if (MOCK_ENABLED) {
        const e    = email.trim().toLowerCase();
        const mock = Object.entries(MOCK_USERS).find(
          ([k, v]) => k.toLowerCase() === e && v.pw === password,
        );
        if (!mock) return { success: false, error: 'Invalid email or password.' };
        const [, md] = mock;
        userData = { email: e, ...md };
        tokenStore.setTokens('mock-access', 'mock-refresh');
      } else {
        const result = await loginUser({ email: email.trim(), password });
        userData = result.user;
        try {
          const validation = await validateUser();
          userData = {
            ...userData,
            id:           validation.user_id    ?? userData.id,
            role:         validation.role        ?? userData.role,
            is_completed: validation.is_completed ?? true,
          };
        } catch { /* proceed with login-response data on validation failure */ }
      }

      const u = normaliseUser(userData);
      setUser(u);
      save('az_user', u);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  /* ── Mark profile complete (called after setup page saves) ── */
  const markProfileComplete = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, profileComplete: true };
      save('az_user', updated);
      return updated;
    });
  }, []);

  /* ── Update user profile fields in context + localStorage ── */
  const updateUserProfile = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const name     = updates.username || prev.name;
      const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const updated  = { ...prev, name, initials,
        email:       updates.email       ?? prev.email,
        designation: updates.designation ?? prev.designation,
        bio:         updates.bio_desp    ?? prev.bio,
      };
      save('az_user', updated);
      return updated;
    });
  }, []);

  /* ── Logout ───────────────────────────────────────────── */
  const logout = useCallback(() => {
    tokenStore.clearAll();
    setUser(null); setTenant(null);
    drop('az_user', 'az_tenant');
    window.location.hash = '';
  }, []);

  /* ── Select tenant ────────────────────────────────────── */
  const selectTenant = useCallback((tenantObj) => {
    setTenant(tenantObj);
    save('az_tenant', tenantObj);
  }, []);

  /* ── Permissions ──────────────────────────────────────── */
  const permissions = useCallback(() => can(user), [user]);

  /* ── Control mutations ────────────────────────────────── */
  const updateStatus = useCallback((ctrlId, newStatus) => {
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      return {
        ...c, status: newStatus,
        acts: [...c.acts, {
          id: 'e' + Date.now(), type: 'status',
          user: user?.name ?? 'Admin', role: user?.role ?? 'admin',
          at: new Date().toISOString(),
          msg: `Status: ${statusLabel(c.status)} → ${statusLabel(newStatus)}`,
        }],
      };
    }));
  }, [user]);

  const addComment = useCallback((ctrlId, text) => {
    if (!text.trim()) return;
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      return {
        ...c,
        acts: [...c.acts, {
          id: 'e' + Date.now(), type: 'comment',
          user: user?.name ?? 'User', role: user?.role ?? 'user',
          at: new Date().toISOString(), msg: text.trim(),
        }],
      };
    }));
  }, [user]);

  const requestHelp = useCallback((ctrlId) => {
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      return {
        ...c,
        acts: [...c.acts, {
          id: 'e' + Date.now(), type: 'request',
          user: user?.name ?? 'User', role: user?.role ?? 'user',
          at: new Date().toISOString(),
          msg: '🆘 Help requested — please advise on the next steps to implement this control.',
        }],
      };
    }));
  }, [user]);

  const addDocument = useCallback((ctrlId, doc) => {
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      return {
        ...c, docs: [...c.docs, doc],
        acts: [...c.acts, {
          id: 'e' + Date.now(), type: 'upload',
          user: user?.name ?? 'User', role: user?.role ?? 'user',
          at: new Date().toISOString(),
          msg: `Uploaded ${doc.name} (v${doc.ver} · ${doc.size})`,
        }],
      };
    }));
  }, [user]);

  const updateDocStatus = useCallback((ctrlId, docId, docStatus) => {
    setControls(prev => prev.map(c => {
      if (c.id !== ctrlId) return c;
      const doc = c.docs.find(d => d.id === docId);
      return {
        ...c,
        docs: c.docs.map(d => d.id === docId ? { ...d, status: docStatus } : d),
        acts: [...c.acts, {
          id: 'e' + Date.now(), type: 'comment',
          user: user?.name ?? 'Admin', role: 'admin',
          at: new Date().toISOString(),
          msg: docStatus === 'approved'
            ? `✓ Document "${doc?.name}" (v${doc?.ver}) approved.`
            : `⚠ "${doc?.name}" needs revision. Please re-upload.`,
        }],
      };
    }));
  }, [user]);

  const complianceScore = useCallback(() => {
    const done = controls.filter(c => c.status === 'implemented' || c.status === 'not_applicable').length;
    return Math.round((done / controls.length) * 100);
  }, [controls]);

  const priorityControls = useCallback(() =>
    controls.filter(c => c.status === 'blocked' || c.status === 'needs_discussion'),
  [controls]);

  return (
    <AppContext.Provider value={{
      user, authLoading, authReady, sessionExpiredOnLoad,
      login, logout, permissions,
      markProfileComplete, updateUserProfile,
      tenant, selectTenant,
      controls, controlsLoading, controlsError,
      updateStatus, addComment, requestHelp, addDocument, updateDocStatus,
      complianceScore, priorityControls,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
