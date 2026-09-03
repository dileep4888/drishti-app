import { useTheme } from "../ThemeContext";
import "./Landing.css";

export default function Landing({ onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-header-left">
            <img src="/drishti-logo.svg" alt="DRISHTI" className="landing-header-logo" />
            <div>
              <span className="landing-header-name">DRISHTI</span>
              <span className="landing-header-sub">Smart Real-Time Monitoring</span>
            </div>
          </div>
          <div className="landing-header-right">
            <button className="link-btn" onClick={toggleTheme}>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</button>
            <button className="btn-secondary" onClick={() => onNavigate("/login")}>Sign In</button>
            <button className="btn-primary" onClick={() => onNavigate("/login")}>Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">Government of India — Ministry of Social Justice & Empowerment</div>
          <h1>
            AI-Powered Surveillance,<br />
            Tracking & Inspection System
          </h1>
          <p>
            Centralized monitoring platform for transparent, accountable governance across all social welfare institutes.
            Eliminate fraud, automate inspections, and ensure accountability with AI-driven analytics.
          </p>
          <div className="landing-hero-actions">
            <button className="btn-primary btn-lg" onClick={() => onNavigate("/login")}>
              Access Dashboard →
            </button>
            <button className="btn-secondary btn-lg" onClick={() => onNavigate("/register")}>
              Register as Official
            </button>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-stat"><span className="landing-stat-val">1,245</span><span className="landing-stat-lbl">Active Projects</span></div>
            <div className="landing-stat"><span className="landing-stat-val">3,450</span><span className="landing-stat-lbl">CCTV Cameras</span></div>
            <div className="landing-stat"><span className="landing-stat-val">28</span><span className="landing-stat-lbl">States Covered</span></div>
            <div className="landing-stat"><span className="landing-stat-val">24/7</span><span className="landing-stat-lbl">Monitoring</span></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">Core Capabilities</span>
            <h2>Intelligent Monitoring Features</h2>
          </div>
          <div className="landing-features-grid">
            {[
              { icon: "🛡️", title: "AI Risk Scoring", desc: "Dynamic trust scores combining CCTV data, attendance records, and inspection history." },
              { icon: "📹", title: "Live CCTV Analytics", desc: "AI-powered people counting, anomaly detection, and real-time camera health monitoring." },
              { icon: "🔍", title: "Surprise Inspections", desc: "Automated random inspector assignment with conflict avoidance for fair inspections." },
              { icon: "📍", title: "Geo-tagged Evidence", desc: "Tamper-proof records locked with GPS, timestamp, and inspector ID." },
              { icon: "📊", title: "Predictive Analytics", desc: "ML models predict which institutions require urgent inspection." },
              { icon: "🎥", title: "Video Verification", desc: "Surprise video calls to verify staff presence and activities in real-time." },
            ].map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Score */}
      <section className="landing-section alt" id="trust">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">AI Trust Engine</span>
            <h2>Dynamic Trust Scores</h2>
          </div>
          <div className="landing-trust-grid">
            {[
              { name: "CRY Child Rights", score: 82, status: "Reliable", color: "var(--green)", factors: "CCTV: Online • Attendance: Verified • Complaints: Low" },
              { name: "HelpAge India", score: 42, status: "Medium Risk", color: "var(--orange)", factors: "CCTV: Intermittent • Attendance: Discrepancy" },
              { name: "Smile Foundation", score: 20, status: "High Risk", color: "var(--red)", factors: "CCTV: Offline 5hrs • 58% Attendance Mismatch" },
            ].map((t, i) => (
              <div key={i} className="landing-trust-card">
                <div className="landing-trust-score" style={{ borderColor: t.color }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: t.color }}>{t.score}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/100</span>
                </div>
                <div className="landing-trust-info">
                  <h4>{t.name}</h4>
                  <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.status}</span>
                  <p>{t.factors}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="landing-section" id="problem">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">Problem Statement</span>
            <h2>Why DRISHTI AI?</h2>
          </div>
          <div className="landing-problem-grid">
            <div className="landing-problem-card">
              <div className="landing-problem-head red">Current Challenges</div>
              <ul>
                <li>Fake attendance records by NGOs</li>
                <li>Proxy staff and beneficiary fraud</li>
                <li>Inspectors notified beforehand</li>
                <li>No centralized monitoring</li>
                <li>Manual inspector assignment bias</li>
              </ul>
            </div>
            <div className="landing-problem-card">
              <div className="landing-problem-head green">Our Solution</div>
              <ul>
                <li>AI-powered CCTV verification</li>
                <li>Geo-tagged evidence collection</li>
                <li>Random automated assignment</li>
                <li>Real-time anomaly detection</li>
                <li>Dynamic trust scoring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to Transform Governance?</h2>
          <p>Join DRISHTI AI for transparent, accountable social welfare monitoring.</p>
          <div className="landing-cta-actions">
            <button className="btn-primary btn-lg" onClick={() => onNavigate("/login")}>Access Dashboard</button>
            <button className="btn-secondary btn-lg" onClick={() => onNavigate("/register")}>Register</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/drishti-logo.svg" alt="DRISHTI" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>DRISHTI AI</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Since 2026</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            © 2026 DRISHTI AI — Ministry of Social Justice & Empowerment, Government of India
          </div>
        </div>
      </footer>
    </div>
  );
}
