import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/dashboard");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for stored auth
    const stored = localStorage.getItem("drishti_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }

    const onHash = () => setRoute(window.location.hash.slice(1) || "/dashboard");
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
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("drishti_token");
    localStorage.removeItem("drishti_user");
    setUser(null);
    navigate("/login");
  };

  // Route logic
  if (route === "/login") {
    return <Login onLogin={handleLogin} onNavigate={navigate} />;
  }
  if (route === "/register") {
    return <Register onLogin={handleLogin} onNavigate={navigate} />;
  }

  // Protected: redirect to login if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  return <Dashboard user={user} onLogout={handleLogout} onNavigate={navigate} />;
}

export default App;
