import api from '../config';
import { ENDPOINTS } from '../endpoints';
import { createDemoPolicies } from '../../data/policies';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — in-memory demo policy library so the page can be
   previewed without the backend. Edits last until the page is reloaded. */
let demoPolicies = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ? createDemoPolicies() : null;

function demoPolicy(policyId) {
  const policy = demoPolicies.find(item => String(item.id) === String(policyId));
  if (!policy) throw new Error('Policy not found.');
  return policy;
}

const needsAttention = (policy, today) =>
  ['not started', 'needs attention'].includes(policy.status.toLowerCase())
  || (policy.nextReview && policy.nextReview.slice(0, 10) < today);

function collection(data, label) {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return collection(JSON.parse(data), label); } catch { throw new Error(`The ${label} endpoint returned an unreadable response.`); }
  }
  for (const key of ['items', 'results', 'policies', 'data']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data && typeof data === 'object' && (data.id || data.policy_id)) return [data];
  return [];
}

export function normalizePolicy(raw = {}) {
  return {
    ...raw,
    id: raw.id ?? raw.policy_id,
    name: raw.policy_name ?? raw.name ?? 'Untitled policy',
    category: raw.category ?? 'Other',
    requirement: raw.requirement ?? 'Recommended',
    section: raw.section_rule ?? raw.section ?? '',
    owner: raw.policy_owner ?? raw.owner ?? '',
    status: raw.policy_status ?? raw.status ?? 'Draft',
    nextReview: raw.next_review_date ?? raw.next_review ?? '',
    reviewDate: raw.review_date ?? '',
    files: Array.isArray(raw.files ?? raw.policy_files)
      ? (raw.files ?? raw.policy_files)
      : typeof (raw.files ?? raw.policy_files) === 'string'
        ? [{ file_name: raw.files ?? raw.policy_files }]
        : collection(raw.files ?? raw.policy_files ?? [], 'Policy files'),
  };
}

export async function fetchPolicies({ search, requirement, status, tab } = {}) {
  if (demoPolicies) {
    const today = new Date().toISOString().slice(0, 10);
    const query = search?.trim().toLowerCase();
    return demoPolicies.map(normalizePolicy).filter(policy =>
      (!query || [policy.name, policy.owner, policy.category].some(value => value.toLowerCase().includes(query)))
      && (!requirement || policy.requirement.toLowerCase() === requirement.toLowerCase())
      && (!status || policy.status.toLowerCase() === status.toLowerCase())
      && (!tab || tab === 'all' || (tab === 'needs_attention'
        ? needsAttention(policy, today)
        : policy.requirement.toLowerCase() === tab)));
  }
  const params = {};
  if (search?.trim()) params.search = search.trim();
  if (requirement) params.requirement = requirement;
  if (status) params.status = status;
  if (tab) params.tab = tab;
  const { data } = await api.get(ENDPOINTS.POLICIES.LIST, { params });
  return collection(data, 'Policy list').map(normalizePolicy);
}

export async function fetchPolicySummary() {
  if (demoPolicies) {
    const today = new Date().toISOString().slice(0, 10);
    const policies = demoPolicies.map(normalizePolicy);
    return {
      total: policies.length,
      mandatory: policies.filter(policy => policy.requirement.toLowerCase() === 'mandatory').length,
      published: policies.filter(policy => policy.status.toLowerCase() === 'published').length,
      in_progress: policies.filter(policy => ['draft', 'in review'].includes(policy.status.toLowerCase())).length,
      needs_attention: policies.filter(policy => needsAttention(policy, today)).length,
    };
  }
  const { data } = await api.get(ENDPOINTS.POLICIES.SUMMARY);
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return { message: data }; }
  }
  return data ?? {};
}

export async function fetchPolicy(policyId) {
  if (demoPolicies) return normalizePolicy({ ...demoPolicy(policyId) });
  const { data } = await api.get(ENDPOINTS.POLICIES.DETAIL(policyId));
  return normalizePolicy(data);
}

export async function createPolicy(payload) {
  if (demoPolicies) {
    const policy = { ...payload, id: `demo-p${Date.now()}`, files: [] };
    demoPolicies.push(policy);
    return normalizePolicy({ ...policy });
  }
  const { data } = await api.post(ENDPOINTS.POLICIES.CREATE, payload);
  return normalizePolicy(data);
}

export async function updatePolicy(policyId, payload) {
  if (demoPolicies) return normalizePolicy({ ...Object.assign(demoPolicy(policyId), payload) });
  const { data } = await api.patch(ENDPOINTS.POLICIES.UPDATE(policyId), payload);
  return normalizePolicy(data);
}

export async function deletePolicy(policyId) {
  if (demoPolicies) {
    demoPolicies = demoPolicies.filter(policy => String(policy.id) !== String(policyId));
    return;
  }
  await api.delete(ENDPOINTS.POLICIES.DELETE(policyId));
}

export async function uploadPolicyFile(policyId, file) {
  if (demoPolicies) {
    demoPolicy(policyId).files = [{ file_name: file.name }];
    return {};
  }
  const form = new FormData();
  form.append('policy_file', file);
  const { data } = await api.post(ENDPOINTS.POLICIES.UPLOAD_FILE(policyId), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePolicyFiles(policyId) {
  if (demoPolicies) {
    demoPolicy(policyId).files = [];
    return;
  }
  await api.delete(ENDPOINTS.POLICIES.DELETE_FILES(policyId));
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'policy-file';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadPolicyFiles(policyId) {
  if (demoPolicies) throw new Error('Demo mode: policy files are not stored, so there is nothing to download.');
  const response = await api.get(ENDPOINTS.POLICIES.FILES(policyId), { responseType: 'blob' });
  const blob = response.data;
  const contentType = response.headers?.['content-type'] ?? blob.type ?? '';
  const disposition = response.headers?.['content-disposition'] ?? '';
  const fileName = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)?.[1];

  if (/json|text\//i.test(contentType)) {
    const text = await blob.text();
    let payload = text;
    try { payload = JSON.parse(text); } catch {}
    const url = typeof payload === 'string'
      ? payload
      : payload?.download_url ?? payload?.file_url ?? payload?.url;
    if (url && /^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!text.trim()) throw new Error('No policy file is available to download.');
    saveBlob(new Blob([text], { type: contentType || 'text/plain' }), fileName || 'policy-files.txt');
    return;
  }

  saveBlob(blob, fileName || 'policy-file');
}
