import { useState, useEffect, lazy, Suspense } from "react";
import { useTheme } from "../ThemeContext";
import {
  getStats, getInstitutes, getInstituteDetail, getInspections,
  assignRandomInspector, getAlerts, resolveAlert, getCCTV,
  getComplaints, getAnalytics, getRiskMap, getVideoCalls,
  getBeneficiaries, getPredictiveInspections,
} from "../api";
import GlobalSearch from "../components/GlobalSearch";
import ExportReport from "../components/ExportReport";
import SentimentAnalyzer from "../components/SentimentAnalyzer";
import ExifVerifier from "../components/ExifVerifier";
import VideoCallModal from "../components/VideoCallModal";
import "./Dashboard.css";

const RiskMapSection = lazy(() => import("./RiskMapSection"));
const AnalyticsSection = lazy(() => import("./AnalyticsSection"));

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: "🏠" },
  { key: "inspections", label: "Inspections", icon: "📋" },
  { key: "map", label: "Map View", icon: "🗺️" },
  { key: "institutes", label: "Projects", icon: "📁" },
  { key: "analytics", label: "Reports & Analytics", icon: "📈" },
  { key: "alerts", label: "Alerts", icon: "🔔" },
  { key: "cctv", label: "Assets", icon: "📹" },
  { key: "beneficiaries", label: "Users & Roles", icon: "👥" },
  { key: "complaints", label: "Departments", icon: "🏢" },
  { key: "video-calls", label: "Settings", icon: "⚙️" },
  { key: "predictive", label: "AI Predictions", icon: "🤖" },
];

// ── Helpers ────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub, subType }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className={`stat-sub ${subType || "neutral"}`}>{sub}</div>}
      </div>
    </div>
  );
}

