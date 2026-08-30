import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RiskStamp from "../components/RiskStamp";
import "./Dashboard.css";

// TODO: replace with a real call to GET /institutes once that endpoint is built.
// Shape matches the `institutes` table in db/schema.sql so swapping in the
// real API response later is a drop-in change.
const MOCK_INSTITUTES = [
  { id: 1, name: "Asha Rehabilitation Centre", district: "Jaipur", risk_score: 82, last_inspected_at: "2026-08-14", status: "flagged" },
  { id: 2, name: "Sunrise Old Age Home", district: "Udaipur", risk_score: 41, last_inspected_at: "2026-08-20", status: "under_review" },
  { id: 3, name: "Divyang Skill Development Institute", district: "Kota", risk_score: 12, last_inspected_at: "2026-08-25", status: "active" },
  { id: 4, name: "Sanjeevani NGO Trust", district: "Jodhpur", risk_score: 68, last_inspected_at: "2026-07-30", status: "flagged" },
  { id: 5, name: "Pragati Scholarship Cell", district: "Ajmer", risk_score: 5, last_inspected_at: "2026-08-27", status: "active" },
];

export default function Dashboard() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem("drishti_name");
    const savedRole = localStorage.getItem("drishti_role");
    if (!localStorage.getItem("drishti_token")) {
      navigate("/login");
      return;
    }
    setName(savedName || "");
    setRole(savedRole || "");
  }, [navigate]);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  const flaggedCount = MOCK_INSTITUTES.filter((i) => i.risk_score >= 70).length;
  const watchCount = MOCK_INSTITUTES.filter((i) => i.risk_score >= 35 && i.risk_score < 70).length;

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-eyebrow">DoSJE</p>
          <h1 className="sidebar-title">DRISHTI</h1>
        </div>
        <nav className="sidebar-nav">
          <a className="sidebar-nav__item sidebar-nav__item--active" href="#">
            Institute register
          </a>
          <a className="sidebar-nav__item" href="#">
            Live inspections
          </a>
          <a className="sidebar-nav__item" href="#">
            VC call log
          </a>
          <a className="sidebar-nav__item" href="#">
            Risk flags
          </a>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user">{name}</p>
          <p className="sidebar-role">{role?.replace("_", " ")}</p>
          <button className="sidebar-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>Institute register</h2>
          <p>Live status across all onboarded projects, NGOs and institutes.</p>
        </header>

        <section className="summary-row">
          <div className="summary-card">
            <span className="summary-number">{MOCK_INSTITUTES.length}</span>
            <span className="summary-label">Onboarded institutes</span>
          </div>
          <div className="summary-card summary-card--amber">
            <span className="summary-number">{watchCount}</span>
            <span className="summary-label">Under watch</span>
          </div>
          <div className="summary-card summary-card--red">
            <span className="summary-number">{flaggedCount}</span>
            <span className="summary-label">Flagged this week</span>
          </div>
        </section>

        <section className="institute-list">
          {MOCK_INSTITUTES.map((inst) => (
            <div className="institute-row" key={inst.id}>
              <RiskStamp score={inst.risk_score} />
              <div className="institute-details">
                <h3>{inst.name}</h3>
                <p className="institute-meta">
                  {inst.district} · Last inspected {inst.last_inspected_at}
                </p>
              </div>
              <button className="institute-action">View live feed</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
