import api, { tenantApi } from '../config';
import { ENDPOINTS } from '../endpoints';

/* POST /v1/file-manager  multipart/form-data */
export async function uploadDocument(control_id, file) {
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
  const { data } = await api.get(`${ENDPOINTS.FILE_MANAGER.LIST}/${control_id}`);
  return data;
}

/* GET /v1/file-manager/{file_id} → binary download */
export async function downloadFile(fileId, fileName) {
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
