import json
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Institute, Inspection, Inspector, Alert, Complaint, CCTVDevice,
    AttendanceRecord, Beneficiary, Evidence, VideoCall, RiskScore, User
)
from ..security import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard API"])


# ── Dashboard Stats ────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total_institutes = db.query(Institute).count()
    total_cctv = db.query(CCTVDevice).count()
    cctv_online = db.query(CCTVDevice).filter(CCTVDevice.status == "online").count()
    total_inspections = db.query(Inspection).count()
    pending_inspections = db.query(Inspection).filter(Inspection.status == "pending").count()
    completed_inspections = db.query(Inspection).filter(Inspection.status == "completed").count()
    high_risk = db.query(Institute).filter(Institute.risk_score >= 61).count()
    medium_risk = db.query(Institute).filter(Institute.risk_score.between(31, 60)).count()
    low_risk = db.query(Institute).filter(Institute.risk_score.between(0, 30)).count()
    unresolved_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    total_complaints = db.query(Complaint).count()
    pending_complaints = db.query(Complaint).filter(Complaint.status == "pending").count()
    total_beneficiaries = db.query(Beneficiary).count()
    active_projects = total_institutes  # placeholder

    return {
        "active_projects": active_projects,
        "total_institutes": total_institutes,
        "live_cctv_cameras": cctv_online,
        "total_cctv_cameras": total_cctv,
        "inspections_today": total_inspections,
        "pending_inspections": pending_inspections,
        "completed_inspections": completed_inspections,
        "high_risk_locations": high_risk,
        "medium_risk_locations": medium_risk,
        "low_risk_locations": low_risk,
        "anomalies_detected": unresolved_alerts,
        "unresolved_alerts": unresolved_alerts,
        "total_complaints": total_complaints,
        "pending_complaints": pending_complaints,
        "total_beneficiaries": total_beneficiaries,
    }


# ── Institutes ─────────────────────────────────────────────────────────

@router.get("/institutes")
def get_institutes(
    risk_level: str | None = None,
    state: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Institute)
    if risk_level:
        q = q.filter(Institute.risk_level == risk_level)
    if state:
        q = q.filter(Institute.state == state)
    if type:
        q = q.filter(Institute.type == type)

    institutes = q.order_by(Institute.risk_score.desc()).all()
    return [_serialize_institute(i, db) for i in institutes]


