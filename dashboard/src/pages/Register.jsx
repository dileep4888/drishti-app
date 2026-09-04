import { useState } from "react";
import { register } from "../api";
import { useTheme } from "../ThemeContext";
import {
  ShieldCheck, Camera, MapPin, Search,
  ArrowLeft, Sun, Moon, AlertTriangle, Loader2
} from "lucide-react";
import "./Login.css";

export default function Register({ onLogin, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
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
              <h2>Create Account</h2>
              <p>Register as a DRISHTI AI official</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={form.name} onChange={update("name")} placeholder="Enter full name" required />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={update("email")} placeholder="official@gov.in" required />
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

              <div className="auth-form-row">
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

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spinner-icon" /> Creating account...</> : "Create Account"}
              </button>
            </form>

            <div className="auth-form-footer">
              <p>Already have an account? <button onClick={() => onNavigate("/login")}>Sign In</button></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
