import "./RiskStamp.css";

// The signature element of the dashboard: institute risk shown as a rotated
// wax-stamp badge rather than a generic colored pill. Ties back to the
// "inspection ledger" concept — every institute gets visually "stamped"
// with its current status.
export default function RiskStamp({ score }) {
  let tier = "clear";
  let label = "CLEAR";
  if (score >= 70) {
    tier = "high";
    label = "FLAGGED";
  } else if (score >= 35) {
    tier = "watch";
    label = "WATCH";
  }

  return (
    <div className={`risk-stamp risk-stamp--${tier}`} title={`Risk score: ${score}`}>
      <span className="risk-stamp__label">{label}</span>
      <span className="risk-stamp__score">{score}</span>
    </div>
  );
}
