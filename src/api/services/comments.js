/**
 * api/services/comments.js — Admin Portal
 *
 * Comments live on the Customer API (port 8001 / tenantApi).
 * Both admin/reviewer and customer comments go through the same endpoints.
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — comments are kept in memory per control. */
const demoComments = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ? {} : null;

/* POST /v1/comments  { comment, control_id } */
export async function createComment(control_id, comment) {
  if (demoComments) {
    let author = 'You';
    try { author = JSON.parse(localStorage.getItem('az_user'))?.name ?? author; } catch { /* keep default */ }
    const entry = { id: `demo-c${Date.now()}`, comment, control_id, username: author, created_at: new Date().toISOString() };
    demoComments[control_id] = [...(demoComments[control_id] ?? []), entry];
    return entry;
  }
  const { data } = await api.post(
    ENDPOINTS.COMMENTS.CREATE,
    { comment, control_id },
    { params: { event_type: 'Control' } },
  );
  return data;
}

/* GET /v1/comments/control/{control_id} */
export async function getComments(control_id) {
  if (demoComments) return [...(demoComments[control_id] ?? [])];
  const { data } = await api.get(`${ENDPOINTS.COMMENTS.LIST}/control/${control_id}`, {
    params: { event_type: 'Control' },
  });
  return data;
}
