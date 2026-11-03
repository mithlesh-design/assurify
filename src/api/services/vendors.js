import api from '../config';
import { ENDPOINTS } from '../endpoints';
import { createDemoVendors } from '../../data/vendors';

/* Mock mode (VITE_ENABLE_MOCK_AUTH) — in-memory demo vendors so the TPRM pages can be
   previewed without the backend. Edits last until the page is reloaded. */
const demoVendors = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ? createDemoVendors() : null;

function demoAssessment(vendorId, category) {
  const vendor   = demoVendors.find(v => v.vendor_id === vendorId);
  const items    = (vendor?.vendor_assessment ?? []).filter(c => !category || c.category === category);
  const answered = items.filter(c => c.response).length;
  return {
    compliance_percentage: items.length ? (answered / items.length) * 100 : 0,
    total_answered:        answered,
    total_count:           items.length,
    vendor_assessment:     items.map(c => ({ ...c })),
  };
}

export async function fetchVendors() {
  if (demoVendors) return demoVendors.map(({ vendor_assessment, ...vendor }) => ({ ...vendor }));
  const { data } = await api.get(ENDPOINTS.VENDORS.LIST);
  return data;
}

export async function createVendor(payload) {
  if (demoVendors) {
    const vendor = { ...payload, vendor_id: `demo-v${Date.now()}`, dpa_status: 'Missing', vendor_assessment: [] };
    demoVendors.push(vendor);
    return { ...vendor };
  }
  const { data } = await api.post(ENDPOINTS.VENDORS.CREATE, payload);
  return data;
}

export async function updateVendorAssessment(vendorId, controls) {
  if (demoVendors) {
    const items = demoVendors.find(v => v.vendor_id === vendorId)?.vendor_assessment ?? [];
    controls.forEach(({ vendor_control_id, response }) => {
      const item = items.find(c => c.vendor_control_id === vendor_control_id);
      if (item) item.response = response;
    });
    return demoAssessment(vendorId);
  }
  const { data } = await api.put(ENDPOINTS.VENDORS.UPDATE(vendorId), controls);
  return data;
}

export async function fetchVendorAssessment(vendorId, category = null) {
  if (demoVendors) return demoAssessment(vendorId, category);
  const params = category ? { category } : {};
  const { data } = await api.get(ENDPOINTS.VENDORS.ASSESSMENT(vendorId), { params });
  return data;
}

export async function updateVendorDpaStatus(vendorId, dpaStatus) {
  if (demoVendors) {
    const vendor = demoVendors.find(v => v.vendor_id === vendorId);
    if (vendor) vendor.dpa_status = dpaStatus;
    return { ...vendor };
  }
  const { data } = await api.put(ENDPOINTS.VENDORS.DPA_STATUS(vendorId), null, {
    params: { dpa_status: dpaStatus },
  });
  return data;
}
