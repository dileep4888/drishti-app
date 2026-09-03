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
    <div className="auth-page">
      {/* Government Top Bar */}
      <div className="govt-topbar">
        Government of India
        <button className="topbar-theme" onClick={toggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Government Header */}
      <header className="govt-header">
        <div className="govt-emblem">
          <img src="/drishti-logo.svg" alt="DRISHTI" />
        </div>
        <div className="govt-header-text">
          <h1>DRISHTI AI</h1>
          <p>Ministry of Social Justice & Empowerment</p>
        </div>
      </header>

      {/* Auth Content */}
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Citizen Login</h2>
            <p>Sign in to access the DRISHTI AI monitoring dashboard</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">⚠</span>
                {error}
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
              {loading ? (
                <>
                  <span className="spinner" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <p>
              Don't have an account?{" "}
              <button onClick={() => onNavigate("/register")}>Register here</button>
            </p>
          </div>
        </div>

        <div className="auth-demo">
          <div className="auth-demo-label">Demo Credentials</div>
          <div className="auth-demo-creds">
            <strong>Email:</strong> dileepbairwa48@gmail.com
            <br />
            <strong>Password:</strong> highxgamer
          </div>
        </div>

        <div className="auth-back">
          <button onClick={() => onNavigate("/")}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}
