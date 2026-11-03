/**
 * data/vendors.js — shared vendor (TPRM) constants & helpers.
 *
 * Used by the vendor list (pages/Vendors.jsx), the dedicated vendor
 * detail page (pages/VendorDetail.jsx) and the sub-control side panel
 * (components/VendorControlPanel.jsx).
 */

export const BRAND_COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' },
  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
  { bg: '#CCFBF1', text: '#134E4A', border: '#99F6E4' },
  { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  { bg: '#FFE4E6', text: '#9F1239', border: '#FECDD3' },
];

export function brandColor(str) {
  if (!str) return BRAND_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return BRAND_COLORS[Math.abs(h) % BRAND_COLORS.length];
}

export function normalizeVendor(v) {
  const name = v.vendor_name ?? v.name ?? 'Unknown';
  const raw  = (v.dpa_status ?? 'missing').toLowerCase();
  return {
    id:            v.vendor_id ?? v.id,
    name,
    avatar:        name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
    email:         v.vendor_email ?? v.email ?? '—',
    category:      v.vendor_category ?? v.category ?? '—',
    dpaStatus:     raw,
    compliancePct: v.compliance_percentage ?? null,
    totalAnswered: v.total_answered ?? null,
    totalCount:    v.total_count ?? null,
  };
}

export function riskTone(pct)      { return pct < 40 ? 'high' : pct < 70 ? 'med' : 'low'; }
export function riskTextColor(pct) { return pct < 40 ? '#DC2626' : pct < 70 ? '#B45309' : 'var(--green-dim)'; }

/* ── Response status mappings ─────────────────────────── */
export const STATUS_DISPLAY = ['Compliant', 'Non-Compliant', 'In Progress', 'Not Applicable'];
export const DISPLAY_TO_API = { 'Compliant': 'Yes', 'Non-Compliant': 'No', 'In Progress': 'Partial', 'Not Applicable': 'Not Applicable' };
export const API_TO_DISPLAY = { 'Yes': 'Compliant', 'No': 'Non-Compliant', 'Partial': 'In Progress', 'Not Applicable': 'Not Applicable' };

export const RESP_META = {
  'Compliant':      { bg: 'var(--risk-low-bg)',  text: 'var(--risk-low-text)',  border: 'var(--risk-low-border)',  dot: '#10B981' },
  'Non-Compliant':  { bg: 'var(--risk-high-bg)', text: 'var(--risk-high-text)', border: 'var(--risk-high-border)', dot: '#EF4444' },
  'In Progress':    { bg: 'var(--risk-med-bg)',  text: 'var(--risk-med-text)',  border: 'var(--risk-med-border)',  dot: '#F59E0B' },
  'Not Applicable': { bg: 'var(--surface)',       text: 'var(--slate)',          border: 'var(--border)',          dot: '#94A3B8' },
};

/* ── DPA status mappings ──────────────────────────────── */
export const DPA_OPTIONS = ['Signed', 'Pending', 'Not Required', 'Missing', 'Expired'];
export const DPA_META = {
  signed:         { label: 'Signed',       bg: 'var(--risk-low-bg)',  text: 'var(--risk-low-text)',  border: 'var(--risk-low-border)',  accent: '#10B981' },
  pending:        { label: 'Pending',      bg: 'var(--risk-med-bg)',  text: 'var(--risk-med-text)',  border: 'var(--risk-med-border)',  accent: '#F59E0B' },
  'not required': { label: 'Not Required', bg: 'var(--surface)',       text: 'var(--slate)',          border: 'var(--border)',           accent: '#94A3B8' },
  missing:        { label: 'Missing',      bg: 'var(--risk-high-bg)', text: 'var(--risk-high-text)', border: 'var(--risk-high-border)', accent: '#EF4444' },
  expired:        { label: 'Expired',      bg: '#FFF7ED',             text: '#C2410C',               border: '#FED7AA',                accent: '#F97316' },
};

export const CATEGORY_LABELS = {
  datacollection:         'Data Collection',
  datastorage:            'Data Storage & Retention',
  data_usage:             'Data Usage',
  thirdpartysubprocessor: 'Third-Party / Sub-processors',
  security:               'Security Controls',
  incidentbreach:         'Incident & Breach',
  dataprincipalrights:    'Data Principal Rights',
  governance:             'Governance',
  operational:            'Operational',
};

