"""Dashboard API routes — all backed by Firestore."""
import json
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException

from ..database import get_firestore
from ..models import COLLECTIONS, serialize_doc, now_utc
from ..security import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard API"])


# ── Helpers ─────────────────────────────────────────────────────────────

def _col(db, name):
    return db.collection(name)


def _get_all(db, collection_name, filters=None):
    """Fetch all docs from a collection, optionally applying Firestore where clauses."""
    ref = _col(db, collection_name)
    query = ref
    if filters:
        for field, op, value in filters:
            query = query.where(field, op, value)
    return [serialize_doc({**doc.to_dict(), "id": doc.id}) for doc in query.stream()]


def _get_doc(db, collection_name, doc_id):
    doc = _col(db, collection_name).document(doc_id).get()
    if not doc.exists:
        return None
    return serialize_doc({**doc.to_dict(), "id": doc.id})


def _count_docs(db, collection_name, filters=None):
    return len(_get_all(db, collection_name, filters))


# ── Dashboard Stats ────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db=Depends(get_firestore), user=Depends(get_current_user)):
    institutes = _get_all(db, "institutes")
    cctv_devices = _get_all(db, "cctv_devices")
    inspections = _get_all(db, "inspections")
    alerts = _get_all(db, "alerts")
    complaints = _get_all(db, "complaints")
    beneficiaries = _get_all(db, "beneficiaries")

    cctv_online = sum(1 for c in cctv_devices if c.get("status") == "online")
    pending_inspections = sum(1 for i in inspections if i.get("status") == "pending")
    completed_inspections = sum(1 for i in inspections if i.get("status") == "completed")
    high_risk = sum(1 for i in institutes if (i.get("risk_score") or 0) >= 61)
    medium_risk = sum(1 for i in institutes if 31 <= (i.get("risk_score") or 0) <= 60)
    low_risk = sum(1 for i in institutes if (i.get("risk_score") or 0) <= 30)
    unresolved_alerts = sum(1 for a in alerts if not a.get("is_resolved"))
    pending_complaints = sum(1 for c in complaints if c.get("status") == "pending")

    return {
        "active_projects": len(institutes),
        "total_institutes": len(institutes),
        "live_cctv_cameras": cctv_online,
        "total_cctv_cameras": len(cctv_devices),
        "inspections_today": len(inspections),
        "pending_inspections": pending_inspections,
        "completed_inspections": completed_inspections,
        "high_risk_locations": high_risk,
        "medium_risk_locations": medium_risk,
        "low_risk_locations": low_risk,
        "anomalies_detected": unresolved_alerts,
        "unresolved_alerts": unresolved_alerts,
        "total_complaints": len(complaints),
        "pending_complaints": pending_complaints,
        "total_beneficiaries": len(beneficiaries),
    }


# ── Institutes ─────────────────────────────────────────────────────────

@router.get("/institutes")
def get_institutes(
    risk_level: str | None = None,
    state: str | None = None,
    type: str | None = None,
    user=Depends(get_current_user),
):
    db = get_firestore()
    filters = []
    if risk_level:
        filters.append(("risk_level", "==", risk_level))
    if state:
        filters.append(("state", "==", state))
    if type:
        filters.append(("type", "==", type))

    institutes = _get_all(db, "institutes", filters if filters else None)
    # Sort by risk_score desc
    institutes.sort(key=lambda x: x.get("risk_score", 0), reverse=True)

    # Enrich with counts
    cctv_devices = _get_all(db, "cctv_devices")
    complaints = _get_all(db, "complaints")
    alerts = _get_all(db, "alerts")

    cctv_by_institute = {}
    for c in cctv_devices:
        iid = c.get("institute_id")
        if iid not in cctv_by_institute:
            cctv_by_institute[iid] = {"online": 0, "total": 0}
        cctv_by_institute[iid]["total"] += 1
        if c.get("status") == "online":
            cctv_by_institute[iid]["online"] += 1

    complaint_counts = {}
    for c in complaints:
        iid = c.get("institute_id")
        complaint_counts[iid] = complaint_counts.get(iid, 0) + 1

    alert_counts = {}
    for a in alerts:
        if not a.get("is_resolved"):
            iid = a.get("institute_id")
            alert_counts[iid] = alert_counts.get(iid, 0) + 1

    results = []
    for inst in institutes:
        iid = inst["id"]
        cctv_info = cctv_by_institute.get(iid, {"online": 0, "total": 0})
        results.append({
            **inst,
            "cctv_online": cctv_info["online"],
            "cctv_total": cctv_info["total"],
            "complaint_count": complaint_counts.get(iid, 0),
            "active_alerts": alert_counts.get(iid, 0),
        })

    return results


