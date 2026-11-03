/**
 * data/ropa.js
 * Static reference data and mock records for the RoPA module.
 * Based on DPDPA_GDPR_RoPA_Template (DPDPA 2023 + GDPR aligned).
 */

/* ── Status options ──────────────────────────────────────── */
export const STATUS_OPTIONS = [
  { value: 'active',       label: 'Active' },
  { value: 'inactive',     label: 'Inactive' },
  { value: 'under_review', label: 'Under Review' },
];

export const STATUS_META = {
  active:       { label: 'Active',       bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  inactive:     { label: 'Inactive',     bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#94A3B8' },
  under_review: { label: 'Under Review', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
};

/* ── Sensitivity ─────────────────────────────────────────── */
export const SENSITIVITY_META = {
  high:   { label: 'High',   bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  medium: { label: 'Medium', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  low:    { label: 'Low',    bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
};

/* ── Legal basis — DPDPA 2023 ────────────────────────────── */
export const LEGAL_BASIS_DPDPA = [
  { value: 'Consent',             label: 'Consent',             section: 'S.6' },
  { value: 'Contract',            label: 'Contract',            section: 'S.4' },
  { value: 'Legal Obligation',    label: 'Legal Obligation',    section: 'S.4' },
  { value: 'Vital Interests',     label: 'Vital Interests',     section: 'S.4' },
  { value: 'Legitimate Purpose',  label: 'Legitimate Purpose',  section: 'S.7' },
  { value: 'State Function',      label: 'State Function',      section: 'S.4(2)' },
];

/* ── Legal basis — GDPR ──────────────────────────────────── */
export const LEGAL_BASIS_GDPR = [
  { value: 'Consent (Art.6(1)(a))',             label: 'Consent',              article: 'Art.6(1)(a)' },
  { value: 'Contract (Art.6(1)(b))',            label: 'Contract',             article: 'Art.6(1)(b)' },
  { value: 'Legal Obligation (Art.6(1)(c))',    label: 'Legal Obligation',     article: 'Art.6(1)(c)' },
  { value: 'Vital Interests (Art.6(1)(d))',     label: 'Vital Interests',      article: 'Art.6(1)(d)' },
  { value: 'Public Task (Art.6(1)(e))',         label: 'Public Task',          article: 'Art.6(1)(e)' },
  { value: 'Legitimate Interests (Art.6(1)(f))','label': 'Legitimate Interests', article: 'Art.6(1)(f)' },
];

/* ── Data categories reference ───────────────────────────── */
export const DATA_CATEGORIES = [
  { value: 'Basic Identifiers',       label: 'Basic Identifiers',       sensitivity: 'low',    gdpr_special: false, examples: 'Name, Email, Phone, Address, Username' },
  { value: 'Government IDs',          label: 'Government IDs',          sensitivity: 'high',   gdpr_special: false, examples: 'Aadhaar, PAN, Passport, Driving Licence, Voter ID' },
  { value: 'Financial Data',          label: 'Financial Data',          sensitivity: 'high',   gdpr_special: false, examples: 'Bank account, Credit card, UPI ID, Salary, Tax details' },
  { value: 'Health / Medical Data',   label: 'Health / Medical Data',   sensitivity: 'high',   gdpr_special: true,  examples: 'Medical records, prescriptions, diagnoses, disability' },
  { value: 'Biometric Data',          label: 'Biometric Data',          sensitivity: 'high',   gdpr_special: true,  examples: 'Fingerprint, facial recognition, iris scan, voice print' },
  { value: "Children's Data",         label: "Children's Data",         sensitivity: 'high',   gdpr_special: true,  examples: 'Any personal data of persons under 18 years' },
  { value: 'Location Data',           label: 'Location Data',           sensitivity: 'medium', gdpr_special: false, examples: 'GPS, IP address, real-time location, geo-tagging' },
  { value: 'Behavioural Data',        label: 'Behavioural Data',        sensitivity: 'medium', gdpr_special: false, examples: 'Browsing history, purchase patterns, app usage, clicks' },
  { value: 'Employment / HR Data',    label: 'Employment / HR Data',    sensitivity: 'medium', gdpr_special: false, examples: 'Emp ID, performance, payroll, leave, appraisals' },
  { value: 'Communication Data',      label: 'Communication Data',      sensitivity: 'medium', gdpr_special: false, examples: 'Emails, chat logs, call recordings, correspondence' },
  { value: 'Racial / Ethnic Origin',  label: 'Racial / Ethnic Origin',  sensitivity: 'high',   gdpr_special: true,  examples: 'Self-declared race, caste, ethnicity, national origin' },
  { value: 'Political / Religious',   label: 'Political / Religious',   sensitivity: 'high',   gdpr_special: true,  examples: 'Political opinions, religion, trade union membership' },
  { value: 'Sexual Orientation',      label: 'Sexual Orientation',      sensitivity: 'high',   gdpr_special: true,  examples: 'Gender identity, sexual orientation' },
  { value: 'Criminal Records',        label: 'Criminal Records',        sensitivity: 'high',   gdpr_special: true,  examples: 'Criminal convictions, offences, FIRs, judicial records' },
  { value: 'Pseudonymised Data',      label: 'Pseudonymised Data',      sensitivity: 'medium', gdpr_special: false, examples: 'Data with identifiers replaced by codes (re-identifiable)' },
];

/* ── Rights ──────────────────────────────────────────────── */
export const RIGHTS_OPTIONS = [
  'Access', 'Correction', 'Erasure', 'Portability', 'Restriction', 'Objection', 'Withdraw Consent', 'Grievance',
];

/* ── DPA status ──────────────────────────────────────────── */
export const DPA_STATUS_META = {
  yes:     { label: 'Yes',     bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  no:      { label: 'No',      bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  pending: { label: 'Pending', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
};

/* ── DPIA status ─────────────────────────────────────────── */
export const DPIA_STATUS_META = {
  completed:   { label: 'Completed',   bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  in_progress: { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  not_started: { label: 'Not Started', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
};

/* ── Notice status ───────────────────────────────────────── */
export const NOTICE_STATUS_META = {
  yes:         { label: 'Yes',         bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  no:          { label: 'No',          bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  in_progress: { label: 'In Progress', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
};

/* ── Completeness checklist items (from RoPA Dashboard sheet) ── */
export const CHECKLIST_ITEMS = [
  { id: 'all_documented',     label: 'All activities documented in RoPA Register' },
  { id: 'legal_basis',        label: 'Legal basis mapped for all activities (DPDPA)' },
  { id: 'notice_provided',    label: 'Privacy notice provided for all processing activities' },
  { id: 'dpa_in_place',       label: 'DPA in place with all third-party vendors' },
  { id: 'dpia_completed',     label: 'DPIA completed for all high-risk activities' },
  { id: 'retention_defined',  label: 'Retention periods defined for all activities' },
  { id: 'data_localisation',  label: 'Data localisation compliance verified (DPDPA S.16)' },
  { id: 'cross_border_docs',  label: 'Cross-border transfer safeguards documented' },
  { id: 'audit_trail',        label: 'Audit trail maintained for all activities' },
  { id: 'children_consent',   label: "Children data activities have parental consent mechanism" },
];

/* ── Mock RoPA Records ───────────────────────────────────── */
export const MOCK_ROPA_RECORDS = [
  {
    id: 1,
    ropa_id: 'RPA-001',
    processing_activity: 'Employee Payroll Processing',
    department: 'Human Resources',
    process_owner: 'HR Manager / CFO',
    last_updated: '2026-06-01',
    status: 'active',
    purpose: 'Process salary, deductions, statutory filings (PF, ESI, TDS)',
    legal_basis_dpdpa: 'Legal Obligation',
    legal_basis_gdpr: 'Legal Obligation (Art.6(1)(c))',
    consent_mechanism: 'N/A',
    data_principals: 'Employees',
    volume: '~500',
    childrens_data: false,
    children_safeguard: 'N/A',
    data_categories: ['Employment / HR Data', 'Government IDs', 'Financial Data'],
    sensitive_data: 'PAN, Aadhaar, Bank account',
    sensitivity_level: 'high',
    collection_source: 'HRMS / Onboarding forms',
    notice_provided: 'yes',
    notice_reference: 'Internal Privacy Notice v2.1',
    storage_location: 'Cloud (GreyHR)',
    storage_country: 'India',
    data_localisation: true,
    retention_period: '7 years (Income Tax Act)',
    retention_basis: 'Statutory requirement',
    deletion_method: 'Secure deletion',
    third_party_vendors: 'GreyHR',
    vendor_country: 'India',
    dpa_in_place: 'yes',
    cross_border_transfer: false,
    security_measures: 'Encryption, RBAC, MFA, Audit logs',
    encryption: 'At Rest and In Transit',
    access_controls: 'RBAC + MFA',
    dpia_required: false,
    dpia_status: null,
    dpia_reference: null,
    rights_supported: ['Access', 'Correction', 'Erasure'],
    grievance_channel: 'Internal HR / DPO',
    audit_trail: [{ date: '2026-06-01', change: 'Initial entry', by: 'Privacy Officer' }],
    reviewed_by: 'Adarsh Chourasiya',
    next_review: '2027-06-01',
  },
  {
    id: 2,
    ropa_id: 'RPA-002',
    processing_activity: 'Customer Onboarding & KYC',
    department: 'Operations',
    process_owner: 'VP Operations',
    last_updated: '2026-06-01',
    status: 'active',
    purpose: 'Collecting and verifying customer identity for service activation',
    legal_basis_dpdpa: 'Consent',
    legal_basis_gdpr: 'Consent (Art.6(1)(a))',
    consent_mechanism: 'Digital consent form (timestamp + IP logged)',
    data_principals: 'Customers',
    volume: '~12,000',
    childrens_data: false,
    children_safeguard: 'N/A',
    data_categories: ['Basic Identifiers', 'Government IDs', 'Biometric Data'],
    sensitive_data: 'Aadhaar, PAN, Photo (Biometric)',
    sensitivity_level: 'high',
    collection_source: 'Online form / Mobile app',
    notice_provided: 'yes',
    notice_reference: 'Website Privacy Policy v3.0',
    storage_location: 'Cloud (AWS S3)',
    storage_country: 'India',
    data_localisation: true,
    retention_period: '5 years post account closure',
    retention_basis: 'RBI KYC norms',
    deletion_method: 'Anonymisation',
    third_party_vendors: 'Amazon Web Services, Razorpay',
    vendor_country: 'India / USA',
    dpa_in_place: 'yes',
    cross_border_transfer: true,
    security_measures: 'AES-256, RBAC, MFA, Pen tested',
    encryption: 'At Rest and In Transit',
    access_controls: 'RBAC + MFA',
    dpia_required: true,
    dpia_status: 'completed',
    dpia_reference: 'DPIA-2026-001 (15-01-2026)',
    rights_supported: ['Access', 'Correction', 'Erasure', 'Portability'],
    grievance_channel: 'Internal / DPO / RBI Ombudsman',
    audit_trail: [{ date: '2026-06-01', change: 'Initial entry', by: 'Privacy Officer' }],
    reviewed_by: 'Adarsh Chourasiya',
    next_review: '2027-06-01',
  },
  {
    id: 3,
    ropa_id: 'RPA-003',
    processing_activity: 'Marketing Email Campaigns',
    department: 'Marketing',
    process_owner: 'Head of Marketing',
    last_updated: '2026-06-01',
    status: 'active',
    purpose: 'Sending promotional emails and targeted campaigns',
    legal_basis_dpdpa: 'Consent',
    legal_basis_gdpr: 'Consent (Art.6(1)(a))',
    consent_mechanism: 'Email opt-in with double opt-in (HubSpot)',
    data_principals: 'Customers / Prospects',
    volume: '~25,000',
    childrens_data: false,
    children_safeguard: 'N/A',
    data_categories: ['Basic Identifiers', 'Behavioural Data', 'Location Data'],
    sensitive_data: 'Behavioural/Profile data',
    sensitivity_level: 'medium',
    collection_source: 'Website sign-up / CRM import',
    notice_provided: 'yes',
    notice_reference: 'Cookie Policy + Privacy Policy',
    storage_location: 'Cloud (HubSpot)',
    storage_country: 'USA',
    data_localisation: false,
    retention_period: '3 years / Until consent withdrawn',
    retention_basis: 'Consent-based',
    deletion_method: 'Secure deletion on unsubscribe',
    third_party_vendors: 'HubSpot, Google Analytics',
    vendor_country: 'USA',
    dpa_in_place: 'pending',
    cross_border_transfer: true,
    security_measures: 'TLS, RBAC, GDPR DPA with HubSpot',
    encryption: 'In Transit Only',
    access_controls: 'RBAC Only',
    dpia_required: false,
    dpia_status: null,
    dpia_reference: null,
    rights_supported: ['Access', 'Erasure', 'Objection', 'Portability'],
    grievance_channel: 'DPO / Unsubscribe link',
    audit_trail: [{ date: '2026-06-01', change: 'Initial entry', by: 'Privacy Officer' }],
    reviewed_by: 'Adarsh Chourasiya',
    next_review: '2026-12-01',
  },
  {
    id: 4,
    ropa_id: 'RPA-004',
    processing_activity: 'Employee Recruitment',
    department: 'Human Resources',
    process_owner: 'HR Manager',
    last_updated: '2026-06-01',
    status: 'active',
    purpose: 'Collecting applicant data for selection and hiring',
    legal_basis_dpdpa: 'Consent',
    legal_basis_gdpr: 'Legitimate Interests (Art.6(1)(f))',
    consent_mechanism: 'Application form consent checkbox',
    data_principals: 'Job Applicants',
    volume: '~800/year',
    childrens_data: false,
    children_safeguard: 'N/A',
    data_categories: ['Basic Identifiers', 'Employment / HR Data'],
    sensitive_data: 'N/A',
    sensitivity_level: 'low',
    collection_source: 'Job portal / Email / Application form',
    notice_provided: 'yes',
    notice_reference: 'Recruitment Privacy Notice',
    storage_location: 'Cloud (Zoho Recruit)',
    storage_country: 'India',
    data_localisation: true,
    retention_period: '1 year post-rejection',
    retention_basis: 'Business need',
    deletion_method: 'Secure deletion',
    third_party_vendors: 'Zoho Recruit, LinkedIn',
    vendor_country: 'India / USA',
    dpa_in_place: 'yes',
    cross_border_transfer: true,
    security_measures: 'TLS, RBAC, HR-restricted access',
    encryption: 'In Transit Only',
    access_controls: 'RBAC Only',
    dpia_required: false,
    dpia_status: null,
    dpia_reference: null,
    rights_supported: ['Access', 'Correction', 'Erasure'],
    grievance_channel: 'HR Department / DPO',
    audit_trail: [{ date: '2026-06-01', change: 'Initial entry', by: 'Privacy Officer' }],
    reviewed_by: 'Adarsh Chourasiya',
    next_review: '2027-06-01',
  },
  {
    id: 5,
    ropa_id: 'RPA-005',
    processing_activity: 'Customer Support & Grievance',
    department: 'Customer Success',
    process_owner: 'Head of Customer Success',
    last_updated: '2026-06-01',
    status: 'active',
    purpose: 'Managing complaints, tickets, and grievance resolution',
    legal_basis_dpdpa: 'Contract',
    legal_basis_gdpr: 'Contract (Art.6(1)(b))',
    consent_mechanism: 'N/A — Contract performance',
    data_principals: 'Customers',
    volume: '~12,000',
    childrens_data: false,
    children_safeguard: 'N/A',
    data_categories: ['Basic Identifiers', 'Communication Data'],
    sensitive_data: 'N/A',
    sensitivity_level: 'medium',
    collection_source: 'Ticket system / Email / Chat',
    notice_provided: 'yes',
    notice_reference: 'Privacy Policy v3.0',
    storage_location: 'Cloud (Freshdesk)',
    storage_country: 'India',
    data_localisation: true,
    retention_period: '3 years post closure',
    retention_basis: 'Contractual obligation',
    deletion_method: 'Secure deletion',
    third_party_vendors: 'Freshdesk',
    vendor_country: 'India',
    dpa_in_place: 'pending',
    cross_border_transfer: false,
    security_measures: 'TLS, RBAC, Ticket encryption',
    encryption: 'In Transit Only',
    access_controls: 'RBAC Only',
    dpia_required: false,
    dpia_status: null,
    dpia_reference: null,
    rights_supported: ['Access', 'Correction'],
    grievance_channel: 'Grievance Officer / DPO',
    audit_trail: [{ date: '2026-06-01', change: 'Initial entry', by: 'Privacy Officer' }],
    reviewed_by: 'Adarsh Chourasiya',
    next_review: '2027-06-01',
  },
];

/* ── Dashboard stats derived from records ────────────────── */
export function computeDashboardStats(records) {
  return {
    total:              records.length,
    active:             records.filter(r => r.status === 'active').length,
    inactive:           records.filter(r => r.status === 'inactive').length,
    under_review:       records.filter(r => r.status === 'under_review').length,
    high_sensitivity:   records.filter(r => r.sensitivity_level === 'high').length,
    dpia_required:      records.filter(r => r.dpia_required).length,
    missing_dpa:        records.filter(r => r.dpa_in_place === 'no').length,
    pending_dpa:        records.filter(r => r.dpa_in_place === 'pending').length,
    cross_border:       records.filter(r => r.cross_border_transfer).length,
    childrens_data:     records.filter(r => r.childrens_data).length,
    notice_not_provided: records.filter(r => r.notice_provided === 'no').length,
  };
}

/* ── Next RoPA ID generator ──────────────────────────────── */
export function nextRopaId(records) {
  const nums = records.map(r => parseInt(r.ropa_id.replace('RPA-', ''), 10)).filter(Boolean);
  const max = nums.length ? Math.max(...nums) : 0;
  return `RPA-${String(max + 1).padStart(3, '0')}`;
}

/* ── Demo RoPA (mock mode only — served by api/services/ropa.js) ──────────
   API shapes: question bank, processes, and per-process answers keyed by field_name. */
const q = (id, section, field_name, display_text, question, answer_type, is_required = false) =>
  ({ id, section, order_no: id, field_name, display_text, question, answer_type, is_required });

export const DEMO_ROPA_QUESTIONS = [
  q(1,  'Purpose & Legal Basis', 'purpose',               'Purpose',                    'Why is this personal data processed?', 'text', true),
  q(2,  'Purpose & Legal Basis', 'legal_basis_dpdpa',     'Legal basis (DPDPA)',        'Which DPDP Act ground permits this processing?', 'select', true),
  q(3,  'Purpose & Legal Basis', 'legal_basis_gdpr',      'Legal basis (GDPR)',         'Only if EU residents are in scope.', 'select'),
  q(4,  'Purpose & Legal Basis', 'consent_mechanism',     'Consent mechanism',          'How is consent captured and withdrawn?', 'text'),
  q(5,  'Data Principals',       'data_principals',       'Data principals',            'Whose personal data is processed?', 'string', true),
  q(6,  'Data Principals',       'volume',                'Approximate volume',         'Number of individuals.', 'number'),
  q(7,  'Data Principals',       'children_data',         "Children's data",            'Does this include data of anyone under 18?', 'boolean'),
  q(8,  'Data Categories',       'data_categories',       'Data categories',            'List the personal data fields collected.', 'text'),
  q(9,  'Data Categories',       'sensitivity_level',     'Sensitivity level',          null, 'select', true),
  q(10, 'Collection & Notice',   'collection_source',     'Collection source',          'Where does the data come from?', 'string'),
  q(11, 'Collection & Notice',   'notice_provided',       'Privacy notice provided',    'Is a Section 5 notice given at or before collection?', 'boolean'),
  q(12, 'Storage & Retention',   'storage_location',      'Storage location',           'System and hosting region.', 'string'),
  q(13, 'Storage & Retention',   'retention_period',      'Retention period',           null, 'string'),
  q(14, 'Storage & Retention',   'retention_basis',       'Retention basis',            null, 'select'),
  q(15, 'Storage & Retention',   'deletion_method',       'Deletion method',            null, 'select'),
  q(16, 'Third Parties',         'third_party_vendors',   'Third-party vendors',        'Processors that receive this data.', 'string'),
  q(17, 'Third Parties',         'dpa_in_place',          'DPA in place',               'yes, no or pending', 'string'),
  q(18, 'Third Parties',         'cross_border_transfer', 'Cross-border transfer',      null, 'select'),
  q(19, 'Security',              'security_measures',     'Security measures',          null, 'multiselect'),
  q(20, 'Security',              'encryption',            'Encryption',                 null, 'select'),
  q(21, 'Security',              'access_controls',       'Access controls',            null, 'select'),
  q(22, 'DPIA',                  'dpia_required',         'DPIA required',              'High-risk or large-scale processing?', 'boolean'),
  q(23, 'DPIA',                  'dpia_status',           'DPIA status',                null, 'select'),
  q(24, 'Data Principal Rights', 'rights_supported',      'Rights supported',           null, 'multiselect'),
  q(25, 'Data Principal Rights', 'grievance_channel',     'Grievance channel',          null, 'select'),
];

export const DEMO_ROPA_PROCESSES = [
  {
    process: { id: 1, process_name: 'Customer Onboarding & KYC', process_description: 'Identity verification before activating customer accounts and wallet features.', department: 'Operations', process_owner: 'VP Operations', status: true, updated_at: '2026-10-28T10:30:00Z' },
    answers: {
      purpose: 'Verify customer identity before activating accounts and payment features, as required for KYC.',
      legal_basis_dpdpa: 'Legal_Obligation', legal_basis_gdpr: 'Legal_Obligation', consent_mechanism: 'Not required — statutory KYC obligation.',
      data_principals: 'Customers', volume: 120000, children_data: false,
      data_categories: 'Name, PAN, masked Aadhaar, address, phone, selfie for liveness check', sensitivity_level: 'High',
      collection_source: 'Mobile app and web sign-up', notice_provided: true,
      storage_location: 'Cloud — Mumbai region', retention_period: '5 years after account closure (PMLA)', retention_basis: 'Legal', deletion_method: 'Secure_Wipe',
      third_party_vendors: 'KYCVerify Labs', dpa_in_place: 'pending', cross_border_transfer: 'No',
      security_measures: ['Encryption', 'RBAC', 'MFA', 'Access logging'], encryption: 'At_Rest_And_In_Transit', access_controls: 'MFA',
      dpia_required: true, dpia_status: 'In_Progress',
      rights_supported: ['Access', 'Correction', 'Grievance'], grievance_channel: 'DPO',
    },
  },
  {
    process: { id: 2, process_name: 'Order Fulfilment & Delivery', process_description: 'Sharing delivery details with courier partners to ship orders.', department: 'Logistics', process_owner: 'Head of Logistics', status: true, updated_at: '2026-10-21T08:15:00Z' },
    answers: {
      purpose: 'Deliver purchased goods and send delivery updates.',
      legal_basis_dpdpa: 'Contract', legal_basis_gdpr: 'Contract', consent_mechanism: 'Not required — needed to fulfil the order.',
      data_principals: 'Customers', volume: 250000, children_data: false,
      data_categories: 'Name, delivery address, phone number, order contents', sensitivity_level: 'Medium',
      collection_source: 'Checkout', notice_provided: true,
      storage_location: 'Order management system — Mumbai region', retention_period: '3 years after delivery', retention_basis: 'Business', deletion_method: 'Anonymise',
      third_party_vendors: 'SwiftShip Couriers', dpa_in_place: 'yes', cross_border_transfer: 'No',
      security_measures: ['Encryption', 'RBAC', 'Backups'], encryption: 'At_Rest_And_In_Transit', access_controls: 'RBAC',
      dpia_required: false, dpia_status: 'Not_Applicable',
      rights_supported: ['Access', 'Correction', 'Erasure', 'Grievance'], grievance_channel: 'Internal',
    },
  },
  {
    process: { id: 3, process_name: 'Marketing Emails & Personalisation', process_description: 'Promotional emails and product recommendations based on browsing history.', department: 'Marketing', process_owner: 'Chief Marketing Officer', status: true, updated_at: '2026-09-14T12:00:00Z' },
    answers: {
      purpose: 'Send promotional offers and personalise product recommendations.',
      legal_basis_dpdpa: 'Consent', legal_basis_gdpr: 'Consent', consent_mechanism: 'Opt-in checkbox at checkout; unsubscribe link in every email.',
      data_principals: 'Customers and newsletter subscribers', volume: 80000, children_data: false,
      data_categories: 'Email, name, purchase history, browsing behaviour', sensitivity_level: 'Medium',
      collection_source: 'Website, app and checkout', notice_provided: false,
      storage_location: 'Email platform — United States', retention_period: 'Until consent is withdrawn', retention_basis: 'Business', deletion_method: 'Secure_Wipe',
      third_party_vendors: 'MailBridge', dpa_in_place: 'no', cross_border_transfer: 'Yes_With_SCCs',
      security_measures: ['Encryption', 'RBAC'], encryption: 'In_Transit', access_controls: 'Basic_Password',
      dpia_required: true, dpia_status: 'Not_Started',
      rights_supported: ['Access', 'Erasure', 'Withdraw Consent', 'Objection'], grievance_channel: 'DPO',
    },
  },
  {
    process: { id: 4, process_name: 'Employee Payroll Processing', process_description: 'Salary, deductions and statutory filings (PF, ESI, TDS).', department: 'Human Resources', process_owner: 'HR Manager', status: true, updated_at: '2026-10-02T09:00:00Z' },
    answers: {
      purpose: 'Pay salaries and meet statutory filing obligations.',
      legal_basis_dpdpa: 'Legal_Obligation', legal_basis_gdpr: '', consent_mechanism: 'Not required — employment and tax law.',
      data_principals: 'Employees', volume: 500, children_data: false,
      data_categories: 'Name, PAN, Aadhaar, bank account, salary, PF number', sensitivity_level: 'High',
      collection_source: 'Onboarding forms and HR system', notice_provided: true,
      storage_location: 'Payroll software — India', retention_period: '8 years (Income Tax Act)', retention_basis: 'Legal', deletion_method: 'Secure_Wipe',
      third_party_vendors: 'PayrollPro', dpa_in_place: 'yes', cross_border_transfer: 'No',
      security_measures: ['Encryption', 'RBAC', 'MFA', 'Access logging', 'Backups'], encryption: 'At_Rest_And_In_Transit', access_controls: 'MFA',
      dpia_required: false, dpia_status: 'Not_Applicable',
      rights_supported: ['Access', 'Correction', 'Grievance'], grievance_channel: 'Internal',
    },
  },
  {
    process: { id: 5, process_name: 'CCTV Surveillance at Warehouses', process_description: 'Video monitoring of warehouse floors and entry gates.', department: 'Facilities', process_owner: 'Facilities Manager', status: true, updated_at: '2026-08-30T16:45:00Z' },
    answers: {
      purpose: 'Prevent theft and keep staff and visitors safe.',
      legal_basis_dpdpa: 'Legitimate_Purpose', legal_basis_gdpr: '', consent_mechanism: 'Signage at entry points.',
      data_principals: 'Employees, contractors and visitors', volume: 2000, children_data: false,
      data_categories: 'Video footage, entry timestamps', sensitivity_level: 'Medium',
      collection_source: 'On-site cameras', notice_provided: true,
      storage_location: 'On-premise video recorder', retention_period: '30 days', retention_basis: 'Business', deletion_method: 'Secure_Wipe',
      third_party_vendors: 'SecureEye Systems', dpa_in_place: 'yes', cross_border_transfer: 'No',
      security_measures: ['RBAC', 'Access logging'], encryption: 'At_Rest', access_controls: 'RBAC',
      dpia_required: true, dpia_status: 'Completed',
      rights_supported: ['Access', 'Grievance'], grievance_channel: 'Internal',
    },
  },
  {
    process: { id: 6, process_name: "Kids' Learning Club Sign-ups", process_description: 'Sign-ups for a paused workshop programme for children aged 8–14.', department: 'Marketing', process_owner: 'Community Lead', status: false, updated_at: '2026-07-11T11:20:00Z' },
    answers: {
      purpose: 'Register children for learning workshops and contact parents about sessions.',
      legal_basis_dpdpa: 'Consent', legal_basis_gdpr: '', consent_mechanism: 'Verifiable parental consent via OTP sent to the parent.',
      data_principals: 'Children and their parents', volume: 1500, children_data: true,
      data_categories: "Child's name and age, parent's name, email and phone", sensitivity_level: 'High',
      collection_source: 'Event sign-up form', notice_provided: true,
      storage_location: 'Analytics platform — United States', retention_period: '1 year after the programme ends', retention_basis: 'Business', deletion_method: 'Secure_Wipe',
      third_party_vendors: 'InsightLytics', dpa_in_place: 'no', cross_border_transfer: 'Yes',
      security_measures: ['Encryption'], encryption: 'In_Transit', access_controls: 'Basic_Password',
      dpia_required: true, dpia_status: 'Not_Started',
      rights_supported: ['Access', 'Erasure', 'Withdraw Consent', 'Grievance'], grievance_channel: 'DPO',
    },
  },
];

/* Dashboard payload (API key names) derived from records merged with their answers */
export function computeDemoRopaDashboard(records) {
  const crossBorder = r => r.cross_border_transfer && !['No', 'Not Applicable'].includes(r.cross_border_transfer);
  const level = l => records.filter(r => String(r.sensitivity_level ?? '').toLowerCase() === l).length;
  const dpia = records.filter(r => r.dpia_required === true);
  return {
    total_processing_activities: records.length,
    active_activities: records.filter(r => r.status === 'active').length,
    dpia_required: dpia.length,
    dpia_not_started: dpia.filter(r => r.dpia_status === 'Not_Started').length,
    high_sensitivity_activities: level('high'),
    medium_sensitivity_activities: level('medium'),
    low_sensitivity_activities: level('low'),
    missing_dpas_vendors: records.filter(r => r.dpa_in_place === 'no').length,
    pending_dpa: records.filter(r => r.dpa_in_place === 'pending').length,
    cross_border_transfers: records.filter(crossBorder).length,
    cross_border_transfers_without_safeguards: records.filter(r => r.cross_border_transfer === 'Yes').length,
    children_data_activities: records.filter(r => r.children_data === true).length,
    notice_not_provided: records.filter(r => r.notice_provided === false).length,
    checklist: {
      all_documented:    true,
      legal_basis:       records.every(r => r.legal_basis_dpdpa),
      notice_provided:   records.every(r => r.notice_provided === true),
      dpa_in_place:      records.every(r => !r.third_party_vendors || r.dpa_in_place === 'yes'),
      dpia_completed:    dpia.every(r => r.dpia_status === 'Completed'),
      retention_defined: records.every(r => r.retention_period),
      data_localisation: records.every(r => !crossBorder(r)),
      cross_border_docs: records.filter(crossBorder).every(r => r.cross_border_transfer !== 'Yes'),
      audit_trail:       true,
      children_consent:  records.filter(r => r.children_data === true).every(r => r.legal_basis_dpdpa === 'Consent'),
    },
  };
}
