import { useState, useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "./ThemeContext";
import { preloadDashboardData } from "./api";
import Landing from "./pages/Landing";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent-orange)", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
        <p>Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  const [user, setUser] = useState(null);
  const [preloadedData, setPreloadedData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("drishti_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const onHash = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem("drishti_token", token);
    localStorage.setItem("drishti_user", JSON.stringify(userData));
    setUser(userData);
    // Preload dashboard data while navigating
    preloadDashboardData()
      .then((data) => {
        setPreloadedData(data);
        navigate("/dashboard");
      })
      .catch(() => {
        navigate("/dashboard");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("drishti_token");
    localStorage.removeItem("drishti_user");
    setUser(null);
    setPreloadedData(null);
    navigate("/");
  };

  // Routes
  if (route === "/" || route === "") {
    return <Landing onNavigate={navigate} />;
  }
  if (route === "/login") {
    return <Suspense fallback={<Loader />}><Login onLogin={handleLogin} onNavigate={navigate} /></Suspense>;
  }
  if (route === "/register") {
    return <Suspense fallback={<Loader />}><Register onLogin={handleLogin} onNavigate={navigate} /></Suspense>;
  }

  // Protected: redirect to landing if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  return <Suspense fallback={<Loader />}><Dashboard user={user} onLogout={handleLogout} onNavigate={navigate} preloaded={preloadedData} /></Suspense>;
}

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
