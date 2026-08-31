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
      <div className="login-container">
        <div className="login-top-bar">
          <button className="link-btn" onClick={() => onNavigate("/")}>← Home</button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="login-brand">
          <div className="login-logo">
            <span className="login-logo-icon">👁</span>
          </div>
          <h1 className="login-title">DRISHTI AI</h1>
          <p className="login-subtitle">
            Digital Real-time Intelligent Surveillance, Tracking & Inspection System
          </p>
          <p className="login-org">Ministry of Social Justice & Empowerment</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Sign In</h2>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="login-footer">
            <span>Don't have an account? </span>
            <button type="button" className="link-btn" onClick={() => onNavigate("/register")}>
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
