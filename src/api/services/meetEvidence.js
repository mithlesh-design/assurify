import api from '../config';
import { ENDPOINTS } from '../endpoints';
import { createDemoMeetings, createDemoEvidence } from '../../data/meetEvidence';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — in-memory demo meetings and evidence so the trackers
   can be previewed without the backend. Edits last until the page is reloaded. */
const demo = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true'
  ? { meetings: createDemoMeetings(), evidence: createDemoEvidence() }
  : null;
const demoFiles = (files) => Array.from(files ?? []).map((f, i) => ({ id: `demo-f${Date.now()}-${i}`, file_name: f.name }));

const listData = data => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export function meetingToRecord(meeting) {
  return {
    ...meeting,
    id: meeting.id ?? meeting.meeting_id,
    department: meeting.department ?? '',
    date: meeting.meeting_date ?? meeting.date ?? '',
    attendees: Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : (meeting.attendees ?? ''),
    purpose: meeting.meeting_purpose ?? meeting.purpose ?? '',
    followUp: meeting.decision_follow_up ?? meeting.follow_up ?? meeting.followUp ?? '',
    documents: listData(meeting.documents ?? meeting.files),
    evidenceIds: meeting.evidence_ids ?? meeting.evidenceIds ?? [],
  };
}

export function evidenceToRecord(evidence) {
  return {
    ...evidence,
    id: evidence.id ?? evidence.evidence_id,
    name: evidence.evidence_name ?? evidence.name ?? '',
    type: evidence.evidence_type ?? evidence.type ?? '',
    purpose: evidence.evidence_description ?? evidence.purpose ?? evidence.description ?? '',
    department: evidence.department ?? '',
    requestedDate: evidence.requested_date ?? evidence.requestedDate ?? new Date().toISOString().slice(0, 10),
    deadline: evidence.deadline ?? '',
    status: evidence.status ?? 'Requested',
    source: evidence.meeting_id ? 'meeting' : (evidence.source ?? 'tracker'),
    meetingId: evidence.meeting_id ?? evidence.meetingId ?? null,
    files: listData(evidence.files ?? evidence.documents),
  };
}

export async function fetchMeetings() {
  if (demo) return demo.meetings.map(meetingToRecord);
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETINGS);
  return listData(data).map(meetingToRecord);
}

export async function fetchMeeting(meetingId) {
  if (demo) return meetingToRecord(demo.meetings.find(m => String(m.meeting_id) === String(meetingId)) ?? {});
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETING(meetingId));
  return meetingToRecord(data);
}

export async function createMeeting(payload) {
  if (demo) {
    const meeting = {
      meeting_id: `demo-m${Date.now()}`,
      meeting_name: payload.meeting_name ?? payload.name ?? `${payload.department} meeting`,
      department: payload.department,
      attendees: Array.isArray(payload.attendees) ? payload.attendees : String(payload.attendees ?? '').split(',').map(v => v.trim()).filter(Boolean),
      meeting_date: payload.meeting_date ?? payload.date,
      meeting_purpose: payload.meeting_purpose ?? payload.purpose ?? '',
      decision_follow_up: payload.decision_follow_up ?? payload.followUp ?? '',
      files: [],
    };
    demo.meetings.push(meeting);
    return meetingToRecord(meeting);
  }
  const body = {
    meeting_name: payload.meeting_name ?? payload.name ?? `${payload.department} meeting`,
    department: payload.department,
    attendees: Array.isArray(payload.attendees) ? payload.attendees : String(payload.attendees ?? '').split(',').map(v => v.trim()).filter(Boolean),
    meeting_date: payload.meeting_date ?? payload.date,
    meeting_purpose: payload.meeting_purpose ?? payload.purpose ?? '',
    decision_follow_up: payload.decision_follow_up ?? payload.followUp ?? '',
  };
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.MEETINGS, body);
  return meetingToRecord(data);
}