/* ── Demo vendors (mock mode only — served by api/services/vendors.js) ── */
const DEMO_SUB_CONTROLS = [
  { code: 'DC-01', category: 'datacollection',         title: 'Collects only the personal data needed for the contracted service', description: 'Vendor confirms each data field it receives is necessary for the service it provides to us.' },
  { code: 'DC-02', category: 'datacollection',         title: 'Records the purpose for each category of personal data', description: 'A documented purpose exists for every category of personal data the vendor processes on our behalf.' },
  { code: 'DU-01', category: 'data_usage',             title: 'Uses personal data only on our documented instructions', description: 'Contract restricts processing to our instructions; no secondary use such as marketing or model training.' },
  { code: 'DS-01', category: 'datastorage',            title: 'Stores personal data in India or a permitted transfer country', description: 'Hosting regions are listed and none fall in a country restricted under DPDP Act §16.' },
  { code: 'DS-02', category: 'datastorage',            title: 'Deletes or returns personal data when the contract ends', description: 'Vendor provides a deletion certificate or data return within an agreed period after termination.' },
  { code: 'TP-01', category: 'thirdpartysubprocessor', title: 'Maintains an up-to-date list of sub-processors', description: 'A current sub-processor list with locations and services is shared with us.' },
  { code: 'TP-02', category: 'thirdpartysubprocessor', title: 'Notifies us before engaging a new sub-processor', description: 'Advance written notice is given so we can object before a new sub-processor receives our data.' },
  { code: 'SC-01', category: 'security',               title: 'Encrypts personal data at rest and in transit', description: 'AES-256 or equivalent at rest and TLS 1.2+ in transit, with keys managed separately from data.' },
  { code: 'SC-02', category: 'security',               title: 'Holds a current ISO 27001 or SOC 2 Type II report', description: 'Certificate or report issued within the last 12 months, with scope covering the services we use.' },
  { code: 'IB-01', category: 'incidentbreach',         title: 'Notifies us of a personal data breach within 24 hours', description: 'Gives us time to meet our own notification duty to the Data Protection Board under DPDP Act §8(6).' },
  { code: 'IB-02', category: 'incidentbreach',         title: 'Has a tested incident response plan', description: 'Plan is documented and exercised at least once a year, with lessons learned recorded.' },
  { code: 'DR-01', category: 'dataprincipalrights',    title: 'Supports access, correction and erasure requests on time', description: 'Vendor can locate, correct and erase an individual\'s data within our response timelines.' },
  { code: 'GV-01', category: 'governance',             title: 'Has a named privacy contact or Data Protection Officer', description: 'A named contact is responsible for privacy questions and escalations from us.' },
  { code: 'GV-02', category: 'governance',             title: 'Gives staff with data access annual privacy training', description: 'Training records are available for staff who can access our personal data.' },
];

/* responses: one character per DEMO_SUB_CONTROLS entry —
   Y = Yes, N = No, P = Partial, A = Not Applicable, - = not answered yet; '' = not assessed */
const DEMO_RESPONSE = { Y: 'Yes', N: 'No', P: 'Partial', A: 'Not Applicable', '-': null };

const DEMO_VENDORS = [
  { vendor_id: 'demo-v1', vendor_name: 'PayNova Payments',     vendor_email: 'privacy@paynova.example',     vendor_category: 'thirdpartysubprocessor', dpa_status: 'Signed',       responses: 'YYYYYYYYYPYYYY' },
  { vendor_id: 'demo-v2', vendor_name: 'CloudNest Hosting',    vendor_email: 'dpo@cloudnest.example',       vendor_category: 'datastorage',            dpa_status: 'Signed',       responses: 'YYYYYYPYYY-YYY' },
  { vendor_id: 'demo-v3', vendor_name: 'SwiftSMS Gateway',     vendor_email: 'compliance@swiftsms.example', vendor_category: 'operational',            dpa_status: 'Pending',      responses: 'YP-NYP-YN-Y-PY' },
  { vendor_id: 'demo-v4', vendor_name: 'Helpdesk360',          vendor_email: 'legal@helpdesk360.example',   vendor_category: 'dataprincipalrights',    dpa_status: 'Pending',      responses: 'YY-Y-P--Y--Y--' },
  { vendor_id: 'demo-v5', vendor_name: 'MailBridge',           vendor_email: 'privacy@mailbridge.example',  vendor_category: 'data_usage',             dpa_status: 'Missing',      responses: 'PN-N--N-------' },
  { vendor_id: 'demo-v6', vendor_name: 'InsightLytics',        vendor_email: 'hello@insightlytics.example', vendor_category: 'datacollection',         dpa_status: 'Missing',      responses: '' },
  { vendor_id: 'demo-v7', vendor_name: 'SecureVault Backup',   vendor_email: 'security@securevault.example', vendor_category: 'security',              dpa_status: 'Expired',      responses: 'YYAYYYNYYPYYY-' },
  { vendor_id: 'demo-v8', vendor_name: 'Spice Route Catering', vendor_email: 'accounts@spiceroute.example', vendor_category: 'operational',            dpa_status: 'Not Required', responses: 'AAAAAAAAAAAAAA' },
];

/* Fresh copy in API shape: vendor fields + vendor_assessment sub-controls */
export function createDemoVendors() {
  return DEMO_VENDORS.map(({ responses, ...vendor }) => ({
    ...vendor,
    vendor_assessment: [...responses].map((code, i) => ({
      ...DEMO_SUB_CONTROLS[i],
      assessment_id:     `${vendor.vendor_id}-${DEMO_SUB_CONTROLS[i].code}`,
      vendor_control_id: `${vendor.vendor_id}-${DEMO_SUB_CONTROLS[i].code}`,
      response:          DEMO_RESPONSE[code],
    })),
  }));
}
