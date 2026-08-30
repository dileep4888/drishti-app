import StatusPill from "../components/StatusPill";
import "./ListPage.css";

// TODO: replace with GET /inspections once the endpoint exists.
// Shape matches the `inspections` table in db/schema.sql.
const MOCK_INSPECTIONS = [
  { id: 1, institute: "Asha Rehabilitation Centre", inspector: "R. Meena", assignment_type: "triggered_by_flag", status: "in_progress", gps_verified: true, assigned_at: "2026-08-29 09:10" },
  { id: 2, institute: "Sunrise Old Age Home", inspector: "P. Sharma", assignment_type: "random", status: "assigned", gps_verified: false, assigned_at: "2026-08-30 07:45" },
  { id: 3, institute: "Divyang Skill Development Institute", inspector: "A. Khan", assignment_type: "random", status: "submitted", gps_verified: true, assigned_at: "2026-08-25 11:00" },
  { id: 4, institute: "Sanjeevani NGO Trust", inspector: "R. Meena", assignment_type: "manual", status: "reviewed", gps_verified: true, assigned_at: "2026-07-30 10:20" },
];

const STATUS_TONE = {
  assigned: "neutral",
  in_progress: "amber",
  submitted: "green",
  reviewed: "green",
};

const STATUS_LABEL = {
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

const ASSIGNMENT_LABEL = {
  random: "Random",
  manual: "Manual",
  triggered_by_flag: "Risk-triggered",
};

export default function LiveInspections() {
  return (
    <>
      <header className="page-header">
        <h2>Live inspections</h2>
        <p>Inspections currently assigned or in progress across all inspectors.</p>
      </header>

      {MOCK_INSPECTIONS.length === 0 ? (
        <div className="empty-state">No inspections assigned right now.</div>
      ) : (
        MOCK_INSPECTIONS.map((insp) => (
          <div className="list-row" key={insp.id}>
            <div className="list-row__main">
              <h3>{insp.institute}</h3>
              <p className="list-row__meta">
                Inspector: {insp.inspector} &middot; Assigned {insp.assigned_at}
              </p>
              {!insp.gps_verified && insp.status !== "assigned" && (
                <p className="list-row__note">GPS location not yet verified for this visit.</p>
              )}
            </div>
            <div className="list-row__side">
              <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
              <StatusPill tone="neutral">{ASSIGNMENT_LABEL[insp.assignment_type]}</StatusPill>
            </div>
          </div>
        ))
      )}
    </>
  );
}
