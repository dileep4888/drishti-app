import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LiveInspections from "./pages/LiveInspections";
import VcCallLog from "./pages/VcCallLog";
import RiskFlags from "./pages/RiskFlags";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inspections" element={<LiveInspections />} />
          <Route path="vc-calls" element={<VcCallLog />} />
          <Route path="risk-flags" element={<RiskFlags />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
