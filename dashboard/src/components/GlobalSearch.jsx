import { useState, useEffect, useRef } from "react";
import { Building2, ClipboardCheck, AlertTriangle, FileText, Search, X } from "lucide-react";

const ICONS = {
  institute: <Building2 size={14} />,
  inspection: <ClipboardCheck size={14} />,
  alert: <AlertTriangle size={14} />,
  complaint: <FileText size={14} />,
};

export default function GlobalSearch({ institutes, inspections, alerts, complaints, onNavigate, onSelectInstitute }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const found = [];

    institutes.forEach((i) => {
      if (i.name?.toLowerCase().includes(q) || i.district?.toLowerCase().includes(q) || i.state?.toLowerCase().includes(q)) {
        found.push({ type: "institute", label: i.name, sub: `${i.district}, ${i.state} — Risk: ${i.risk_score}`, id: i.id });
      }
    });
    inspections.forEach((i) => {
      if (i.institute_name?.toLowerCase().includes(q) || i.inspector_name?.toLowerCase().includes(q)) {
        found.push({ type: "inspection", label: `INS-${i.id} — ${i.institute_name}`, sub: `${i.status} • ${i.type}`, id: i.id });
      }
    });
    alerts.forEach((a) => {
      if (a.title?.toLowerCase().includes(q) || a.institute_name?.toLowerCase().includes(q)) {
        found.push({ type: "alert", label: a.title, sub: `${a.institute_name} — ${a.severity}`, id: a.id });
      }
    });
    complaints.forEach((c) => {
      if (c.description?.toLowerCase().includes(q) || c.institute_name?.toLowerCase().includes(q)) {
        found.push({ type: "complaint", label: c.description?.slice(0, 60), sub: `${c.institute_name} — ${c.category}`, id: c.id });
      }
    });

    setResults(found.slice(0, 8));
  }, [query, institutes, inspections, alerts, complaints]);

  const navMap = { institute: "institutes", inspection: "inspections", alert: "alerts", complaint: "complaints" };

  return (
    <div className="global-search" ref={ref}>
      <div className="search-input-wrap">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search institutes, inspections, alerts..."
          className="search-input"
        />
        {query && <button className="search-clear" onClick={() => { setQuery(""); setResults([]); }}><X size={12} /></button>}
      </div>
      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((r, i) => (
            <button
              key={i}
              className="search-result"
              onClick={() => {
                if (r.type === "institute") onSelectInstitute(r.id);
                else onNavigate(navMap[r.type] || "overview");
                setOpen(false); setQuery("");
              }}
            >
              <span className="search-result-icon">{ICONS[r.type]}</span>
              <div>
                <div className="search-result-label">{r.label}</div>
                <div className="search-result-sub">{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query && results.length === 0 && (
        <div className="search-dropdown">
          <div className="search-empty">No results found for "{query}"</div>
        </div>
      )}
    </div>
  );
}
