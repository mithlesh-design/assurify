const NORMALIZED_SECTIONS = {
  purposelegalbasis: 'PURPOSE & LEGAL BASIS',
  dataprincipal: 'DATA PRINCIPALS',
  dataprincipals: 'DATA PRINCIPALS',
  dataprincipalrights: 'DATA PRINCIPAL RIGHTS',
  datacategories: 'DATA CATEGORIES',
  collectionnotice: 'COLLECTION & NOTICE',
  storageretention: 'STORAGE & RETENTION',
  thirdparty: 'THIRD PARTIES',
  security: 'SECURITY',
  dpia: 'DPIA',
};

export const ROPA_SECTION_GROUPS = {
  purpose: ['PURPOSE & LEGAL BASIS'],
  data: ['DATA PRINCIPALS', 'DATA CATEGORIES', 'COLLECTION & NOTICE'],
  storage: ['STORAGE & RETENTION'],
  vendors: ['THIRD PARTIES'],
  security: ['SECURITY'],
  dpia: ['DPIA'],
  rights: ['DATA PRINCIPAL RIGHTS'],
};

export const ROPA_SECTION_LABELS = {
  'PURPOSE & LEGAL BASIS': 'Purpose & Legal Basis',
  'DATA PRINCIPALS': 'Data Principals',
  'DATA CATEGORIES': 'Data Categories & Sensitivity',
  'COLLECTION & NOTICE': 'Collection & Notice',
  'STORAGE & RETENTION': 'Storage & Retention',
  'THIRD PARTIES': 'Third-Party Vendors & Transfers',
  SECURITY: 'Security Measures',
  DPIA: 'Data Protection Impact Assessment (DPIA)',
  'DATA PRINCIPAL RIGHTS': 'Data Principal Rights',
};

export function normalizeRopaSection(section = '') {
  const key = section.toLowerCase().replace(/[^a-z]/g, '');
  return NORMALIZED_SECTIONS[key] ?? section.toUpperCase();
}

export function questionsForSections(questions, sections) {
  return questions
    .filter(question => sections.includes(normalizeRopaSection(question.section)))
    .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));
}

export function decodeRopaAnswer(answer, answerType) {
  if (answer == null || answer === '') return '';
  if (typeof answer !== 'string') return answer;
  const normalized = answer.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (answerType === 'boolean') {
    if (normalized === 'yes') return true;
    if (normalized === 'no') return false;
  }
  if (answer.startsWith('[') || answer.startsWith('{')) {
    try {
      return JSON.parse(answer);
    } catch {
      return answer;
    }
  }
  if (answerType === 'number' && answer.trim() !== '') {
    const number = Number(answer);
    return Number.isNaN(number) ? answer : number;
  }
  return answer;
}

export function encodeRopaAnswer(answer) {
  if (Array.isArray(answer)) return JSON.stringify(answer);
  if (typeof answer === 'boolean') return String(answer);
  return answer == null ? '' : String(answer);
}

const ENUM_OPTIONS = {
  legal_basis_dpdpa: ['Consent', 'Contract', 'Legal_Obligation', 'Vital_Interest', 'State_Function', 'Legitimate_Purpose'],
  legal_basis_gdpr: ['Consent', 'Contract', 'Legal_Obligation', 'Vital_Interest', 'Legitimate_Purpose', 'Public_Task'],
  sensitivity_level: ['Low', 'Medium', 'High'],
  cross_border_transfer: ['Yes', 'No', 'Not Applicable', 'Adequate_Decision', 'Yes_With_SCCs', 'Yes_With_BCRs'],
  encryption: ['At_Rest', 'In_Transit', 'At_Rest_And_In_Transit', 'Not_Encrypted'],
  access_controls: ['RBAC', 'MFA', 'Basic_Password', 'None'],
  dpia_status: ['Completed', 'In_Progress', 'Not_Started', 'Not_Applicable'],
  retention_basis: ['Legal', 'Business', 'Contractual'],
  deletion_method: ['Secure_Wipe', 'Anonymise', 'Archive'],
  grievance_channel: ['Internal', 'DPO', 'Ombudsman'],
  security_measures: ['Encryption', 'RBAC', 'MFA', 'Access logging', 'Backups', 'Penetration testing'],
  rights_supported: ['Access', 'Correction', 'Erasure', 'Portability', 'Restriction', 'Objection', 'Withdraw Consent', 'Grievance'],
};

export function ropaQuestionOptions(question) {
  return ENUM_OPTIONS[question.field_name] ?? [];
}

export function isRopaMultiSelect(question) {
  return question.answer_type === 'multiselect';
}

export function isRopaBoolean(question) {
  return question.answer_type === 'boolean';
}

export function isRopaText(question) {
  return question.answer_type === 'text';
}
