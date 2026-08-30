import { useState } from "react";
import { register } from "../api";
import "./Login.css";

export default function Register({ onLogin, onNavigate }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "department_official",
    phone: "", state: "", district: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      onLogin({ id: data.id, name: data.name, email: data.email, role: data.role }, data.access_token);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <span className="login-logo-icon">👁</span>
          </div>
          <h1 className="login-title">DRISHTI AI</h1>
          <p className="login-subtitle">Create your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Register</h2>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={update("name")} placeholder="Enter full name" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update("email")} placeholder="Enter email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update("password")} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={update("role")}>
              <option value="department_official">Department Official</option>
              <option value="super_admin">Super Admin</option>
              <option value="state_authority">State Authority</option>
              <option value="district_authority">District Authority</option>
              <option value="inspector">Inspector</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={form.state} onChange={update("state")} placeholder="State" />
            </div>
            <div className="form-group">
              <label>District</label>
              <input type="text" value={form.district} onChange={update("district")} placeholder="District" />
            </div>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={update("phone")} placeholder="+91-XXXXXXXXXX" />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <div className="login-footer">
            <span>Already have an account? </span>
            <button type="button" className="link-btn" onClick={() => onNavigate("/login")}>
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