@router.get("/institutes/{institute_id}")
def get_institute_detail(institute_id: str, user=Depends(get_current_user)):
    db = get_firestore()
    inst = _get_doc(db, "institutes", institute_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")

    # Get related data
    cctv_devices = [c for c in _get_all(db, "cctv_devices") if c.get("institute_id") == institute_id]
    inspections = [i for i in _get_all(db, "inspections") if i.get("institute_id") == institute_id]
    complaints = [c for c in _get_all(db, "complaints") if c.get("institute_id") == institute_id]
    alerts = [a for a in _get_all(db, "alerts") if a.get("institute_id") == institute_id]
    attendance = [a for a in _get_all(db, "attendance_records") if a.get("institute_id") == institute_id]
    beneficiaries = [b for b in _get_all(db, "beneficiaries") if b.get("institute_id") == institute_id]

    inst["cctv_devices"] = cctv_devices[:10]
    inst["inspections"] = inspections[:10]
    inst["complaints"] = complaints[:10]
    inst["alerts"] = alerts[:10]
    inst["attendance_records"] = attendance[:10]
    inst["beneficiaries"] = beneficiaries[:10]
    inst["cctv_online"] = sum(1 for c in cctv_devices if c.get("status") == "online")
    inst["cctv_total"] = len(cctv_devices)
    inst["complaint_count"] = len(complaints)
    inst["active_alerts"] = sum(1 for a in alerts if not a.get("is_resolved"))

    return inst


# ── Inspections ────────────────────────────────────────────────────────

@router.get("/inspections")
def get_inspections(
    status: str | None = None,
    type: str | None = None,
    user=Depends(get_current_user),
):
    db = get_firestore()
    filters = []
    if status:
        filters.append(("status", "==", status))
    if type:
        filters.append(("type", "==", type))

    inspections = _get_all(db, "inspections", filters if filters else None)

    # Get institute and inspector names
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}
    inspectors = {i["id"]: i for i in _get_all(db, "inspectors")}

    results = []
    for insp in inspections:
        inst = institutes.get(insp.get("institute_id"), {})
        inspector = inspectors.get(insp.get("inspector_id"), {})
        results.append({
            **insp,
            "institute_name": inst.get("name", "Unknown"),
            "institute_district": inst.get("district", ""),
            "inspector_name": inspector.get("name", "Unassigned"),
            "inspector_id": inspector.get("employee_id"),
        })

    return results


@router.post("/inspections/{inspection_id}/assign-random")
def assign_random_inspector(inspection_id: str, user=Depends(get_current_user)):
    db = get_firestore()
    insp_doc = _col(db, "inspections").document(inspection_id).get()
    if not insp_doc.exists:
        raise HTTPException(status_code=404, detail="Inspection not found")

    insp_data = insp_doc.to_dict()
    if insp_data.get("inspector_id"):
        raise HTTPException(status_code=400, detail="Inspector already assigned")

    # Get available inspectors
    inspectors = _get_all(db, "inspectors")
    available = [i for i in inspectors if i.get("is_available")]
    if not available:
        raise HTTPException(status_code=404, detail="No available inspectors")

    # Avoid recent inspectors for this institute
    all_inspections = _get_all(db, "inspections")
    recent_ids = set()
    for inv in all_inspections:
        if inv.get("institute_id") == insp_data.get("institute_id") and inv.get("inspector_id"):
            recent_ids.add(inv["inspector_id"])

    non_recent = [i for i in available if i["id"] not in recent_ids]
    pool = non_recent if non_recent else available
    chosen = random.choice(pool)

    # Update inspection
    _col(db, "inspections").document(inspection_id).update({
        "inspector_id": chosen["id"],
        "status": "pending",
    })

    # Update inspector load
    _col(db, "inspectors").document(chosen["id"]).update({
        "current_load": (chosen.get("current_load") or 0) + 1,
    })

    return {"message": f"Inspector {chosen['name']} ({chosen.get('employee_id')}) assigned", "inspector_id": chosen["id"]}


# ── Alerts ─────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(
    severity: str | None = None,
    resolved: bool | None = None,
    user=Depends(get_current_user),
):
    db = get_firestore()
    filters = []
    if severity:
        filters.append(("severity", "==", severity))
    if resolved is not None:
        filters.append(("is_resolved", "==", resolved))

    alerts = _get_all(db, "alerts", filters if filters else None)
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}

    results = []
    for a in alerts:
        inst = institutes.get(a.get("institute_id"), {})
        results.append({
            **a,
            "institute_name": inst.get("name", "System"),
        })

    return results


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    db = get_firestore()
    doc = _col(db, "alerts").document(alert_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Alert not found")

    _col(db, "alerts").document(alert_id).update({
        "is_resolved": True,
        "resolved_at": now_utc(),
        "resolved_by": user.get("name", "Admin"),
    })
    return {"message": "Alert resolved"}


# ── CCTV ───────────────────────────────────────────────────────────────

@router.get("/cctv")
def get_cctv_devices(
    status: str | None = None,
    user=Depends(get_current_user),
):
    db = get_firestore()
    filters = [("status", "==", status)] if status else None
    devices = _get_all(db, "cctv_devices", filters)
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}

    results = []
    for d in devices:
        inst = institutes.get(d.get("institute_id"), {})
        results.append({
            **d,
            "institute_name": inst.get("name", "Unknown"),
        })
    return results


