import StatusPill from "../components/StatusPill";
import "./ListPage.css";

// TODO: replace with GET /vc-calls once the endpoint exists.
// Shape matches the `vc_calls` table in db/schema.sql.
const MOCK_CALLS = [
  { id: 1, institute: "Asha Rehabilitation Centre", target_role: "incharge", call_status: "completed", call_started_at: "2026-08-29 09:15", notes: "Incharge confirmed present, footage cross-checked." },
  { id: 2, institute: "Sunrise Old Age Home", target_role: "beneficiary", call_status: "missed", call_started_at: "2026-08-28 16:40", notes: "No answer after 3 attempts — flagged for follow-up." },
  { id: 3, institute: "Sanjeevani NGO Trust", target_role: "staff", call_status: "scheduled", call_started_at: "2026-08-31 10:00", notes: "" },
  { id: 4, institute: "Pragati Scholarship Cell", target_role: "beneficiary", call_status: "completed", call_started_at: "2026-08-27 14:05", notes: "Beneficiary confirmed scholarship disbursed on time." },
];

const STATUS_TONE = {
  scheduled: "neutral",
  ongoing: "amber",
  completed: "green",
  missed: "red",
};

const STATUS_LABEL = {
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  missed: "Missed",
};

const ROLE_LABEL = {
  incharge: "Project Incharge",
  staff: "Staff",
  beneficiary: "Beneficiary",
};

export default function VcCallLog() {
  return (
    <>
      <header className="page-header">
        <h2>VC call log</h2>
        <p>Random, unscheduled video calls placed to institute contacts for spot verification.</p>
      </header>

      {MOCK_CALLS.length === 0 ? (
        <div className="empty-state">No video calls logged yet.</div>
      ) : (
        MOCK_CALLS.map((call) => (
          <div className="list-row" key={call.id}>
            <div className="list-row__main">
              <h3>{call.institute}</h3>
              <p className="list-row__meta">
                Called: {ROLE_LABEL[call.target_role]} &middot; {call.call_started_at}
              </p>
              {call.notes && <p className="list-row__note">{call.notes}</p>}
            </div>
            <div className="list-row__side">
              <StatusPill tone={STATUS_TONE[call.call_status]}>{STATUS_LABEL[call.call_status]}</StatusPill>
            </div>
          </div>
        ))
      )}
    </>
  );
}
