import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import "./Login.css"; // reuses the same card/form styling as Login

const ROLES = [
  { value: "department_official", label: "Department Official" },
  { value: "pmu_admin", label: "PMU Admin" },
  { value: "inspector", label: "Inspector" },
  { value: "ngo_incharge", label: "NGO Incharge" },
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("department_official");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register({ name, email, password, role });
      localStorage.setItem("drishti_token", data.access_token);
      localStorage.setItem("drishti_role", data.role);
      localStorage.setItem("drishti_name", data.name);
      // Only department_official / pmu_admin can actually view the dashboard
      // (backend enforces this) — inspectors/NGO users land on the same
      // dashboard route but will see a 403 if they try protected views.
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not create account. Try a different email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">DoSJE · Inspection Command</p>
        <h1 className="login-title">Create account</h1>
        <p className="login-subtitle">Register to access DRISHTI</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
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
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="login-label">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="login-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
