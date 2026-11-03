/**
 * RoPA process, question, and response API service.
 * Endpoints map to ENDPOINTS.ROPA in api/endpoints.js.
 */

import { tenantApi } from '../config';
import { ENDPOINTS } from '../endpoints';
import { DEMO_ROPA_QUESTIONS, DEMO_ROPA_PROCESSES, computeDemoRopaDashboard } from '../../data/ropa';
import { decodeRopaAnswer, encodeRopaAnswer } from '../../data/ropaQuestions';

const listData = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const processDisplayIds = new Map();
const formatRopaId = (sequence) => `ROPA-${String(sequence).padStart(3, '0')}`;

const cacheProcessDisplayIds = (processes) => {
  processDisplayIds.clear();
  processes.forEach((process, index) => {
    const id = process.id ?? process.process_id;
    if (id != null) processDisplayIds.set(String(id), formatRopaId(index + 1));
  });
};

const processToRecord = (process) => ({
  ...process,
  id: process.id ?? process.process_id,
  ropa_id: processDisplayIds.get(String(process.id ?? process.process_id))
    ?? (typeof process.ropa_id === 'string' && /^ROPA-\d+$/i.test(process.ropa_id) ? process.ropa_id.toUpperCase() : null)
    ?? (Number.isInteger(Number(process.id ?? process.process_id))
      ? formatRopaId(Number(process.id ?? process.process_id))
      : process.ropa_id ?? process.id ?? process.process_id),
  processing_activity: process.process_name ?? '',
  process_description: process.process_description ?? '',
  department: process.department ?? '',
  process_owner: process.process_owner ?? '',
  status: process.status === false ? 'inactive' : 'active',
  last_updated: process.updated_at ?? process.created_at ?? '',
});

/* ── Mock mode (VITE_ENABLE_MOCK_AUTH) ─────────────────────
   In-memory demo RoPA so the register can be previewed without the backend.
   Edits last until the page is reloaded. */
const demo = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ? {
  processes: DEMO_ROPA_PROCESSES.map(({ process }) => ({ ...process })),
  responses: Object.fromEntries(DEMO_ROPA_PROCESSES.map(({ process, answers }) => [
    process.id,
    DEMO_ROPA_QUESTIONS
      .filter(question => answers[question.field_name] !== undefined && answers[question.field_name] !== '')
      .map(question => ({ question_id: question.id, answer: encodeRopaAnswer(answers[question.field_name]) })),
  ])),
} : null;

const demoProcess = (id) => {
  const process = demo.processes.find(p => String(p.id) === String(id));
  if (!process) throw new Error('Processing activity not found.');
  return process;
};

/* Process merged with its decoded answers — what the register list and dashboard read */
const demoRecordWithAnswers = (process) => {
  const record = processToRecord(process);
  (demo.responses[process.id] ?? []).forEach(({ question_id, answer }) => {
    const question = DEMO_ROPA_QUESTIONS.find(item => item.id === question_id);
    if (question) record[question.field_name] = decodeRopaAnswer(answer, question.answer_type);
  });
  return record;
};

export async function fetchRopaRecords({ activeOnly = false } = {}) {
  if (demo) {
    const processes = demo.processes.filter(p => !activeOnly || p.status !== false);
    cacheProcessDisplayIds(processes);
    return processes.map(demoRecordWithAnswers);
  }
  const { data } = await tenantApi.get(ENDPOINTS.ROPA.LIST, {
    params: { active_only: activeOnly },
  });
  const processes = listData(data);
  cacheProcessDisplayIds(processes);
  return processes.map(processToRecord);
}

export async function fetchRopaRecord(id) {
  if (demo) {
    if (!processDisplayIds.has(String(id))) cacheProcessDisplayIds(demo.processes);
    return processToRecord({ ...demoProcess(id) });
  }
  const { data } = await tenantApi.get(ENDPOINTS.ROPA.DETAIL(id));
  if (!processDisplayIds.has(String(id))) {
    const { data: list } = await tenantApi.get(ENDPOINTS.ROPA.LIST, { params: { active_only: false } });
    cacheProcessDisplayIds(listData(list));
  }
  return processToRecord(data);
}

export async function createRopaRecord(payload) {
  if (demo) {
    const process = { ...payload, id: Math.max(0, ...demo.processes.map(p => p.id)) + 1, updated_at: new Date().toISOString() };
    demo.processes.push(process);
    demo.responses[process.id] = [];
    cacheProcessDisplayIds(demo.processes);
    return processToRecord(process);
  }
  const { data } = await tenantApi.post(ENDPOINTS.ROPA.CREATE, payload);
  return processToRecord(data);
}

export async function updateRopaRecord(id, payload) {
  if (demo) {
    const process = Object.assign(demoProcess(id), payload, { updated_at: new Date().toISOString() });
    return processToRecord({ ...process });
  }
  const { data } = await tenantApi.patch(ENDPOINTS.ROPA.UPDATE(id), payload);
  return processToRecord(data);
}

export async function deleteRopaRecord(id) {
  if (demo) {
    demo.processes = demo.processes.filter(p => String(p.id) !== String(id));
    delete demo.responses[id];
    return;
  }
  await tenantApi.delete(ENDPOINTS.ROPA.DELETE(id));
}

export async function fetchRopaDashboard() {
  const data = demo
    ? computeDemoRopaDashboard(demo.processes.map(demoRecordWithAnswers))
    : (await tenantApi.get(ENDPOINTS.ROPA.DASHBOARD)).data;
  return {
    ...data,
    total: data.total_processing_activities ?? 0,
    active: data.active_activities ?? 0,
    dpia_required: data.dpia_required ?? 0,
    high_sensitivity: data.high_sensitivity_activities ?? 0,
    missing_dpa: data.missing_dpas_vendors ?? 0,
    cross_border: data.cross_border_transfers ?? 0,
    children_data: data.children_data_activities ?? 0,
    notice_not_provided: data.notice_not_provided ?? 0,
    sensitivity_medium: data.medium_sensitivity_activities ?? null,
    sensitivity_low: data.low_sensitivity_activities ?? null,
    checklist: data.checklist ?? null,
    dpia_not_started: data.dpia_not_started ?? null,
    cross_border_without_safeguards: data.cross_border_transfers_without_safeguards ?? null,
  };
}

export async function fetchRopaQuestions(section) {
  if (demo) return DEMO_ROPA_QUESTIONS.filter(question => !section || question.section === section).map(question => ({ ...question }));
  const { data } = await tenantApi.get(ENDPOINTS.ROPA.QUESTIONS, {
    params: section ? { section } : undefined,
  });
  return listData(data);
}

export async function fetchRopaResponses(processId) {
  if (demo) return (demo.responses[processId] ?? []).map(response => ({ ...response }));
  const { data } = await tenantApi.get(ENDPOINTS.ROPA.RESPONSES(processId));
  return listData(data);
}

export async function upsertRopaResponses(processId, responses) {
  if (demo) {
    const process = demoProcess(processId);
    const saved = demo.responses[process.id] ?? [];
    responses.forEach(({ question_id, answer }) => {
      const existing = saved.find(response => response.question_id === question_id);
      if (existing) existing.answer = answer;
      else saved.push({ question_id, answer });
    });
    demo.responses[process.id] = saved;
    process.updated_at = new Date().toISOString();
    return saved.map(response => ({ ...response }));
  }
  const { data } = await tenantApi.put(ENDPOINTS.ROPA.RESPONSES(processId), { responses });
  return listData(data);
}
