/**
 * api/services/comments.js — Admin Portal
 *
 * Comments live on the Customer API (port 8001 / tenantApi).
 * Both admin/reviewer and customer comments go through the same endpoints.
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* POST /v1/comments  { comment, control_id } */
export async function createComment(control_id, comment) {
  const { data } = await api.post(
    ENDPOINTS.COMMENTS.CREATE,
    { comment, control_id },
    { params: { event_type: 'Control' } },
  );
  return data;
}

/* GET /v1/comments/control/{control_id} */
export async function getComments(control_id) {
  const { data } = await api.get(`${ENDPOINTS.COMMENTS.LIST}/control/${control_id}`, {
    params: { event_type: 'Control' },
  });
  return data;
}
