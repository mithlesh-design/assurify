/**
 * api/services/vendorControls.js
 *
 * Activity (comments / documents / observations) for a single vendor
 * sub-control — shown in the VendorControlPanel side overlay.
 *
 * Comments + document list now hit real endpoints (see endpoints.js,
 * VENDOR_CONTROL.*). Document upload and observation save are still
 * pending backend work — those endpoint factories return '' and the
 * calls below are guarded by requireEndpoint() so the UI fails fast with
 * a friendly message instead of firing a request to an empty path.
 */

import api,{ tenantApi } from '../config';
import { ENDPOINTS }  from '../endpoints';

/* Generic tenant-service comment system also serves Control / Vendor
   entities — Vendor_Control distinguishes a vendor sub-control comment. */
const EVENT_TYPE = 'Vendor_Control';

function requireEndpoint(path) {
  if (!path) {
    throw new Error('This feature is not available yet — the API endpoint has not been configured.');
  }
  return path;
}

/* GET /v1/tenant-service/comments/vendor-control/{control_id} → [comment, ...] */
export async function getVendorControlComments(vendorControlId) {
  const base = ENDPOINTS.VENDOR_CONTROL.COMMENTS_LIST(vendorControlId);
  const { data } = await api.get(`${base}/${vendorControlId}`, {
    // params: { event_type: EVENT_TYPE },
  });
  return data;
}

/* POST /v1/tenant-service/comments/vendor-control/{control_id}  { comment, control_id } */
export async function createVendorControlComment(vendorControlId, comment) {
  const base = ENDPOINTS.VENDOR_CONTROL.COMMENT_CREATE(vendorControlId);
  const { data } = await api.post(
    `${base}/${vendorControlId}`,
    { comment, control_id: vendorControlId },
    { params: { event_type: EVENT_TYPE } },
  );
  return data;
}

/* GET /v1/file-manager/vendor-control/{control_id} → [file, ...] */
export async function listVendorControlDocuments(vendorControlId) {
  const base = ENDPOINTS.VENDOR_CONTROL.DOCS_LIST(vendorControlId);
  const { data } = await tenantApi.get(`${base}/${vendorControlId}`);
  return data;
}

/* POST multipart/form-data { payload, evidence_file } */
export async function uploadVendorControlDocument(vendorControlId, file) {
  const endpoint = requireEndpoint(ENDPOINTS.VENDOR_CONTROL.DOC_UPLOAD(vendorControlId));
  const formData = new FormData();
  formData.append('payload', JSON.stringify({ vendor_control_id: vendorControlId }));
  formData.append('evidence_file', file);
  const { data } = await tenantApi.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/* Document download reuses the same file-manager GET-by-id endpoint as
   the DPDPA assessment panel — see api/services/fileManager.js::downloadFile */

/* PATCH { remarks, recommendation } */
export async function saveVendorControlObservation(vendorControlId, remarks, recommendation) {
  const endpoint = requireEndpoint(ENDPOINTS.VENDOR_CONTROL.OBSERVATION(vendorControlId));
  const { data } = await tenantApi.patch(endpoint, { remarks, recommendation });
  return data;
}
