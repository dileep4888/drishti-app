import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function AnalyticsSection({ analytics }) {
  if (!analytics) return null;

  return (
    <div className="analytics-grid">
      <div className="card chart-card">
        <h3 className="card-title">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={analytics.risk_distribution} cx="50%" cy="50%"
              innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
              {analytics.risk_distribution.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3 className="card-title">Inspection Status</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analytics.inspection_status}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
            <Bar dataKey="value" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3 className="card-title">Attendance: Reported vs AI Detected</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analytics.attendance_comparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
            <Legend />
            <Bar dataKey="reported" name="Reported" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="AI Detected" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3 className="card-title">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={analytics.inspection_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
            <Legend />
            <Line type="monotone" dataKey="inspections" stroke="var(--accent-blue)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="complaints" stroke="var(--accent-red)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3 className="card-title">Complaint Categories</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analytics.complaint_categories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--text-muted)" />
            <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={120} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
            <Bar dataKey="value" fill="var(--accent-orange)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3 className="card-title">CCTV Status</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={analytics.cctv_status} cx="50%" cy="50%"
              innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
              {analytics.cctv_status.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
