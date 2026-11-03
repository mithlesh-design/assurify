import api from '../config';
import { ENDPOINTS } from '../endpoints';

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
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETINGS);
  return listData(data).map(meetingToRecord);
}

export async function fetchMeeting(meetingId) {
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETING(meetingId));
  return meetingToRecord(data);
}

export async function createMeeting(payload) {
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
  await api.delete(ENDPOINTS.MEET_EVIDENCE.MEETING(meetingId));
}

export async function uploadMeetingFiles(meetingId, files) {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('document_file', file));
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.MEETING_FILES_UPLOAD(meetingId), formData);
  return data;
}

export async function fetchMeetingFiles(meetingId) {
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.MEETING_FILES(meetingId));
  return listData(data);
}

export async function fetchEvidences(meetingId = null) {
  const config = meetingId ? { params: { meeting_id: meetingId } } : undefined;
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCES, config);
  return listData(data).map(evidenceToRecord);
}

export async function fetchEvidence(evidenceId) {
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId));
  return evidenceToRecord(data);
}

export async function createEvidence(payload) {
  const body = {
    evidence_name: payload.evidence_name ?? payload.name,
    evidence_type: payload.evidence_type ?? payload.type ?? 'Document',
    evidence_description: payload.evidence_description ?? payload.purpose ?? payload.description ?? '',
  };
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.EVIDENCES, body);
  return evidenceToRecord({ ...data, ...payload });
}

export async function updateEvidence(evidenceId, payload) {
  const body = {
    evidence_name: payload.evidence_name ?? payload.name,
    evidence_type: payload.evidence_type ?? payload.type ?? 'Document',
    evidence_description: payload.evidence_description ?? payload.purpose ?? payload.description ?? '',
  };
  const { data } = await api.patch(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId), body);
  return evidenceToRecord({ ...data, ...payload });
}

export async function deleteEvidence(evidenceId) {
  await api.delete(ENDPOINTS.MEET_EVIDENCE.EVIDENCE(evidenceId));
}

export async function uploadEvidenceFiles(evidenceId, files) {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('evidence_file', file));
  const { data } = await api.post(ENDPOINTS.MEET_EVIDENCE.EVIDENCE_FILES_UPLOAD(evidenceId), formData);
  return data;
}

export async function fetchEvidenceFiles(evidenceId) {
  const { data } = await api.get(ENDPOINTS.MEET_EVIDENCE.EVIDENCE_FILES(evidenceId));
  return listData(data);
}

export async function downloadFiles(url, fallbackName = 'download') {
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
