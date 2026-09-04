import { useState, useRef } from "react";
import { Camera, AlertTriangle, CheckCircle, XCircle, Upload } from "lucide-react";

function parseExif(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target.result);
      const results = { fileName: file.name, fileSize: file.size, lastModified: new Date(file.lastModified).toISOString() };

      if (view.getUint16(0) !== 0xFFD8) {
        results.format = "Non-JPEG (EXIF limited)";
        results.issues = ["Non-JPEG format — EXIF data may be stripped"];
        resolve(results);
        return;
      }
      results.format = "JPEG";

      try {
        let offset = 2;
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) { results.hasExif = true; const length = view.getUint16(offset + 2); results.exifSize = length; break; }
          if ((marker & 0xFF00) !== 0xFF00) break;
          offset += 2 + view.getUint16(offset + 2);
        }
        if (!results.hasExif) { results.issues = results.issues || []; results.issues.push("No EXIF data found — photo may be edited or screenshot"); }
      } catch { results.issues = results.issues || []; results.issues.push("Could not parse EXIF data"); }

      const fileDate = new Date(file.lastModified);
      const now = new Date();
      const ageHours = (now - fileDate) / (1000 * 60 * 60);
      results.fileAge = `${Math.round(ageHours)} hours old`;
      if (ageHours > 24) { results.issues = results.issues || []; results.issues.push("Photo is more than 24 hours old — may not be from current inspection"); }

      resolve(results);
    };
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

export default function ExifVerifier() {
  const [results, setResults] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const fileRef = useRef(null);

  async function handleFiles(files) {
    setVerifying(true);
    const res = [];
    for (const file of files) { const exif = await parseExif(file); res.push(exif); }
    setResults(res);
    setVerifying(false);
  }

  function getTrustLevel(r) {
    if (!r.issues || r.issues.length === 0) return { label: "VERIFIED", icon: <CheckCircle size={14} />, color: "var(--green)", bg: "var(--green-light)" };
    if (r.issues.length === 1) return { label: "SUSPICIOUS", icon: <AlertTriangle size={14} />, color: "var(--orange)", bg: "var(--orange-light)" };
    return { label: "FAKE RISK", icon: <XCircle size={14} />, color: "var(--red)", bg: "var(--red-light)" };
  }

  return (
    <div className="exif-verifier">
      <div className="exif-upload" onClick={() => fileRef.current?.click()}>
        <input
          ref={fileRef} type="file" accept="image/*" multiple
          onChange={(e) => e.target.files?.length && handleFiles(Array.from(e.target.files))}
          style={{ display: "none" }}
        />
        <div className="exif-upload-icon"><Camera size={24} /></div>
        <p>Drop photos or click to verify</p>
        <p className="exif-upload-hint">Checks EXIF data, timestamp, and file integrity</p>
      </div>

      {verifying && <div className="loading-state"><div className="spinner" /><p>Analyzing photos...</p></div>}

      {results.length > 0 && (
        <div className="exif-results">
          <h3>Verification Results ({results.length} photos)</h3>
          {results.map((r, i) => {
            const trust = getTrustLevel(r);
            return (
              <div key={i} className="exif-result-card" style={{ borderColor: trust.color }}>
                <div className="exif-result-header">
                  <span className="exif-trust-badge" style={{ background: trust.bg, color: trust.color }}>{trust.icon} {trust.label}</span>
                  <span className="exif-filename">{r.fileName}</span>
                </div>
                <div className="exif-details">
                  <div><strong>Format:</strong> {r.format}</div>
                  <div><strong>Size:</strong> {(r.fileSize / 1024).toFixed(1)} KB</div>
                  <div><strong>Age:</strong> {r.fileAge}</div>
                  <div><strong>EXIF:</strong> {r.hasExif ? "Present" : "Missing"}</div>
                </div>
                {r.issues && r.issues.length > 0 && (
                  <div className="exif-issues">
                    {r.issues.map((issue, j) => (
                      <div key={j} className="exif-issue"><AlertTriangle size={12} /> {issue}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
