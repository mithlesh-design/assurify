/**
 * api/endpoints.js — single source of truth for every API path.
 *
 *   Main API   (BASE_URL   · Django DRF)   → auth
 *   Tenant API (TENANT_URL · FastAPI)       → controls, tenants
 */

export const ENDPOINTS = {

  /* ════════════════════════════════════════════════════════
     MAIN API  (api instance · Authorization: Bearer)
  ════════════════════════════════════════════════════════ */

  AUTH: {
    LOGIN: '/v1/auth/login/',                      // POST  { email, password }         → { access, refresh, user }
    REGISTER: '/v1/auth/register/',                   // POST  { email, username, role, password }
    VALIDATE: '/v1/auth/validate-user',               // GET   (token in header)            → { role, user_id, is_completed }
    USERS: '/v1/auth/users/',                      // GET   → [{ id, username, email, role, is_active }]
    USER: (id) => `/v1/auth/users/${id}`,         // GET / PATCH  { username, email, designation, rating, bio_desp }
  },

  PROFILE: {
    UPLOAD_CERT: '/v1/upload-certificate',            // POST multipart/form-data  { certificate_files[] }
    USER_FILES: '/v1/files/user',                    // GET  ?user_id=<id>        → [{ id, file_name, file_url, ... }]
    DELETE_FILE: (id) => `/v1/files/${id}`,           // DELETE /v1/files/{file_id}
  },

  /* ════════════════════════════════════════════════════════
     TENANT API  (tenantApi instance · token: <value>)
  ════════════════════════════════════════════════════════ */

  TENANTS: {
    LIST: '/v1/tenant/',                     // GET → [{ id, name, url, ... }]
    QUESTIONNAIRE: '/v1/tenant/tenant-questionare/',  // GET → [{ question, answer, category, ... }]
  },

  CONTROLS: {
    LIST: '/v1/tenant/tenant-service/controls',                                                           // GET  ?gapp_principle=<value>
    REVIEW: (id) => `/v1/control-framework/tenant-service/${id}/review`,             // PATCH { control_status }
  },

  COMMENTS: {
    CREATE: '/v1/control-framework/tenant-service/comments',              // POST { comment, control_id }   → comment object
    LIST: '/v1/control-framework/tenant-service/comments',              // GET  ?control_id=<id>          → [comment, ...]
  },

  FILE_MANAGER: {
    UPLOAD: '/v1/file-manager',                   // POST multipart/form-data { payload, evidence_file }
    LIST: '/v1/file-manager/control',           // GET /{control_id}
    GET: (id) => `/v1/file-manager/${id}`,     // GET /{file_id} → binary download
  },

  VENDORS: {
    LIST: '/v1/tenant-service/vendor-list',                                           // GET → [vendor, ...]
    CREATE: '/v1/tenant-service/create-vendor-assessment',                              // POST { vendor_name, vendor_category, vendor_email, vendor_phone }
    UPDATE: (vendorId) => `/v1/tenant-service/vendor-assessment/${vendorId}`,           // PUT [{ vendor_control_id, response, comments }]
    ASSESSMENT: (vendorId) => `/v1/tenant-service/vendor-assessment/${vendorId}`,           // GET ?category=<key>
    DPA_STATUS: (vendorId) => `/v1/tenant-service/vendor-completion/${vendorId}`,           // PUT ?dpa_status=<status>
  },

  /* Vendor sub-control activity (comments / documents / observations).
     Backend is still in progress — paths are intentionally left blank.
     Fill in the real path string for each as the API becomes available. */
  VENDOR_CONTROL: {
    COMMENTS_LIST: (vendorControlId) => '/v1/tenant-service/comments/vendor-control',           // GET    → [comment, ...]
    COMMENT_CREATE: (vendorControlId) => '/v1/tenant-service/comments/vendor-control',           // POST   { comment, vendor_control_id }
    DOCS_LIST: (vendorControlId) => '/v1/file-manager/vendor-control',           // GET    → [file, ...]
    DOC_UPLOAD: (vendorControlId) => '',           // POST   multipart/form-data { payload, evidence_file }
    DOC_DOWNLOAD: (fileId) => '',           // GET    → binary download
    OBSERVATION: (vendorControlId) => '',           // PATCH  { remarks, recommendation }
  },

  /* ════════════════════════════════════════════════════════
     ROPA  (Records of Processing Activities)
  ════════════════════════════════════════════════════════ */
  MEET_EVIDENCE: {
    MEETINGS: '/v1/meet-evidence/meetings',
    MEETING: (meetingId) => `/v1/meet-evidence/meetings/${meetingId}`,
    MEETING_FILES_UPLOAD: (meetingId) => `/v1/meet-evidence/meetings/${meetingId}/file`,
    MEETING_FILES: (meetingId) => `/v1/meet-evidence/${meetingId}/files`,
    EVIDENCES: '/v1/meet-evidence/evidences',
    EVIDENCE: (evidenceId) => `/v1/meet-evidence/evidences/${evidenceId}`,
    EVIDENCE_FILES_UPLOAD: (evidenceId) => `/v1/meet-evidence/evidences/${evidenceId}/file`,
    EVIDENCE_FILES: (evidenceId) => `/v1/meet-evidence/evidences/${evidenceId}/files`,
  },

  POLICIES: {
    LIST: '/v1/policies',
    CREATE: '/v1/policies',
    SUMMARY: '/v1/policies/summary',
    DETAIL: (id) => `/v1/policies/${encodeURIComponent(id)}`,
    UPDATE: (id) => `/v1/policies/${encodeURIComponent(id)}`,
    DELETE: (id) => `/v1/policies/${encodeURIComponent(id)}`,
    FILES: (id) => `/v1/policies/${encodeURIComponent(id)}/files`,
    UPLOAD_FILE: (id) => `/v1/policies/${encodeURIComponent(id)}/files`,
    DELETE_FILES: (id) => `/v1/policies/${encodeURIComponent(id)}/files`,
  },

  ROPA: {
    LIST: '/v1/ropa/processes',                             // GET ?active_only=false → [process, ...]
    CREATE: '/v1/ropa/processes',                           // POST { process_name, process_description, department, process_owner, status }
    DETAIL: (id) => `/v1/ropa/processes/${id}`,             // GET → process
    UPDATE: (id) => `/v1/ropa/processes/${id}`,             // PATCH { process_name, process_description, department, process_owner, status }
    DELETE: (id) => `/v1/ropa/processes/${id}`,
    DASHBOARD: '/v1/ropa/dashboard',                        // GET → live RoPA summary counts
    QUESTIONS: '/v1/ropa/questions',                        // GET ?section=<section>
    RESPONSES: (id) => `/v1/ropa/processes/${id}/responses`, // GET / PUT { responses: [{ question_id, answer }] }
  },

};
