"""Firestore document helpers and validation for DRISHTI AI.

Firestore collections:
- users: Auth & profile
- institutes: NGOs, Education, Health centers
- cctv_devices: CCTV cameras linked to institutes
- inspectors: Available inspectors
- inspections: Scheduled/surprise inspections
- evidence: Photos, videos, docs from inspections
- attendance_records: AI vs reported attendance
- alerts: System-generated alerts
- complaints: Beneficiary complaints
- beneficiaries: Beneficiary records
- video_calls: VC monitoring log
- risk_scores: Calculated risk breakdowns
"""
from datetime import datetime, timezone


# ── Collection names ────────────────────────────────────────────────────

COLLECTIONS = {
    "users": "users",
    "institutes": "institutes",
    "cctv_devices": "cctv_devices",
    "inspectors": "inspectors",
    "inspections": "inspections",
    "evidence": "evidence",
    "attendance_records": "attendance_records",
    "alerts": "alerts",
    "complaints": "complaints",
    "beneficiaries": "beneficiaries",
    "video_calls": "video_calls",
    "risk_scores": "risk_scores",
}


# ── Helper: convert Firestore timestamps to ISO strings ────────────────

def serialize_doc(doc_dict):
    """Convert Firestore Timestamp objects to ISO strings for JSON."""
    if doc_dict is None:
        return None
    result = {}
    for k, v in doc_dict.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
        elif hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result


def now_utc():
    return datetime.now(timezone.utc)
