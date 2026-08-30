import StatusPill from "../components/StatusPill";
import "./ListPage.css";

// TODO: replace with GET /risk-flags once the endpoint exists.
// Shape matches the `risk_flags` table in db/schema.sql.
const MOCK_FLAGS = [
  { id: 1, institute: "Asha Rehabilitation Centre", flag_type: "attendance_mismatch", severity: "high", description: "Reported staff count doesn't match attendance logs for 3 consecutive weeks.", resolved: false },
  { id: 2, institute: "Sanjeevani NGO Trust", flag_type: "cctv_anomaly", severity: "medium", description: "Motion detected below expected activity threshold during working hours.", resolved: false },
  { id: 3, institute: "Sunrise Old Age Home", flag_type: "missed_vc", severity: "medium", description: "Beneficiary video call missed twice in the same week.", resolved: false },
  { id: 4, institute: "Divyang Skill Development Institute", flag_type: "report_similarity", severity: "low", description: "Inspection report wording closely matches previous month's submission.", resolved: true },
];

const SEVERITY_TONE = { low: "neutral", medium: "amber", high: "red" };
const SEVERITY_LABEL = { low: "Low", medium: "Medium", high: "High" };

const FLAG_LABEL = {
  attendance_mismatch: "Attendance mismatch",
  report_similarity: "Report similarity",
  cctv_anomaly: "CCTV anomaly",
  missed_vc: "Missed VC call",
};

export default function RiskFlags() {
  return (
    <>
      <header className="page-header">
        <h2>Risk flags</h2>
        <p>Anomalies raised automatically by the detection layer, pending official review.</p>
      </header>

      {MOCK_FLAGS.length === 0 ? (
        <div className="empty-state">No active risk flags.</div>
      ) : (
        MOCK_FLAGS.map((flag) => (
          <div className="list-row" key={flag.id}>
            <div className="list-row__main">
              <h3>{flag.institute}</h3>
              <p className="list-row__meta">{FLAG_LABEL[flag.flag_type]}</p>
              <p className="list-row__note">{flag.description}</p>
            </div>
            <div className="list-row__side">
              <StatusPill tone={SEVERITY_TONE[flag.severity]}>{SEVERITY_LABEL[flag.severity]} severity</StatusPill>
              <StatusPill tone={flag.resolved ? "green" : "neutral"}>
                {flag.resolved ? "Resolved" : "Open"}
              </StatusPill>
            </div>
          </div>
        ))
      )}
    </>
  );
}
