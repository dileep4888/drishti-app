import { useTheme } from "../ThemeContext";
import "./Landing.css";

export default function Landing({ onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={() => onNavigate("/")}>
            <img src="/drishti-logo.svg" alt="DRISHTI" className="landing-brand-logo" />
            <div className="landing-brand-text">
              <span className="brand-name">DRISHTI</span>
              <span className="brand-tagline">AI SYSTEM</span>
            </div>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#about">About</a>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="nav-cta" onClick={() => onNavigate("/login")}>
              Sign In →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-glow" />
          <div className="hero-glow-2" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Government of India — Ministry of Social Justice & Empowerment
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Digital Real-time</span>
            <span className="hero-title-line accent">Intelligent Surveillance,</span>
            <span className="hero-title-line">Tracking & Inspection</span>
          </h1>
          <p className="hero-desc">
            AI-powered centralized monitoring platform eliminating fraud, automating inspections,
            and ensuring transparent governance across all social welfare institutes.
          </p>
          <div className="hero-actions">
            <button className="btn-primary-lg" onClick={() => onNavigate("/login")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Access Dashboard
            </button>
            <button className="btn-outline-lg" onClick={() => onNavigate("/register")}>
              Register Now
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">1,245</span>
              <span className="hero-stat-lbl">Active Projects</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-val">3,450</span>
              <span className="hero-stat-lbl">CCTV Cameras</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-val">28</span>
              <span className="hero-stat-lbl">States Covered</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-val">24/7</span>
              <span className="hero-stat-lbl">Real-time Monitoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Score Visual */}
      <section className="trust-section">
        <div className="section-inner">
          <div className="trust-banner">
            <div className="trust-left">
              <div className="trust-logo-large">
                <img src="/drishti-logo.svg" alt="DRISHTI AI" />
              </div>
              <div>
                <h2 className="trust-title">DRISHTI AI Trust Score</h2>
                <p className="trust-desc">Dynamic AI-powered trust evaluation for every institute in the nation</p>
              </div>
            </div>
            <div className="trust-cards">
              <div className="trust-card good">
                <div className="trust-card-score">82<span>/100</span></div>
                <div className="trust-card-name">CRY Child Rights</div>
                <div className="trust-card-status">🟢 Reliable</div>
              </div>
              <div className="trust-card warn">
                <div className="trust-card-score">42<span>/100</span></div>
                <div className="trust-card-name">HelpAge India</div>
                <div className="trust-card-status">🟡 Medium Risk</div>
              </div>
              <div className="trust-card danger">
                <div className="trust-card-score">20<span>/100</span></div>
                <div className="trust-card-name">Smile Foundation</div>
                <div className="trust-card-status">🔴 High Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-inner">
          <div className="section-badge">Core Capabilities</div>
          <h2 className="section-title">AI-Powered Surveillance & Governance</h2>
          <p className="section-desc">
            Combining artificial intelligence, real-time video analytics, and geo-tagged evidence
            to eliminate fraud and ensure accountability.
          </p>
          <div className="features-grid">
            {[
              { icon: "🤖", title: "AI Risk Scoring", desc: "Dynamic trust scores for every institute based on CCTV data, attendance, complaints, and inspection history." },
              { icon: "📹", title: "Live CCTV Analytics", desc: "AI-powered people counting, anomaly detection, and real-time camera health monitoring across all locations." },
              { icon: "🔍", title: "Surprise Inspections", desc: "Automated random inspector assignment with conflict avoidance to prevent bias and ensure fairness." },
              { icon: "📍", title: "Geo-tagged Evidence", desc: "Every photo and video is locked with GPS coordinates, timestamp, and inspector ID for tamper-proof records." },
              { icon: "📊", title: "Predictive Analytics", desc: "AI predicts which institutions need urgent inspection before problems escalate, enabling proactive governance." },
              { icon: "🎥", title: "Video Verification", desc: "Surprise video calls to project in-charges and staff to verify presence and activities in real-time." },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="modules" id="modules">
        <div className="section-inner">
          <div className="section-badge light">Platform Modules</div>
          <h2 className="section-title light">Complete Monitoring Ecosystem</h2>
          <div className="modules-grid">
            {[
              { icon: "📊", name: "Dashboard", desc: "Centralized overview of all institutes, alerts, and metrics" },
              { icon: "🏛️", name: "Institute Registry", desc: "Track all NGOs, education centers, and health facilities" },
              { icon: "🔍", name: "Inspection Engine", desc: "AI-powered surprise & scheduled inspection management" },
              { icon: "📹", name: "CCTV Monitor", desc: "Live camera feeds with AI people detection" },
              { icon: "🗺️", name: "Risk Map", desc: "Geographic visualization of institutional risk levels" },
              { icon: "🚨", name: "Alert System", desc: "Real-time anomaly detection and notification" },
              { icon: "📝", name: "Complaint Tracker", desc: "Beneficiary feedback with AI sentiment analysis" },
              { icon: "📈", name: "Analytics Hub", desc: "Trend analysis, attendance comparison, and reporting" },
              { icon: "🎥", name: "Video Calls", desc: "Surprise video verification with evidence recording" },
              { icon: "👥", name: "Beneficiary Portal", desc: "Service verification and feedback collection" },
              { icon: "🤖", name: "AI Predictions", desc: "Priority inspection recommendations from ML models" },
              { icon: "📱", name: "Mobile Inspector", desc: "Field app for geo-tagged evidence capture" },
            ].map((m, i) => (
              <div key={i} className="module-card">
                <span className="module-icon">{m.icon}</span>
                <h4 className="module-name">{m.name}</h4>
                <p className="module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Ministry */}
      <section className="about" id="about">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-badge">About the Initiative</div>
              <h2 className="section-title">Ministry of Social Justice & Empowerment</h2>
              <p className="about-desc">
                DRISHTI AI is designed for the Department of Social Justice and Empowerment under
                the Government of India. It addresses critical challenges in monitoring government
                projects, NGOs, and social welfare institutes across the country.
              </p>
              <div className="about-points">
                {[
                  "Eliminate fake attendance and proxy staff reports",
                  "Automate inspector assignment with conflict avoidance",
                  "AI-powered anomaly detection across all institutes",
                  "Tamper-proof geo-tagged evidence collection",
                  "Real-time CCTV monitoring with people counting",
                ].map((p, i) => (
                  <div key={i} className="about-point">
                    <span className="point-check">✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-visual">
              <div className="about-card">
                <img src="/drishti-logo.svg" alt="DRISHTI AI" className="about-logo" />
                <div className="about-card-title">Digital India Initiative</div>
                <div className="about-card-desc">Smart Governance for Social Justice</div>
                <div className="about-card-org">Ministry of Social Justice & Empowerment</div>
                <div className="about-card-problem">
                  Problem ID: 26095<br />
                  Theme: Smart Automation<br />
                  Category: Software
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-inner">
          <img src="/drishti-logo.svg" alt="" className="cta-logo" />
          <h2 className="cta-title">Ready to Transform Governance?</h2>
          <p className="cta-desc">
            Join DRISHTI AI and experience AI-powered monitoring for transparent, accountable governance.
          </p>
          <div className="cta-actions">
            <button className="btn-primary-lg" onClick={() => onNavigate("/login")}>
              Access Dashboard →
            </button>
            <button className="btn-outline-lg" onClick={() => onNavigate("/register")}>
              Register Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/drishti-logo.svg" alt="DRISHTI" className="footer-logo" />
            <div>
              <span className="footer-brand-name">DRISHTI AI</span>
              <span className="footer-brand-sub">Since 2026</span>
            </div>
          </div>
          <div className="footer-info">
            <p>© 2026 DRISHTI AI — Digital Real-time Intelligent Surveillance, Tracking & Inspection System</p>
            <p>Ministry of Social Justice & Empowerment • Government of India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
