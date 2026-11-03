import api, { tenantApi } from '../config';
import { ENDPOINTS } from '../endpoints';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — uploaded file names are kept in memory per control. */
const demoDocs = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ? {} : null;

/* POST /v1/file-manager  multipart/form-data */
export async function uploadDocument(control_id, file) {
  if (demoDocs) {
    const doc = { id: `demo-d${Date.now()}`, file_name: file.name, control_id, created_at: new Date().toISOString() };
    demoDocs[control_id] = [...(demoDocs[control_id] ?? []), doc];
    return doc;
  }
  const formData = new FormData();
  formData.append('payload', JSON.stringify({ control_id }));
  formData.append('evidence_file', file);
  const { data } = await tenantApi.post(ENDPOINTS.FILE_MANAGER.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/* GET /v1/file-manager/control/{control_id} */
export async function listDocuments(control_id) {
  if (demoDocs) return [...(demoDocs[control_id] ?? [])];
  const { data } = await api.get(`${ENDPOINTS.FILE_MANAGER.LIST}/${control_id}`);
  return data;
}

/* GET /v1/file-manager/{file_id} → binary download */
export async function downloadFile(fileId, fileName) {
  if (demoDocs) throw new Error('Demo mode: files are not stored, so there is nothing to download.');
  const response = await api.get(ENDPOINTS.FILE_MANAGER.GET(fileId), {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName ?? 'document';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
