import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("drishti_token", data.access_token);
      localStorage.setItem("drishti_role", data.role);
      localStorage.setItem("drishti_name", data.name);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not sign in. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">DoSJE · Inspection Command</p>
        <h1 className="login-title">DRISHTI</h1>
        <p className="login-subtitle">Sign in to view live institute status</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
