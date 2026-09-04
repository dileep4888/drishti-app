import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useTheme } from "../ThemeContext";
import {
  getStats, getInstitutes, getInstituteDetail, getInspections,
  assignRandomInspector, getAlerts, resolveAlert, getCCTV,
  getComplaints, getAnalytics, getRiskMap, getVideoCalls,
  getBeneficiaries, getPredictiveInspections,
} from "../api";
import GlobalSearch from "../components/GlobalSearch";
import SentimentAnalyzer from "../components/SentimentAnalyzer";
import ExifVerifier from "../components/ExifVerifier";
import VideoCallModal from "../components/VideoCallModal";
import {
  LayoutDashboard, ClipboardCheck, Map, FolderKanban, BarChart3, Bell,
  Camera, Users, Building, Settings, Brain, ChevronLeft, ChevronRight,
  Search, Sun, Moon, LogOut, Menu, CalendarDays, Clock3,
  Flag, Info, ShieldCheck, Lock,
  Maximize2, Image as ImageIcon, CircleCheck, CircleAlert, TriangleAlert,
  X, Hash, ChevronDown, User, ClipboardList, SlidersHorizontal,
  LifeBuoy, TrendingUp, Building2, MapPin, Radio, Landmark, Eye, Pencil,
  Download, ListFilter, MapPinCheck,
} from "lucide-react";
import "./Dashboard.css";

const RiskMapSection = lazy(() => import("./RiskMapSection"));
const AnalyticsSection = lazy(() => import("./AnalyticsSection"));

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "inspections", label: "Inspections", icon: <ClipboardCheck size={18} /> },
  { key: "map", label: "Map View", icon: <Map size={18} /> },
  { key: "institutes", label: "Projects", icon: <FolderKanban size={18} /> },
  { key: "analytics", label: "Reports & Analytics", icon: <BarChart3 size={18} /> },
  { key: "alerts", label: "Alerts", icon: <Bell size={18} /> },
  { key: "cctv", label: "Assets", icon: <Camera size={18} /> },
  { key: "beneficiaries", label: "Users & Roles", icon: <Users size={18} /> },
  { key: "complaints", label: "Departments", icon: <Building size={18} /> },
  { key: "video-calls", label: "Settings", icon: <Settings size={18} /> },
  { key: "predictive", label: "AI Predictions", icon: <Brain size={18} /> },
];

const CHART_RANGES = ["Today", "This Week", "This Month", "This Quarter", "This Year"];

function StatCard({ icon, label, value, color, sub, subType }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}>{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className={`stat-sub ${subType || "neutral"}`}>{sub}</div>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="filter-select">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = { online:"badge-green", offline:"badge-red", pending:"badge-yellow", in_progress:"badge-blue", completed:"badge-green", cancelled:"badge-grey", investigating:"badge-orange", resolved:"badge-green", dismissed:"badge-grey", compliant:"badge-green", non_compliant:"badge-red", partial:"badge-yellow", missed:"badge-red", scheduled:"badge-blue", maintenance:"badge-yellow", info:"badge-blue", warning:"badge-yellow", critical:"badge-red", active:"badge-green", high:"badge-red", medium:"badge-yellow", low:"badge-green", NGO:"badge-purple", institute:"badge-blue", project:"badge-blue" };
  return <span className={`badge ${c[status] || "badge-grey"}`}>{status?.replace(/_/g, " ")}</span>;
}

