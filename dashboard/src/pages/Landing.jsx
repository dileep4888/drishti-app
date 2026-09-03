import { useTheme } from "../ThemeContext";
import "./Landing.css";

export default function Landing({ onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* Government Top Bar */}
      <div className="govt-topbar">
        <span>Government of India</span>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <button className="topbar-theme" onClick={toggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Government Header */}
      <header className="govt-header-landing">
        <div className="govt-header-inner">
          <div className="govt-header-left">
            <div className="govt-emblem-landing">
              <img src="/drishti-logo.svg" alt="DRISHTI" />
            </div>
            <div className="govt-title-block">
              <h1>DRISHTI AI</h1>
              <p>Digital Real-time Intelligent Surveillance, Tracking & Inspection System</p>
              <p className="govt-ministry">Ministry of Social Justice & Empowerment</p>
            </div>
          </div>
          <div className="govt-header-right">
            <button className="btn-primary" onClick={() => onNavigate("/login")}>
              Citizen Login
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("/register")}>
              Register
            </button>
          </div>
        </div>
        <div className="govt-nav-strip">
          <a href="#about" className="govt-nav-link active">Home</a>
          <a href="#features" className="govt-nav-link">About DRISHTI</a>
          <a href="#modules" className="govt-nav-link">Modules</a>
          <a href="#problem" className="govt-nav-link">Problem Statement</a>
          <a href="#contact" className="govt-nav-link">Contact</a>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="hero-govt">
        <div className="hero-govt-inner">
          <div className="hero-govt-content">
            <div className="hero-govt-badge">
              Problem ID: 26095 • Smart Automation
            </div>
            <h2>
              AI-Powered Surveillance, Tracking & Inspection System for
              Social Welfare Governance
            </h2>
            <p>
              DRISHTI AI is a centralized monitoring platform designed for the
              Department of Social Justice and Empowerment. It enables real-time
              monitoring of institutions, AI-based attendance verification,
              automated inspection assignment, and predictive risk analysis
              to ensure transparent and accountable governance.
            </p>
            <div className="hero-govt-actions">
              <button className="btn-primary" onClick={() => onNavigate("/login")}>
                Access Dashboard →
              </button>
              <button className="btn-secondary" onClick={() => onNavigate("/register")}>
                Register as Official
              </button>
            </div>
          </div>
          <div className="hero-govt-stats">
            <div className="govt-stat-card">
              <div className="govt-stat-num">1,245</div>
              <div className="govt-stat-lbl">Active Projects</div>
            </div>
            <div className="govt-stat-card">
              <div className="govt-stat-num">3,450</div>
              <div className="govt-stat-lbl">CCTV Cameras</div>
            </div>
            <div className="govt-stat-card">
              <div className="govt-stat-num">28</div>
              <div className="govt-stat-lbl">States Covered</div>
            </div>
            <div className="govt-stat-card">
              <div className="govt-stat-num">24/7</div>
              <div className="govt-stat-lbl">Real-time Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="govt-section" id="problem">
        <div className="govt-section-inner">
          <div className="govt-section-header">
            <span className="govt-section-num">01</span>
            <h3>The Problem</h3>
          </div>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-card-head red">Current Challenges</div>
              <ul className="problem-list">
                <li>Fake attendance records submitted by NGOs</li>
                <li>Proxy staff and beneficiary fraud</li>
                <li>Inspectors notified before surprise inspections</li>
                <li>No centralized real-time monitoring system</li>
                <li>Manual inspector assignment creates bias</li>
                <li>No way to verify CCTV footage authenticity</li>
                <li>Delayed response to non-compliance</li>
              </ul>
            </div>
            <div className="problem-card">
              <div className="problem-card-head green">Our Solution</div>
              <ul className="problem-list">
                <li>AI-powered CCTV attendance verification</li>
                <li>Geo-tagged evidence with GPS + timestamp</li>
                <li>Random automated inspector assignment</li>
                <li>Real-time anomaly detection engine</li>
                <li>Dynamic trust scoring for every institute</li>
                <li>Predictive inspection prioritization</li>
                <li>Surprise video conferencing verification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="govt-section alt" id="features">
        <div className="govt-section-inner">
          <div className="govt-section-header">
            <span className="govt-section-num">02</span>
            <h3>Core Capabilities</h3>
          </div>
          <div className="features-grid-govt">
            {[
              { icon: "🤖", title: "AI Risk Scoring", desc: "Dynamic trust evaluation combining CCTV data, attendance records, complaint patterns, and inspection history into a single risk score for each institute." },
              { icon: "📹", title: "Live CCTV Analytics", desc: "AI-powered people counting, anomaly detection, and camera health monitoring. Detects attendance discrepancies between reported and actual numbers." },
              { icon: "🔍", title: "Surprise Inspection", desc: "Automated random inspector assignment with conflict avoidance. Prevents inspector-institute bias and ensures fair, surprise inspections." },
              { icon: "📍", title: "Geo-tagged Evidence", desc: "Every inspection photo and video is locked with GPS coordinates, timestamp, inspector ID, and inspection reference for tamper-proof records." },
              { icon: "📊", title: "Predictive Analytics", desc: "Machine learning models predict which institutions require urgent inspection based on risk patterns, complaint trends, and historical data." },
              { icon: "🎥", title: "Video Verification", desc: "Surprise video calls to project in-charges and staff to verify presence, activities, and infrastructure in real-time." },
            ].map((f, i) => (
              <div key={i} className="feature-card-govt">
                <div className="feature-icon-govt">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="govt-section" id="modules">
        <div className="govt-section-inner">
          <div className="govt-section-header">
            <span className="govt-section-num">03</span>
            <h3>Platform Modules</h3>
          </div>
          <div className="modules-table-wrap">
            <table className="modules-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Function</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Centralized Dashboard", "Overview of all projects, institutes, alerts and analytics", "Operational"],
                  ["Institute Registry", "Track NGOs, education centers, health facilities", "Operational"],
                  ["Inspection Engine", "AI-powered surprise and scheduled inspection management", "Operational"],
                  ["CCTV Monitor", "Live camera feeds with AI people detection", "Operational"],
                  ["Risk Map", "Geographic visualization of institutional risk levels", "Operational"],
                  ["Alert System", "Real-time anomaly detection and official notification", "Operational"],
                  ["Complaint Tracker", "Beneficiary feedback with AI sentiment analysis", "Operational"],
                  ["Analytics Hub", "Trend analysis, attendance comparison, and reporting", "Operational"],
                  ["Video Calls", "Surprise video verification with evidence recording", "Operational"],
                  ["Beneficiary Portal", "Service verification and feedback collection", "Operational"],
                  ["AI Predictions", "Priority inspection recommendations from ML models", "Operational"],
                  ["Mobile Inspector", "Field app for geo-tagged evidence capture", "Development"],
                ].map(([mod, fn, st], i) => (
                  <tr key={i}>
                    <td className="font-bold">{mod}</td>
                    <td>{fn}</td>
                    <td>
                      <span className={`badge ${st === "Operational" ? "badge-green" : "badge-blue"}`}>
                        {st}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Score */}
      <section className="govt-section alt" id="trust">
        <div className="govt-section-inner">
          <div className="govt-section-header">
            <span className="govt-section-num">04</span>
            <h3>DRISHTI AI Trust Score</h3>
          </div>
          <p className="trust-intro">
            Every institute receives a dynamic trust score based on real-time data from
            CCTV feeds, attendance verification, inspection outcomes, and beneficiary feedback.
          </p>
          <div className="trust-cards-row">
            <div className="trust-card-govt">
              <div className="trust-score good">82</div>
              <div className="trust-info">
                <div className="trust-name">CRY Child Rights</div>
                <div className="trust-status badge badge-green">Reliable</div>
                <div className="trust-factors">CCTV: Online • Attendance: Verified • Complaints: Low</div>
              </div>
            </div>
            <div className="trust-card-govt">
              <div className="trust-score warn">42</div>
              <div className="trust-info">
                <div className="trust-name">HelpAge India</div>
                <div className="trust-status badge badge-yellow">Medium Risk</div>
                <div className="trust-factors">CCTV: Intermittent • Attendance: Discrepancy • Complaints: Moderate</div>
              </div>
            </div>
            <div className="trust-card-govt">
              <div className="trust-score danger">20</div>
              <div className="trust-info">
                <div className="trust-name">Smile Foundation</div>
                <div className="trust-status badge badge-red">High Risk</div>
                <div className="trust-factors">CCTV: Offline 5hrs • Attendance: 58% Mismatch • Complaints: High</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="govt-section" id="about-section">
        <div className="govt-section-inner">
          <div className="govt-section-header">
            <span className="govt-section-num">05</span>
            <h3>About the Initiative</h3>
          </div>
          <div className="about-grid-govt">
            <div>
              <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                DRISHTI AI is designed for the Department of Social Justice and Empowerment
                under the Government of India. It addresses critical challenges in monitoring
                government-funded projects, NGOs, and social welfare institutes across the nation.
              </p>
              <div className="about-details">
                <div className="about-detail-row">
                  <span className="about-detail-label">Organization</span>
                  <span>Ministry of Social Justice & Empowerment</span>
                </div>
                <div className="about-detail-row">
                  <span className="about-detail-label">Department</span>
                  <span>Department of Social Justice & Empowerment</span>
                </div>
                <div className="about-detail-row">
                  <span className="about-detail-label">Problem ID</span>
                  <span>26095</span>
                </div>
                <div className="about-detail-row">
                  <span className="about-detail-label">Theme</span>
                  <span>Smart Automation</span>
                </div>
                <div className="about-detail-row">
                  <span className="about-detail-label">Category</span>
                  <span>Software</span>
                </div>
              </div>
            </div>
            <div>
              <div className="about-card-govt">
                <img src="/drishti-logo.svg" alt="DRISHTI AI" className="about-logo-govt" />
                <h4>DRISHTI AI</h4>
                <p>Digital Real-time Intelligent Surveillance, Tracking & Inspection System</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="govt-cta">
        <div className="govt-cta-inner">
          <h3>Ready to Transform Social Welfare Governance?</h3>
          <p>Join the DRISHTI AI platform and experience AI-powered monitoring for transparent, accountable governance.</p>
          <div className="govt-cta-actions">
            <button className="btn-primary" onClick={() => onNavigate("/login")}>
              Access Dashboard →
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("/register")}>
              Register as Official
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="govt-footer">
        <div className="govt-footer-inner">
          <div className="govt-footer-grid">
            <div className="govt-footer-col">
              <div className="govt-footer-brand">
                <img src="/drishti-logo.svg" alt="DRISHTI" className="govt-footer-logo" />
                <div>
                  <div className="govt-footer-name">DRISHTI AI</div>
                  <div className="govt-footer-sub">Government of India</div>
                </div>
              </div>
              <p className="govt-footer-desc">
                Digital Real-time Intelligent Surveillance, Tracking & Inspection System
              </p>
            </div>
            <div className="govt-footer-col">
              <h4>Quick Links</h4>
              <a href="#features">About DRISHTI</a>
              <a href="#modules">Platform Modules</a>
              <a href="#problem">Problem Statement</a>
              <button onClick={() => onNavigate("/login")}>Login</button>
              <button onClick={() => onNavigate("/register")}>Register</button>
            </div>
            <div className="govt-footer-col">
              <h4>Ministry</h4>
              <p>Ministry of Social Justice & Empowerment</p>
              <p>Department of Social Justice & Empowerment</p>
              <p>Government of India</p>
            </div>
          </div>
          <div className="govt-footer-bottom">
            <p>© 2026 DRISHTI AI — Ministry of Social Justice & Empowerment, Government of India. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
