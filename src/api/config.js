/**
 * api/config.js
 *
 * Two axios instances — one per backend:
 *
 *   api        → Main API  (BASE_URL / Django DRF)    → Authorization: Bearer <token>
 *   tenantApi  → Tenant API (FastAPI)                  → token: <value>
 *
 * Both share:
 *   • session-expiry on 401 (clears tokens, fires az:session-expired)
 *   • normaliseError → human-readable message (handles DRF + FastAPI error shapes)
 */

import axios from 'axios';

/* ── Base URLs (from .env) ────────────────────────────── */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const TENANT_URL = import.meta.env.VITE_TENANT_API_URL;

const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

/* ── Token storage ────────────────────────────────────── */
const TOKEN_KEYS = { access: 'az_access_token', refresh: 'az_refresh_token' };

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.access),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.refresh),
  setAccess: (t) => localStorage.setItem(TOKEN_KEYS.access, t),
  setRefresh: (t) => localStorage.setItem(TOKEN_KEYS.refresh, t),
  setTokens: (a, r) => { tokenStore.setAccess(a); if (r) tokenStore.setRefresh(r); },
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
    localStorage.removeItem('az_user');
  },
};

/* ── Axios instances ──────────────────────────────────── */

// Main API — Django DRF, uses  Authorization: Bearer <token>
const api = axios.create({ baseURL: BASE_URL, timeout: TIMEOUT, headers: DEFAULT_HEADERS });

// Tenant API — FastAPI, uses  token: <value>
export const tenantApi = axios.create({ baseURL: TENANT_URL, timeout: TIMEOUT, headers: DEFAULT_HEADERS });

/* ── Request interceptors — attach token per convention ── */

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['token'] = token;   // FastAPI endpoints expect this
  }
  return config;
});

tenantApi.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers['token'] = token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── 401 → session-expired ────────────────────────────── */

function attachSessionInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      /* Only fire session-expired if the user had an active session.
         This prevents the event from firing on a failed login attempt. */
      if (error.response?.status === 401 && tokenStore.getAccess()) {
        tokenStore.clearAll();
        window.dispatchEvent(new Event('az:session-expired'));
      }
      return Promise.reject(normaliseError(error));
    },
  );
}

attachSessionInterceptor(api);
attachSessionInterceptor(tenantApi);

/* ── Error normalisation ──────────────────────────────── */

/**
 * Converts a raw Axios error into a plain Error with a human-readable message.
 * Handles both Django DRF and FastAPI/Pydantic error shapes.
 */
export function normaliseError(error) {
  if (!error.response) {
    const msg = error.code === 'ECONNABORTED'
      ? 'Request timed out. Please try again.'
      : 'Network error. Check your connection.';
    const e = new Error(msg); e.status = 0; return e;
  }

  const { status, data } = error.response;
  const detail = data?.detail;

  const message =
    /* FastAPI / Pydantic — detail is an array of validation errors */
    (Array.isArray(detail)
      ? detail.map((d) => `${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join('; ')
      : detail
    ) ||
    /* Django DRF — non_field_errors array */
    data?.non_field_errors?.[0] ||
    /* plain string body */
    (typeof data === 'string' ? data : null) ||
    /* DRF field-level errors  { field: ["msg"] } */
    Object.values(data || {})?.[0]?.[0] ||
    `Server error (${status})`;

  const e = new Error(message);
  e.status = status;
  e.data = data;
  return e;
}

export default api;
