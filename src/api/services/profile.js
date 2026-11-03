/**
 * api/services/profile.js
 *
 * User profile — get / update details and manage certificate documents.
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — profile reads/writes stay in memory. */
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
let demoFiles = [{ id: 'demo-cert1', file_name: 'CIPP-E-certificate.pdf', created_at: '2025-03-02T10:00:00Z' }];
const demoUser = () => {
  try { return JSON.parse(localStorage.getItem('az_user')) ?? {}; } catch { return {}; }
};

/* GET /v1/auth/users/{id} */
export async function getUser(userId) {
  if (MOCK_ENABLED) {
    const u = demoUser();
    return { id: userId, username: u.name, email: u.email, role: u.role, designation: u.designation ?? '', bio_desp: u.bio ?? '', is_completed: true };
  }
  const { data } = await api.get(ENDPOINTS.AUTH.USER(userId));
  return data;
}

/* PATCH /v1/auth/users/{id}  { username, email, designation, bio_desp } */
export async function updateUser(userId, updates) {
  if (MOCK_ENABLED) return { ...(await getUser(userId)), ...updates, is_completed: true };
  const { data } = await api.patch(ENDPOINTS.AUTH.USER(userId), updates);
  return data;
}

/* POST /v1/upload-certificate  multipart/form-data { certificate_files[] } */
export async function uploadCertificates(files) {
  if (MOCK_ENABLED) {
    const added = files.map((f, i) => ({ id: `demo-cert${Date.now()}-${i}`, file_name: f.name, created_at: new Date().toISOString() }));
    demoFiles = [...demoFiles, ...added];
    return added;
  }
  const form = new FormData();
  files.forEach(f => form.append('certificate_files', f));
  const { data } = await api.post(ENDPOINTS.PROFILE.UPLOAD_CERT, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/* DELETE /v1/files/{file_id} */
export async function deleteFile(fileId) {
  if (MOCK_ENABLED) { demoFiles = demoFiles.filter(f => f.id !== fileId); return {}; }
  const { data } = await api.delete(ENDPOINTS.PROFILE.DELETE_FILE(fileId));
  return data;
}

/* GET /v1/files/user?user_id={id} */
export async function getUserFiles(userId) {
  const data = MOCK_ENABLED
    ? demoFiles
    : (await api.get(ENDPOINTS.PROFILE.USER_FILES, { params: { user_id: userId } })).data;
  const raw = Array.isArray(data) ? data : (data?.files ?? data?.results ?? data?.data ?? []);
  return raw.map((f, i) => ({
    id:         String(f.id ?? f.file_id ?? i),
    name:       f.file_name ?? f.name ?? f.filename ?? f.original_name ?? 'Document',
    url:        f.file_url  ?? f.url  ?? f.download_url ?? f.file_path ?? null,
    uploadedAt: f.created_at ?? f.uploaded_at ?? new Date().toISOString(),
  }));
}