# ── Complaints ─────────────────────────────────────────────────────────

@router.get("/complaints")
def get_complaints(
    category: str | None = None,
    status: str | None = None,
    user=Depends(get_current_user),
):
    db = get_firestore()
    filters = []
    if category:
        filters.append(("category", "==", category))
    if status:
        filters.append(("status", "==", status))

    complaints = _get_all(db, "complaints", filters if filters else None)
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}

    results = []
    for c in complaints:
        inst = institutes.get(c.get("institute_id"), {})
        results.append({
            **c,
            "institute_name": inst.get("name", "Unknown"),
        })
    return results


# ── Analytics ──────────────────────────────────────────────────────────

@router.get("/analytics")
def get_analytics(user=Depends(get_current_user)):
    db = get_firestore()
    institutes = _get_all(db, "institutes")
    inspections = _get_all(db, "inspections")
    complaints = _get_all(db, "complaints")
    alerts = _get_all(db, "alerts")
    cctv_devices = _get_all(db, "cctv_devices")
    attendance_records = _get_all(db, "attendance_records")

    # Risk distribution
    risk_dist = [
        {"name": "Low Risk", "value": sum(1 for i in institutes if i.get("risk_level") == "low"), "color": "#22c55e"},
        {"name": "Medium Risk", "value": sum(1 for i in institutes if i.get("risk_level") == "medium"), "color": "#eab308"},
        {"name": "High Risk", "value": sum(1 for i in institutes if i.get("risk_level") == "high"), "color": "#ef4444"},
        {"name": "Critical", "value": sum(1 for i in institutes if i.get("risk_level") == "critical"), "color": "#7c2d12"},
    ]

    # Inspection status
    insp_status = [
        {"name": "Pending", "value": sum(1 for i in inspections if i.get("status") == "pending")},
        {"name": "In Progress", "value": sum(1 for i in inspections if i.get("status") == "in_progress")},
        {"name": "Completed", "value": sum(1 for i in inspections if i.get("status") == "completed")},
        {"name": "Cancelled", "value": sum(1 for i in inspections if i.get("status") == "cancelled")},
    ]

    # Complaint categories
    cat_counts = {}
    for c in complaints:
        cat = c.get("category", "other")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    complaint_cats = [{"name": k, "value": v} for k, v in cat_counts.items()]

    # Alert types
    type_counts = {}
    for a in alerts:
        t = a.get("type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
    alert_types = [{"name": k, "value": v} for k, v in type_counts.items()]

    # Monthly trend (mock)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    inspection_trend = [
        {"month": m, "inspections": random.randint(20, 80), "complaints": random.randint(5, 25)}
        for m in months
    ]

    # Attendance comparison
    inst_map = {i["id"]: i for i in institutes}
    attendance_comparison = []
    for a in attendance_records:
        inst = inst_map.get(a.get("institute_id"), {})
        attendance_comparison.append({
            "name": inst.get("name", "Unknown")[:15],
            "reported": a.get("reported_count", 0),
            "actual": a.get("ai_detected_count", 0),
        })

    # CCTV status
    cctv_online = sum(1 for c in cctv_devices if c.get("status") == "online")
    cctv_offline = sum(1 for c in cctv_devices if c.get("status") == "offline")

    return {
        "risk_distribution": risk_dist,
        "inspection_status": insp_status,
        "complaint_categories": complaint_cats,
        "alert_types": alert_types,
        "inspection_trend": inspection_trend,
        "attendance_comparison": attendance_comparison,
        "cctv_status": [
            {"name": "Online", "value": cctv_online, "color": "#22c55e"},
            {"name": "Offline", "value": cctv_offline, "color": "#ef4444"},
        ],
    }


# ── Risk Map ───────────────────────────────────────────────────────────

@router.get("/risk-map")
def get_risk_map(user=Depends(get_current_user)):
    db = get_firestore()
    institutes = _get_all(db, "institutes")
    return [
        {
            "id": i["id"],
            "name": i.get("name"),
            "type": i.get("type"),
            "lat": i.get("latitude"),
            "lng": i.get("longitude"),
            "risk_score": i.get("risk_score", 0),
            "risk_level": i.get("risk_level", "low"),
            "trust_score": i.get("trust_score", 100),
            "district": i.get("district"),
        }
        for i in institutes
        if i.get("latitude") and i.get("longitude")
    ]


