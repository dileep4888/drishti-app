import axios from "axios";

// Reads from Vercel/Netlify environment variable in production (VITE_API_URL).
// Falls back to localhost for local development — so this file never needs
// manual editing when you move from local to deployed.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Attach the saved token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("drishti_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email, password) {
  // Backend's /auth/login expects OAuth2 form data, not JSON — it uses
  // "username" as the field name for email, per FastAPI's OAuth2PasswordRequestForm.
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

export async function fetchMe() {
  const res = await api.get("/dashboard/me");
  return res.data;
}

export async function register({ name, email, password, role, phone }) {
  // Backend's /auth/register expects JSON, unlike /auth/login (form data).
  const res = await api.post("/auth/register", { name, email, password, role, phone });
  return res.data;
}

export default api;
