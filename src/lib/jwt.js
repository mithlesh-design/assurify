/**
 * lib/jwt.js
 *
 * Client-side JWT utilities.
 *
 * NOTE: These helpers decode the token payload WITHOUT signature
 * verification — that stays on the server.  They are only used to:
 *   1. Check whether the stored access token is already expired
 *      so we can skip a doomed API call.
 *   2. Extract basic user fields (email, role) when the login
 *      response does not include a separate `user` object.
 */

/**
 * Decode the payload of a JWT (base64url → JSON).
 * Returns null if the token is missing or malformed.
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const base64 = token
      .split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true when the access token is expired (or missing / malformed).
 * Adds a 30-second buffer so we refresh slightly before true expiry.
 */
export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp - 30) * 1000;
}

/**
 * Try to extract a minimal user object from the access token payload.
 * Returns null if the token doesn't carry the needed fields.
 *
 * Works with standard SimpleJWT custom claims and dj-rest-auth patterns.
 */
export function getUserFromToken(token) {
  const p = decodeJwt(token);
  if (!p) return null;

  const email = p.email ?? null;
  const username =
    p.username ?? p.name ?? p.full_name ?? email ?? 'Unknown';
  const role = p.role ?? p.user_role ?? 'User';

  return {
    id:       p.user_id ?? p.id ?? p.sub ?? null,
    email,
    username,
    role,
  };
}