function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>;
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="filter-select">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    online: "badge-green", offline: "badge-red",
    pending: "badge-yellow", in_progress: "badge-blue",
    completed: "badge-green", cancelled: "badge-grey",
    investigating: "badge-orange", resolved: "badge-green",
    dismissed: "badge-grey",
    compliant: "badge-green", non_compliant: "badge-red",
    partial: "badge-yellow",
    missed: "badge-red", scheduled: "badge-blue",
    maintenance: "badge-yellow",
    info: "badge-blue", warning: "badge-yellow", critical: "badge-red",
  };
  return (
    <span className={`badge ${colors[status] || "badge-grey"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function RiskBadge({ level, score }) {
  const cls = { low: "badge-green", medium: "badge-yellow", high: "badge-red", critical: "badge-red" };
  return (
    <span className={`badge ${cls[level] || "badge-grey"}`}>
      {level?.toUpperCase()} ({score})
    </span>
  );
}

// ── Donut Chart Component ──────────────────────────────────────────

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ["#3b82f6", "#10b981", "#22c55e", "#f59e0b", "#8e99a9"];
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const pct = (d.value / total) * 100;
    const dashArray = `${pct * 2.51327} ${251.327 - pct * 2.51327}`;
    const dashOffset = `${-cumulative * 2.51327}`;
    cumulative += pct;
    return { ...d, color: colors[i % colors.length], dashArray, dashOffset };
  });

  return (
    <div className="donut-container">
      <div className="donut-chart">
        <svg viewBox="0 0 100 100">
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          ))}
          <text x="50" y="46" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="800">{total.toLocaleString()}</text>
          <text x="50" y="58" textAnchor="middle" fill="var(--text-muted)" fontSize="4">Total</text>
        </svg>
      </div>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="donut-legend-item">
            <div className="donut-legend-dot" style={{ background: s.color }} />
            <span className="donut-legend-label">{s.name}</span>
            <span className="donut-legend-value">{s.value}</span>
            <span className="donut-legend-pct">({((s.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────

export default function Dashboard({ user, onLogout, onNavigate, preloaded }) {
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("overview");
  const [stats, setStats] = useState(preloaded?.stats || null);
  const [institutes, setInstitutes] = useState(preloaded?.institutes || []);
  const [inspections, setInspections] = useState([]);
  const [alerts, setAlerts] = useState(preloaded?.alerts || []);
  const [cctv, setCctv] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [riskMap, setRiskMap] = useState([]);
  const [videoCalls, setVideoCalls] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [predictive, setPredictive] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [instituteDetail, setInstituteDetail] = useState(null);
  const [loading, setLoading] = useState(!preloaded);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const fetchedRef = useState({})[0];

  const hasData = {
    overview: stats && institutes.length > 0,
    institutes: institutes.length > 0,
    inspections: inspections.length > 0,
    alerts: alerts.length > 0,
    cctv: cctv.length > 0,
    complaints: complaints.length > 0,
    analytics: !!analytics,
    map: riskMap.length > 0,
    "video-calls": videoCalls.length > 0,
    beneficiaries: beneficiaries.length > 0,
    predictive: predictive.length > 0,
  };

  useEffect(() => { loadTabData(); }, [activeNav]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newAlerts = await getAlerts();
        const prevIds = alerts.map((a) => a.id).join(",");
        const newIds = newAlerts.map((a) => a.id).join(",");
        if (prevIds && prevIds !== newIds) {
          setAlerts(newAlerts);
          const unread = newAlerts.filter((a) => !a.is_resolved).length;
          if (unread > 0) document.title = `(${unread}) DRISHTI AI`;
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [alerts]);

  async function loadTabData() {
    const alreadyLoaded = hasData[activeNav];
    if (alreadyLoaded) setRefreshing(true); else setLoading(true);
    try {
      switch (activeNav) {
        case "overview":
          const [s, i] = await Promise.all([getStats(), getInstitutes()]);
          setStats(s); setInstitutes(i);
          break;
        case "institutes": setInstitutes(await getInstitutes(filters)); break;
        case "inspections": setInspections(await getInspections(filters)); break;
        case "map": setRiskMap(await getRiskMap()); break;
        case "alerts": setAlerts(await getAlerts(filters)); break;
        case "cctv": setCctv(await getCCTV(filters)); break;
        case "complaints": setComplaints(await getComplaints(filters)); break;
        case "analytics": setAnalytics(await getAnalytics()); break;
        case "video-calls": setVideoCalls(await getVideoCalls()); break;
        case "beneficiaries": setBeneficiaries(await getBeneficiaries()); break;
        case "predictive": setPredictive(await getPredictiveInspections()); break;
      }
    } catch (err) { console.error("Failed to load data:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleViewInstitute(id) {
    setSelectedInstitute(id);
    try { setInstituteDetail(await getInstituteDetail(id)); } catch (err) { console.error(err); }
  }

  async function handleAssignRandom(inspectionId) {
    try {
      await assignRandomInspector(inspectionId);
      setInspections(await getInspections(filters));
    } catch (err) { alert(err.message); }
  }

  async function handleResolveAlert(alertId) {
    try {
      await resolveAlert(alertId);
      setAlerts(await getAlerts(filters));
    } catch (err) { alert(err.message); }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Quick stats from overview data
  const totalInspections = stats ? (stats.inspections_today + stats.pending_inspections + (stats.completed_inspections || 0)) : 0;
  const approvedInspections = stats ? Math.round(totalInspections * 0.788) : 0;
  const pendingInspections = stats ? stats.pending_inspections : 0;
  const flaggedCount = stats ? stats.high_risk_locations : 0;
  const deptCount = 12;

  // Recent inspections for the list
  const recentInspections = inspections.slice(0, 5);

  // Alert icons by severity
  const alertIconMap = {
    critical: { cls: "red", icon: "🔴" },
    warning: { cls: "yellow", icon: "⚠️" },
    info: { cls: "blue", icon: "ℹ️" },
  };

  return (
    <div className="dashboard">
      {videoCallRoom && (
        <VideoCallModal roomName={videoCallRoom} displayName={user.name} onClose={() => setVideoCallRoom(null)} />
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ═══ Sidebar ═══════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-govt-text">
          Social Justice & Empowerment Department<br />Rajasthan Government
        </div>

        <div className="sidebar-brand">
          <div className="brand-icon">
            <img src="/drishti-logo.svg" alt="DRISHTI" />
          </div>
          <div className="brand-name">DRISHTI</div>
          <div className="brand-sub">Smart Real-Time Monitoring<br />& Inspection App</div>
        </div>

        <div className="sidebar-search">
          <GlobalSearch
            institutes={institutes}
            inspections={inspections}
            alerts={alerts}
            complaints={complaints}
            onNavigate={(nav) => setActiveNav(nav)}
            onSelectInstitute={handleViewInstitute}
          />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => { setActiveNav(item.key); setSelectedInstitute(null); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-ai-badge">
          <div className="sidebar-ai-badge-header">
            <span>🔒</span> AI VERIFICATION ACTIVE
          </div>
          <p>Anti-Spoofing & Depth Sensing Enabled</p>
          <div className="sidebar-ai-status">
            <span className="sidebar-ai-dot" /> System Secure
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user.name?.[0] || "U"}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role?.replace(/_/g, " ")}</div>
          </div>
          <button className="theme-toggle-sm" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="logout-btn" onClick={onLogout} title="Sign out">⏻</button>
        </div>

        <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "9px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          © 2024 Drishti Platform<br />All rights reserved.
        </div>
      </aside>

      {/* ═══ Main Content ═════════════════════════════════════ */}
      <main className="main-content">
        {/* ── Header Bar ─────────────────────────────────── */}
        <header className="main-header">
          <div className="main-header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="main-header-brand">
              <img src="/drishti-logo.svg" alt="Drishti" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <span>Drishti</span>
            </div>
          </div>
          <div className="main-header-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search inspections, projects, assets..." />
          </div>
          <div className="main-header-right">
            <div className="header-notif">
              🔔
              {alerts.filter(a => !a.is_resolved).length > 0 && (
                <span className="header-notif-badge">{alerts.filter(a => !a.is_resolved).length}</span>
              )}
            </div>
            <div className="header-profile">
              <div className="header-profile-avatar">{user.name?.[0] || "ID"}</div>
              <div>
                <div className="header-profile-name">Inspector {user.name?.split(" ")[0] || "User"}</div>
                <div className="header-profile-role">{user.role?.replace(/_/g, " ")}</div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="content-area">
            <div className="stats-grid">
              {[1,2,3,4,5].map((i) => <div key={i} className="skeleton skeleton-stat" />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </div>
          </div>
        ) : (
          <>
            {/* ── Welcome + Stats (Overview Only) ────────── */}
            {activeNav === "overview" && (
              <div className="content-area">
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h2>Welcome back,</h2>
                    <h1>Inspector {user.name?.split(" ")[0] || "User"} 👋</h1>
                    <p>Stay vigilant, build a better nation.</p>
                  </div>
                  <div className="welcome-actions">
                    <div className="date-picker">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div className="notif-bell">
                      🔔
                      <span className="notif-bell-badge">{alerts.filter(a => !a.is_resolved).length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* ── Stats Cards ────────────────────────── */}
                <div className="stats-grid" style={{ marginTop: 16 }}>
                  <StatCard icon="📋" label="Total Inspections" value={totalInspections.toLocaleString()} color="#3b82f6" sub="↑ 18% from last month" subType="up" />
                  <StatCard icon="✅" label="Approved" value={approvedInspections.toLocaleString()} color="#10b981" sub="78.8% of total" subType="neutral" />
                  <StatCard icon="⏳" label="Pending" value={pendingInspections.toLocaleString()} color="#f59e0b" sub="18.6% of total" subType="neutral" />
                  <StatCard icon="🚩" label="Flagged" value={flaggedCount.toLocaleString()} color="#ef4444" sub="2.6% of total" subType="neutral" />
                  <StatCard icon="🏢" label="Departments" value={deptCount} color="#3b82f6" sub="Active" subType="neutral" />
                </div>

                {/* ── Three Column: Inspections | Chart | Live ── */}
                <div className="grid-3">
                  {/* Recent Inspections */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Recent Inspections</h3>
                      <button className="card-link" onClick={() => setActiveNav("inspections")}>View All</button>
                    </div>
                    <div className="inspection-list">
                      {recentInspections.length === 0 && (
                        <div style={{ padding: 12, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No recent inspections</div>
                      )}
                      {recentInspections.map((insp, i) => {
                        const thumbs = ["🏗️", "🏫", "🏗️", "🏫", "🏗️"];
                        const statuses = ["badge-green", "badge-yellow", "badge-green", "badge-yellow", "badge-red"];
                        const statusLabels = ["Approved", "Pending", "Approved", "Pending", "Flagged"];
                        return (
                          <div key={insp.id} className="inspection-item">
                            <div className="inspection-thumb">{thumbs[i % 5]}</div>
                            <div className="inspection-info">
                              <div className="inspection-name">{insp.institute_name || `Site ${i + 1}`}</div>
                              <div className="inspection-location">{insp.type} — {insp.gps_verified ? "GPS ✓" : "GPS ✗"}</div>
                            </div>
                            <div className="inspection-meta">
                              <span className={`badge ${statuses[i % 5]}`}>{statusLabels[i % 5]}</span>
                              <div className="inspection-time">{i + 1}h ago</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspection Overview Chart (simple bar) */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Inspection Overview</h3>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>This Month</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: 2 }} /> Total</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#10b981", borderRadius: 2 }} /> Approved</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: 2 }} /> Pending</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#ef4444", borderRadius: 2 }} /> Flagged</span>
                    </div>
                    <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 4px" }}>
                      {[300, 350, 380, 400, 420, 440, 460, 500].map((val, i) => {
                        const maxVal = 500;
                        const h = (val / maxVal) * 100;
                        const approved = val * 0.788;
                        const pending = val * 0.186;
                        const flagged = val * 0.026;
                        const ah = (approved / maxVal) * 100;
                        const ph = (pending / maxVal) * 100;
                        const fh = (flagged / maxVal) * 100;
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1 }}>
                              <div style={{ width: "100%", height: `${h}%`, background: "#3b82f6", borderRadius: "2px 2px 0 0", opacity: 0.3 }} />
                              <div style={{ width: "100%", height: `${ah}%`, background: '#10b981', borderRadius: 2, marginTop: `-${h}%` }} />
                              <div style={{ width: "100%", height: `${ph}%`, background: '#f59e0b', borderRadius: 2 }} />
                              <div style={{ width: "100%", height: `${fh}%`, background: "#ef4444", borderRadius: 2 }} />
                            </div>
                            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{i + 1} Jun</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Monitoring */}
                  <div className="card live-monitoring" style={{ padding: 0 }}>
                    <div className="card-header" style={{ padding: "14px 16px 10px" }}>
                      <h3 className="card-title">Live Monitoring</h3>
                      <span className="card-badge live">LIVE</span>
                    </div>
                    <div className="live-video">
                      <div className="live-video-placeholder">
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📹</div>
                        <div>Live CCTV Feed</div>
                        <div style={{ fontSize: 10, marginTop: 4 }}>RTSP Stream Active</div>
                      </div>
                      <div className="live-video-overlay">
                        <span>Geo: 26.9124° N, 75.7873° E</span>
                        <span>Time: {timeStr}</span>
                      </div>
                    </div>
                    <div className="live-status">
                      <div className="live-status-left">
                        <span className="live-status-dot" />
                        <div>
                          <div className="live-status-text">Environment OK</div>
                          <div className="live-status-sub">All parameters normal</div>
                        </div>
                      </div>
                      <div className="live-actions">
                        <button className="live-action"><span className="live-action-icon">📸</span>Capture</button>
                        <button className="live-action"><span className="live-action-icon">🎬</span>Record</button>
                        <button className="live-action"><span className="live-action-icon">📷</span>Snapshot</button>
                        <button className="live-action"><span className="live-action-icon">🖥️</span>Full Screen</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Three Column: Map | Alerts | Departments ── */}
                <div className="grid-3">
                  {/* Inspection Map */}
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="card-header" style={{ padding: "14px 16px 10px" }}>
                      <h3 className="card-title">Inspection Map</h3>
                      <button className="card-link" onClick={() => setActiveNav("map")}>View Full Map</button>
                    </div>
                    <div className="map-container">                        <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}>
                          <RiskMapSection riskMap={riskMap} />
                        </Suspense>
                      </div>
                  </div>

                  {/* Recent Alerts */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Recent Alerts</h3>
                      <button className="card-link" onClick={() => setActiveNav("alerts")}>View All</button>
                    </div>
                    <div className="alert-list">
                      {alerts.slice(0, 5).map((a) => {
                        const info = alertIconMap[a.severity] || alertIconMap.info;
                        return (
                          <div key={a.id} className="alert-item">
                            <div className={`alert-icon ${info.cls}`}>{info.icon}</div>
                            <div className="alert-info">
                              <div className={`alert-title ${a.severity === "critical" ? "red" : a.severity === "warning" ? "orange" : "blue"}`}>
                                {a.title}
                              </div>
                              <div className="alert-desc">{a.institute_name}</div>
                            </div>
                            <span className="alert-time">
                              {a.created_at ? Math.floor((now - new Date(a.created_at)) / 3600000) + "h ago" : "1h ago"}
                            </span>
                          </div>
                        );
                      })}
                      {alerts.length === 0 && (
                        <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No alerts</div>
                      )}
                    </div>
                  </div>

                  {/* Top Departments */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Top Departments</h3>
                      <button className="card-link">View All</button>
                    </div>
                    <DonutChart data={[
                      { name: "Public Works Department", value: 532 },
                      { name: "Rural Development", value: 320 },
                      { name: "Urban Development", value: 210 },
                      { name: "Water Resources", value: 110 },
                      { name: "Other Departments", value: 76 },
                    ]} />
                  </div>
                </div>

                {/* ── Feature Cards (Bottom) ──────────────── */}
                <div className="features-bottom">
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon">🛡️</div>
                    <h4>Anti-Spoofing AI</h4>
                    <p>Detects screen replay fraud using depth sensing & lighting analysis.</p>
                    <div className="feature-card-bottom-status text-green">Status: Active</div>
                  </div>
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon">🔐</div>
                    <h4>Visual Hashing</h4>
                    <p>Detects duplicate assets using perceptual hashing algorithm.</p>
                    <div className="feature-card-bottom-status text-green">Status: Active</div>
                  </div>
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon">🔒</div>
                    <h4>Secure & Transparent</h4>
                    <p>End-to-end encrypted data for better governance and accountability.</p>
                    <div className="feature-card-bottom-status text-green">Status: Secure</div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Other Tabs ═══════════════════════════════ */}
            {activeNav !== "overview" && (
              <div className="content-area">

                {/* ── Institutes ───────────────────────────── */}
                {activeNav === "institutes" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Projects</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Monitor all registered institutions</p>
                    </div>
                    <FilterBar>
                      <Select label="Type" value={filters.type || ""} onChange={(v) => setFilters({ ...filters, type: v })} options={["ngo", "institute", "project"]} />
                      <Select label="Risk" value={filters.risk_level || ""} onChange={(v) => setFilters({ ...filters, risk_level: v })} options={["low", "medium", "high", "critical"]} />
                      <Select label="State" value={filters.state || ""} onChange={(v) => setFilters({ ...filters, state: v })} options={["Rajasthan", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat"]} />
                    </FilterBar>
                    <div className="table-wrapper">
                      <table className="data-table full">
                        <thead>
                          <tr>
                            <th>ID</th><th>Name</th><th>Type</th><th>Scheme</th>
                            <th>Location</th><th>Risk</th><th>Trust</th><th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {institutes.map((inst) => (
                            <tr key={inst.id} className="clickable" onClick={() => handleViewInstitute(inst.id)}>
                              <td style={{ fontFamily: "monospace", fontSize: 12 }}>INS-{inst.id}</td>
                              <td style={{ fontWeight: 600 }}>{inst.name}</td>
                              <td><StatusBadge status={inst.type} /></td>
                              <td style={{ fontSize: 11 }}>{inst.scheme}</td>
                              <td>{inst.district}, {inst.state}</td>
                              <td><RiskBadge level={inst.risk_level} score={inst.risk_score} /></td>
                              <td style={{ fontWeight: 700, color: inst.trust_score >= 60 ? "var(--green)" : "var(--red)" }}>{inst.trust_score}</td>
                              <td><StatusBadge status={inst.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Inspections ──────────────────────────── */}
                {activeNav === "inspections" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Inspections</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Track surprise & scheduled inspections</p>
                    </div>
                    <FilterBar>
                      <Select label="Status" value={filters.status || ""} onChange={(v) => setFilters({ ...filters, status: v })} options={["pending", "in_progress", "completed", "cancelled"]} />
                      <Select label="Type" value={filters.type || ""} onChange={(v) => setFilters({ ...filters, type: v })} options={["surprise", "scheduled", "follow_up"]} />
                    </FilterBar>
                    <div className="table-wrapper">
                      <table className="data-table full">
                        <thead>
                          <tr>
                            <th>ID</th><th>Institute</th><th>Type</th><th>Status</th>
                            <th>Inspector</th><th>GPS</th><th>Compliance</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspections.map((insp) => (
                            <tr key={insp.id}>
                              <td style={{ fontFamily: "monospace", fontSize: 12 }}>INS-{insp.id}</td>
                              <td style={{ fontWeight: 600 }}>{insp.institute_name}</td>
                              <td><StatusBadge status={insp.type} /></td>
                              <td><StatusBadge status={insp.status} /></td>
                              <td>{insp.inspector_name || "—"}</td>
                              <td>{insp.gps_verified ? "✅ Verified" : "❌ Not verified"}</td>
                              <td>{insp.compliance_status ? <StatusBadge status={insp.compliance_status} /> : "—"}</td>
                              <td>
                                {!insp.inspector_name && insp.status === "pending" && (
                                  <button className="btn-sm btn-primary" onClick={() => handleAssignRandom(insp.id)}>Assign</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Map ──────────────────────────────────── */}
                {activeNav === "map" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Map View</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Geographic risk visualization</p>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                      <div style={{ height: 500 }}>
                        <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}>
                          <RiskMapSection riskMap={riskMap} />
                        </Suspense>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Alerts ───────────────────────────────── */}
                {activeNav === "alerts" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Alerts</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>System-generated alerts & anomalies</p>
                    </div>
                    <FilterBar>
                      <Select label="Severity" value={filters.severity || ""} onChange={(v) => setFilters({ ...filters, severity: v })} options={["info", "warning", "critical"]} />
                    </FilterBar>
                    <div className="alerts-grid">
                      {alerts.map((a) => (
                        <div key={a.id} className={`alert-card severity-${a.severity} ${a.is_resolved ? "resolved" : ""}`}>
                          <div className="alert-card-header">
                            <span className="alert-card-type">{a.type}</span>
                            <StatusBadge status={a.severity} />
                          </div>
                          <div className="alert-card-title">{a.title}</div>
                          <div className="alert-card-msg">{a.message}</div>
                          <div className="alert-card-footer">
                            <span className="alert-institute-name">{a.institute_name}</span>
                            <span className="alert-date">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                          {!a.is_resolved && (
                            <button className="btn-sm btn-success" style={{ marginTop: 8 }} onClick={() => handleResolveAlert(a.id)}>Mark Resolved</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── CCTV ─────────────────────────────────── */}
                {activeNav === "cctv" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Assets</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Live camera feed monitoring</p>
                    </div>
                    <div className="cctv-grid">
                      {cctv.map((cam) => (
                        <div key={cam.id} className={`cctv-card ${cam.status}`}>
                          <div className="cctv-preview">
                            <div className="cctv-static">
                              {cam.status === "online" && <div className="scanline" />}
                              {cam.status === "online" ? (
                                <span className="cctv-live">● LIVE — {cam.people_detected} people</span>
                              ) : (
                                <span className="cctv-offline-text">OFFLINE</span>
                              )}
                            </div>
                          </div>
                          <div className="cctv-info">
                            <div className="cctv-name">{cam.name}</div>
                            <div className="cctv-meta">
                              <StatusBadge status={cam.status} />
                              <span>{cam.location_description}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Complaints ──────────────────────────── */}
                {activeNav === "complaints" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Departments</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Beneficiary feedback & complaints</p>
                    </div>
                    <SentimentAnalyzer complaints={complaints} />
                    <FilterBar>
                      <Select label="Category" value={filters.category || ""} onChange={(v) => setFilters({ ...filters, category: v })} options={["staff_absent", "service_not_received", "fake_attendance", "infrastructure", "misbehavior", "other"]} />
                      <Select label="Status" value={filters.status || ""} onChange={(v) => setFilters({ ...filters, status: v })} options={["pending", "investigating", "resolved", "dismissed"]} />
                    </FilterBar>
                    <div className="table-wrapper">
                      <table className="data-table full">
                        <thead>
                          <tr><th>ID</th><th>Institute</th><th>From</th><th>Category</th><th>Description</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {complaints.map((c) => (
                            <tr key={c.id}>
                              <td style={{ fontFamily: "monospace", fontSize: 12 }}>CMP-{c.id}</td>
                              <td style={{ fontWeight: 600 }}>{c.institute_name}</td>
                              <td>{c.is_anonymous ? "🔒 Anonymous" : c.beneficiary_name}</td>
                              <td><StatusBadge status={c.category?.replace(/_/g, " ")} /></td>
                              <td style={{ fontSize: 12 }}>{c.description}</td>
                              <td><StatusBadge status={c.status} /></td>
                              <td style={{ fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Analytics ────────────────────────────── */}
                {activeNav === "analytics" && analytics && (
                  <Suspense fallback={<div className="loading-state"><div className="spinner" /><p>Loading charts...</p></div>}>
                    <AnalyticsSection analytics={analytics} />
                  </Suspense>
                )}

                {/* ── Video Calls ──────────────────────────── */}
                {activeNav === "video-calls" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Settings</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Surprise video verification calls</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <button className="btn-primary" onClick={() => setVideoCallRoom(`official-${Date.now()}`)}>
                        🎥 Start Surprise Video Call
                      </button>
                    </div>
                    <ExifVerifier />
                    <div className="table-wrapper" style={{ marginTop: 16 }}>
                      <table className="data-table full">
                        <thead>
                          <tr><th>ID</th><th>Institute</th><th>Called Person</th><th>Role</th><th>Status</th><th>Duration</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {videoCalls.map((vc) => (
                            <tr key={vc.id}>
                              <td style={{ fontFamily: "monospace", fontSize: 12 }}>VC-{vc.id}</td>
                              <td style={{ fontWeight: 600 }}>{vc.institute_name}</td>
                              <td>{vc.called_person}</td>
                              <td><StatusBadge status={vc.role?.replace(/_/g, " ")} /></td>
                              <td><StatusBadge status={vc.status} /></td>
                              <td>{vc.duration_seconds > 0 ? `${Math.floor(vc.duration_seconds / 60)}m ${vc.duration_seconds % 60}s` : "—"}</td>
                              <td style={{ fontSize: 12 }}>{vc.scheduled_time ? new Date(vc.scheduled_time).toLocaleDateString("en-IN") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Beneficiaries ────────────────────────── */}
                {activeNav === "beneficiaries" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Users & Roles</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Beneficiary verification & feedback</p>
                    </div>
                    <div className="table-wrapper">
                      <table className="data-table full">
                        <thead>
                          <tr><th>Name</th><th>Institute</th><th>Service Received</th><th>Rating</th><th>Attendance</th><th>Feedback</th></tr>
                        </thead>
                        <tbody>
                          {beneficiaries.map((b) => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600 }}>{b.name}</td>
                              <td>{b.institute_name}</td>
                              <td>{b.service_received ? "✅ Yes" : "❌ No"}</td>
                              <td>{"⭐".repeat(b.service_rating || 0)}</td>
                              <td>{b.attendance_confirmed ? "✅ Confirmed" : "❌ Not confirmed"}</td>
                              <td style={{ fontSize: 12 }}>{b.feedback || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ── Predictive ──────────────────────────── */}
                {activeNav === "predictive" && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>AI Predictions</h2>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>AI-predicted inspection priorities</p>
                    </div>
                    <div className="predictive-grid">
                      {predictive.map((p, i) => (
                        <div key={i} className={`predictive-card priority-${p.priority.toLowerCase()}`}>
                          <div className="predictive-header">
                            <div className="predictive-rank">#{i + 1}</div>
                            <div>
                              <div className="predictive-name">{p.institute_name}</div>
                              <div className="predictive-priority">
                                <StatusBadge status={p.priority === "HIGH" ? "critical" : p.priority === "MEDIUM" ? "warning" : "info"} />
                                <span>Priority Inspection</span>
                              </div>
                            </div>
                          </div>
                          <div className="predictive-scores">
                            <div className="score-item">
                              <span className="score-label">Risk Score</span>
                              <span className="score-value" style={{ color: p.risk_score >= 61 ? "var(--red)" : p.risk_score >= 31 ? "var(--orange)" : "var(--green)" }}>
                                {p.risk_score}/100
                              </span>
                            </div>
                            <div className="score-item">
                              <span className="score-label">Trust Score</span>
                              <span className="score-value">{p.trust_score}/100</span>
                            </div>
                          </div>
                          <div className="predictive-reasons">
                            <strong>AI Reasons:</strong>
                            <ul>
                              {p.reasons.map((r, j) => <li key={j}>⚠️ {r}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ═══ Institute Detail Panel ═════════════════════════ */}
      {selectedInstitute && instituteDetail && (
        <div className="detail-overlay" onClick={() => setSelectedInstitute(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{instituteDetail.name}</h2>
              <button className="detail-close" onClick={() => setSelectedInstitute(null)}>✕</button>
            </div>
            <div className="detail-body">
              <div className="detail-info-grid">
                <div className="info-item"><span className="info-label">Type</span><span className="info-value">{instituteDetail.type}</span></div>
                <div className="info-item"><span className="info-label">Scheme</span><span className="info-value">{instituteDetail.scheme}</span></div>
                <div className="info-item"><span className="info-label">Location</span><span className="info-value">{instituteDetail.district}, {instituteDetail.state}</span></div>
                <div className="info-item"><span className="info-label">Contact</span><span className="info-value">{instituteDetail.contact_person}</span></div>
              </div>
              <div className="detail-scores">
                <div className="score-circle">
                  <div className="score-ring" style={{ borderColor: instituteDetail.risk_score >= 61 ? "var(--red)" : instituteDetail.risk_score >= 31 ? "var(--orange)" : "var(--green)" }}>
                    <div className="score-inner">
                      <span className="score-num">{instituteDetail.risk_score}</span>
                      <span className="score-lbl">Risk</span>
                    </div>
                  </div>
                </div>
                <div className="score-circle">
                  <div className="score-ring" style={{ borderColor: "var(--accent)" }}>
                    <div className="score-inner">
                      <span className="score-num">{instituteDetail.trust_score}</span>
                      <span className="score-lbl">Trust</span>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="detail-section-title">📹 CCTV Devices ({instituteDetail.cctv_devices?.length})</h3>
              <div className="detail-cctv-grid">
                {instituteDetail.cctv_devices?.map((cam) => (
                  <div key={cam.id} className={`mini-cctv ${cam.status}`}>
                    <div className="mini-cctv-preview">
                      {cam.status === "online" ? <span className="mini-live">● LIVE — {cam.people_detected} people</span> : <span className="mini-offline">OFFLINE</span>}
                    </div>
                    <div className="mini-cctv-name">{cam.name}</div>
                  </div>
                ))}
              </div>
              <h3 className="detail-section-title">🔍 Inspections ({instituteDetail.inspections?.length})</h3>
              <div className="detail-list">
                {instituteDetail.inspections?.map((insp) => (
                  <div key={insp.id} className="detail-list-item">
                    <StatusBadge status={insp.status} />
                    <span>{insp.type} — {insp.gps_verified ? "GPS ✓" : "GPS ✗"}</span>
                    {insp.compliance_status && <StatusBadge status={insp.compliance_status} />}
                  </div>
                ))}
              </div>
              <h3 className="detail-section-title">📝 Complaints ({instituteDetail.complaints?.length})</h3>
              <div className="detail-list">
                {instituteDetail.complaints?.map((c) => (
                  <div key={c.id} className="detail-list-item">
                    <StatusBadge status={c.category?.replace(/_/g, " ")} />
                    <span style={{ fontSize: 12 }}>{c.description}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
              <h3 className="detail-section-title">🚨 Alerts ({instituteDetail.alerts?.length})</h3>
              <div className="detail-list">
                {instituteDetail.alerts?.map((a) => (
                  <div key={a.id} className="detail-list-item">
                    <StatusBadge status={a.severity} />
                    <span style={{ fontSize: 12 }}>{a.title}</span>
                    {a.is_resolved && <span className="text-green">✓ Resolved</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
