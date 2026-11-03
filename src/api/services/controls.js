/**
 * api/services/controls.js
 *
 * All control calls use the Tenant API instance (FastAPI · token header).
 *
 * tenantUrl (optional): absolute base URL for the selected tenant's server.
 *   When provided  → absolute URL e.g. http://tenant1.example.com/v1/controls/
 *   When omitted   → relative path, tenantApi.baseURL applies
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — control reviews are applied locally by AppContext only. */
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

const url = (tenantUrl, endpoint) =>
  tenantUrl ? `${tenantUrl}${endpoint}` : endpoint;

/* GET /v1/controls/ */
export async function fetchControls(tenantUrl) {
  const { data } = await api.get(url(tenantUrl, ENDPOINTS.CONTROLS.LIST));
  return data;
}

/* GET /v1/controls/?gapp_principle=<GapPrinciple> */
export async function fetchControlsByPrinciple(gappPrinciple, tenantUrl) {
  const { data } = await api.get(url(tenantUrl, ENDPOINTS.CONTROLS.LIST), {
    params: { gapp_principle: gappPrinciple },
  });
  return data;
}

/* Maps internal snake_case values → API enum labels */
const STATUS_API_LABEL = {
  pending_review: 'Pending Review',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  needs_discussion: 'Need Discussion',
  not_applicable: 'Not Applicable',
};

/* PATCH /v1/control-framework/tenant-service/{control_id}/review */
export async function reviewControl(controlId, controlStatus, tenantUrl) {
  if (MOCK_ENABLED) return { control_id: controlId, control_status: controlStatus };
  const endpoint = ENDPOINTS.CONTROLS.REVIEW(controlId);
  const { data } = await api.patch(
    tenantUrl ? `${tenantUrl}${endpoint}` : endpoint,
    { control_status: STATUS_API_LABEL[controlStatus] ?? controlStatus },
  );
  return data;
}

/* PATCH /v1/control-framework/tenant-service/{control_id}/review — observation & recommendation only */
export async function saveObservationRecommendation(controlId, remarks, recommendation, tenantUrl) {
  if (MOCK_ENABLED) return { control_id: controlId, remarks, recommendation };
  const endpoint = ENDPOINTS.CONTROLS.REVIEW(controlId);
  const { data } = await api.patch(
    tenantUrl ? `${tenantUrl}${endpoint}` : endpoint,
    { remarks, recommendation },
  );
  return data;
}
