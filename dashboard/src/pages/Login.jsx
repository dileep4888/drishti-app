import { useState } from "react";
import { login } from "../api";
import { useTheme } from "../ThemeContext";
import {
  ShieldCheck, Camera, MapPin, Search,
  ArrowLeft, Sun, Moon, AlertTriangle, Loader2
} from "lucide-react";
import "./Login.css";

export default function Login({ onLogin, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin({ id: data.id, name: data.name, email: data.email, role: data.role }, data.access_token);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Left: Brand */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <img src="/drishti-logo.svg" alt="DRISHTI" className="auth-logo" />
            <h1>DRISHTI</h1>
            <p>Smart Real-Time Monitoring<br />&amp; Inspection App</p>
            <div className="auth-brand-features">
              <div className="auth-feature"><ShieldCheck size={14} /> AI-Powered Surveillance</div>
              <div className="auth-feature"><Camera size={14} /> Live CCTV Analytics</div>
              <div className="auth-feature"><MapPin size={14} /> Geo-tagged Evidence</div>
              <div className="auth-feature"><Search size={14} /> Surprise Inspections</div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-form-top">
              <button className="link-btn" onClick={() => onNavigate("/")}>
                <ArrowLeft size={14} /> Home
              </button>
              <button className="link-btn" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your DRISHTI AI dashboard</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="official@gov.in"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spinner-icon" /> Signing in...</> : "Sign In"}
              </button>
            </form>

            <div className="auth-form-footer">
              <p>Don't have an account? <button onClick={() => onNavigate("/register")}>Register</button></p>
            </div>

            <div className="auth-demo">
              <div className="auth-demo-label">Demo Credentials</div>
              <div className="auth-demo-creds">
                <strong>Email:</strong> dileepbairwa48@gmail.com<br />
                <strong>Password:</strong> highxgamer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
