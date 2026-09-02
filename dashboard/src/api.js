const API_URL = import.meta.env.VITE_API_URL || "";

// ── Client-side cache (60s TTL) ──────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

function getCacheKey(path) {
  return path;
}

function getCached(path) {
  const entry = cache.get(getCacheKey(path));
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  if (entry) cache.delete(getCacheKey(path));
  return null;
}

function setCache(path, data) {
  cache.set(getCacheKey(path), { data, ts: Date.now() });
}

// ── Request helper ───────────────────────────────────────────────────

async function request(path, options = {}) {
  const isGet = !options.method || options.method === "GET";

  // Return cached data for GET requests (no body)
  if (isGet && !options.body) {
    const cached = getCached(path);
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

  // Cache GET responses
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

export function getCacheStatus() {
  const now = Date.now();
  const entries = [];
  for (const [key, val] of cache.entries()) {
    entries.push({ path: key, fresh: now - val.ts < CACHE_TTL, age: Math.round((now - val.ts) / 1000) });
  }
  return entries;
}

// ── Auth ─────────────────────────────────────────────────────────────

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

// ── Dashboard Stats ──────────────────────────────────────────────────

export async function getStats() {
  return request("/api/stats");
}

// ── Institutes ───────────────────────────────────────────────────────

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

// ── Inspections ──────────────────────────────────────────────────────

export async function getInspections(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  const qs = params.toString();
  return request(`/api/inspections${qs ? `?${qs}` : ""}`);
}

export async function assignRandomInspector(inspectionId) {
  const data = await request(`/api/inspections/${inspectionId}/assign-random`, {
    method: "POST",
  });
  invalidateCache("/api/inspections");
  return data;
}

// ── Alerts ───────────────────────────────────────────────────────────

export async function getAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.resolved !== undefined) params.set("resolved", filters.resolved);
  const qs = params.toString();
  return request(`/api/alerts${qs ? `?${qs}` : ""}`);
}

export async function resolveAlert(alertId) {
  const data = await request(`/api/alerts/${alertId}/resolve`, { method: "POST" });
  invalidateCache("/api/alerts");
  return data;
}

// ── CCTV ─────────────────────────────────────────────────────────────

export async function getCCTV(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return request(`/api/cctv${qs ? `?${qs}` : ""}`);
}

// ── Complaints ───────────────────────────────────────────────────────

export async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return request(`/api/complaints${qs ? `?${qs}` : ""}`);
}

// ── Analytics ────────────────────────────────────────────────────────

export async function getAnalytics() {
  return request("/api/analytics");
}

// ── Risk Map ─────────────────────────────────────────────────────────

export async function getRiskMap() {
  return request("/api/risk-map");
}

// ── Video Calls ──────────────────────────────────────────────────────

export async function getVideoCalls() {
  return request("/api/video-calls");
}

export async function initiateVC(instituteId, calledPerson, role) {
  const data = await request(
    `/api/video-calls/initiate?institute_id=${instituteId}&called_person=${encodeURIComponent(calledPerson)}&role=${role}`,
    { method: "POST" }
  );
  invalidateCache("/api/video-calls");
  return data;
}

export async function endVC(callId, notes = "") {
  const data = await request(`/api/video-calls/${callId}/end?notes=${encodeURIComponent(notes)}`, {
    method: "POST",
  });
  invalidateCache("/api/video-calls");
  return data;
}

// ── Beneficiaries ────────────────────────────────────────────────────

export async function getBeneficiaries() {
  return request("/api/beneficiaries");
}

// ── Predictive Inspections ───────────────────────────────────────────

export async function getPredictiveInspections() {
  return request("/api/predictive-inspections");
}

// ── Preload all overview data in parallel (called on login) ──────────

export async function preloadDashboardData() {
  const [stats, institutes, alerts] = await Promise.all([
    getStats(),
    getInstitutes(),
    getAlerts(),
  ]);
  return { stats, institutes, alerts };
}
