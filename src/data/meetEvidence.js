/* Demo meetings and evidence requests used only in mock mode (VITE_ENABLE_MOCK_AUTH). */

const isoDaysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function createDemoMeetings() {
  return [
    {
      meeting_id: 'demo-m1',
      meeting_name: 'IT kickoff meeting',
      department: 'Information Technology',
      attendees: ['Rahul Verma', 'Sara Lee', 'Daniel Brooks'],
      meeting_date: isoDaysFromNow(-12),
      meeting_purpose: 'Walk through the data inventory and confirm systems that store personal data.',
      decision_follow_up: 'IT to share the system inventory and access-control matrix.',
      files: [{ id: 'demo-mf1', file_name: 'System-inventory-v2.xlsx' }],
      evidence_ids: ['demo-e1', 'demo-e2'],
    },
    {
      meeting_id: 'demo-m2',
      meeting_name: 'HR data review',
      department: 'Human Resources',
      attendees: ['Emily Carter', 'Priya Nair'],
      meeting_date: isoDaysFromNow(-5),
      meeting_purpose: 'Review employee onboarding forms and retention periods.',
      decision_follow_up: 'HR to provide the current retention schedule.',
      files: [],
      evidence_ids: ['demo-e3'],
    },
    {
      meeting_id: 'demo-m3',
      meeting_name: 'Legal review',
      department: 'Legal',
      attendees: ['Michael Chen'],
      meeting_date: isoDaysFromNow(-2),
      meeting_purpose: 'Confirm processor agreements in place with key vendors.',
      decision_follow_up: '',
      files: [],
      evidence_ids: [],
    },
  ];
}

export function createDemoEvidence() {
  return [
    {
      evidence_id: 'demo-e1',
      evidence_name: 'Access control policy',
      evidence_type: 'Document',
      evidence_description: 'Current access-control policy covering production systems.',
      department: 'Information Technology',
      requested_date: isoDaysFromNow(-12),
      deadline: isoDaysFromNow(3),
      status: 'Requested',
      meeting_id: 'demo-m1',
      files: [],
    },
    {
      evidence_id: 'demo-e2',
      evidence_name: 'System inventory',
      evidence_type: 'Document',
      evidence_description: 'List of systems that store or process personal data.',
      department: 'Information Technology',
      requested_date: isoDaysFromNow(-12),
      deadline: isoDaysFromNow(-1),
      status: 'Uploaded',
      meeting_id: 'demo-m1',
      files: [{ id: 'demo-ef1', file_name: 'System-inventory-v2.xlsx' }],
    },
    {
      evidence_id: 'demo-e3',
      evidence_name: 'Employee data retention schedule',
      evidence_type: 'Document',
      evidence_description: 'Retention periods for employee records.',
      department: 'Human Resources',
      requested_date: isoDaysFromNow(-5),
      deadline: isoDaysFromNow(9),
      status: 'Requested',
      meeting_id: 'demo-m2',
      files: [],
    },
    {
      evidence_id: 'demo-e4',
      evidence_name: 'Vendor DPA register',
      evidence_type: 'Spreadsheet',
      evidence_description: 'Signed data processing agreements with all processors.',
      department: 'Legal',
      requested_date: isoDaysFromNow(-20),
      deadline: isoDaysFromNow(-6),
      status: 'Overdue',
      source: 'tracker',
      files: [],
    },
  ];
}

export function createDemoUsers() {
  return [
    { id: 'demo-u1', username: 'Priya Reviewer', email: 'reviewer@appzlogic.com', role: 'Reviewer', is_active: true, designation: 'Lead Privacy Reviewer', rating: 4.8, created_at: '2025-02-14T10:00:00Z' },
    { id: 'demo-u2', username: 'Daniel Brooks', email: 'daniel.brooks@northwind.com', role: 'User', is_active: true, designation: 'Data Protection Officer', rating: null, created_at: '2025-04-03T10:00:00Z' },
    { id: 'demo-u3', username: 'Emily Carter', email: 'emily.carter@contoso.com', role: 'User', is_active: true, designation: 'HR Director', rating: null, created_at: '2025-06-21T10:00:00Z' },
    { id: 'demo-u4', username: 'Rahul Verma', email: 'rahul.verma@appzlogic.com', role: 'Reviewer', is_active: false, designation: 'Privacy Analyst', rating: 4.2, created_at: '2025-01-09T10:00:00Z' },
    { id: 'demo-u5', username: 'Sara Lee', email: 'sara.lee@fabrikam.com', role: 'User', is_active: true, designation: 'Chief Information Security Officer', rating: null, created_at: '2025-08-30T10:00:00Z' },
  ];
}