export async function updateMeeting(meetingId, payload) {
  if (demo) {
    const meeting = demo.meetings.find(m => String(m.meeting_id) === String(meetingId));
    if (meeting) Object.assign(meeting, {
      department: payload.department ?? meeting.department,
      meeting_date: payload.meeting_date ?? payload.date ?? meeting.meeting_date,
      meeting_purpose: payload.meeting_purpose ?? payload.purpose ?? meeting.meeting_purpose,
      decision_follow_up: payload.decision_follow_up ?? payload.followUp ?? meeting.decision_follow_up,
    });
    return meetingToRecord(meeting ?? {});
  }
  const body = {
    meeting_name: payload.meeting_name ?? payload.name ?? `${payload.department ?? ''} meeting`.trim(),
    department: payload.department,
    attendees: Array.isArray(payload.attendees) ? payload.attendees : String(payload.attendees ?? '').split(',').map(v => v.trim()).filter(Boolean),
    meeting_date: payload.meeting_date ?? payload.date,
    meeting_purpose: payload.meeting_purpose ?? payload.purpose ?? '',
    decision_follow_up: payload.decision_follow_up ?? payload.followUp ?? '',
  };
  const { data } = await api.patch(ENDPOINTS.MEET_EVIDENCE.MEETING(meetingId), body);
  return meetingToRecord(data);
}

export async function deleteMeeting(meetingId) {
  if (demo) { demo.meetings = demo.meetings.filter(m => String(m.meeting_id) !== String(meetingId)); return; }
  await api.delete(ENDPOINTS.MEET_EVIDENCE.MEETING(meetingId));
}

export async function uploadMeetingFiles(meetingId, files) {
  if (demo) {
    const meeting = demo.meetings.find(m => String(m.meeting_id) === String(meetingId));
    const added = demoFiles(files);
    if (meeting) meeting.files = [...(meeting.files ?? []), ...added];
    return added;
  }
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('document_file', file));
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.MEETING_FILES_UPLOAD(meetingId), formData);
  return data;
}

export async function fetchMeetingFiles(meetingId) {
  if (demo) return [...(demo.meetings.find(m => String(m.meeting_id) === String(meetingId))?.files ?? [])];
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETING_FILES(meetingId));
  return listData(data);
}

export async function fetchEvidences(meetingId = null) {
  if (demo) return demo.evidence.filter(e => !meetingId || String(e.meeting_id) === String(meetingId)).map(evidenceToRecord);
  const config = meetingId ? { params: { meeting_id: meetingId } } : undefined;
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCES, config);
  return listData(data).map(evidenceToRecord);
}

export async function fetchEvidence(evidenceId) {
  if (demo) return evidenceToRecord(demo.evidence.find(e => String(e.evidence_id) === String(evidenceId)) ?? {});
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId));
  return evidenceToRecord(data);
}

export async function createEvidence(payload) {
  if (demo) {
    const evidence = { evidence_id: `demo-e${Date.now()}`, files: [], ...payload };
    demo.evidence.push(evidence);
    return evidenceToRecord(evidence);
  }
  const body = {
    evidence_name: payload.evidence_name ?? payload.name,
    evidence_type: payload.evidence_type ?? payload.type ?? 'Document',
    evidence_description: payload.evidence_description ?? payload.purpose ?? payload.description ?? '',
  };
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.EVIDENCES, body);
  return evidenceToRecord({ ...data, ...payload });
}

export async function updateEvidence(evidenceId, payload) {
  if (demo) {
    const evidence = demo.evidence.find(e => String(e.evidence_id) === String(evidenceId));
    if (evidence) Object.assign(evidence, payload);
    return evidenceToRecord({ ...(evidence ?? {}), ...payload });
  }
  const body = {
    evidence_name: payload.evidence_name ?? payload.name,
    evidence_type: payload.evidence_type ?? payload.type ?? 'Document',
    evidence_description: payload.evidence_description ?? payload.purpose ?? payload.description ?? '',
  };
  const { data } = await api.patch(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId), body);
  return evidenceToRecord({ ...data, ...payload });
}

export async function deleteEvidence(evidenceId) {
  if (demo) { demo.evidence = demo.evidence.filter(e => String(e.evidence_id) !== String(evidenceId)); return; }
  await api.delete(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId));
}

export async function uploadEvidenceFiles(evidenceId, files) {
  if (demo) {
    const evidence = demo.evidence.find(e => String(e.evidence_id) === String(evidenceId));
    const added = demoFiles(files);
    if (evidence) evidence.files = [...(evidence.files ?? []), ...added];
    return added;
  }
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('evidence_file', file));
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.EVIDENCE_FILES_UPLOAD(evidenceId), formData);
  return data;
}

export async function fetchEvidenceFiles(evidenceId) {
  if (demo) return [...(demo.evidence.find(e => String(e.evidence_id) === String(evidenceId))?.files ?? [])];
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCE_FILES(evidenceId));
  return listData(data);
}

export async function downloadFiles(url, fallbackName = 'download') {
  if (demo) throw new Error('Demo mode: files are not stored, so there is nothing to download.');
  const response = await api.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
