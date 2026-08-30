import "./StatusPill.css";

// Accessibility note: meaning is carried by the text label, not just color —
// so this reads correctly even without color vision.
export default function StatusPill({ tone = "neutral", children }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}
