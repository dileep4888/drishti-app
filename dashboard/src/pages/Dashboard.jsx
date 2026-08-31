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
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "institutes", label: "Institutes", icon: "🏛️" },
  { key: "inspections", label: "Inspections", icon: "🔍" },
  { key: "map", label: "Risk Map", icon: "🗺️" },
  { key: "alerts", label: "Alerts", icon: "🚨" },
  { key: "cctv", label: "CCTV", icon: "📹" },
  { key: "complaints", label: "Complaints", icon: "📝" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { key: "video-calls", label: "Video Calls", icon: "🎥" },
  { key: "beneficiaries", label: "Beneficiaries", icon: "👥" },
  { key: "predictive", label: "AI Predictions", icon: "🤖" },
];

// ── Helpers ────────────────────────────────────────────────────────────

function RiskBadge({ level, score }) {
  const colors = { low: "#22c55e", medium: "#eab308", high: "#ef4444", critical: "#991b1b" };
  return (
    <span className="risk-badge" style={{ background: colors[level] || "#64748b" }}>
      {level?.toUpperCase()} ({score})
    </span>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
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
    online: "var(--accent-green)", offline: "var(--accent-red)",
    pending: "var(--accent-yellow)", in_progress: "var(--accent-blue)",
    completed: "var(--accent-green)", cancelled: "var(--text-muted)",
    investigating: "var(--accent-orange)", resolved: "var(--accent-green)",
    dismissed: "var(--text-muted)",
    compliant: "var(--accent-green)", non_compliant: "var(--accent-red)",
    partial: "var(--accent-yellow)",
    missed: "var(--accent-red)", scheduled: "var(--accent-purple)",
    maintenance: "var(--accent-yellow)",
    info: "var(--accent-blue)", warning: "var(--accent-yellow)", critical: "var(--accent-red)",
  };
  return (
    <span className="status-badge" style={{ color: colors[status] || "var(--text-muted)", borderColor: colors[status] || "var(--text-muted)" }}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────

export default function Dashboard({ user, onLogout, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("overview");
  const [stats, setStats] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cctv, setCctv] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [riskMap, setRiskMap] = useState([]);
  const [videoCalls, setVideoCalls] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [predictive, setPredictive] = useState([]);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [instituteDetail, setInstituteDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Load data for active tab
  useEffect(() => {
    loadTabData();
  }, [activeNav]);

  // Real-time alert polling (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newAlerts = await getAlerts();
        const prevIds = alerts.map((a) => a.id).join(",");
        const newIds = newAlerts.map((a) => a.id).join(",");
        if (prevIds && prevIds !== newIds) {
          setAlerts(newAlerts);
          const unread = newAlerts.filter((a) => !a.is_resolved).length;
          if (unread > 0) {
            document.title = `(${unread}) DRISHTI AI — New Alerts!`;
          }
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [alerts]);

  async function loadTabData() {
    setLoading(true);
    try {
      switch (activeNav) {
        case "overview":
          const [s, i] = await Promise.all([getStats(), getInstitutes()]);
          setStats(s); setInstitutes(i);
          break;
        case "institutes":
          setInstitutes(await getInstitutes(filters));
          break;
        case "inspections":
          setInspections(await getInspections(filters));
          break;
        case "map":
          setRiskMap(await getRiskMap());
          break;
        case "alerts":
          setAlerts(await getAlerts(filters));
          break;
        case "cctv":
          setCctv(await getCCTV(filters));
          break;
        case "complaints":
          setComplaints(await getComplaints(filters));
          break;
        case "analytics":
          setAnalytics(await getAnalytics());
          break;
        case "video-calls":
          setVideoCalls(await getVideoCalls());
          break;
        case "beneficiaries":
          setBeneficiaries(await getBeneficiaries());
          break;
        case "predictive":
          setPredictive(await getPredictiveInspections());
          break;
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInstitute(id) {
    setSelectedInstitute(id);
    try {
      setInstituteDetail(await getInstituteDetail(id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAssignRandom(inspectionId) {
    try {
      await assignRandomInspector(inspectionId);
      setInspections(await getInspections(filters));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleResolveAlert(alertId) {
    try {
      await resolveAlert(alertId);
      setAlerts(await getAlerts(filters));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="dashboard">
      {/* Video Call Modal */}
      {videoCallRoom && (
        <VideoCallModal roomName={videoCallRoom} displayName={user.name} onClose={() => setVideoCallRoom(null)} />
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">👁</span>
          <div>
            <div className="brand-name">DRISHTI AI</div>
            <div className="brand-sub">Surveillance System</div>
          </div>
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
              onClick={() => { setActiveNav(item.key); setSelectedInstitute(null); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

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
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <div className="header-top-row">
              <h1 className="page-title">
              {NAV_ITEMS.find((n) => n.key === activeNav)?.icon}{" "}
              {NAV_ITEMS.find((n) => n.key === activeNav)?.label}
            </h1>
            <p className="page-subtitle">
              {activeNav === "overview" && "Real-time monitoring dashboard"}
              {activeNav === "institutes" && "Monitor all registered institutions"}
              {activeNav === "inspections" && "Track surprise & scheduled inspections"}
              {activeNav === "map" && "Geographic risk visualization"}
              {activeNav === "alerts" && "System-generated alerts & anomalies"}
              {activeNav === "cctv" && "Live camera feed monitoring"}
              {activeNav === "complaints" && "Beneficiary feedback & complaints"}
              {activeNav === "analytics" && "AI-powered analytics & trends"}
              {activeNav === "video-calls" && "Surprise video verification calls"}
              {activeNav === "beneficiaries" && "Beneficiary verification & feedback"}
              {activeNav === "predictive" && "AI-predicted inspection priorities"}
            </p>
          </div>
          <div className="header-actions">
              <ExportReport stats={stats} institutes={institutes} inspections={inspections} alerts={alerts} complaints={complaints} activeNav={activeNav} />
              <div className="header-time">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading data...</p>
          </div>
        ) : (
          <div className="content-area">
            {/* ── OVERVIEW ─────────────────────────────────────── */}
            {activeNav === "overview" && stats && (
              <>
                <div className="stats-grid">
                  <StatCard icon="🏛️" label="Total Institutes" value={stats.total_institutes} color="#3b82f6" />
                  <StatCard icon="📹" label="Live CCTV" value={`${stats.live_cctv_cameras}/${stats.total_cctv_cameras}`} color="#06b6d4" />
                  <StatCard icon="🔍" label="Inspections" value={stats.inspections_today} sub={`${stats.pending_inspections} pending`} color="#a855f7" />
                  <StatCard icon="🔴" label="High Risk" value={stats.high_risk_locations} color="#ef4444" />
                  <StatCard icon="🟡" label="Medium Risk" value={stats.medium_risk_locations} color="#eab308" />
                  <StatCard icon="🟢" label="Low Risk" value={stats.low_risk_locations} color="#22c55e" />
                  <StatCard icon="⚠️" label="Active Alerts" value={stats.unresolved_alerts} color="#f97316" />
                  <StatCard icon="📝" label="Complaints" value={stats.total_complaints} sub={`${stats.pending_complaints} pending`} color="#ec4899" />
                </div>

                <div className="grid-2">
                  {/* Top Risk Institutes */}
                  <div className="card">
                    <h3 className="card-title">⚠️ High Risk Institutes</h3>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr><th>Name</th><th>District</th><th>Risk</th><th>Trust</th></tr>
                        </thead>
                        <tbody>
                          {institutes.filter((i) => i.risk_score >= 50).slice(0, 5).map((inst) => (
                            <tr key={inst.id} className="clickable" onClick={() => handleViewInstitute(inst.id)}>
                              <td className="font-medium">{inst.name}</td>
                              <td>{inst.district}</td>
                              <td><RiskBadge level={inst.risk_level} score={inst.risk_score} /></td>
                              <td><span className="trust-score">{inst.trust_score}/100</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Alerts */}
                  <div className="card">
                    <h3 className="card-title">🚨 Recent Alerts</h3>
                    <div className="alert-list">
                      {alerts.slice(0, 6).map((a) => (
                        <div key={a.id} className={`alert-item severity-${a.severity}`}>
                          <div className="alert-header">
                            <StatusBadge status={a.severity} />
                            <span className="alert-time">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                          <div className="alert-title">{a.title}</div>
                          <div className="alert-institute">{a.institute_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── INSTITUTES ───────────────────────────────────── */}
            {activeNav === "institutes" && (
              <>
                <FilterBar>
                  <Select label="Risk" value={filters.risk_level || ""} onChange={(v) => { setFilters({ ...filters, risk_level: v }); }}
                    options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" }]} />
                  <Select label="Type" value={filters.type || ""} onChange={(v) => { setFilters({ ...filters, type: v }); }}
                    options={[{ value: "NGO", label: "NGO" }, { value: "Education", label: "Education" }, { value: "Health", label: "Health" }]} />
                </FilterBar>
                <div className="table-wrapper">
                  <table className="data-table full">
                    <thead>
                      <tr>
                        <th>Name</th><th>Type</th><th>Scheme</th><th>District</th><th>Risk</th>
                        <th>Trust</th><th>CCTV</th><th>Complaints</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutes.map((inst) => (
                        <tr key={inst.id}>
                          <td className="font-medium">{inst.name}</td>
                          <td><StatusBadge status={inst.type} /></td>
                          <td className="text-sm">{inst.scheme}</td>
                          <td>{inst.district}, {inst.state}</td>
                          <td><RiskBadge level={inst.risk_level} score={inst.risk_score} /></td>
                          <td><span className="trust-score">{inst.trust_score}/100</span></td>
                          <td>{inst.cctv_online}/{inst.cctv_total}</td>
                          <td>{inst.complaint_count}</td>
                          <td>
                            <button className="btn-sm btn-primary" onClick={() => handleViewInstitute(inst.id)}>Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── INSPECTIONS ──────────────────────────────────── */}
            {activeNav === "inspections" && (
              <>
                <FilterBar>
                  <Select label="Status" value={filters.status || ""} onChange={(v) => { setFilters({ ...filters, status: v }); }}
                    options={["pending", "in_progress", "completed", "cancelled"]} />
                  <Select label="Type" value={filters.type || ""} onChange={(v) => { setFilters({ ...filters, type: v }); }}
                    options={["surprise", "scheduled", "follow_up"]} />
                </FilterBar>
                <div className="table-wrapper">
                  <table className="data-table full">
                    <thead>
                      <tr>
                        <th>ID</th><th>Institute</th><th>Inspector</th><th>Type</th>
                        <th>Status</th><th>GPS</th><th>Compliance</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((insp) => (
                        <tr key={insp.id}>
                          <td className="mono">INS-{insp.id}</td>
                          <td className="font-medium">{insp.institute_name}</td>
                          <td>{insp.inspector_name}</td>
                          <td><StatusBadge status={insp.type} /></td>
                          <td><StatusBadge status={insp.status} /></td>
                          <td>{insp.gps_verified ? "✅ Verified" : "❌ Unverified"}</td>
                          <td>{insp.compliance_status ? <StatusBadge status={insp.compliance_status} /> : "—"}</td>
                          <td>
                            {insp.status === "pending" && !insp.inspector_name.includes("Unassigned") === false && (
                              <button className="btn-sm btn-warning" onClick={() => handleAssignRandom(insp.id)}>
                                🎲 Assign
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── RISK MAP ─────────────────────────────────────── */}
            {activeNav === "map" && (
              <Suspense fallback={<div className="loading-state"><div className="spinner" /><p>Loading map...</p></div>}>
                <RiskMapSection riskMap={riskMap} />
              </Suspense>
            )}

            {/* ── ALERTS ────────────────────────────────────────── */}
            {activeNav === "alerts" && (
              <>
                <FilterBar>
                  <Select label="Severity" value={filters.severity || ""} onChange={(v) => { setFilters({ ...filters, severity: v }); }}
                    options={["info", "warning", "critical"]} />
                  <Select label="Status" value={filters.resolved || ""} onChange={(v) => { setFilters({ ...filters, resolved: v === "resolved" ? "true" : v === "active" ? "false" : "" }); }}
                    options={[{ value: "active", label: "Active" }, { value: "resolved", label: "Resolved" }]} />
                </FilterBar>
                <div className="alerts-grid">
                  {alerts.map((a) => (
                    <div key={a.id} className={`alert-card severity-${a.severity} ${a.is_resolved ? "resolved" : ""}`}>
                      <div className="alert-card-header">
                        <StatusBadge status={a.severity} />
                        <span className="alert-card-type">{a.type?.replace(/_/g, " ")}</span>
                      </div>
                      <h4 className="alert-card-title">{a.title}</h4>
                      <p className="alert-card-msg">{a.message}</p>
                      <div className="alert-card-footer">
                        <span className="alert-institute-name">{a.institute_name}</span>
                        <span className="alert-date">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                      {!a.is_resolved && (
                        <button className="btn-sm btn-success" onClick={() => handleResolveAlert(a.id)}>
                          ✓ Mark Resolved
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── CCTV ──────────────────────────────────────────── */}
            {activeNav === "cctv" && (
              <>
                <FilterBar>
                  <Select label="Status" value={filters.status || ""} onChange={(v) => { setFilters({ ...filters, status: v }); }}
                    options={["online", "offline", "maintenance"]} />
                </FilterBar>
                <div className="cctv-grid">
                  {cctv.map((cam) => (
                    <div key={cam.id} className={`cctv-card ${cam.status}`}>
                      <div className="cctv-preview">
                        <div className="cctv-static">
                          {cam.status === "online" ? (
                            <>
                              <div className="scanline" />
                              <span className="cctv-live">● LIVE</span>
                              <span className="cctv-people">{cam.people_detected} people detected</span>
                            </>
                          ) : (
                            <span className="cctv-offline-text">NO SIGNAL</span>
                          )}
                        </div>
                      </div>
                      <div className="cctv-info">
                        <div className="cctv-name">{cam.name}</div>
                        <div className="cctv-meta">
                          <span>{cam.institute_name}</span>
                          <StatusBadge status={cam.status} />
                        </div>
                        <div className="cctv-location">📍 {cam.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── COMPLAINTS ───────────────────────────────────── */}
            {activeNav === "complaints" && (
              <>
                <SentimentAnalyzer complaints={complaints} />
                <FilterBar>
                  <Select label="Category" value={filters.category || ""} onChange={(v) => { setFilters({ ...filters, category: v }); }}
                    options={["staff_absent", "service_not_received", "fake_attendance", "infrastructure", "misbehavior", "other"]} />
                  <Select label="Status" value={filters.status || ""} onChange={(v) => { setFilters({ ...filters, status: v }); }}
                    options={["pending", "investigating", "resolved", "dismissed"]} />
                </FilterBar>
                <div className="table-wrapper">
                  <table className="data-table full">
                    <thead>
                      <tr>
                        <th>ID</th><th>Institute</th><th>From</th><th>Category</th>
                        <th>Description</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => (
                        <tr key={c.id}>
                          <td className="mono">CMP-{c.id}</td>
                          <td className="font-medium">{c.institute_name}</td>
                          <td>{c.is_anonymous ? "🔒 Anonymous" : c.beneficiary_name}</td>
                          <td><StatusBadge status={c.category?.replace(/_/g, " ")} /></td>
                          <td className="text-sm">{c.description}</td>
                          <td><StatusBadge status={c.status} /></td>
                          <td className="text-sm">{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── ANALYTICS ────────────────────────────────────── */}
            {activeNav === "analytics" && analytics && (
              <Suspense fallback={<div className="loading-state"><div className="spinner" /><p>Loading charts...</p></div>}>
                <AnalyticsSection analytics={analytics} />
              </Suspense>
            )}

            {/* ── VIDEO CALLS ──────────────────────────────────── */}
            {activeNav === "video-calls" && (
              <>
                <div className="vc-actions">
                  <button className="btn-primary" onClick={() => setVideoCallRoom(`official-${Date.now()}`)}>
                    🎥 Start Surprise Video Call
                  </button>
                </div>
                <div className="table-wrapper">
                <table className="data-table full">
                  <thead>
                    <tr>
                      <th>ID</th><th>Institute</th><th>Called Person</th><th>Role</th>
                      <th>Initiated By</th><th>Status</th><th>Duration</th><th>GPS Verified</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoCalls.map((vc) => (
                      <tr key={vc.id}>
                        <td className="mono">VC-{vc.id}</td>
                        <td className="font-medium">{vc.institute_name}</td>
                        <td>{vc.called_person}</td>
                        <td><StatusBadge status={vc.role?.replace(/_/g, " ")} /></td>
                        <td>{vc.initiated_by}</td>
                        <td><StatusBadge status={vc.status} /></td>
                        <td>{vc.duration_seconds > 0 ? `${Math.floor(vc.duration_seconds / 60)}m ${vc.duration_seconds % 60}s` : "—"}</td>
                        <td>{vc.location_verified ? "✅" : "❌"}</td>
                        <td className="text-sm">{vc.scheduled_time ? new Date(vc.scheduled_time).toLocaleDateString("en-IN") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {/* ── BENEFICIARIES ────────────────────────────────── */}
            {activeNav === "beneficiaries" && (
              <div className="table-wrapper">
                <table className="data-table full">
                  <thead>
                    <tr>
                      <th>Name</th><th>Institute</th><th>Service Received</th>
                      <th>Rating</th><th>Attendance</th><th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaries.map((b) => (
                      <tr key={b.id}>
                        <td className="font-medium">{b.name}</td>
                        <td>{b.institute_name}</td>
                        <td>{b.service_received ? "✅ Yes" : "❌ No"}</td>
                        <td>{"⭐".repeat(b.service_rating || 0)}</td>
                        <td>{b.attendance_confirmed ? "✅ Confirmed" : "❌ Not confirmed"}</td>
                        <td className="text-sm">{b.feedback || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── EXIF VERIFIER ────────────────────────────────── */}
            {activeNav === "video-calls" && (
              <ExifVerifier />
            )}

            {/* ── PREDICTIVE INSPECTIONS ───────────────────────── */}
            {activeNav === "predictive" && (
              <div className="predictive-grid">
                {predictive.map((p, i) => (
                  <div key={i} className={`predictive-card priority-${p.priority.toLowerCase()}`}>
                    <div className="predictive-header">
                      <div className="predictive-rank">#{i + 1}</div>
                      <div>
                        <h3 className="predictive-name">{p.institute_name}</h3>
                        <div className="predictive-priority">
                          <StatusBadge status={p.priority === "HIGH" ? "critical" : p.priority === "MEDIUM" ? "warning" : "info"} />
                          <span>Priority Inspection</span>
                        </div>
                      </div>
                    </div>
                    <div className="predictive-scores">
                      <div className="score-item">
                        <span className="score-label">Risk Score</span>
                        <span className="score-value" style={{ color: p.risk_score >= 61 ? "var(--accent-red)" : p.risk_score >= 31 ? "var(--accent-yellow)" : "var(--accent-green)" }}>
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
                    <button className="btn-sm btn-primary" style={{ marginTop: "0.75rem" }}>
                      🎲 Assign Inspector Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── INSTITUTE DETAIL PANEL ──────────────────────────── */}
      {selectedInstitute && instituteDetail && (
        <div className="detail-overlay" onClick={() => setSelectedInstitute(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{instituteDetail.name}</h2>
              <button className="detail-close" onClick={() => setSelectedInstitute(null)}>✕</button>
            </div>
            <div className="detail-body">
              <div className="detail-info-grid">
                <div className="info-item">
                  <span className="info-label">Type</span>
                  <span className="info-value">{instituteDetail.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Scheme</span>
                  <span className="info-value">{instituteDetail.scheme}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{instituteDetail.district}, {instituteDetail.state}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contact</span>
                  <span className="info-value">{instituteDetail.contact_person}</span>
                </div>
              </div>

              <div className="detail-scores">
                <div className="score-circle">
                  <div className="score-ring" style={{
                    background: `conic-gradient(${instituteDetail.risk_score >= 61 ? "var(--accent-red)" : instituteDetail.risk_score >= 31 ? "var(--accent-yellow)" : "var(--accent-green)"} ${instituteDetail.risk_score * 3.6}deg, #1e293b 0deg)`
                  }}>
                    <div className="score-inner">
                      <span className="score-num">{instituteDetail.risk_score}</span>
                      <span className="score-lbl">Risk</span>
                    </div>
                  </div>
                </div>
                <div className="score-circle">
                  <div className="score-ring" style={{
                    background: `conic-gradient(var(--accent-cyan) ${instituteDetail.trust_score * 3.6}deg, #1e293b 0deg)`
                  }}>
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
                      {cam.status === "online" ? (
                        <span className="mini-live">● LIVE — {cam.people_detected} people</span>
                      ) : (
                        <span className="mini-offline">OFFLINE</span>
                      )}
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
                    <span>{insp.type} — {insp.gps_verified ? "GPS ✅" : "GPS ❌"}</span>
                    {insp.compliance_status && <StatusBadge status={insp.compliance_status} />}
                  </div>
                ))}
              </div>

              <h3 className="detail-section-title">📝 Complaints ({instituteDetail.complaints?.length})</h3>
              <div className="detail-list">
                {instituteDetail.complaints?.map((c) => (
                  <div key={c.id} className="detail-list-item">
                    <StatusBadge status={c.category?.replace(/_/g, " ")} />
                    <span className="text-sm">{c.description}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>

              <h3 className="detail-section-title">🚨 Alerts ({instituteDetail.alerts?.length})</h3>
              <div className="detail-list">
                {instituteDetail.alerts?.map((a) => (
                  <div key={a.id} className="detail-list-item">
                    <StatusBadge status={a.severity} />
                    <span className="text-sm">{a.title}</span>
                    {a.is_resolved && <span className="text-green">✓ Resolved</span>}
                  </div>
                ))}
              </div>

              <h3 className="detail-section-title">📊 Attendance Records</h3>
              <div className="detail-list">
                {instituteDetail.attendance_records?.slice(0, 5).map((ar) => (
                  <div key={ar.id} className="detail-list-item">
                    <span className="mono text-sm">{new Date(ar.date).toLocaleDateString("en-IN")}</span>
                    <span>Reported: <strong>{ar.reported_count}</strong></span>
                    <span>AI Detected: <strong style={{ color: ar.discrepancy_percentage > 20 ? "var(--accent-red)" : "var(--accent-green)" }}>{ar.ai_detected_count}</strong></span>
                    {ar.discrepancy_percentage > 10 && (
                      <span className="disc-badge">⚠️ {ar.discrepancy_percentage.toFixed(0)}% discrepancy</span>
                    )}
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
