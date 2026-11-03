/**
 * config/obligations.js
 *
 * Single source of truth for all static obligation and GAPP principle data.
 * Imported by ObligationControls, Dashboard, Assessment, and any future page
 * that needs to list or look up obligations / principles.
 */

/* ── GAPP Principle enum ─────────────────────────────────────────────────── */

export const GAPP_PRINCIPLES = {
  Management:            'Management',
  Notice:                'Notice',
  Choice_Consent:        'Choice_Consent',
  Collection:            'Collection',
  Use_Retention_Disposal:'Use_Retention_Disposal',
  Access:                'Access',
  Disclosure:            'Disclosure',
  Security:              'Security',
  Quality:               'Quality',
  Monitor_Enforcement:   'Monitor_Enforcement',
};

export const GAPP_PRINCIPLE_LABELS = {
  Management:             'Management',
  Notice:                 'Notice',
  Choice_Consent:         'Choice & Consent',
  Collection:             'Collection',
  Use_Retention_Disposal: 'Use, Retention & Disposal',
  Access:                 'Access',
  Disclosure:             'Disclosure to Third Parties',
  Security:               'Security for Privacy',
  Quality:                'Quality',
  Monitor_Enforcement:    'Monitoring & Enforcement',
};

/* ── DPDPA Obligations ───────────────────────────────────────────────────── */