@router.get("/institutes/{institute_id}")
def get_institute_detail(institute_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inst = db.query(Institute).filter(Institute.id == institute_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")

    data = _serialize_institute(inst, db)
    data["cctv_devices"] = [
        {"id": c.id, "name": c.name, "status": c.status, "people_detected": c.people_detected,
         "is_recording": c.is_recording, "location": c.location_description}
        for c in inst.cctv_devices
    ]
    data["inspections"] = [
        {"id": i.id, "type": i.type, "status": i.status, "gps_verified": i.gps_verified,
         "compliance_status": i.compliance_status, "created_at": i.created_at.isoformat() if i.created_at else None}
        for i in inst.inspections[:10]
    ]
    data["complaints"] = [
        {"id": c.id, "category": c.category, "description": c.description,
         "status": c.status, "created_at": c.created_at.isoformat() if c.created_at else None}
        for c in inst.complaints[:10]
    ]
    data["alerts"] = [
        {"id": a.id, "type": a.type, "severity": a.severity, "title": a.title,
         "is_resolved": a.is_resolved, "created_at": a.created_at.isoformat() if a.created_at else None}
        for a in inst.alerts[:10]
    ]
    data["attendance_records"] = [
        {"id": ar.id, "date": ar.date.isoformat() if ar.date else None,
         "reported_count": ar.reported_count, "ai_detected_count": ar.ai_detected_count,
         "discrepancy_percentage": ar.discrepancy_percentage}
        for ar in inst.attendance_records[:10]
    ]
    data["beneficiaries"] = [
        {"id": b.id, "name": b.name, "service_received": b.service_received,
         "service_rating": b.service_rating}
        for b in inst.beneficiaries[:10]
    ]
    return data


def _serialize_institute(inst, db):
    cctv_online = db.query(CCTVDevice).filter(
        CCTVDevice.institute_id == inst.id, CCTVDevice.status == "online"
    ).count()
    cctv_total = db.query(CCTVDevice).filter(CCTVDevice.institute_id == inst.id).count()
    complaint_count = db.query(Complaint).filter(Complaint.institute_id == inst.id).count()
    alert_count = db.query(Alert).filter(
        Alert.institute_id == inst.id, Alert.is_resolved == False
    ).count()

    return {
        "id": inst.id,
        "name": inst.name,
        "type": inst.type,
        "scheme": inst.scheme,
        "state": inst.state,
        "district": inst.district,
        "address": inst.address,
        "latitude": inst.latitude,
        "longitude": inst.longitude,
        "risk_score": inst.risk_score,
        "risk_level": inst.risk_level,
        "trust_score": inst.trust_score,
        "reported_beneficiaries": inst.reported_beneficiaries,
        "reported_staff": inst.reported_staff,
        "status": inst.status,
        "contact_person": inst.contact_person,
        "cctv_online": cctv_online,
        "cctv_total": cctv_total,
        "complaint_count": complaint_count,
        "active_alerts": alert_count,
    }


# ── Inspections ────────────────────────────────────────────────────────

@router.get("/inspections")
def get_inspections(
    status: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Inspection)
    if status:
        q = q.filter(Inspection.status == status)
    if type:
        q = q.filter(Inspection.type == type)

    inspections = q.order_by(Inspection.created_at.desc()).all()
    results = []
    for insp in inspections:
        inst = db.query(Institute).filter(Institute.id == insp.institute_id).first()
        inspector = db.query(Inspector).filter(Inspector.id == insp.inspector_id).first()
        results.append({
            "id": insp.id,
            "institute_id": insp.institute_id,
            "institute_name": inst.name if inst else "Unknown",
            "institute_district": inst.district if inst else "",
            "inspector_name": inspector.name if inspector else "Unassigned",
            "inspector_id": inspector.employee_id if inspector else None,
            "type": insp.type,
            "status": insp.status,
            "gps_verified": insp.gps_verified,
            "compliance_status": insp.compliance_status,
            "notes": insp.notes,
            "created_at": insp.created_at.isoformat() if insp.created_at else None,
            "completed_date": insp.completed_date.isoformat() if insp.completed_date else None,
        })
    return results


@router.post("/inspections/{inspection_id}/assign-random")
def assign_random_inspector(inspection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.inspector_id:
        raise HTTPException(status_code=400, detail="Inspector already assigned")

    # Get available inspectors, exclude those who recently inspected this institute
    recent_inspector_ids = [
        i.inspector_id for i in db.query(Inspection).filter(
            Inspection.institute_id == inspection.institute_id,
            Inspection.inspector_id.isnot(None),
        ).order_by(Inspection.created_at.desc()).limit(3).all()
    ]

    available = db.query(Inspector).filter(
        Inspector.is_available == True,
        Inspector.id.notin_(recent_inspector_ids) if recent_inspector_ids else True,
    ).all()

    if not available:
        # Fallback: any available inspector
        available = db.query(Inspector).filter(Inspector.is_available == True).all()
    if not available:
        raise HTTPException(status_code=404, detail="No available inspectors")

    chosen = random.choice(available)
    inspection.inspector_id = chosen.id
    inspection.status = "pending"
    chosen.current_load += 1
    db.commit()

    return {"message": f"Inspector {chosen.name} ({chosen.employee_id}) assigned", "inspector_id": chosen.id}


# ── Alerts ─────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(
    severity: str | None = None,
    resolved: bool | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Alert)
    if severity:
        q = q.filter(Alert.severity == severity)
    if resolved is not None:
        q = q.filter(Alert.is_resolved == resolved)

    alerts = q.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        inst = db.query(Institute).filter(Institute.id == a.institute_id).first()
        results.append({
            "id": a.id,
            "institute_id": a.institute_id,
            "institute_name": inst.name if inst else "System",
            "type": a.type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "is_resolved": a.is_resolved,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return results


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = user.name
    db.commit()
    return {"message": "Alert resolved"}


# ── CCTV ───────────────────────────────────────────────────────────────

@router.get("/cctv")
def get_cctv_devices(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(CCTVDevice)
    if status:
        q = q.filter(CCTVDevice.status == status)

    devices = q.all()
    results = []
    for d in devices:
        inst = db.query(Institute).filter(Institute.id == d.institute_id).first()
        results.append({
            "id": d.id,
            "institute_id": d.institute_id,
            "institute_name": inst.name if inst else "Unknown",
            "name": d.name,
            "status": d.status,
            "people_detected": d.people_detected,
            "is_recording": d.is_recording,
            "location": d.location_description,
            "rtsp_url": d.rtsp_url,
            "last_online": d.last_online.isoformat() if d.last_online else None,
        })
    return results


# ── Complaints ─────────────────────────────────────────────────────────

@router.get("/complaints")
def get_complaints(
    category: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Complaint)
    if category:
        q = q.filter(Complaint.category == category)
    if status:
        q = q.filter(Complaint.status == status)

    complaints = q.order_by(Complaint.created_at.desc()).all()
    results = []
    for c in complaints:
        inst = db.query(Institute).filter(Institute.id == c.institute_id).first()
        results.append({
            "id": c.id,
            "institute_id": c.institute_id,
            "institute_name": inst.name if inst else "Unknown",
            "beneficiary_name": c.beneficiary_name,
            "category": c.category,
            "description": c.description,
            "status": c.status,
            "ai_category": c.ai_category,
            "is_anonymous": c.is_anonymous,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return results


# ── Analytics ──────────────────────────────────────────────────────────

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Risk distribution
    risk_dist = [
        {"name": "Low Risk", "value": db.query(Institute).filter(Institute.risk_level == "low").count(), "color": "#22c55e"},
        {"name": "Medium Risk", "value": db.query(Institute).filter(Institute.risk_level == "medium").count(), "color": "#eab308"},
        {"name": "High Risk", "value": db.query(Institute).filter(Institute.risk_level == "high").count(), "color": "#ef4444"},
        {"name": "Critical", "value": db.query(Institute).filter(Institute.risk_level == "critical").count(), "color": "#7c2d12"},
    ]

    # Inspection status
    insp_status = [
        {"name": "Pending", "value": db.query(Inspection).filter(Inspection.status == "pending").count()},
        {"name": "In Progress", "value": db.query(Inspection).filter(Inspection.status == "in_progress").count()},
        {"name": "Completed", "value": db.query(Inspection).filter(Inspection.status == "completed").count()},
        {"name": "Cancelled", "value": db.query(Inspection).filter(Inspection.status == "cancelled").count()},
    ]

    # Complaint categories
    complaint_cats = db.query(
        Complaint.category, func.count(Complaint.id)
    ).group_by(Complaint.category).all()

    # Alert types
    alert_types = db.query(
        Alert.type, func.count(Alert.id)
    ).group_by(Alert.type).all()

    # Monthly trend (mock 6 months)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    inspection_trend = [
        {"month": m, "inspections": random.randint(20, 80), "complaints": random.randint(5, 25)}
        for m in months
    ]

    # Attendance comparison
    attendance = db.query(AttendanceRecord).all()
    attendance_comparison = []
    for a in attendance:
        inst = db.query(Institute).filter(Institute.id == a.institute_id).first()
        attendance_comparison.append({
            "name": inst.name[:15] if inst else "Unknown",
            "reported": a.reported_count,
            "actual": a.ai_detected_count,
        })

    # CCTV status
    cctv_online = db.query(CCTVDevice).filter(CCTVDevice.status == "online").count()
    cctv_offline = db.query(CCTVDevice).filter(CCTVDevice.status == "offline").count()

    return {
        "risk_distribution": risk_dist,
        "inspection_status": insp_status,
        "complaint_categories": [{"name": c[0], "value": c[1]} for c in complaint_cats],
        "alert_types": [{"name": a[0], "value": a[1]} for a in alert_types],
        "inspection_trend": inspection_trend,
        "attendance_comparison": attendance_comparison,
        "cctv_status": [
            {"name": "Online", "value": cctv_online, "color": "#22c55e"},
            {"name": "Offline", "value": cctv_offline, "color": "#ef4444"},
        ],
    }


# ── Risk Map ───────────────────────────────────────────────────────────

@router.get("/risk-map")
def get_risk_map(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    institutes = db.query(Institute).filter(
        Institute.latitude.isnot(None), Institute.longitude.isnot(None)
    ).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "type": i.type,
            "lat": i.latitude,
            "lng": i.longitude,
            "risk_score": i.risk_score,
            "risk_level": i.risk_level,
            "trust_score": i.trust_score,
            "district": i.district,
        }
        for i in institutes
    ]


# ── Video Calls ────────────────────────────────────────────────────────

@router.get("/video-calls")
def get_video_calls(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    calls = db.query(VideoCall).order_by(VideoCall.created_at.desc()).all()
    results = []
    for vc in calls:
        inst = db.query(Institute).filter(Institute.id == vc.institute_id).first()
        results.append({
            "id": vc.id,
            "institute_id": vc.institute_id,
            "institute_name": inst.name if inst else "Unknown",
            "initiated_by": vc.initiated_by,
            "called_person": vc.called_person,
            "role": vc.role,
            "status": vc.status,
            "scheduled_time": vc.scheduled_time.isoformat() if vc.scheduled_time else None,
            "started_at": vc.started_at.isoformat() if vc.started_at else None,
            "ended_at": vc.ended_at.isoformat() if vc.ended_at else None,
            "duration_seconds": vc.duration_seconds,
            "location_verified": vc.location_verified,
            "notes": vc.notes,
        })
    return results


@router.post("/video-calls/initiate")
def initiate_vc(
    institute_id: int,
    called_person: str,
    role: str = "project_incharge",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    vc = VideoCall(
        institute_id=institute_id,
        initiated_by=user.name,
        called_person=called_person,
        role=role,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
    )
    db.add(vc)
    db.commit()
    db.refresh(vc)
    return {"message": "Video call initiated", "call_id": vc.id}


@router.post("/video-calls/{call_id}/end")
def end_vc(call_id: int, notes: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vc = db.query(VideoCall).filter(VideoCall.id == call_id).first()
    if not vc:
        raise HTTPException(status_code=404, detail="Video call not found")
    vc.ended_at = datetime.now(timezone.utc)
    vc.status = "completed"
    vc.notes = notes
    if vc.started_at:
        vc.duration_seconds = int((vc.ended_at - vc.started_at).total_seconds())
    db.commit()
    return {"message": "Call ended", "duration": vc.duration_seconds}


# ── Beneficiaries ──────────────────────────────────────────────────────

@router.get("/beneficiaries")
def get_beneficiaries(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bens = db.query(Beneficiary).all()
    results = []
    for b in bens:
        inst = db.query(Institute).filter(Institute.id == b.institute_id).first()
        results.append({
            "id": b.id,
            "institute_id": b.institute_id,
            "institute_name": inst.name if inst else "Unknown",
            "name": b.name,
            "service_received": b.service_received,
            "service_rating": b.service_rating,
            "feedback": b.feedback,
            "attendance_confirmed": b.attendance_confirmed,
        })
    return results


# ── Predictive Inspection ──────────────────────────────────────────────

@router.get("/predictive-inspections")
def get_predictive_inspections(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """AI-predicted priority institutions for next inspection"""
    institutes = db.query(Institute).order_by(Institute.risk_score.desc()).limit(5).all()
    results = []
    for inst in institutes:
        reasons = []
        if inst.risk_score >= 61:
            reasons.append("High risk score")
        # Check CCTV offline
        offline_cctv = db.query(CCTVDevice).filter(
            CCTVDevice.institute_id == inst.id, CCTVDevice.status == "offline"
        ).count()
        if offline_cctv > 0:
            reasons.append(f"{offline_cctv} CCTV cameras offline")
        # Check complaints
        complaint_count = db.query(Complaint).filter(Complaint.institute_id == inst.id).count()
        if complaint_count > 3:
            reasons.append(f"{complaint_count} complaints received")
        # Check attendance discrepancy
        latest_attendance = db.query(AttendanceRecord).filter(
            AttendanceRecord.institute_id == inst.id
        ).order_by(AttendanceRecord.created_at.desc()).first()
        if latest_attendance and latest_attendance.discrepancy_percentage > 30:
            reasons.append(f"Attendance discrepancy: {latest_attendance.discrepancy_percentage:.0f}%")

        results.append({
            "institute_id": inst.id,
            "institute_name": inst.name,
            "risk_score": inst.risk_score,
            "risk_level": inst.risk_level,
            "trust_score": inst.trust_score,
            "priority": "HIGH" if inst.risk_score >= 61 else "MEDIUM" if inst.risk_score >= 31 else "LOW",
            "reasons": reasons or ["Scheduled periodic inspection"],
        })
    return results
