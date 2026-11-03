/**
 * api/services/auth.js
 *
 * Authentication API calls.
 * Returns normalised payloads; throws normalised errors (api/config.js).
 */

import api, { tenantApi, tokenStore } from '../config';
import { ENDPOINTS }        from '../endpoints';
import { getUserFromToken }  from '../../lib/jwt';
import { createDemoUsers }   from '../../data/meetEvidence';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — sample users so the admin portal can be previewed. */
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

/* ── Login ──────────────────────────────────────────────
   POST /auth/login/?mfa=false
   Body:     { email, password }
   Response: { access, refresh }
             OR { access, refresh, user: { id, email, username, role } }

   Strategy (no separate /profile/ endpoint required):
     1. Use data.user if the backend includes it.
     2. Decode the JWT payload for email / username / role.
     3. Fall back to { email } only — AppContext normalises gaps.
─────────────────────────────────────────────────────── */
export async function loginUser({ email, password, mfa = false }) {
  const { data } = await api.post(
    `${ENDPOINTS.AUTH.LOGIN}?mfa=${mfa}`,
    { email, password },
  );

  /* Normalise token field names — backends vary: access / access_token / token */
  const access  = data.access  ?? data.access_token  ?? data.token;
  const refresh = data.refresh ?? data.refresh_token;

  if (!access) throw new Error('Login response did not include an access token.');

  tokenStore.setTokens(access, refresh);

  /* Resolve user without calling a separate /profile/ endpoint */
  const user =
    data.user ??
    getUserFromToken(access) ??
    { email, username: email, role: 'User' };

  return { access, refresh, user };
}

/* ── Register ───────────────────────────────────────────
   POST /auth/register/
   Body: { email, username, role, password }
─────────────────────────────────────────────────────── */
export async function registerUser({ email, username, role, password }) {
  const { data } = await api.post(ENDPOINTS.AUTH.REGISTER, {
    email, username, role, password,
  });
  return data; // { id, email, username, role }
}

/* ── List users (admin only) ────────────────────────────
   GET /v1/auth/users/
   Returns all users excluding admins.
─────────────────────────────────────────────────────── */
export async function fetchUsers() {
  const data = MOCK_ENABLED ? createDemoUsers() : (await api.get(ENDPOINTS.AUTH.USERS)).data;
  const raw = Array.isArray(data) ? data : (data?.results ?? data?.users ?? []);
  return raw
    .filter(u => (u.role ?? '').toLowerCase() !== 'admin')
    .map(u => {
      const name     = u.username ?? u.name ?? u.email ?? 'User';
      const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      return {
        id:          String(u.id ?? u.user_id ?? Math.random()),
        name,
        initials,
        email:       u.email       ?? '',
        role:        (u.role       ?? 'user').toLowerCase(),
        isActive:    u.is_active   ?? u.active ?? true,
        designation: u.designation ?? u.job_title ?? null,
        rating:      u.rating      ?? u.score    ?? null,
        bio:         u.bio_desp    ?? u.bio      ?? null,
        joinedAt:    u.created_at  ?? u.date_joined ?? null,
      };
    });
}

/* ── Validate session ───────────────────────────────────
   POST /v1/auth/validate/
   Called immediately after login (tokens already set).
   Returns { role, user_id } — used to confirm role and get canonical user id.
─────────────────────────────────────────────────────── */
export async function validateUser() {
  const { data } = await api.get(ENDPOINTS.AUTH.VALIDATE);
  return data; // { role, user_id, ... }
}

