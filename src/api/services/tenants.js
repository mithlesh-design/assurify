/**
 * api/services/tenants.js
 *
 * Tenant list — fetched after login so the user can pick their workspace.
 * Uses the Tenant API instance (FastAPI · token header).
 */

import api from '../config';
import { ENDPOINTS } from '../endpoints';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — sample tenants so the reviewer portal can be
   previewed without the backend. Raw API shape; normalised by fetchTenants() below.
   url is empty so tenant-scoped requests fall back to the default base URL. */
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

const MOCK_TENANTS = [
  {
    id: 't1', name: 'Acme Corp', url: '', description: 'Retail & e-commerce · DPDPA readiness review',
    email: 'privacy@acmecorp.example', industry: 'Retail', plan: 'Enterprise',
    city: 'Mumbai', country: 'India', is_active: true, created_at: '2026-06-12',
    reviewer: { id: 2, username: 'Priya Reviewer', email: 'reviewer@appzlogic.com' },
  },
  {
    id: 't2', name: 'TechStart Inc', url: '', description: 'SaaS startup · DPDPA + GDPR assessment',
    email: 'dpo@techstart.example', industry: 'Technology', plan: 'Growth',
    city: 'Bengaluru', country: 'India', is_active: true, created_at: '2026-08-03',
    reviewer: { id: 2, username: 'Priya Reviewer', email: 'reviewer@appzlogic.com' },
  },
];

/* Recover selections from old bug where JSON.stringify'd array was stored char-by-char */
function parseResponse(r) {
  if (!Array.isArray(r)) return r;
  if (r.length > 1 && r[0] === '[' && r[0].length === 1) {
    try { return JSON.parse(r.join('')); } catch {}
  }
  return r;
}

/* GET /v1/tenant/tenant-questionare/?tenant_name=<name>
   Returns questions + each question's saved user responses.
   q.answer  = available options (all choices)
   q.response = user's selected answers (what we want to display) */
export async function fetchQuestionnaire(tenantName) {
  const params = tenantName ? { tenant_name: tenantName } : {};
  const { data } = await api.get(ENDPOINTS.TENANTS.QUESTIONNAIRE, { params });
  const raw = Array.isArray(data) ? data : (data?.results ?? data?.questions ?? data?.data ?? []);
  return raw.map((q, i) => ({
    id:       String(q.id ?? q.question_id ?? i),
    question: q.question ?? q.question_text ?? q.title ?? q.label ?? `Question ${i + 1}`,
    selected: parseResponse(q.response ?? q.response ?? q.reponser) ?? null,
    category: q.category ?? q.section ?? q.group ?? q.type ?? 'General',
  }));
}

/* GET /v1/tenant → normalised tenant list with all available fields */
export async function fetchTenants() {
  let raw = MOCK_TENANTS;
  if (!MOCK_ENABLED) {
    const { data } = await api.get(ENDPOINTS.TENANTS.LIST);
    raw = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  }
  return raw.map((t) => {
    /* Reviewer may arrive as:
       - nested object: { id, username, email }
       - plain string:  "Priya Sharma"  (name already resolved)
       - plain number:  5               (ID — name must be fetched separately)
       - flat fields:   reviewer_id, reviewer_name, assigned_reviewer_id, etc. */
    const rv = t.reviewer ?? t.assigned_reviewer ?? t.assigned_to ?? null;
    const reviewerName =
      (typeof rv === 'object' && rv !== null)
        ? (rv.username ?? rv.name ?? rv.email ?? null)
        : (typeof rv === 'string' ? rv : null)
          ?? t.reviewer_name ?? t.assigned_reviewer_name ?? null;
    const reviewerEmail =
      (typeof rv === 'object' && rv !== null ? rv.email : null)
        ?? t.reviewer_email ?? null;
    const reviewerId =
      (typeof rv === 'object' && rv !== null)
        ? String(rv.id ?? rv.user_id ?? '')
        : (typeof rv === 'number' ? String(rv) : '')  // numeric ID field
          || String(t.reviewer_id ?? t.assigned_reviewer_id ?? '');

    return {
      id:           t.id            ?? t.tenant_id    ?? String(t.pk ?? Math.random()),
      name:         t.name          ?? t.company_name ?? 'Unnamed Tenant',
      url:          t.url           ?? t.api_url      ?? t.base_url      ?? '',
      description:  t.description   ?? t.desc         ?? '',
      email:        t.email         ?? t.contact_email ?? t.admin_email  ?? null,
      phone:        t.phone         ?? t.contact_phone ?? t.mobile       ?? null,
      industry:     t.industry      ?? t.sector        ?? t.business_type ?? null,
      plan:         t.plan          ?? t.subscription  ?? t.plan_name    ?? null,
      isActive:     t.is_active     ?? t.active        ?? true,
      city:         t.city          ?? t.location      ?? null,
      country:      t.country       ?? null,
      createdAt:    t.created_at    ?? t.date_created  ?? t.joined_at    ?? null,
      logo:         t.logo          ?? t.logo_url      ?? t.avatar       ?? null,
      reviewer:     reviewerName    || null,
      reviewerEmail: reviewerEmail  || null,
      reviewerId:   reviewerId      || null,
    };
  });
}
