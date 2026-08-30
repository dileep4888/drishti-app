import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Layout.css";

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("drishti_token")) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
