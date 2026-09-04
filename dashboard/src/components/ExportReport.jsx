import { useState } from "react";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";

function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.json`; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportReport({ stats, institutes, inspections, alerts, complaints, activeNav }) {
  const [open, setOpen] = useState(false);

  function getData() {
    switch (activeNav) {
      case "overview": return { data: institutes, name: "overview-report" };
      case "institutes": return { data: institutes, name: "institutes-report" };
      case "inspections": return { data: inspections, name: "inspections-report" };
      case "alerts": return { data: alerts, name: "alerts-report" };
      case "complaints": return { data: complaints, name: "complaints-report" };
      default: return { data: institutes, name: "report" };
    }
  }

  function handleExport(format) {
    const { data, name } = getData();
    if (format === "csv") exportCSV(data, `drishti-${name}-${new Date().toISOString().slice(0, 10)}`);
    else exportJSON(data, `drishti-${name}-${new Date().toISOString().slice(0, 10)}`);
    setOpen(false);
  }

  return (
    <div className="export-wrapper" style={{ position: "relative" }}>
      <button className="btn-sm btn-outline" onClick={() => setOpen(!open)}>
        <Download size={13} /> Export
      </button>
      {open && (
        <div className="export-dropdown">
          <button onClick={() => handleExport("csv")}><FileSpreadsheet size={13} /> Download CSV</button>
          <button onClick={() => handleExport("json")}><FileJson size={13} /> Download JSON</button>
        </div>
      )}
    </div>
  );
}