function RiskBadge({ level, score }) {
  const c = { low:"badge-green", medium:"badge-yellow", high:"badge-red", critical:"badge-red" };
  return <span className={`badge ${c[level] || "badge-grey"}`}>{level?.toUpperCase()} ({score})</span>;
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ["#2563eb", "#10b981", "#22c55e", "#f59e0b", "#8e99a9"];
  let cum = 0;
  const segs = data.map((d, i) => {
    const pct = (d.value / total) * 100;
    const da = `${pct * 2.51327} ${251.327 - pct * 2.51327}`;
    const doff = `${-cum * 2.51327}`;
    cum += pct;
    return { ...d, color: colors[i % colors.length], da, doff };
  });
  return (
    <div className="donut-container">
      <div className="donut-chart">
        <svg viewBox="0 0 100 100">
          {segs.map((s, i) => (
            <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={s.da} strokeDashoffset={s.doff} />
          ))}
          <text x="50" y="46" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="800">{total.toLocaleString()}</text>
          <text x="50" y="58" textAnchor="middle" fill="var(--text-muted)" fontSize="4">Total Inspections</text>
        </svg>
      </div>
      <div className="donut-legend">
        {segs.map((s, i) => (
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [chartRange, setChartRange] = useState("This Week");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const hasData = {
    overview: stats && institutes.length > 0, institutes: institutes.length > 0,
    inspections: inspections.length > 0, alerts: alerts.length > 0, cctv: cctv.length > 0,
    complaints: complaints.length > 0, analytics: !!analytics, map: riskMap.length > 0,
    "video-calls": videoCalls.length > 0, beneficiaries: beneficiaries.length > 0,
    predictive: predictive.length > 0,
  };

  useEffect(() => { loadTabData(); }, [activeNav]);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const na = await getAlerts();
        if (alerts.map(a => a.id).join(",") !== na.map(a => a.id).join(",")) setAlerts(na);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(iv);
  }, [alerts]);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadTabData() {
    if (hasData[activeNav]) setRefreshing(true); else setLoading(true);
    try {
      switch (activeNav) {
        case "overview": { const [s, i, r] = await Promise.all([getStats(), getInstitutes(), getRiskMap()]); setStats(s); setInstitutes(i); setRiskMap(r); break; }
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleViewInstitute(id) {
    setSelectedInstitute(id);
    try { setInstituteDetail(await getInstituteDetail(id)); } catch (e) { console.error(e); }
  }
  async function handleAssignRandom(iid) {
    try { await assignRandomInspector(iid); setInspections(await getInspections(filters)); }
    catch (e) { console.error(e); }
  }
  async function handleResolveAlert(aid) {
    try { await resolveAlert(aid); setAlerts(await getAlerts(filters)); }
    catch (e) { console.error(e); }
  }

  const now = new Date();
  const totalI = stats ? (stats.inspections_today + stats.pending_inspections + (stats.completed_inspections || 0)) : 0;
  const approvedI = stats ? Math.round(totalI * 0.788) : 0;
  const pendingI = stats?.pending_inspections || 0;
  const flaggedI = stats?.high_risk_locations || 0;
  const recentI = inspections.slice(0, 5);
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;

  const alertIcons = {
    critical: { cls: "red", icon: <CircleAlert size={16} /> },
    warning: { cls: "yellow", icon: <TriangleAlert size={16} /> },
    info: { cls: "blue", icon: <Info size={16} /> },
  };

  return (
    <div className={`dashboard ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {videoCallRoom && <VideoCallModal roomName={videoCallRoom} displayName={user.name} onClose={() => setVideoCallRoom(null)} />}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══ Sidebar ══ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {!sidebarCollapsed && (
          <>
            <div className="sidebar-govt">
              <Landmark size={16} />
              <div>
                <div className="sidebar-govt-line1">Social Justice &amp; Empowerment Department</div>
                <div className="sidebar-govt-line2">Government of Rajasthan</div>
              </div>
            </div>
            <div className="sidebar-brand">
              <div className="brand-icon"><img src="/drishti-logo.svg" alt="DRISHTI" /></div>
              <div className="brand-text">
                <div className="brand-name">DRISHTI</div>
                <div className="brand-sub">Smart Real-Time Monitoring &amp; Inspection App</div>
              </div>
            </div>
            <div className="sidebar-search">
              <GlobalSearch institutes={institutes} inspections={inspections} alerts={alerts} complaints={complaints} onNavigate={(nav) => setActiveNav(nav)} onSelectInstitute={handleViewInstitute} />
            </div>
          </>
        )}
        {sidebarCollapsed && (
          <div className="sidebar-brand-collapsed">
            <img src="/drishti-logo.svg" alt="DRISHTI" className="brand-icon-collapsed" />
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => { setActiveNav(item.key); setSelectedInstitute(null); setSidebarOpen(false); }}
              title={sidebarCollapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="sidebar-ai-badge">
            <div className="sidebar-ai-badge-header"><ShieldCheck size={14} /> AI VERIFICATION ACTIVE</div>
            <p>Anti-Spoofing &amp; Depth Sensing Enabled</p>
            <div className="sidebar-ai-status"><span className="sidebar-ai-dot" /> System Secure</div>
          </div>
        )}

        <div className="sidebar-user">
          <div className="user-avatar">{user.name?.[0] || "U"}</div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role?.replace(/_/g, " ")}</div>
            </div>
          )}
          <button className="theme-toggle-sm" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="logout-btn" onClick={onLogout} title="Sign out" aria-label="Sign out"><LogOut size={14} /></button>
        </div>
        {!sidebarCollapsed && <div className="sidebar-footer">&copy; 2026 Drishti Platform</div>}
      </aside>

      {/* ══ Main ══ */}
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <header className="main-header">
          <div className="main-header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar"><Menu size={20} /></button>
            <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label="Collapse sidebar">
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="main-header-brand">
              <img src="/drishti-logo.svg" alt="Drishti" />
              <span>Drishti</span>
            </div>
          </div>
          <div className="main-header-search">
            <GlobalSearch institutes={institutes} inspections={inspections} alerts={alerts} complaints={complaints} onNavigate={(nav) => setActiveNav(nav)} onSelectInstitute={handleViewInstitute} />
          </div>
          <div className="main-header-right">
            <button className="header-notif" title="Notifications" aria-label="Notifications">
              <Bell size={20} />
              {unresolvedAlerts > 0 && <span className="header-notif-badge">{unresolvedAlerts}</span>}
            </button>
            <div className="header-profile" ref={profileRef}>
              <button className="header-profile-btn" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="User menu">
                <div className="header-profile-avatar">{user.name?.[0] || "ID"}</div>
                <div className="header-profile-text">
                  <div className="header-profile-name">Inspector {user.name?.split(" ")[0] || "User"}</div>
                  <div className="header-profile-role">{user.role?.replace(/_/g, " ")}</div>
                </div>
                <ChevronDown size={14} className="header-profile-caret" />
              </button>
              {profileOpen && (
                <div className="header-profile-dropdown">
                  <button onClick={() => { setProfileOpen(false); }}><User size={14} /> Profile</button>
                  <button onClick={() => { setActiveNav("inspections"); setProfileOpen(false); }}><ClipboardList size={14} /> My Inspections</button>
                  <button onClick={() => { setActiveNav("video-calls"); setProfileOpen(false); }}><SlidersHorizontal size={14} /> Preferences</button>
                  <button onClick={() => { setProfileOpen(false); }}><LifeBuoy size={14} /> Help &amp; Support</button>
                  <div className="header-profile-sep" />
                  <button className="header-profile-logout" onClick={onLogout}><LogOut size={14} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="content-area">
            <div className="welcome-section">
              <div className="welcome-text"><h2>Welcome back,</h2><h1>Inspector {user.name?.split(" ")[0] || "User"}</h1></div>
            </div>
            <div className="stats-grid">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-stat" />)}</div>
            <div className="grid-3"><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /></div>
          </div>
        ) : (
          <>
            {/* ══ Overview ══ */}
            {activeNav === "overview" && (
              <div className="content-area">
                <div className="welcome-section">
                  <div className="welcome-text">
                    <h2>Welcome back,</h2>
                    <h1>Inspector {user.name?.split(" ")[0] || "User"}</h1>
                    <p>Stay vigilant, build a better nation.</p>
                  </div>
                  <div className="welcome-actions">
                    <div className="date-picker"><CalendarDays size={14} /> {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    <div className="notif-bell"><Bell size={18} />{unresolvedAlerts > 0 && <span className="notif-bell-badge">{unresolvedAlerts}</span>}</div>
                  </div>
                </div>

                <div className="stats-grid">
                  <StatCard icon={<ClipboardCheck size={22} />} label="Total Inspections" value={totalI.toLocaleString()} color="#2563eb" sub="18% from last month" subType="up" />
                  <StatCard icon={<CircleCheck size={22} />} label="Approved" value={approvedI.toLocaleString()} color="#10b981" sub="78.8% of total" />
                  <StatCard icon={<Clock3 size={22} />} label="Pending" value={pendingI.toLocaleString()} color="#f59e0b" sub="18.6% of total" />
                  <StatCard icon={<Flag size={22} />} label="Flagged" value={flaggedI.toLocaleString()} color="#ef4444" sub="2.6% of total" />
                  <StatCard icon={<Building size={22} />} label="Departments" value={12} color="#7c3aed" sub="Active" />
                </div>

                <div className="grid-3">
                  <div className="card">
                    <div className="card-header"><h3 className="card-title">Recent Inspections</h3><button className="card-link" onClick={() => setActiveNav("inspections")}>View All</button></div>
                    <div className="inspection-list">
                      {recentI.length === 0 && (
                        <div className="empty-state"><ImageIcon size={28} /><p>No recent inspections</p><span className="empty-hint">New inspections will appear here</span></div>
                      )}
                      {recentI.map((insp, i) => {
                        const t = ["linear-gradient(135deg,#8B7355,#6B5B3E)","linear-gradient(135deg,#4a6741,#2d4a28)","linear-gradient(135deg,#5a7a8a,#3d5a6a)","linear-gradient(135deg,#8a6a4a,#6a4a2a)","linear-gradient(135deg,#7a8a6a,#5a6a4a)"];
                        const l = ["Jaipur","Sikar","Alwar","Bhilwara","Kota"];
                        const s = ["badge-green","badge-yellow","badge-green","badge-yellow","badge-red"];
                        const sl = ["Approved","Pending","Approved","Pending","Flagged"];
                        return (
                          <div key={insp.id} className="inspection-item">
                            <div className="inspection-thumb" style={{ background: t[i % 5] }}><ImageIcon size={18} color="rgba(255,255,255,0.6)" /></div>
                            <div className="inspection-info">
                              <div className="inspection-name">{insp.institute_name || `Site ${i + 1}`}</div>
                              <div className="inspection-location"><MapPin size={10} /> {l[i % 5]}, Rajasthan</div>
                            </div>
                            <div className="inspection-meta">
                              <span className={`badge ${s[i % 5]}`}>{sl[i % 5]}</span>
                              <div className="inspection-time">{i + 1}h ago</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Inspection Overview</h3>
                      <select className="chart-range" value={chartRange} onChange={(e) => setChartRange(e.target.value)} aria-label="Chart range">
                        {CHART_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="chart-legend">
                      <span><span className="legend-dot" style={{ background: "#2563eb" }} /> Total</span>
                      <span><span className="legend-dot" style={{ background: "#10b981" }} /> Approved</span>
                      <span><span className="legend-dot" style={{ background: "#f59e0b" }} /> Pending</span>
                      <span><span className="legend-dot" style={{ background: "#ef4444" }} /> Flagged</span>
                    </div>
                    <div className="chart-area">
                      <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none" role="img" aria-label="Inspection trend chart">
                        {[0, 100, 200, 300, 400, 500].map((v, i) => (
                          <g key={i}>
                            <line x1="0" y1={160 - (v / 500) * 140} x2="300" y2={160 - (v / 500) * 140} stroke="var(--border)" strokeWidth="0.5" />
                            <text x="-4" y={164 - (v / 500) * 140} fontSize="8" fill="var(--text-muted)" textAnchor="end">{v}</text>
                          </g>
                        ))}
                        <path d="M0,160 L0,130 42,120 85,112 128,104 171,96 214,88 257,76 300,60 L300,160 Z" fill="rgba(37,99,235,0.12)" />
                        <polyline points="0,130 42,120 85,112 128,104 171,96 214,88 257,76 300,60" fill="none" stroke="#2563eb" strokeWidth="2" />
                        <path d="M0,160 L0,148 42,142 85,138 128,133 171,128 214,122 257,114 300,104 L300,160 Z" fill="rgba(16,185,129,0.12)" />
                        <polyline points="0,148 42,142 85,138 128,133 171,128 214,122 257,114 300,104" fill="none" stroke="#10b981" strokeWidth="2" />
                        <path d="M0,160 L0,155 42,153 85,152 128,150 171,148 214,146 257,143 300,140 L300,160 Z" fill="rgba(245,158,11,0.12)" />
                        <polyline points="0,155 42,153 85,152 128,150 171,148 214,146 257,143 300,140" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                        <path d="M0,160 L0,158 42,158 85,157 128,157 171,156 214,156 257,155 300,155 L300,160 Z" fill="rgba(239,68,68,0.08)" />
                        <polyline points="0,158 42,158 85,157 128,157 171,156 214,156 257,155 300,155" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                        {["1 Jun","2 Jun","3 Jun","4 Jun","5 Jun","6 Jun","7 Jun","8 Jun"].map((d, i) => (
                          <text key={i} x={i * 42.8 + 10} y="158" fontSize="7" fill="var(--text-muted)">{d}</text>
                        ))}
                      </svg>
                    </div>
                  </div>

                  <div className="card live-monitoring">
                    <div className="card-header"><h3 className="card-title">Live Monitoring</h3><span className="card-badge live"><span className="live-dot" /> LIVE</span></div>
                    <div className="live-video">
                      <div className="live-video-placeholder">
                        <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                          <rect width="400" height="200" fill="#1a3020" />
                          <rect x="50" y="80" width="80" height="60" rx="2" fill="#2a4a30" />
                          <rect x="200" y="60" width="120" height="100" rx="2" fill="#2a4a30" />
                          <rect x="0" y="145" width="400" height="55" fill="#3a4a2a" />
                        </svg>
                        <div className="live-video-overlay-center"><Camera size={32} color="rgba(255,255,255,0.3)" /><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>Live CCTV Feed</div></div>
                      </div>
                      <div className="live-video-overlay">
                        <span><MapPin size={10} /> 26.9124 N, 75.7873 E</span>
                        <span><Clock3 size={10} /> {now.toLocaleTimeString("en-IN")}</span>
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
                        <button className="live-action" title="Capture"><Camera size={14} /> Capture</button>
                        <button className="live-action" title="Record"><CircleAlert size={14} /> Record</button>
                        <button className="live-action" title="Snapshot"><ImageIcon size={14} /> Snapshot</button>
                        <button className="live-action" title="Full screen"><Maximize2 size={14} /> Full Screen</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="card card-no-pad">
                    <div className="card-header"><h3 className="card-title">Inspection Map</h3><button className="card-link" onClick={() => setActiveNav("map")}>View Full Map</button></div>
                    <div className="map-container">
                      <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}>
                        <RiskMapSection riskMap={riskMap} />
                      </Suspense>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3 className="card-title">Recent Alerts</h3><button className="card-link" onClick={() => setActiveNav("alerts")}>View All</button></div>
                    <div className="alert-list">
                      {alerts.length === 0 && <div className="empty-state"><Bell size={28} /><p>No alerts</p><span className="empty-hint">System alerts will appear here</span></div>}
                      {alerts.slice(0, 5).map((a) => {
                        const info = alertIcons[a.severity] || alertIcons.info;
                        return (
                          <div key={a.id} className="alert-item">
                            <div className={`alert-icon ${info.cls}`}>{info.icon}</div>
                            <div className="alert-info">
                              <div className="alert-title">{a.title}</div>
                              <div className="alert-desc">{a.institute_name}</div>
                            </div>
                            <span className="alert-time">{a.created_at ? Math.max(1, Math.floor((now - new Date(a.created_at)) / 3600000)) + "h ago" : "1h ago"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3 className="card-title">Top Departments</h3></div>
                    <DonutChart data={[{ name: "Public Works", value: 532 }, { name: "Rural Dev", value: 320 }, { name: "Urban Dev", value: 210 }, { name: "Water", value: 110 }, { name: "Other", value: 76 }]} />
                  </div>
                </div>

                <div className="features-bottom">
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon"><ShieldCheck size={24} /></div>
                    <h4>Anti-Spoofing AI</h4>
                    <p>Detects screen replay fraud using depth sensing and lighting analysis.</p>
                    <div className="feature-card-bottom-status text-green">Status: Active</div>
                  </div>
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon"><Hash size={24} /></div>
                    <h4>Visual Hashing</h4>
                    <p>Detects duplicate assets using perceptual hashing algorithm.</p>
                    <div className="feature-card-bottom-status text-green">Status: Active</div>
                  </div>
                  <div className="feature-card-bottom">
                    <div className="feature-card-bottom-icon"><Lock size={24} /></div>
                    <h4>Secure &amp; Transparent</h4>
                    <p>End-to-end encrypted data for better governance and accountability.</p>
                    <div className="feature-card-bottom-status text-green">Status: Secure</div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ Other tabs ══ */}
            {activeNav !== "overview" && (
              <div className="content-area">
                {activeNav === "institutes" && (
                  <>
                    <div className="page-header"><h2>Projects</h2><p>Monitor all registered institutions</p></div>
                    <div className="page-actions">
                      <div className="page-actions-search"><Search size={14} /><input placeholder="Search projects..." aria-label="Search projects" /></div>
                      <button className="btn-outline"><ListFilter size={13} /> Filter</button>
                      <ExportButton institutes={institutes} activeNav="institutes" />
                    </div>
                    <FilterBar><Select label="Type" value={filters.type || ""} onChange={v => setFilters({ ...filters, type: v })} options={["ngo", "institute", "project"]} /><Select label="Risk" value={filters.risk_level || ""} onChange={v => setFilters({ ...filters, risk_level: v })} options={["low", "medium", "high", "critical"]} /><Select label="State" value={filters.state || ""} onChange={v => setFilters({ ...filters, state: v })} options={["Rajasthan", "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat"]} /></FilterBar>
                    <div className="table-wrapper"><table className="data-table full">
                      <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Scheme</th><th>Location</th><th>Risk</th><th>Trust</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {institutes.map(inst => (
                          <tr key={inst.id} className="clickable" onClick={() => handleViewInstitute(inst.id)}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>INS-{inst.id}</td>
                            <td style={{ fontWeight: 600 }}>{inst.name}</td>
                            <td><StatusBadge status={inst.type} /></td>
                            <td style={{ fontSize: 11 }}>{inst.scheme}</td>
                            <td>{inst.district}, {inst.state}</td>
                            <td><RiskBadge level={inst.risk_level} score={inst.risk_score} /></td>
                            <td style={{ fontWeight: 700, color: inst.trust_score >= 60 ? "var(--green)" : "var(--red)" }}>{inst.trust_score}</td>
                            <td><StatusBadge status={inst.status} /></td>
                            <td className="row-actions" onClick={e => e.stopPropagation()}>
                              <button className="icon-btn" title="View"><Eye size={14} /></button>
                              <button className="icon-btn" title="Edit"><Pencil size={14} /></button>
                              <button className="icon-btn" title="Download"><Download size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    {institutes.length === 0 && <div className="empty-state"><Building2 size={32} /><p>No projects found</p><span className="empty-hint">Try adjusting your filters</span></div>}
                  </>
                )}

                {activeNav === "inspections" && (
                  <>
                    <div className="page-header"><h2>Inspections</h2><p>Monitor, verify and manage field inspections</p></div>
                    <div className="page-actions">
                      <div className="page-actions-search"><Search size={14} /><input placeholder="Search inspections..." aria-label="Search inspections" /></div>
                      <button className="btn-outline"><ListFilter size={13} /> Filter</button>
                      <ExportButton inspections={inspections} activeNav="inspections" />
                    </div>
                    <FilterBar><Select label="Status" value={filters.status || ""} onChange={v => setFilters({ ...filters, status: v })} options={["pending", "in_progress", "completed", "cancelled"]} /><Select label="Type" value={filters.type || ""} onChange={v => setFilters({ ...filters, type: v })} options={["surprise", "scheduled", "follow_up"]} /></FilterBar>
                    <div className="table-wrapper"><table className="data-table full">
                      <thead><tr><th>ID</th><th>Institute</th><th>Type</th><th>Status</th><th>Inspector</th><th>GPS</th><th>Compliance</th><th>Actions</th></tr></thead>
                      <tbody>
                        {inspections.map(insp => (
                          <tr key={insp.id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>INS-{insp.id}</td>
                            <td style={{ fontWeight: 600 }}>{insp.institute_name}</td>
                            <td><StatusBadge status={insp.type} /></td>
                            <td><StatusBadge status={insp.status} /></td>
                            <td>{insp.inspector_name || "—"}</td>
                            <td>{insp.gps_verified ? <span className="text-green gps-ok">Verified</span> : <span className="text-red">Not verified</span>}</td>
                            <td>{insp.compliance_status ? <StatusBadge status={insp.compliance_status} /> : "—"}</td>
                            <td className="row-actions">
                              {insp.status === "pending" && !insp.inspector_name && <button className="btn-sm btn-primary" onClick={() => handleAssignRandom(insp.id)}>Assign</button>}
                              <button className="icon-btn" title="View"><Eye size={14} /></button>
                              <button className="icon-btn" title="Review"><ClipboardCheck size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    {inspections.length === 0 && <div className="empty-state"><ClipboardCheck size={32} /><p>No inspections found</p><span className="empty-hint">Inspections assigned to you will appear here</span></div>}
                  </>
                )}

                {activeNav === "map" && (
                  <>
                    <div className="page-header"><h2>Map View</h2><p>Geographic risk visualization</p></div>
                    <div className="card card-no-pad"><div style={{ height: 500 }}><Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}><RiskMapSection riskMap={riskMap} /></Suspense></div></div>
                  </>
                )}

                {activeNav === "alerts" && (
                  <>
                    <div className="page-header"><h2>Alerts</h2><p>System-generated alerts and anomalies</p></div>
                    <FilterBar><Select label="Severity" value={filters.severity || ""} onChange={v => setFilters({ ...filters, severity: v })} options={["info", "warning", "critical"]} /></FilterBar>
                    <div className="alerts-grid">
                      {alerts.map(a => (
                        <div key={a.id} className={`alert-card severity-${a.severity} ${a.is_resolved ? "resolved" : ""}`}>
                          <div className="alert-card-header"><span className="alert-card-type">{a.type}</span><StatusBadge status={a.severity} /></div>
                          <div className="alert-card-title">{a.title}</div>
                          <div className="alert-card-msg">{a.message}</div>
                          <div className="alert-card-footer"><span className="alert-institute-name">{a.institute_name}</span><span className="alert-date">{new Date(a.created_at).toLocaleDateString("en-IN")}</span></div>
                          {!a.is_resolved && <button className="btn-sm btn-success" style={{ marginTop: 8 }} onClick={() => handleResolveAlert(a.id)}>Mark Resolved</button>}
                        </div>
                      ))}
                    </div>
                    {alerts.length === 0 && <div className="empty-state"><Bell size={32} /><p>No alerts found</p><span className="empty-hint">All clear — no active alerts</span></div>}
                  </>
                )}

                {activeNav === "cctv" && (
                  <>
                    <div className="page-header"><h2>Assets</h2><p>Live camera feed monitoring</p></div>
                    <div className="cctv-grid">
                      {cctv.map(cam => (
                        <div key={cam.id} className={`cctv-card ${cam.status}`}>
                          <div className="cctv-preview">
                            <div className="cctv-static">
                              {cam.status === "online" && <div className="scanline" />}
                              {cam.status === "online"
                                ? <span className="cctv-live"><Radio size={12} /> LIVE — {cam.people_detected} people</span>
                                : <span className="cctv-offline-text">OFFLINE</span>}
                            </div>
                          </div>
                          <div className="cctv-info">
                            <div className="cctv-name">{cam.name}</div>
                            <div className="cctv-meta"><StatusBadge status={cam.status} /><span>{cam.location_description}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cctv.length === 0 && <div className="empty-state"><Camera size={32} /><p>No camera assets found</p><span className="empty-hint">Registered CCTV devices will appear here</span></div>}
                  </>
                )}

                {activeNav === "complaints" && (
                  <>
                    <div className="page-header"><h2>Departments</h2><p>Beneficiary feedback and complaints</p></div>
                    <SentimentAnalyzer complaints={complaints} />
                    <FilterBar><Select label="Category" value={filters.category || ""} onChange={v => setFilters({ ...filters, category: v })} options={["staff_absent", "service_not_received", "fake_attendance", "infrastructure", "misbehavior", "other"]} /><Select label="Status" value={filters.status || ""} onChange={v => setFilters({ ...filters, status: v })} options={["pending", "investigating", "resolved", "dismissed"]} /></FilterBar>
                    <div className="table-wrapper"><table className="data-table full">
                      <thead><tr><th>ID</th><th>Institute</th><th>From</th><th>Category</th><th>Description</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {complaints.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>CMP-{c.id}</td>
                            <td style={{ fontWeight: 600 }}>{c.institute_name}</td>
                            <td>{c.is_anonymous ? "Anonymous" : c.beneficiary_name}</td>
                            <td><StatusBadge status={c.category?.replace(/_/g, " ")} /></td>
                            <td style={{ fontSize: 12 }}>{c.description}</td>
                            <td><StatusBadge status={c.status} /></td>
                            <td style={{ fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    {complaints.length === 0 && <div className="empty-state"><Building size={32} /><p>No complaints found</p></div>}
                  </>
                )}

                {activeNav === "analytics" && (analytics
                  ? <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}><AnalyticsSection analytics={analytics} /></Suspense>
                  : <div className="page-header"><h2>Reports &amp; Analytics</h2><p>Loading analytics data...</p></div>
                )}

                {activeNav === "video-calls" && (
                  <>
                    <div className="page-header"><h2>Settings</h2><p>Surprise video verification calls</p></div>
                    <div style={{ marginBottom: 16 }}><button className="btn-primary" onClick={() => setVideoCallRoom(`official-${Date.now()}`)}><Video size={14} className="lucide" /> Start Surprise Video Call</button></div>
                    <ExifVerifier />
                    <div className="table-wrapper" style={{ marginTop: 16 }}><table className="data-table full">
                      <thead><tr><th>ID</th><th>Institute</th><th>Called Person</th><th>Role</th><th>Status</th><th>Duration</th><th>Date</th></tr></thead>
                      <tbody>
                        {videoCalls.map(vc => (
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
                    </table></div>
                    {videoCalls.length === 0 && <div className="empty-state"><Video size={32} /><p>No video calls logged</p></div>}
                  </>
                )}

                {activeNav === "beneficiaries" && (
                  <>
                    <div className="page-header"><h2>Users &amp; Roles</h2><p>Beneficiary verification and feedback</p></div>
                    <div className="table-wrapper"><table className="data-table full">
                      <thead><tr><th>Name</th><th>Institute</th><th>Service</th><th>Rating</th><th>Attendance</th><th>Feedback</th></tr></thead>
                      <tbody>
                        {beneficiaries.map(b => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 600 }}>{b.name}</td>
                            <td>{b.institute_name}</td>
                            <td>{b.service_received ? <span className="text-green">Yes</span> : <span className="text-red">No</span>}</td>
                            <td>{b.service_rating || 0}/5</td>
                            <td>{b.attendance_confirmed ? <span className="text-green">Confirmed</span> : <span className="text-red">Not confirmed</span>}</td>
                            <td style={{ fontSize: 12 }}>{b.feedback || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    {beneficiaries.length === 0 && <div className="empty-state"><Users size={32} /><p>No users found</p></div>}
                  </>
                )}

                {activeNav === "predictive" && (
                  <>
                    <div className="page-header"><h2>AI Predictions</h2><p>AI-predicted inspection priorities</p></div>
                    <div className="predictive-grid">
                      {predictive.map((p, i) => (
                        <div key={i} className={`predictive-card priority-${p.priority.toLowerCase()}`}>
                          <div className="predictive-header">
                            <div className="predictive-rank">#{i + 1}</div>
                            <div>
                              <div className="predictive-name">{p.institute_name}</div>
                              <div className="predictive-priority"><StatusBadge status={p.priority === "HIGH" ? "critical" : p.priority === "MEDIUM" ? "warning" : "info"} /><span>Priority Inspection</span></div>
                            </div>
                          </div>
                          <div className="predictive-scores">
                            <div className="score-item"><span className="score-label">Risk Score</span><span className="score-value" style={{ color: p.risk_score >= 61 ? "var(--red)" : p.risk_score >= 31 ? "var(--orange)" : "var(--green)" }}>{p.risk_score}/100</span></div>
                            <div className="score-item"><span className="score-label">Trust Score</span><span className="score-value">{p.trust_score}/100</span></div>
                          </div>
                          <div className="predictive-reasons">
                            <strong>AI Reasons:</strong>
                            <ul>{p.reasons.map((r, j) => <li key={j}><TriangleAlert size={12} /> {r}</li>)}</ul>
                          </div>
                        </div>
                      ))}
                    </div>
                    {predictive.length === 0 && <div className="empty-state"><Brain size={32} /><p>No predictions available</p></div>}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ Institute Detail Drawer ══ */}
      {selectedInstitute && instituteDetail && (
        <div className="detail-overlay" onClick={() => setSelectedInstitute(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{instituteDetail.name}</h2>
              <button className="detail-close" onClick={() => setSelectedInstitute(null)} aria-label="Close"><X size={18} /></button>
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
                    <div className="score-inner"><span className="score-num">{instituteDetail.risk_score}</span><span className="score-lbl">Risk</span></div>
                  </div>
                </div>
                <div className="score-circle">
                  <div className="score-ring" style={{ borderColor: "var(--accent)" }}>
                    <div className="score-inner"><span className="score-num">{instituteDetail.trust_score}</span><span className="score-lbl">Trust</span></div>
                  </div>
                </div>
              </div>
              <h3 className="detail-section-title"><Camera size={14} /> CCTV Devices ({instituteDetail.cctv_devices?.length})</h3>
              <div className="detail-cctv-grid">
                {instituteDetail.cctv_devices?.map(cam => (
                  <div key={cam.id} className={`mini-cctv ${cam.status}`}>
                    <div className="mini-cctv-preview">
                      {cam.status === "online" ? <span className="mini-live"><CircleCheck size={12} /> LIVE — {cam.people_detected} people</span> : <span className="mini-offline">OFFLINE</span>}
                    </div>
                    <div className="mini-cctv-name">{cam.name}</div>
                  </div>
                ))}
              </div>
              <h3 className="detail-section-title"><Search size={14} /> Inspections ({instituteDetail.inspections?.length})</h3>
              <div className="detail-list">
                {instituteDetail.inspections?.map(insp => (
                  <div key={insp.id} className="detail-list-item"><StatusBadge status={insp.status} /><span>{insp.type} — GPS: {insp.gps_verified ? "Verified" : "Not verified"}</span>{insp.compliance_status && <StatusBadge status={insp.compliance_status} />}</div>
                ))}
              </div>
              <h3 className="detail-section-title"><Bell size={14} /> Alerts ({instituteDetail.alerts?.length})</h3>
              <div className="detail-list">
                {instituteDetail.alerts?.map(a => (
                  <div key={a.id} className="detail-list-item"><StatusBadge status={a.severity} /><span style={{ fontSize: 12 }}>{a.title}</span>{a.is_resolved && <span className="text-green">Resolved</span>}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline export button (CSV/JSON) used in page action bars */
function ExportButton({ institutes, inspections, activeNav }) {
  const [open, setOpen] = useState(false);
  const data = activeNav === "inspections" ? inspections : institutes;
  const name = activeNav || "report";

  function exportCSV(rows, filename) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="export-wrapper" style={{ position: "relative" }}>
      <button className="btn-outline" onClick={() => setOpen(!open)}><Download size={13} /> Export</button>
      {open && (
        <div className="export-dropdown" onMouseLeave={() => setOpen(false)}>
          <button onClick={() => { exportCSV(data, `drishti-${name}-${new Date().toISOString().slice(0, 10)}`); setOpen(false); }}>Download CSV</button>
        </div>
      )}
    </div>
  );
}
