/* Initial 29 DPDP Act controls across 8 obligations */

function ago(days, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const OBL_META = [
  { id: 'OBL1', name: 'Consent management',       weight: 25 },
  { id: 'OBL2', name: 'Transparency & notice',    weight: 10 },
  { id: 'OBL3', name: 'Data minimisation',        weight: 10 },
  { id: 'OBL4', name: 'Data accuracy',            weight: 10 },
  { id: 'OBL5', name: 'Data fiduciary duties',    weight: 20 },
  { id: 'OBL6', name: 'Data principal rights',    weight: 10 },
  { id: 'OBL7', name: 'Grievance redressal',      weight: 10 },
  { id: 'OBL8', name: 'Cross-border transfers',   weight:  5 },
];

export const STATUS_META = [
  { value: 'pending_review',    label: 'Pending Review'    },
  { value: 'in_progress',       label: 'In Progress'       },
  { value: 'implemented',       label: 'Implemented'       },
  { value: 'needs_discussion',  label: 'Needs Discussion'  },
  { value: 'not_applicable',    label: 'Not Applicable'    },
];

export function statusLabel(s) {
  return STATUS_META.find(x => x.value === s)?.label ?? s;
}

export function statusClass(s) {
  const map = {
    pending_review:   'status-pending_review',
    in_progress:      'status-in_progress',
    implemented:      'status-implemented',
    needs_discussion: 'status-needs_discussion',
    blocked:          'status-blocked',
    not_applicable:   'status-not_applicable',
  };
  return map[s] ?? 'status-pending_review';
}

export function createInitialControls() {
  return [
    /* ─── OBL1: Consent management ─── */
    {
      id: 'OBL1-C1', obl: 'OBL1',
      name: 'Privacy notice — Section 5 compliance',
      req:  'DPDP Act §5(1)',
      desc: 'The privacy notice must state: purpose of processing, categories of data, retention periods per category, and data principal rights as required by DPDP Act §5(1).',
      status: 'needs_discussion',
      docs: [
        { id: 'd1', name: 'privacy_notice_v1.pdf', ver: 1, by: 'Priya Sharma', at: ago(12), size: '245 KB', status: 'needs_revision', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(14),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(12),   msg: 'Uploaded privacy_notice_v1.pdf for review.' },
        { id: 'e3', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(10),   msg: 'Status: Pending Review → Needs Discussion' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(10, 1), msg: 'The privacy notice is missing two critical sections required by DPDP Act §5(1):\n\n1. Purpose of processing — list each purpose explicitly.\n2. Retention periods — specify per data category.\n\nPlease revise and re-upload. I recommend a table: Data Category | Purpose | Retention Period | Legal Basis.' },
        { id: 'e5', type: 'comment', user: 'Priya Sharma', role: 'customer', at: ago(9),    msg: 'Thank you. Should retention periods be per-category or can we use a blanket period for all data?' },
        { id: 'e6', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(9, 2), msg: 'Per-category is required since you hold Aadhaar (strict limits) and marketing email (longer retention acceptable). Per-category schedules are mandatory. I will share a template shortly.' },
      ],
    },
    {
      id: 'OBL1-C2', obl: 'OBL1',
      name: 'Consent collection mechanism',
      req:  'DPDP Act §6(1)',
      desc: 'Clear, unambiguous consent mechanism before data processing. Pre-ticked boxes are invalid. Must be specific, informed, and freely given.',
      status: 'in_progress',
      docs: [
        { id: 'd2', name: 'consent_widget_spec.pdf', ver: 1, by: 'Priya Sharma', at: ago(8), size: '180 KB', status: 'under_review', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'status',  user: 'Priya Sharma', role: 'customer', at: ago(8),  msg: 'Status: Pending Review → In Progress' },
        { id: 'e3', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(8),  msg: 'Uploaded consent_widget_spec.pdf' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(7),  msg: 'Good progress. Verify: (1) Accept All must not be visually emphasised over granular options. (2) Withdrawal link must be equally prominent as Accept per §6(4).' },
      ],
    },
    {
      id: 'OBL1-C3', obl: 'OBL1',
      name: 'Consent withdrawal mechanism',
      req:  'DPDP Act §6(4)',
      desc: 'Data principals must withdraw consent as easily as it was given. Withdrawal must be readily accessible — not buried in settings.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL1-C4', obl: 'OBL1',
      name: 'Consent records and audit trail',
      req:  'DPDP Act §6(7)',
      desc: 'Maintain complete consent event records: timestamp, notice version shown, purposes accepted, and all withdrawal events.',
      status: 'in_progress',
      docs: [
        { id: 'd3', name: 'consent_records_schema.pdf', ver: 1, by: 'Priya Sharma', at: ago(5), size: '95 KB', status: 'under_review', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system', user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload', user: 'Priya Sharma', role: 'customer', at: ago(5),  msg: 'Uploaded consent_records_schema.pdf — DB schema for consent event logging.' },
        { id: 'e3', type: 'status', user: 'Priya Sharma', role: 'customer', at: ago(5),  msg: 'Status: Pending Review → In Progress' },
      ],
    },
    {
      id: 'OBL1-C5', obl: 'OBL1',
      name: 'Purpose limitation enforcement',
      req:  'DPDP Act §6(2)',
      desc: 'Data collected for a specific purpose must not be used for another purpose without fresh consent.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL2: Transparency & notice ─── */
    {
      id: 'OBL2-C1', obl: 'OBL2',
      name: 'Privacy policy published on website',
      req:  'DPDP Act §5(2)',
      desc: 'DPDP Act compliant privacy policy published and accessible on website within 2 clicks from homepage.',
      status: 'implemented',
      docs: [
        { id: 'd4a', name: 'privacy_policy_v1.pdf', ver: 1, by: 'Priya Sharma', at: ago(35), size: '280 KB', status: 'needs_revision', dataUrl: null, type: 'application/pdf' },
        { id: 'd4b', name: 'privacy_policy_v2.pdf', ver: 2, by: 'Priya Sharma', at: ago(32), size: '295 KB', status: 'needs_revision', dataUrl: null, type: 'application/pdf' },
        { id: 'd4c', name: 'privacy_policy_v3_final.pdf', ver: 3, by: 'Priya Sharma', at: ago(30), size: '310 KB', status: 'approved', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(40),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(35),   msg: 'Uploaded privacy_policy_v1.pdf' },
        { id: 'e3', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(34),   msg: 'V1 missing: (1) Grievance Officer contact per §13(1), (2) explicit DPDP Act 2023 reference. Please revise.' },
        { id: 'e4', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(32),   msg: 'Uploaded privacy_policy_v2.pdf — grievance officer section added.' },
        { id: 'e5', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(31),   msg: 'V2 better. Minor: update "last revised" date and add DPB escalation pathway in grievance section.' },
        { id: 'e6', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(30),   msg: 'Uploaded privacy_policy_v3_final.pdf — all corrections applied.' },
        { id: 'e7', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(30, 1), msg: 'Status: In Progress → Implemented' },
        { id: 'e8', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(30, 1), msg: '✓ V3 approved. All sections present, DPDP Act refs correct. Implemented.' },
      ],
    },
    {
      id: 'OBL2-C2', obl: 'OBL2',
      name: 'Data collection notice at point of collection',
      req:  'DPDP Act §5(1)',
      desc: 'At each collection touchpoint, data principals must be informed of specific purpose and categories being collected.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL2-C3', obl: 'OBL2',
      name: 'Notice in accessible language',
      req:  'DPDP Act §5(3)',
      desc: 'Notices in clear, plain language. For non-English speakers, notices in scheduled languages must be available.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL3: Data minimisation ─── */
    {
      id: 'OBL3-C1', obl: 'OBL3',
      name: 'Data minimisation policy',
      req:  'DPDP Act §8(1)',
      desc: 'Formal policy documenting that only minimum necessary personal data is collected. Requires purpose-to-field justification mapping.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL3-C2', obl: 'OBL3',
      name: 'Data retention and deletion schedule',
      req:  'DPDP Act §8(7)',
      desc: 'Specific retention periods per data category with written justification. Automated deletion or anonymisation after expiry.',
      status: 'needs_discussion',
      docs: [],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system', at: ago(20),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'status',  user: 'Anshul Gupta', role: 'admin',  at: ago(6),    msg: 'Status: Pending Review → Needs Discussion' },
        { id: 'e3', type: 'comment', user: 'Anshul Gupta', role: 'admin',  at: ago(6, 1), msg: 'Discuss Aadhaar retention — specific restrictions under Aadhaar Act 2016 overlay DPDP requirements. Must agree on approach before drafting policy.' },
      ],
    },
    {
      id: 'OBL3-C3', obl: 'OBL3',
      name: 'Storage limitation — Aadhaar data',
      req:  'Aadhaar Act §29 + DPDP §8',
      desc: 'Aadhaar numbers must not be stored after verification purpose is complete. Only verification status may be retained. Raw numbers require tokenisation.',
      status: 'blocked',
      docs: [],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(20),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(4),    msg: 'Status: Pending Review → Blocked' },
        { id: 'e3', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(4),    msg: 'BLOCKED — raw Aadhaar numbers stored violates DPDP Act and Aadhaar Act §29. Engineering must implement tokenisation. P0 risk. Est: 2-3 sprints.' },
        { id: 'e4', type: 'comment', user: 'Priya Sharma', role: 'customer', at: ago(3),    msg: 'P0 engineering ticket raised. Timeline: 3 weeks for tokenisation. Can we document an interim risk acceptance memo here?' },
        { id: 'e5', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(3, 2), msg: 'Yes — upload a risk acceptance memo signed by CISO + CTO with engineering timeline. Status stays Blocked until tokenisation is verified.' },
      ],
    },
    {
      id: 'OBL3-C4', obl: 'OBL3',
      name: 'ROPA — Record of processing activities',
      req:  'DPDP Act §8',
      desc: 'Comprehensive Record of Processing Activities documenting all data processing operations, flows, purposes, legal basis, and third parties.',
      status: 'in_progress',
      docs: [
        { id: 'd5', name: 'ropa_draft_v1.xlsx', ver: 1, by: 'Priya Sharma', at: ago(7), size: '88 KB', status: 'under_review', dataUrl: null, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      ],
      acts: [
        { id: 'e1', type: 'system', user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload', user: 'Priya Sharma', role: 'customer', at: ago(7),  msg: 'Uploaded ropa_draft_v1.xlsx — 12 processing activities mapped across 4 departments.' },
        { id: 'e3', type: 'status', user: 'Priya Sharma', role: 'customer', at: ago(7),  msg: 'Status: Pending Review → In Progress' },
      ],
    },

    /* ─── OBL4: Data accuracy ─── */
    {
      id: 'OBL4-C1', obl: 'OBL4',
      name: 'Data accuracy controls',
      req:  'DPDP Act §11(1)(b)',
      desc: 'Measures to ensure personal data is accurate, complete, and current. Enable data principal correction requests.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL4-C2', obl: 'OBL4',
      name: 'Correction request workflow',
      req:  'DPDP Act §11(1)(b)',
      desc: 'Documented process for data principals to submit correction requests, track status, and receive responses within mandated timeframe.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL4-C3', obl: 'OBL4',
      name: 'Periodic data quality review',
      req:  'DPDP Act §8(2)',
      desc: 'Scheduled review (minimum annual) to identify and correct inaccurate or outdated personal data across all stores.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL5: Data fiduciary duties ─── */
    {
      id: 'OBL5-C1', obl: 'OBL5',
      name: 'DPA — Razorpay (payment processor)',
      req:  'DPDP Act §8(3)',
      desc: 'DPDP Act compliant DPA with Razorpay covering scope, security, breach notification, sub-processor restrictions, audit rights.',
      status: 'blocked',
      docs: [],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'comment', user: 'Priya Sharma', role: 'customer', at: ago(10), msg: 'DPA request sent to Razorpay legal team. Awaiting response. Following up weekly.' },
        { id: 'e3', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(5),  msg: 'Status: Pending Review → Blocked' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(5),  msg: 'BLOCKED — vendor non-responsive. If no DPA in 30 days: (1) consider alternative processors, (2) obtain board risk exception. Escalate to Razorpay account manager.' },
      ],
    },
    {
      id: 'OBL5-C2', obl: 'OBL5',
      name: 'DPA — AWS India (cloud infrastructure)',
      req:  'DPDP Act §8(3)',
      desc: 'DPA with AWS for personal data in ap-south-1 region, DPDP Act compliant processing clauses.',
      status: 'implemented',
      docs: [
        { id: 'd6', name: 'aws_india_dpa_signed.pdf', ver: 1, by: 'Priya Sharma', at: ago(25), size: '512 KB', status: 'approved', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(30),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(25),   msg: 'Uploaded signed AWS India DPA.' },
        { id: 'e3', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(24),   msg: 'Status: In Progress → Implemented' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(24),   msg: '✓ AWS DPA approved. ap-south-1, DPDP compliant clauses, India data residency confirmed. Implemented.' },
      ],
    },
    {
      id: 'OBL5-C3', obl: 'OBL5',
      name: 'Data breach response plan',
      req:  'DPDP Act §8(6) + CERT-In',
      desc: 'Documented and tested incident response plan including CERT-In notification within 6 hours and affected principal notification process.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL5-C4', obl: 'OBL5',
      name: 'Encryption — at rest and in transit',
      req:  'DPDP Act §8(5)',
      desc: 'All personal data encrypted at rest (AES-256+) and in transit (TLS 1.2+). Document standards per data store and channel.',
      status: 'in_progress',
      docs: [
        { id: 'd7', name: 'encryption_standards.pdf', ver: 1, by: 'Priya Sharma', at: ago(6), size: '220 KB', status: 'under_review', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system', user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload', user: 'Priya Sharma', role: 'customer', at: ago(6),  msg: 'Uploaded encryption standards doc covering 4 production databases and API endpoints.' },
        { id: 'e3', type: 'status', user: 'Priya Sharma', role: 'customer', at: ago(6),  msg: 'Status: Pending Review → In Progress' },
      ],
    },
    {
      id: 'OBL5-C5', obl: 'OBL5',
      name: 'Data Protection Officer appointment',
      req:  'DPDP Act §10',
      desc: 'Appoint a DPO (mandatory for Significant Data Fiduciaries) and register with the Data Protection Board.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL6: Data principal rights ─── */
    {
      id: 'OBL6-C1', obl: 'OBL6',
      name: 'Right to access — self-service portal',
      req:  'DPDP Act §11(1)(a)',
      desc: 'Data principals can request and receive access to all personal data held. Respond within 72 hours.',
      status: 'implemented',
      docs: [
        { id: 'd8', name: 'data_access_portal_screenshots.pdf', ver: 1, by: 'Priya Sharma', at: ago(20), size: '145 KB', status: 'approved', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(30),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(20),   msg: 'Uploaded data access portal screenshots and 72-hour SLA documentation.' },
        { id: 'e3', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(19),   msg: 'Status: In Progress → Implemented' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(19),   msg: '✓ Portal reviewed. 72-hr SLA documented. Self-service flow clear. Implemented.' },
      ],
    },
    {
      id: 'OBL6-C2', obl: 'OBL6',
      name: 'Right to correction and erasure',
      req:  'DPDP Act §11(1)(b)(c)',
      desc: 'Process for data principals to request correction of inaccurate data or erasure where processing is no longer lawful.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL6-C3', obl: 'OBL6',
      name: 'Right to nominate',
      req:  'DPDP Act §14',
      desc: 'Allow data principals to nominate an individual to exercise data rights on their behalf in case of death or incapacity.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
    {
      id: 'OBL6-C4', obl: 'OBL6',
      name: 'Data portability',
      req:  'DPDP Act §11(1)(d)',
      desc: 'Provide personal data in structured, machine-readable format upon request to enable transfer to another service.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL7: Grievance redressal ─── */
    {
      id: 'OBL7-C1', obl: 'OBL7',
      name: 'Grievance officer — appointment and publication',
      req:  'DPDP Act §13(1)',
      desc: 'Appoint a Grievance Officer, publish name and contact details on website. Respond to complaints within prescribed timeframe.',
      status: 'implemented',
      docs: [
        { id: 'd9', name: 'grievance_officer_appointment.pdf', ver: 1, by: 'Priya Sharma', at: ago(28), size: '90 KB', status: 'approved', dataUrl: null, type: 'application/pdf' },
      ],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(35),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'upload',  user: 'Priya Sharma', role: 'customer', at: ago(28),   msg: 'Uploaded Grievance Officer appointment letter and website footer screenshot.' },
        { id: 'e3', type: 'status',  user: 'Anshul Gupta', role: 'admin',    at: ago(27),   msg: 'Status: In Progress → Implemented' },
        { id: 'e4', type: 'comment', user: 'Anshul Gupta', role: 'admin',    at: ago(27),   msg: '✓ Appointment verified. Contact published in footer. Implemented.' },
      ],
    },
    {
      id: 'OBL7-C2', obl: 'OBL7',
      name: 'Grievance redressal SLA and process',
      req:  'DPDP Act §13(2)',
      desc: 'Formal grievance process with defined response timeframes for each complaint type, accessible and communicated.',
      status: 'in_progress',
      docs: [],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system',   at: ago(20), msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'status',  user: 'Priya Sharma', role: 'customer', at: ago(4),  msg: 'Status: Pending Review → In Progress' },
        { id: 'e3', type: 'comment', user: 'Priya Sharma', role: 'customer', at: ago(4),  msg: 'Drafting the SOP for grievance redressal. Will upload by end of week.' },
      ],
    },
    {
      id: 'OBL7-C3', obl: 'OBL7',
      name: 'DPB complaint escalation process',
      req:  'DPDP Act §27',
      desc: 'Process for escalating unresolved grievances to the Data Protection Board of India with timelines and documentation.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },

    /* ─── OBL8: Cross-border transfers ─── */
    {
      id: 'OBL8-C1', obl: 'OBL8',
      name: 'Cross-border transfer assessment',
      req:  'DPDP Act §16',
      desc: 'Identify all personal data transfers outside India. Ensure only to countries approved by Central Government per DPDP Act Schedule.',
      status: 'needs_discussion',
      docs: [],
      acts: [
        { id: 'e1', type: 'system',  user: 'System',       role: 'system', at: ago(20),   msg: 'Control added. Status: Pending Review.' },
        { id: 'e2', type: 'status',  user: 'Anshul Gupta', role: 'admin',  at: ago(3),    msg: 'Status: Pending Review → Needs Discussion' },
        { id: 'e3', type: 'comment', user: 'Anshul Gupta', role: 'admin',  at: ago(3),    msg: 'Approved country list not yet notified by Central Government. Map your current cross-border flows now. Prepare a data flow diagram showing all countries where data is transferred.' },
      ],
    },
    {
      id: 'OBL8-C2', obl: 'OBL8',
      name: 'Cross-border transfer contracts',
      req:  'DPDP Act §16(2)',
      desc: 'For approved cross-border transfers, execute contractual safeguards with receiving entities in destination countries.',
      status: 'pending_review',
      docs: [],
      acts: [{ id: 'e1', type: 'system', user: 'System', role: 'system', at: ago(20), msg: 'Control added. Status: Pending Review.' }],
    },
  ];
}
