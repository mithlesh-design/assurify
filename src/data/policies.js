/**
 * data/policies.js — demo policy library (mock mode only).
 *
 * Served by api/services/policies.js when VITE_ENABLE_MOCK_AUTH is 'true'.
 * Records use the API field names; normalizePolicy() maps them for the UI.
 */

const DEMO_POLICIES = [
  { id: 'demo-p1',  policy_name: 'Privacy Notice',                                category: 'Notice and transparency',  requirement: 'Mandatory',   section_rule: 'Section 5, Rule 3',     policy_owner: 'Neha Kapoor (DPO)',          policy_status: 'Published',   review_date: '2026-04-10', next_review_date: '2027-04-10', files: [{ file_name: 'privacy-notice-v3.pdf' }] },
  { id: 'demo-p2',  policy_name: 'Consent Management Policy',                     category: 'Consent',                  requirement: 'Mandatory',   section_rule: 'Section 6',             policy_owner: 'Neha Kapoor (DPO)',          policy_status: 'Published',   review_date: '2026-02-01', next_review_date: '2027-02-01', files: [{ file_name: 'consent-management-policy.pdf' }] },
  { id: 'demo-p3',  policy_name: 'Data Principal Rights Policy',                  category: 'Data principal rights',    requirement: 'Mandatory',   section_rule: 'Sections 11–14',        policy_owner: 'Ananya Iyer (Legal)',        policy_status: 'In review',   review_date: '2026-10-15', next_review_date: '2026-12-15', files: [{ file_name: 'data-principal-rights-policy-draft-v2.docx' }] },
  { id: 'demo-p4',  policy_name: 'Children’s Data and Parental Consent Policy',   category: 'Children’s data',          requirement: 'Mandatory',   section_rule: 'Section 9',             policy_owner: 'Ananya Iyer (Legal)',        policy_status: 'Not started', review_date: '',           next_review_date: '',           files: [] },
  { id: 'demo-p5',  policy_name: 'Data Security Safeguards Policy',               category: 'Security safeguards',      requirement: 'Mandatory',   section_rule: 'Section 8(5), Rule 6',  policy_owner: 'Rahul Verma (CISO)',         policy_status: 'Published',   review_date: '2025-09-30', next_review_date: '2026-09-30', files: [{ file_name: 'security-safeguards-policy.pdf' }] },
  { id: 'demo-p6',  policy_name: 'Breach Response and Notification Policy',       category: 'Breach management',        requirement: 'Mandatory',   section_rule: 'Section 8(6), Rule 7',  policy_owner: 'Rahul Verma (CISO)',         policy_status: 'Draft',       review_date: '2026-10-01', next_review_date: '2027-01-31', files: [] },
  { id: 'demo-p7',  policy_name: 'Data Processor and Vendor Management Policy',   category: 'Processor management',     requirement: 'Mandatory',   section_rule: 'Section 8(2)',          policy_owner: 'Vikram Singh (Procurement)', policy_status: 'In review',   review_date: '2026-09-20', next_review_date: '2026-12-01', files: [{ file_name: 'vendor-management-policy.docx' }] },
  { id: 'demo-p8',  policy_name: 'Cookie Policy',                                 category: 'Notice and transparency',  requirement: 'Recommended', section_rule: 'Sections 5 and 6',      policy_owner: 'Meera Nair (Marketing)',     policy_status: 'Published',   review_date: '2026-03-15', next_review_date: '2027-03-15', files: [{ file_name: 'cookie-policy.pdf' }] },
  { id: 'demo-p9',  policy_name: 'Cross-Border Transfer Policy',                  category: 'Data transfers',           requirement: 'Recommended', section_rule: 'Section 16',            policy_owner: 'Ananya Iyer (Legal)',        policy_status: 'Draft',       review_date: '2026-10-20', next_review_date: '2027-05-01', files: [] },
  { id: 'demo-p10', policy_name: 'Access Control and Logging Policy',             category: 'Security safeguards',      requirement: 'Recommended', section_rule: 'Section 8(5)',          policy_owner: 'Rahul Verma (CISO)',         policy_status: 'Not started', review_date: '',           next_review_date: '',           files: [] },
  { id: 'demo-p11', policy_name: 'DPIA and Periodic Audit Policy',                category: 'Governance and assurance', requirement: 'Recommended', section_rule: 'Sections 10 and 27',    policy_owner: 'Neha Kapoor (DPO)',          policy_status: 'Published',   review_date: '2025-10-20', next_review_date: '2026-10-20', files: [{ file_name: 'dpia-audit-policy.pdf' }] },
];

export function createDemoPolicies() {
  return DEMO_POLICIES.map(policy => ({ ...policy, files: policy.files.map(file => ({ ...file })) }));
}