# ── Video Calls ────────────────────────────────────────────────────────

@router.get("/video-calls")
def get_video_calls(user=Depends(get_current_user)):
    db = get_firestore()
    calls = _get_all(db, "video_calls")
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}

    results = []
    for vc in calls:
        inst = institutes.get(vc.get("institute_id"), {})
        results.append({
            **vc,
            "institute_name": inst.get("name", "Unknown"),
        })
    return results


@router.post("/video-calls/initiate")
def initiate_vc(
    institute_id: str,
    called_person: str,
    role: str = "project_incharge",
    user=Depends(get_current_user),
):
    db = get_firestore()
    vc_data = {
        "institute_id": institute_id,
        "initiated_by": user.get("name", "Admin"),
        "called_person": called_person,
        "role": role,
        "status": "in_progress",
        "started_at": now_utc(),
        "created_at": now_utc(),
    }
    _, doc_ref = _col(db, "video_calls").add(vc_data)
    return {"message": "Video call initiated", "call_id": doc_ref.id}


@router.post("/video-calls/{call_id}/end")
def end_vc(call_id: str, notes: str = "", user=Depends(get_current_user)):
    db = get_firestore()
    doc = _col(db, "video_calls").document(call_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video call not found")

    data = doc.to_dict()
    ended_at = now_utc()
    started_at = data.get("started_at")
    duration = 0
    if started_at:
        if hasattr(started_at, "timestamp"):
            duration = int((ended_at - started_at).total_seconds())

    _col(db, "video_calls").document(call_id).update({
        "ended_at": ended_at,
        "status": "completed",
        "notes": notes,
        "duration_seconds": duration,
    })
    return {"message": "Call ended", "duration": duration}


# ── Beneficiaries ──────────────────────────────────────────────────────

@router.get("/beneficiaries")
def get_beneficiaries(user=Depends(get_current_user)):
    db = get_firestore()
    bens = _get_all(db, "beneficiaries")
    institutes = {i["id"]: i for i in _get_all(db, "institutes")}

    results = []
    for b in bens:
        inst = institutes.get(b.get("institute_id"), {})
        results.append({
            **b,
            "institute_name": inst.get("name", "Unknown"),
        })
    return results


# ── Predictive Inspection ──────────────────────────────────────────────

@router.get("/predictive-inspections")
def get_predictive_inspections(user=Depends(get_current_user)):
    db = get_firestore()
    institutes = _get_all(db, "institutes")
    institutes.sort(key=lambda x: x.get("risk_score", 0), reverse=True)

    cctv_devices = _get_all(db, "cctv_devices")
    complaints = _get_all(db, "complaints")
    attendance_records = _get_all(db, "attendance_records")

    offline_cctv_count = {}
    for c in cctv_devices:
        if c.get("status") == "offline":
            iid = c.get("institute_id")
            offline_cctv_count[iid] = offline_cctv_count.get(iid, 0) + 1

    complaint_count = {}
    for c in complaints:
        iid = c.get("institute_id")
        complaint_count[iid] = complaint_count.get(iid, 0) + 1

    attendance_by_inst = {}
    for a in attendance_records:
        iid = a.get("institute_id")
        if iid not in attendance_by_inst or a.get("created_at", "") > attendance_by_inst[iid].get("created_at", ""):
            attendance_by_inst[iid] = a

    results = []
    for inst in institutes[:5]:
        reasons = []
        iid = inst["id"]
        if (inst.get("risk_score") or 0) >= 61:
            reasons.append("High risk score")
        if offline_cctv_count.get(iid, 0) > 0:
            reasons.append(f"{offline_cctv_count[iid]} CCTV cameras offline")
        if complaint_count.get(iid, 0) > 3:
            reasons.append(f"{complaint_count[iid]} complaints received")
        latest_att = attendance_by_inst.get(iid)
        if latest_att and (latest_att.get("discrepancy_percentage") or 0) > 30:
            reasons.append(f"Attendance discrepancy: {latest_att['discrepancy_percentage']:.0f}%")

        results.append({
            "institute_id": iid,
            "institute_name": inst.get("name"),
            "risk_score": inst.get("risk_score", 0),
            "risk_level": inst.get("risk_level", "low"),
            "trust_score": inst.get("trust_score", 100),
            "priority": "HIGH" if (inst.get("risk_score") or 0) >= 61 else "MEDIUM" if (inst.get("risk_score") or 0) >= 31 else "LOW",
            "reasons": reasons or ["Scheduled periodic inspection"],
        })
    return results
