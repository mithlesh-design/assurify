/**
 * lib/permissions.js
 *
 * Role-based permission helpers for the admin portal.
 *
 * Backend role values (case-insensitive match):
 *   "Admin"    — full access
 *   "Reviewer" — can review controls, approve/reject docs, update statuses
 *   "User"     — read-only + can comment and upload (no status/approval powers)
 *
 * Usage:
 *   import { can } from '../lib/permissions';
 *   if (can(user).updateStatus()) { ... }
 */

/* Normalise role to lowercase for comparison */
const role = (user) => (user?.role || '').toLowerCase();

export function can(user) {
  const r = role(user);

  return {
    /* Status management */
    updateControlStatus: () => r === 'admin' || r === 'reviewer',

    /* Document workflow */
    approveDocument:     () => r === 'admin' || r === 'reviewer',
    rejectDocument:      () => r === 'admin' || r === 'reviewer',
    uploadDocument:      () => true, // all roles can upload

    /* Comments */
    addComment:          () => true, // all roles can comment
    requestHelp:         () => r !== 'admin', // admin doesn't request help

    /* User management (Admin only) */
    manageUsers:         () => r === 'admin',
    inviteUsers:         () => r === 'admin',

    /* Reports */
    viewReport:          () => true,
    exportReport:        () => r === 'admin' || r === 'reviewer',
  };
}

/**
 * Returns a display label + colour for each role.
 * Useful for badges in the UI.
 */
export const ROLE_META = {
  admin:    { label: 'Admin',    color: '#00C853', bg: '#E8FAF0', border: '#AAEDC9' },
  reviewer: { label: 'Reviewer', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  user:     { label: 'User',     color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
};

export function getRoleMeta(user) {
  return ROLE_META[role(user)] ?? ROLE_META.user;
}

/** True if the user has ANY elevated admin-portal access */
export function isAdminPortalUser(user) {
  const r = role(user);
  return r === 'admin' || r === 'reviewer' || r === 'user';
}
