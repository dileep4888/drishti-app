const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = localStorage.getItem("drishti_token");
  const headers = {};
  if (!options.isForm) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────

export async function register(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return request("/auth/login", {
    method: "POST",
    body: formData,
    isForm: true,
  });
}

// ── Dashboard Stats ────────────────────────────────────────────────────

export async function getStats() {
  return request("/api/stats");
}

// ── Institutes ─────────────────────────────────────────────────────────

export async function getInstitutes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.risk_level) params.set("risk_level", filters.risk_level);
  if (filters.state) params.set("state", filters.state);
  if (filters.type) params.set("type", filters.type);
  const qs = params.toString();
  return request(`/api/institutes${qs ? `?${qs}` : ""}`);
}

export async function getInstituteDetail(id) {
  return request(`/api/institutes/${id}`);
}

// ── Inspections ────────────────────────────────────────────────────────

export async function getInspections(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  const qs = params.toString();
  return request(`/api/inspections${qs ? `?${qs}` : ""}`);
}

export async function assignRandomInspector(inspectionId) {
  return request(`/api/inspections/${inspectionId}/assign-random`, {
    method: "POST",
  });
}

// ── Alerts ─────────────────────────────────────────────────────────────

export async function getAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.resolved !== undefined) params.set("resolved", filters.resolved);
  const qs = params.toString();
  return request(`/api/alerts${qs ? `?${qs}` : ""}`);
}

export async function resolveAlert(alertId) {
  return request(`/api/alerts/${alertId}/resolve`, { method: "POST" });
}

// ── CCTV ───────────────────────────────────────────────────────────────

export async function getCCTV(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return request(`/api/cctv${qs ? `?${qs}` : ""}`);
}

// ── Complaints ─────────────────────────────────────────────────────────

export async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return request(`/api/complaints${qs ? `?${qs}` : ""}`);
}

// ── Analytics ──────────────────────────────────────────────────────────

export async function getAnalytics() {
  return request("/api/analytics");
}

// ── Risk Map ───────────────────────────────────────────────────────────

export async function getRiskMap() {
  return request("/api/risk-map");
}

// ── Video Calls ────────────────────────────────────────────────────────

export async function getVideoCalls() {
  return request("/api/video-calls");
}

export async function initiateVC(instituteId, calledPerson, role) {
  return request(
    `/api/video-calls/initiate?institute_id=${instituteId}&called_person=${encodeURIComponent(calledPerson)}&role=${role}`,
    { method: "POST" }
  );
}

export async function endVC(callId, notes = "") {
  return request(`/api/video-calls/${callId}/end?notes=${encodeURIComponent(notes)}`, {
    method: "POST",
  });
}

// ── Beneficiaries ──────────────────────────────────────────────────────

export async function getBeneficiaries() {
  return request("/api/beneficiaries");
}

// ── Predictive Inspections ─────────────────────────────────────────────

export async function getPredictiveInspections() {
  return request("/api/predictive-inspections");
}
