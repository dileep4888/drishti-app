/**
 * DRISHTI AI — Frontend API Client
 *
 * READS  → static JSON from /api-data/ (Vercel CDN, <100ms, zero cold start)
 * MUTATIONS → Python serverless (login, register, assign, resolve, video calls)
 */

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Client-side cache (10 min for static data, 60s for mutations) ────
const cache = new Map();
const STATIC_TTL = 600_000;  // 10 minutes (static data rarely changes)
const MUTATION_TTL = 60_000; // 1 minute

function getCached(path, ttl) {
  const entry = cache.get(path);
  if (entry && Date.now() - entry.ts < ttl) return entry.data;
  if (entry) cache.delete(path);
  return null;
}

function setCache(path, data) {
  cache.set(path, { data, ts: Date.now() });
}

// ── Static JSON fetch (reads) ───────────────────────────────────────

async function fetchStatic(name) {
  const path = `/api-data/${name}.json`;
  const cached = getCached(path, STATIC_TTL);
  if (cached) return cached;

  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${name}`);
  const data = await res.json();
  setCache(path, data);
  return data;
}

// ── Server fetch (mutations + auth) ─────────────────────────────────

async function serverRequest(path, options = {}) {
  const isGet = !options.method || options.method === "GET";

  if (isGet && !options.body) {
    const cached = getCached(path, MUTATION_TTL);
    if (cached) return cached;
  }

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
  const data = await res.json();

  if (isGet && !options.body) {
    setCache(path, data);
  }
  return data;
}

// ── Cache helpers ────────────────────────────────────────────────────

export function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ── Auth (server) ───────────────────────────────────────────────────

export async function register(data) {
  return serverRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return serverRequest("/auth/login", {
    method: "POST",
    body: formData,
    isForm: true,
  });
}

// ── Dashboard Reads (static JSON — instant!) ────────────────────────

export async function getStats() {
  return fetchStatic("stats");
}

export async function getInstitutes(filters = {}) {
  let data = await fetchStatic("institutes");
  if (filters.risk_level) data = data.filter(i => i.risk_level === filters.risk_level);
  if (filters.state) data = data.filter(i => i.state === filters.state);
  if (filters.type) data = data.filter(i => i.type === filters.type);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(i => i.name?.toLowerCase().includes(q) || i.district?.toLowerCase().includes(q) || i.state?.toLowerCase().includes(q) || i.scheme?.toLowerCase().includes(q));
  }
  return data;
}

export async function getInstituteDetail(id) {
  const institutes = await fetchStatic("institutes");
  const inst = institutes.find(i => i.id === Number(id));
  if (!inst) throw new Error("Institute not found");
  // Enrich with related data
  const [cctv, inspectionsList, complaintsList, alertsList, attendance, benList] = await Promise.all([
    fetchStatic("cctv"),
    fetchStatic("inspections"),
    fetchStatic("complaints"),
    fetchStatic("alerts"),
    fetchStatic("stats"), // for attendance comparison
    fetchStatic("beneficiaries"),
  ]);
  return {
    ...inst,
    cctv_devices: cctv.filter(c => c.institute_id === inst.id).map(c => ({
      id: c.id, name: c.name, status: c.status, people_detected: c.people_detected,
      is_recording: c.is_recording, location: c.location,
    })),
    inspections: inspectionsList.filter(i => i.institute_id === inst.id).slice(0, 10).map(i => ({
      id: i.id, type: i.type, status: i.status, gps_verified: i.gps_verified,
      compliance_status: i.compliance_status, created_at: i.created_at,
    })),
    complaints: complaintsList.filter(c => c.institute_id === inst.id).slice(0, 10).map(c => ({
      id: c.id, category: c.category, description: c.description,
      status: c.status, created_at: c.created_at,
    })),
    alerts: alertsList.filter(a => a.institute_id === inst.id).slice(0, 10).map(a => ({
      id: a.id, type: a.type, severity: a.severity, title: a.title,
      is_resolved: a.is_resolved, created_at: a.created_at,
    })),
    attendance_records: [], // Will be populated from a separate static file if needed
    beneficiaries: benList.filter(b => b.institute_id === inst.id).slice(0, 10).map(b => ({
      id: b.id, name: b.name, service_received: b.service_received, service_rating: b.service_rating,
    })),
  };
}

export async function getInspections(filters = {}) {
  let data = await fetchStatic("inspections");
  if (filters.status) data = data.filter(i => i.status === filters.status);
  if (filters.type) data = data.filter(i => i.type === filters.type);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(i => i.institute_name?.toLowerCase().includes(q) || i.inspector_name?.toLowerCase().includes(q));
  }
  return data;
}

export async function assignRandomInspector(inspectionId) {
  const data = await serverRequest(`/api/inspections/${inspectionId}/assign-random`, { method: "POST" });
  invalidateCache("inspections");
  return data;
}

export async function getAlerts(filters = {}) {
  let data = await fetchStatic("alerts");
  if (filters.severity) data = data.filter(a => a.severity === filters.severity);
  if (filters.resolved !== undefined) data = data.filter(a => String(a.is_resolved) === filters.resolved);
  return data;
}

export async function resolveAlert(alertId) {
  const data = await serverRequest(`/api/alerts/${alertId}/resolve`, { method: "POST" });
  invalidateCache("alerts");
  return data;
}

export async function getCCTV(filters = {}) {
  let data = await fetchStatic("cctv");
  if (filters.status) data = data.filter(c => c.status === filters.status);
  return data;
}

export async function getComplaints(filters = {}) {
  let data = await fetchStatic("complaints");
  if (filters.category) data = data.filter(c => c.category === filters.category);
  if (filters.status) data = data.filter(c => c.status === filters.status);
  return data;
}

export async function getAnalytics() {
  return fetchStatic("analytics");
}

export async function getRiskMap() {
  return fetchStatic("risk-map");
}

export async function getVideoCalls() {
  return fetchStatic("video-calls");
}

export async function initiateVC(instituteId, calledPerson, role) {
  const data = await serverRequest(
    `/api/video-calls/initiate?institute_id=${instituteId}&called_person=${encodeURIComponent(calledPerson)}&role=${role}`,
    { method: "POST" }
  );
  invalidateCache("video-calls");
  return data;
}

export async function endVC(callId, notes = "") {
  const data = await serverRequest(`/api/video-calls/${callId}/end?notes=${encodeURIComponent(notes)}`, {
    method: "POST",
  });
  invalidateCache("video-calls");
  return data;
}

export async function getBeneficiaries() {
  return fetchStatic("beneficiaries");
}

export async function getPredictiveInspections() {
  return fetchStatic("predictive-inspections");
}

// ── Preload all dashboard data in parallel (called on login) ─────────

export async function preloadDashboardData() {
  const [stats, institutes, alerts] = await Promise.all([
    getStats(),
    getInstitutes(),
    getAlerts(),
  ]);
  return { stats, institutes, alerts };
}
