import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function RiskMapSection({ riskMap }) {
  return (
    <div className="card map-card">
      <div className="map-container">
        <MapContainer center={[22.5, 78.9]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {riskMap.map((inst) => {
            const color = inst.risk_level === "critical" ? "#991b1b" :
              inst.risk_level === "high" ? "#ef4444" :
              inst.risk_level === "medium" ? "#eab308" : "#22c55e";
            return (
              <CircleMarker
                key={inst.id}
                center={[inst.lat, inst.lng]}
                radius={8 + (inst.risk_score / 10)}
                fillColor={color}
                fillOpacity={0.8}
                color={color}
                weight={2}
              >
                <Popup>
                  <div style={{ color: "#1a1a1a", fontFamily: "Inter, sans-serif" }}>
                    <strong>{inst.name}</strong><br />
                    {inst.district} — {inst.type}<br />
                    Risk: {inst.risk_score}/100 ({inst.risk_level})<br />
                    Trust: {inst.trust_score}/100
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="map-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: "#22c55e" }} /> Low Risk</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: "#eab308" }} /> Medium Risk</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: "#ef4444" }} /> High Risk</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: "#991b1b" }} /> Critical</span>
      </div>
    </div>
  );
}
