import { useTheme } from "../ThemeContext";
import "./Landing.css";

export default function Landing({ onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="landing-brand-icon">👁</span>
            <span className="landing-brand-text">DRISHTI AI</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#about">About</a>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="nav-cta" onClick={() => onNavigate("/login")}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-glow" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Government of India — Smart Automation
          </div>
          <h1 className="hero-title">
            <span className="hero-title-line">Digital Real-time</span>
            <span className="hero-title-line accent">Intelligent Surveillance,</span>
            <span className="hero-title-line">Tracking & Inspection</span>
          </h1>
          <p className="hero-desc">
            DRISHTI AI is a centralized monitoring platform for the Ministry of Social Justice &
            Empowerment. Powered by AI analytics, live CCTV intelligence, and automated inspection
            assignment to ensure transparent, evidence-driven governance.
          </p>
          <div className="hero-actions">
            <button className="btn-primary-lg" onClick={() => onNavigate("/login")}>
              Access Dashboard →
            </button>
            <button className="btn-outline-lg" onClick={() => onNavigate("/register")}>
              Create Account
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">10+</span>
              <span className="hero-stat-lbl">Institutes Monitored</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">30+</span>
              <span className="hero-stat-lbl">CCTV Cameras</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">7</span>
              <span className="hero-stat-lbl">States Covered</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">24/7</span>
              <span className="hero-stat-lbl">Real-time Monitoring</span>
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
                <div className="about-point">
                  <span className="point-check">✓</span>
                  <span>Eliminate fake attendance and proxy staff reports</span>
                </div>
                <div className="about-point">
                  <span className="point-check">✓</span>
                  <span>Automate inspector assignment with conflict avoidance</span>
                </div>
                <div className="about-point">
                  <span className="point-check">✓</span>
                  <span>AI-powered anomaly detection across all institutes</span>
                </div>
                <div className="about-point">
                  <span className="point-check">✓</span>
                  <span>Tamper-proof geo-tagged evidence collection</span>
                </div>
                <div className="about-point">
                  <span className="point-check">✓</span>
                  <span>Real-time CCTV monitoring with people counting</span>
                </div>
              </div>
            </div>
            <div className="about-visual">
              <div className="about-card">
                <div className="about-card-icon">🇮🇳</div>
                <div className="about-card-title">Digital India Initiative</div>
                <div className="about-card-desc">Smart Governance for Social Justice</div>
                <div className="about-card-org">Ministry of Social Justice & Empowerment</div>
                <div className="about-card-problem">
                  Problem ID: 26095
                  <br />
                  Theme: Smart Automation
                  <br />
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
            <span className="landing-brand-icon">👁</span>
            <span>DRISHTI AI</span>
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
