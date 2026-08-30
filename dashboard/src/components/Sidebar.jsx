import { useNavigate, NavLink } from "react-router-dom";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Institute register", end: true },
  { to: "/dashboard/inspections", label: "Live inspections" },
  { to: "/dashboard/vc-calls", label: "VC call log" },
  { to: "/dashboard/risk-flags", label: "Risk flags" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const name = localStorage.getItem("drishti_name") || "";
  const role = localStorage.getItem("drishti_role") || "";

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <p className="sidebar-eyebrow">DoSJE</p>
        <h1 className="sidebar-title">DRISHTI</h1>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              "sidebar-nav__item" + (isActive ? " sidebar-nav__item--active" : "")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p className="sidebar-user">{name}</p>
        <p className="sidebar-role">{role?.replace("_", " ")}</p>
        <button className="sidebar-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
