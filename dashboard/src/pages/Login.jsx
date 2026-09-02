import { useState } from "react";
import { login } from "../api";
import { useTheme } from "../ThemeContext";
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
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />
      <div className="login-container">
        <div className="login-top-bar">
          <button className="link-btn" onClick={() => onNavigate("/")}>← Home</button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="login-brand">
          <div className="login-logo">
            <img src="/drishti-logo.svg" alt="DRISHTI" />
          </div>
          <h1 className="login-title">DRISHTI AI</h1>
          <p className="login-subtitle">
            Surveillance, Tracking & Inspection System
          </p>
          <p className="login-org">Ministry of Social Justice & Empowerment</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Sign In to Dashboard</h2>
          {error && <div className="login-error">{error}</div>}
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
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">Signing in...</span>
            ) : (
              <>Sign In →</>
            )}
          </button>
          <div className="login-footer">
            <span>Don't have an account? </span>
            <button type="button" className="link-btn" onClick={() => onNavigate("/register")}>
              Register
            </button>
          </div>
        </form>

        <div className="login-demo">
          <p className="demo-label">Demo Credentials</p>
          <p className="demo-creds">dileepbairwa48@gmail.com / highxgamer</p>
        </div>
      </div>
    </div>
  );
}