export const DPDPA_OBLIGATIONS = [
  {
    id: 'OBL-1',
    title: 'Consent management',
    dpdpRef: 'Section 6 & 7',
    gappPrinciple: GAPP_PRINCIPLES.Choice_Consent,
    desc: 'Obtain free, specific, informed, unconditional and unambiguous consent before processing personal data. Maintain consent artefacts and enable withdrawal at any time.',
    controls: [
      { num: '1.1', title: 'Consent banner deployed on all data collection touchpoints', ref: 'Section 6(1)' },
      { num: '1.2', title: 'Consent records stored with timestamps, purpose, and user agent', ref: 'Section 7(1)' },
      { num: '1.3', title: 'Consent withdrawal mechanism accessible to all users', ref: 'Section 6(4)' },
      { num: '1.4', title: 'Existing user base has valid re-consent on record', ref: 'Section 7(2)' },
      { num: '1.5', title: 'Consent scope limited strictly to stated processing purpose', ref: 'Section 6(3)' },
    ],
  },
  {
    id: 'OBL-2',
    title: 'Privacy notice (Section 5)',
    dpdpRef: 'Section 5',
    gappPrinciple: GAPP_PRINCIPLES.Notice,
    desc: 'Publish a clear, accessible privacy notice covering all personal data collected, purposes of processing, and Data Principal rights before or at the time of collection.',
    controls: [
      { num: '2.1', title: 'Privacy notice generated and published on all platforms', ref: 'Section 5(1)' },
      { num: '2.2', title: 'Notice available in applicable 8th Schedule languages', ref: 'Section 5(2)' },
      { num: '2.3', title: 'Notice linked from every data collection form and consent flow', ref: 'Section 5(1)(a)' },
      { num: '2.4', title: 'Version history of all notice changes maintained', ref: 'Section 5(3)' },
      { num: '2.5', title: 'DPO contact details published within the notice', ref: 'Section 5(1)(d)' },
    ],
  },
  {
    id: 'OBL-3',
    title: 'Data Principal rights',
    dpdpRef: 'Section 11–14',
    gappPrinciple: GAPP_PRINCIPLES.Access,
    desc: 'Enable and honour rights of Data Principals: access, correction, erasure, portability, and nomination as required under Chapter III of the DPDP Act.',
    controls: [
      { num: '3.1', title: 'Right-to-access request workflow (30-day fulfilment SLA)', ref: 'Section 11' },
      { num: '3.2', title: 'Right-to-correction workflow for inaccurate personal data', ref: 'Section 12(1)' },
      { num: '3.3', title: 'Right-to-erasure (Right to be forgotten) workflow', ref: 'Section 12(3)' },
      { num: '3.4', title: 'Nomination mechanism for death or incapacity of Data Principal', ref: 'Section 14' },
    ],
  },
  {
    id: 'OBL-4',
    title: 'Data localisation (SDF)',
    dpdpRef: 'Section 16–17',
    gappPrinciple: GAPP_PRINCIPLES.Use_Retention_Disposal,
    desc: 'If notified as a Significant Data Fiduciary, ensure personal data and mirrored data remain within India or only in MeitY-approved jurisdictions.',
    controls: [
      { num: '4.1', title: 'Significant Data Fiduciary (SDF) assessment completed', ref: 'Section 17(2)' },
      { num: '4.2', title: 'Data residency map documented for all processing locations', ref: 'Section 17(1)' },
    ],
  },
  {
    id: 'OBL-5',
    title: 'Data Processor agreements',
    dpdpRef: 'Section 8',
    gappPrinciple: GAPP_PRINCIPLES.Disclosure,
    desc: 'Ensure all third-party Data Processors handling personal data have a valid, signed Data Processing Agreement (DPA) in place, with sub-processor lists maintained.',
    controls: [
      { num: '5.1', title: 'DPA signed with every processor handling personal data', ref: 'Section 8(2)' },
      { num: '5.2', title: 'DPA reviewed and renewed annually', ref: 'Section 8(3)' },
      { num: '5.3', title: 'Sub-processor register maintained and kept current', ref: 'Section 8(4)' },
    ],
  },
  {
    id: 'OBL-6',
    title: 'Breach notification',
    dpdpRef: 'Section 8(6)–8(7)',
    gappPrinciple: GAPP_PRINCIPLES.Security,
    desc: 'Detect, assess, and notify the Data Protection Board and affected Data Principals of personal data breaches within the prescribed timeframe.',
    controls: [
      { num: '6.1', title: 'Breach detection and severity classification playbook documented', ref: 'Section 8(6)' },
      { num: '6.2', title: '72-hour Board notification workflow tested (tabletop or live drill)', ref: 'Section 8(7)' },
      { num: '6.3', title: 'Data Principal notification templates prepared and approved', ref: 'Section 8(7)(b)' },
    ],
  },
  {
    id: 'OBL-7',
    title: "Children's data (Section 9)",
    dpdpRef: 'Section 9',
    gappPrinciple: GAPP_PRINCIPLES.Collection,
    desc: 'Obtain verifiable parental or guardian consent before processing personal data of individuals under 18 years of age. Prohibit behavioural tracking of minors.',
    controls: [
      { num: '7.1', title: 'Age-verification mechanism deployed at point of data collection', ref: 'Section 9(1)' },
      { num: '7.2', title: 'Verifiable parental consent workflow for under-18 users', ref: 'Section 9(2)' },
      { num: '7.3', title: 'Behavioural tracking and targeted advertising disabled for minors', ref: 'Section 9(3)' },
    ],
  },
  {
    id: 'OBL-8',
    title: 'Grievance redressal',
    dpdpRef: 'Section 13',
    gappPrinciple: GAPP_PRINCIPLES.Monitor_Enforcement,
    desc: 'Designate a Grievance Officer and publish a clear, timely grievance redressal mechanism. Respond within 24 hours and resolve within 30 days.',
    controls: [
      { num: '8.1', title: 'Grievance Officer designated and contact details published', ref: 'Section 13(1)' },
      { num: '8.2', title: 'Automated acknowledgement within 24 hours of grievance receipt', ref: 'Section 13(2)' },
      { num: '8.3', title: 'Resolution SLA documented — maximum 30 days', ref: 'Section 13(3)' },
      { num: '8.4', title: 'Escalation path to Data Protection Board documented', ref: 'Section 13(4)' },
    ],
  },
];

/* ── Compliance status options (used in audit table dropdowns) ───────────── */

export const STATUS_OPTIONS = [
  { value: '',               label: '— Not Assessed —' },
  { value: 'compliant',      label: 'Compliant' },
  { value: 'partial',        label: 'Partially Compliant' },
  { value: 'non-compliant',  label: 'Non-Compliant' },
  { value: 'na',             label: 'Not Applicable' },
];

export const STATUS_CLASS = {
  'compliant':     'status-compliant',
  'partial':       'status-partial',
  'non-compliant': 'status-non-compliant',
  'na':            'status-na',
  '':              '',
};
