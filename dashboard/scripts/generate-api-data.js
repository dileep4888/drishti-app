#!/usr/bin/env node
/**
 * DRISHTI AI — Static API Data Generator
 * 
 * Generates JSON files for all GET endpoints at build time.
 * These get served by Vercel's CDN (< 100ms response).
 * Python API only handles auth + mutations (login, register, assign, resolve).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'api-data');

// Ensure output directory exists
fs.mkdirSync(outDir, { recursive: true });

// ── Seed data (mirrors Python seed.py exactly) ────────────────────────

const NOW = new Date().toISOString();
const DAYS_AGO = (d) => new Date(Date.now() - d * 86400000).toISOString();
const HOURS_AGO = (h) => new Date(Date.now() - h * 3600000).toISOString();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const institutes = [
  { id: 1, name: "Pratham Education Foundation", type: "NGO", scheme: "SAMAGRA SHIKSHA", state: "Rajasthan", district: "Jaipur", latitude: 26.9124, longitude: 75.7873, risk_score: 85, risk_level: "high", trust_score: 30, reported_beneficiaries: 120, reported_staff: 85, status: "active", contact_person: "Contact - Pratham Educati", contact_phone: "+91-8345612345" },
  { id: 2, name: "HelpAge India", type: "NGO", scheme: "NATIONAL SOCIAL ASSISTANCE", state: "Rajasthan", district: "Jaipur", latitude: 26.9258, longitude: 75.7897, risk_score: 42, risk_level: "medium", trust_score: 65, reported_beneficiaries: 90, reported_staff: 78, status: "active", contact_person: "Contact - HelpAge India", contact_phone: "+91-7654321098" },
  { id: 3, name: "CRY Child Rights", type: "NGO", scheme: "INTEGRATED CHILD DEVELOPMENT", state: "Delhi", district: "New Delhi", latitude: 28.6139, longitude: 77.2090, risk_score: 15, risk_level: "low", trust_score: 90, reported_beneficiaries: 200, reported_staff: 92, status: "active", contact_person: "Contact - CRY Child Righ", contact_phone: "+91-9012345678" },
  { id: 4, name: "Nalanda Learning Centre", type: "Education", scheme: "SAMAGRA SHIKSHA", state: "Rajasthan", district: "Jodhpur", latitude: 26.2389, longitude: 73.0243, risk_score: 72, risk_level: "high", trust_score: 45, reported_beneficiaries: 60, reported_staff: 68, status: "active", contact_person: "Contact - Nalanda Learnin", contact_phone: "+91-7890123456" },
  { id: 5, name: "Vidya Bharti Schools", type: "Education", scheme: "RUSA", state: "Bihar", district: "Patna", latitude: 25.6093, longitude: 85.1376, risk_score: 28, risk_level: "low", trust_score: 88, reported_beneficiaries: 150, reported_staff: 88, status: "active", contact_person: "Contact - Vidya Bharti Sc", contact_phone: "+91-8901234567" },
  { id: 6, name: "Kasturba Gandhi Balika", type: "Education", scheme: "SAMAGRA SHIKSHA", state: "Uttar Pradesh", district: "Lucknow", latitude: 26.8467, longitude: 80.9462, risk_score: 55, risk_level: "medium", trust_score: 70, reported_beneficiaries: 100, reported_staff: 75, status: "active", contact_person: "Contact - Kasturba Gandhi", contact_phone: "+91-8123456789" },
  { id: 7, name: "National Blindness Control", type: "Health", scheme: "NATIONAL HEALTH MISSION", state: "Rajasthan", district: "Udaipur", latitude: 24.5854, longitude: 73.7125, risk_score: 38, risk_level: "medium", trust_score: 75, reported_beneficiaries: 80, reported_staff: 82, status: "active", contact_person: "Contact - National Blindne", contact_phone: "+91-7234567890" },
  { id: 8, name: "Smile Foundation", type: "NGO", scheme: "NATIONAL SOCIAL ASSISTANCE", state: "Madhya Pradesh", district: "Bhopal", latitude: 23.2599, longitude: 77.4126, risk_score: 91, risk_level: "critical", trust_score: 20, reported_beneficiaries: 50, reported_staff: 55, status: "active", contact_person: "Contact - Smile Foundatio", contact_phone: "+91-8456789012" },
  { id: 9, name: "Pratham Health Initiative", type: "Health", scheme: "NATIONAL HEALTH MISSION", state: "Gujarat", district: "Ahmedabad", latitude: 23.0225, longitude: 72.5714, risk_score: 18, risk_level: "low", trust_score: 82, reported_beneficiaries: 110, reported_staff: 90, status: "active", contact_person: "Contact - Pratham Health I", contact_phone: "+91-9567890123" },
  { id: 10, name: "Jan Shikshan Sansthan", type: "Education", scheme: "SKILL INDIA", state: "Rajasthan", district: "Kota", latitude: 25.2138, longitude: 75.8648, risk_score: 62, risk_level: "high", trust_score: 55, reported_beneficiaries: 70, reported_staff: 65, status: "active", contact_person: "Contact - Jan Shikshan Sa", contact_phone: "+91-8678901234" },
];

// Generate CCTV devices
const locations = ["Main Gate", "Classroom A", "Classroom B", "Playground", "Staff Room", "Entrance Hall", "Office", "Corridor"];
const cctvDevices = [];
let cctvId = 1;
institutes.forEach(inst => {
  const count = rand(2, 5);
  for (let j = 0; j < count; j++) {
    const status = Math.random() < 0.8 ? "online" : "offline";
    cctvDevices.push({
      id: cctvId++,
      institute_id: inst.id,
      institute_name: inst.name,
      name: `CAM-${inst.id}-${String(j + 1).padStart(2, '0')} - ${pick(locations)}`,
      status,
      people_detected: status === "online" ? rand(0, 50) : 0,
      is_recording: status === "online",
      location: pick(locations),
      rtsp_url: `rtsp://192.168.${inst.id}.${j + 10}:554/stream${j + 1}`,
      last_online: status === "online" ? HOURS_AGO(rand(0, 48)) : null,
    });
  }
});

// Generate inspectors
const inspectorData = [
  { id: 1, name: "Rahul Verma", employee_id: "INS-201", state: "Rajasthan", district: "Jaipur", specialization: "Education", is_available: true, current_load: 2, total_inspections: 25 },
  { id: 2, name: "Suresh Kumar", employee_id: "INS-202", state: "Rajasthan", district: "Jodhpur", specialization: "Health", is_available: true, current_load: 1, total_inspections: 18 },
  { id: 3, name: "Meena Devi", employee_id: "INS-203", state: "Delhi", district: "New Delhi", specialization: "NGO Audit", is_available: true, current_load: 3, total_inspections: 30 },
  { id: 4, name: "Amit Singh", employee_id: "INS-204", state: "Bihar", district: "Patna", specialization: "Infrastructure", is_available: false, current_load: 4, total_inspections: 22 },
  { id: 5, name: "Neha Gupta", employee_id: "INS-205", state: "Uttar Pradesh", district: "Lucknow", specialization: "Education", is_available: true, current_load: 1, total_inspections: 15 },
  { id: 6, name: "Vikram Rathore", employee_id: "INS-206", state: "Madhya Pradesh", district: "Bhopal", specialization: "Health", is_available: true, current_load: 0, total_inspections: 12 },
  { id: 7, name: "Deepak Joshi", employee_id: "INS-207", state: "Gujarat", district: "Ahmedabad", specialization: "NGO Audit", is_available: true, current_load: 2, total_inspections: 20 },
  { id: 8, name: "Sunita Rani", employee_id: "INS-208", state: "Rajasthan", district: "Kota", specialization: "Education", is_available: false, current_load: 3, total_inspections: 28 },
];

// Generate inspections
const inspections = [];
let inspId = 1;
institutes.forEach(inst => {
  const count = rand(2, 5);
  for (let i = 0; i < count; i++) {
    const status = pick(["pending", "in_progress", "completed", "completed", "completed", "cancelled"]);
    const inspector = status !== "pending" ? pick(inspectorData) : null;
    inspections.push({
      id: inspId++,
      institute_id: inst.id,
      institute_name: inst.name,
      institute_district: inst.district,
      inspector_name: inspector ? inspector.name : "Unassigned",
      inspector_id: inspector ? inspector.employee_id : null,
      type: pick(["surprise", "surprise", "scheduled", "follow_up"]),
      status,
      gps_verified: Math.random() < 0.66,
      compliance_status: status === "completed" ? pick(["compliant", "non_compliant", "partial"]) : null,
      notes: `${status === "completed" ? "Routine" : "Scheduled"} inspection at ${inst.district}`,
      created_at: DAYS_AGO(rand(1, 60)),
      completed_date: status === "completed" ? DAYS_AGO(rand(0, 30)) : null,
    });
  }
});

// Generate alerts
const alertTemplates = [
  { type: "cctv_offline", severity: "warning", title: "CCTV Offline", message: "Camera feed interrupted for more than 4 hours" },
  { type: "attendance_mismatch", severity: "critical", title: "Attendance Discrepancy", message: "Reported attendance significantly differs from AI-detected count" },
  { type: "location_mismatch", severity: "critical", title: "Inspector Location Mismatch", message: "Inspector GPS does not match expected inspection location" },
  { type: "complaint_spike", severity: "warning", title: "Complaint Spike Detected", message: "Multiple complaints received from same institution in short period" },
  { type: "inspection_violation", severity: "critical", title: "Inspection Non-Compliance", message: "Institution failed compliance check during recent inspection" },
  { type: "high_risk", severity: "critical", title: "High Risk Institution", message: "Institution risk score has exceeded critical threshold" },
  { type: "cctv_offline", severity: "info", title: "CCTV Maintenance Due", message: "Scheduled maintenance window approaching for camera system" },
  { type: "attendance_mismatch", severity: "warning", title: "Low Attendance Detected", message: "AI camera count shows unusually low attendance" },
];
const alerts = [];
let alertId = 1;
institutes.forEach(inst => {
  const count = rand(1, 3);
  for (let i = 0; i < count; i++) {
    const tpl = pick(alertTemplates);
    alerts.push({
      id: alertId++,
      institute_id: inst.id,
      institute_name: inst.name,
      type: tpl.type,
      severity: tpl.severity,
      title: tpl.title,
      message: `${tpl.message} — ${inst.name}`,
      is_resolved: Math.random() < 0.5,
      created_at: HOURS_AGO(rand(1, 120)),
    });
  }
});

// Generate attendance records
const attendanceRecords = [];
let attId = 1;
institutes.forEach(inst => {
  for (let d = 0; d < 7; d++) {
    const reported = inst.reported_beneficiaries;
    const actual = Math.round(reported * (0.4 + Math.random() * 0.7));
    const disc = Math.abs(reported - actual) / Math.max(reported, 1) * 100;
    attendanceRecords.push({
      id: attId++,
      institute_id: inst.id,
      institute_name: inst.name,
      date: DAYS_AGO(d),
      reported_count: reported,
      ai_detected_count: actual,
      discrepancy_percentage: Math.round(disc * 10) / 10,
      cctv_source: `CAM-${inst.id}-01`,
      is_verified: disc < 10,
    });
  }
});

// Generate complaints
const complaintTemplates = [
  { category: "staff_absent", description: "Teachers are not coming regularly" },
  { category: "staff_absent", description: "Staff is usually absent on Mondays" },
  { category: "service_not_received", description: "Did not receive mid-day meal today" },
  { category: "fake_attendance", description: "Attendance register shows 100 but only 40 present" },
  { category: "infrastructure", description: "Classroom roof is leaking, no repair done" },
  { category: "misbehavior", description: "Staff misbehaved with parents" },
  { category: "other", description: "Government scheme benefits not reaching beneficiaries" },
];
const complaints = [];
let cmpId = 1;
institutes.forEach(inst => {
  const count = rand(0, 3);
  for (let i = 0; i < count; i++) {
    const tpl = pick(complaintTemplates);
    const anon = Math.random() < 0.5;
    complaints.push({
      id: cmpId++,
      institute_id: inst.id,
      institute_name: inst.name,
      beneficiary_name: anon ? "Anonymous" : `Beneficiary ${rand(1, 100)}`,
      category: tpl.category,
      description: tpl.description,
      status: pick(["pending", "investigating", "resolved"]),
      ai_category: null,
      is_anonymous: anon,
      created_at: DAYS_AGO(rand(1, 30)),
    });
  }
});

// Generate beneficiaries
const firstNames = ["Amit", "Priya", "Rahul", "Sunita", "Deepak", "Meena", "Vikram", "Neha", "Suresh", "Kavita"];
const lastNames = ["Kumar", "Devi", "Singh", "Rani", "Sharma", "Gupta", "Verma", "Joshi", "Patel", "Rao"];
const beneficiaries = [];
let benId = 1;
institutes.forEach(inst => {
  const count = rand(3, 6);
  for (let i = 0; i < count; i++) {
    beneficiaries.push({
      id: benId++,
      institute_id: inst.id,
      institute_name: inst.name,
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      service_received: Math.random() < 0.75,
      service_rating: rand(1, 5),
      feedback: pick([null, "Good service", "Needs improvement", "Satisfied", null]),
      attendance_confirmed: Math.random() < 0.66,
    });
  }
});

// Generate video calls
const videoCalls = [];
let vcId = 1;
institutes.forEach(inst => {
  const count = rand(1, 3);
  for (let i = 0; i < count; i++) {
    const status = pick(["completed", "completed", "completed", "missed", "scheduled"]);
    const started = new Date(Date.now() - rand(1, 15) * 86400000 - rand(0, 12) * 3600000);
    const duration = status === "completed" ? rand(60, 1800) : 0;
    const ended = status === "completed" ? new Date(started.getTime() + duration * 1000) : null;
    videoCalls.push({
      id: vcId++,
      institute_id: inst.id,
      institute_name: inst.name,
      initiated_by: "Dileep Bairwa",
      called_person: `${pick(firstNames)} ${pick(lastNames)}`,
      role: pick(["project_incharge", "staff", "beneficiary"]),
      status,
      scheduled_time: started.toISOString(),
      started_at: status !== "scheduled" ? started.toISOString() : null,
      ended_at: ended ? ended.toISOString() : null,
      duration_seconds: duration,
      location_verified: Math.random() < 0.5,
      notes: `${status === "completed" ? "Routine verification" : "Unanswered"} call`,
    });
  }
});

// ── Compute stats ────────────────────────────────────────────────────

const instCounts = {};
institutes.forEach(i => { instCounts[i.risk_level] = (instCounts[i.risk_level] || 0) + 1; });
const inspCounts = {};
inspections.forEach(i => { inspCounts[i.status] = (inspCounts[i.status] || 0) + 1; });
const cctvCounts = {};
cctvDevices.forEach(c => { cctvCounts[c.status] = (cctvCounts[c.status] || 0) + 1; });
const complaintCounts = {};
complaints.forEach(c => { complaintCounts[c.status] = (complaintCounts[c.status] || 0) + 1; });

const stats = {
  active_projects: institutes.length,
  total_institutes: institutes.length,
  live_cctv_cameras: cctvCounts.online || 0,
  total_cctv_cameras: cctvDevices.length,
  inspections_today: inspections.length,
  pending_inspections: inspCounts.pending || 0,
  completed_inspections: inspCounts.completed || 0,
  high_risk_locations: (instCounts.high || 0) + (instCounts.critical || 0),
  medium_risk_locations: instCounts.medium || 0,
  low_risk_locations: instCounts.low || 0,
  anomalies_detected: alerts.filter(a => !a.is_resolved).length,
  unresolved_alerts: alerts.filter(a => !a.is_resolved).length,
  total_complaints: complaints.length,
  pending_complaints: complaintCounts.pending || 0,
  total_beneficiaries: beneficiaries.length,
};

// ── Compute institute stats (cctv online/total, complaints, alerts) ──

const instStats = {};
institutes.forEach(inst => {
  const instCctv = cctvDevices.filter(c => c.institute_id === inst.id);
  const instAlerts = alerts.filter(a => a.institute_id === inst.id && !a.is_resolved);
  const instComplaints = complaints.filter(c => c.institute_id === inst.id);
  instStats[inst.id] = {
    cctv_online: instCctv.filter(c => c.status === "online").length,
    cctv_total: instCctv.length,
    complaint_count: instComplaints.length,
    active_alerts: instAlerts.length,
  };
});

const institutesWithStats = institutes.map(inst => ({
  ...inst,
  ...instStats[inst.id],
}));

// ── Compute analytics ────────────────────────────────────────────────

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const complaintCats = {};
complaints.forEach(c => { complaintCats[c.category] = (complaintCats[c.category] || 0) + 1; });
const alertTypes = {};
alerts.forEach(a => { alertTypes[a.type] = (alertTypes[a.type] || 0) + 1; });

const analytics = {
  risk_distribution: [
    { name: "Low Risk", value: instCounts.low || 0, color: "#22c55e" },
    { name: "Medium Risk", value: instCounts.medium || 0, color: "#eab308" },
    { name: "High Risk", value: instCounts.high || 0, color: "#ef4444" },
    { name: "Critical", value: instCounts.critical || 0, color: "#7c2d12" },
  ],
  inspection_status: [
    { name: "Pending", value: inspCounts.pending || 0 },
    { name: "In Progress", value: inspCounts.in_progress || 0 },
    { name: "Completed", value: inspCounts.completed || 0 },
    { name: "Cancelled", value: inspCounts.cancelled || 0 },
  ],
  complaint_categories: Object.entries(complaintCats).map(([name, value]) => ({ name, value })),
  alert_types: Object.entries(alertTypes).map(([name, value]) => ({ name, value })),
  inspection_trend: months.map(m => ({ month: m, inspections: rand(20, 80), complaints: rand(5, 25) })),
  attendance_comparison: attendanceRecords.slice(0, 10).map(ar => ({
    name: (institutes.find(i => i.id === ar.institute_id)?.name || "Unknown").slice(0, 15),
    reported: ar.reported_count,
    actual: ar.ai_detected_count,
  })),
  cctv_status: [
    { name: "Online", value: cctvCounts.online || 0, color: "#22c55e" },
    { name: "Offline", value: cctvCounts.offline || 0, color: "#ef4444" },
  ],
};

// ── Compute predictive inspections ───────────────────────────────────

const predictiveInspections = institutesWithStats
  .sort((a, b) => b.risk_score - a.risk_score)
  .slice(0, 5)
  .map(inst => {
    const reasons = [];
    if (inst.risk_score >= 61) reasons.push("High risk score");
    if (inst.cctv_total - inst.cctv_online > 0) reasons.push(`${inst.cctv_total - inst.cctv_online} CCTV cameras offline`);
    if (inst.complaint_count > 3) reasons.push(`${inst.complaint_count} complaints received`);
    const instAtt = attendanceRecords.filter(a => a.institute_id === inst.id);
    const latest = instAtt[0];
    if (latest && latest.discrepancy_percentage > 30) reasons.push(`Attendance discrepancy: ${Math.round(latest.discrepancy_percentage)}%`);
    return {
      institute_id: inst.id,
      institute_name: inst.name,
      risk_score: inst.risk_score,
      risk_level: inst.risk_level,
      trust_score: inst.trust_score,
      priority: inst.risk_score >= 61 ? "HIGH" : inst.risk_score >= 31 ? "MEDIUM" : "LOW",
      reasons: reasons.length > 0 ? reasons : ["Scheduled periodic inspection"],
    };
  });

// ── Write JSON files ─────────────────────────────────────────────────

function writeJSON(name, data) {
  const filePath = path.join(outDir, name);
  fs.writeFileSync(filePath, JSON.stringify(data));
  const size = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`  ✅ ${name} (${size} KB)`);
}

console.log('🏗️  Generating static API data...\n');

writeJSON('stats.json', stats);
writeJSON('institutes.json', institutesWithStats);
writeJSON('inspections.json', inspections);
writeJSON('alerts.json', alerts);
writeJSON('cctv.json', cctvDevices);
writeJSON('complaints.json', complaints);
writeJSON('analytics.json', analytics);
writeJSON('risk-map.json', institutes.filter(i => i.latitude && i.longitude).map(i => ({
  id: i.id, name: i.name, type: i.type, lat: i.latitude, lng: i.longitude,
  risk_score: i.risk_score, risk_level: i.risk_level, trust_score: i.trust_score, district: i.district,
})));
writeJSON('video-calls.json', videoCalls);
writeJSON('beneficiaries.json', beneficiaries);
writeJSON('predictive-inspections.json', predictiveInspections);

console.log(`\n🎉 Generated ${11} JSON files in public/api-data/`);
console.log(`   Total size: ${(fs.readdirSync(outDir).reduce((sum, f) => sum + fs.statSync(path.join(outDir, f)).size, 0) / 1024).toFixed(1)} KB`);
