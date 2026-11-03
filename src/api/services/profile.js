/**
 * api/services/profile.js
 *
 * User profile — get / update details and manage certificate documents.
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* GET /v1/auth/users/{id} */
export async function getUser(userId) {
  const { data } = await api.get(ENDPOINTS.AUTH.USER(userId));
  return data;
}

/* PATCH /v1/auth/users/{id}  { username, email, designation, bio_desp } */
export async function updateUser(userId, updates) {
  const { data } = await api.patch(ENDPOINTS.AUTH.USER(userId), updates);
  return data;
}

/* POST /v1/upload-certificate  multipart/form-data { certificate_files[] } */
export async function uploadCertificates(files) {
  const form = new FormData();
  files.forEach(f => form.append('certificate_files', f));
  const { data } = await api.post(ENDPOINTS.PROFILE.UPLOAD_CERT, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/* DELETE /v1/files/{file_id} */
export async function deleteFile(fileId) {
  const { data } = await api.delete(ENDPOINTS.PROFILE.DELETE_FILE(fileId));
  return data;
}

/* GET /v1/files/user?user_id={id} */
export async function getUserFiles(userId) {
  const { data } = await api.get(ENDPOINTS.PROFILE.USER_FILES, { params: { user_id: userId } });
  const raw = Array.isArray(data) ? data : (data?.files ?? data?.results ?? data?.data ?? []);
  return raw.map((f, i) => ({
    id:         String(f.id ?? f.file_id ?? i),
    name:       f.file_name ?? f.name ?? f.filename ?? f.original_name ?? 'Document',
    url:        f.file_url  ?? f.url  ?? f.download_url ?? f.file_path ?? null,
    uploadedAt: f.created_at ?? f.uploaded_at ?? new Date().toISOString(),
  }));
}
