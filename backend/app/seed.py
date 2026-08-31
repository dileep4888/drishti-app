"""Seed MySQL database with demo data for DRISHTI AI."""
import random
from datetime import datetime, timedelta, timezone

from .database import SessionLocal, engine, Base
from .models import (
    User, Institute, CCTVDevice, Inspector, Inspection, Alert,
    Complaint, AttendanceRecord, Beneficiary, Evidence, VideoCall, RiskScore
)
from .security import get_password_hash


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        print("Database already seeded.")
        db.close()
        return

    # ── Users ──────────────────────────────────────────────────────
    users = [
        User(name="Dileep Bairwa", email="dileepbairwa48@gmail.com",
             hashed_password=get_password_hash("highxgamer"), role="super_admin",
             state="Rajasthan", district="Jaipur"),
        User(name="Priya Sharma", email="priya@demo.com",
             hashed_password=get_password_hash("demo1234"), role="department_official",
             state="Rajasthan", district="Jaipur"),
        User(name="Rahul Verma", email="rahul@demo.com",
             hashed_password=get_password_hash("demo1234"), role="inspector",
             state="Rajasthan", district="Jaipur"),
        User(name="Anita Devi", email="anita@demo.com",
             hashed_password=get_password_hash("demo1234"), role="state_authority",
             state="Rajasthan"),
    ]
    db.add_all(users)
    db.flush()

    # ── Institutes ─────────────────────────────────────────────────
    institute_data = [
        ("Pratham Education Foundation", "NGO", "SAMAGRA SHIKSHA", "Rajasthan", "Jaipur", 26.9124, 75.7873, 85, "high", 30, 120, 85),
        ("HelpAge India", "NGO", "NATIONAL SOCIAL ASSISTANCE", "Rajasthan", "Jaipur", 26.9258, 75.7897, 42, "medium", 65, 90, 78),
        ("CRY Child Rights", "NGO", "INTEGRATED CHILD DEVELOPMENT", "Delhi", "New Delhi", 28.6139, 77.2090, 15, "low", 90, 200, 92),
        ("Nalanda Learning Centre", "Education", "SAMAGRA SHIKSHA", "Rajasthan", "Jodhpur", 26.2389, 73.0243, 72, "high", 45, 60, 68),
        ("Vidya Bharti Schools", "Education", "RUSA", "Bihar", "Patna", 25.6093, 85.1376, 28, "low", 88, 150, 88),
        ("Kasturba Gandhi Balika", "Education", "SAMAGRA SHIKSHA", "Uttar Pradesh", "Lucknow", 26.8467, 80.9462, 55, "medium", 70, 100, 75),
        ("National Blindness Control", "Health", "NATIONAL HEALTH MISSION", "Rajasthan", "Udaipur", 24.5854, 73.7125, 38, "medium", 75, 80, 82),
        ("Smile Foundation", "NGO", "NATIONAL SOCIAL ASSISTANCE", "Madhya Pradesh", "Bhopal", 23.2599, 77.4126, 91, "critical", 20, 50, 55),
        ("Pratham Health Initiative", "Health", "NATIONAL HEALTH MISSION", "Gujarat", "Ahmedabad", 23.0225, 72.5714, 18, "low", 82, 110, 90),
        ("Jan Shikshan Sansthan", "Education", "SKILL INDIA", "Rajasthan", "Kota", 25.2138, 75.8648, 62, "high", 55, 70, 65),
    ]

    institutes = []
    for name, typ, scheme, state, dist, lat, lng, risk, rlevel, trust, ben, staff in institute_data:
        inst = Institute(
            name=name, type=typ, scheme=scheme, state=state, district=dist,
            latitude=lat, longitude=lng, risk_score=risk, risk_level=rlevel,
            trust_score=trust, reported_beneficiaries=ben, reported_staff=staff,
            contact_person=f"Contact - {name[:15]}",
            contact_phone=f"+91-{random.randint(70000,99999)}{random.randint(10000,99999)}",
            status="active",
        )
        institutes.append(inst)
    db.add_all(institutes)
    db.flush()

    # ── CCTV Devices ───────────────────────────────────────────────
    locations = ["Main Gate", "Classroom A", "Classroom B", "Playground", "Staff Room", "Entrance Hall", "Office", "Corridor"]
    for inst in institutes:
        num_cameras = random.randint(2, 5)
        for j in range(num_cameras):
            status = random.choices(["online", "offline"], weights=[80, 20])[0]
            cam = CCTVDevice(
                institute_id=inst.id,
                name=f"CAM-{inst.id}-{j+1:02d} - {random.choice(locations)}",
                rtsp_url=f"rtsp://192.168.{inst.id}.{j+10}:554/stream{j+1}",
                status=status,
                people_detected=random.randint(0, 50) if status == "online" else 0,
                is_recording=status == "online",
                location_description=random.choice(locations),
                last_online=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48)) if status == "online" else None,
                last_offline=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24)) if status == "offline" else None,
            )
            db.add(cam)
    db.flush()

    # ── Inspectors ─────────────────────────────────────────────────
    inspector_data = [
        ("Rahul Verma", "INS-201", "Rajasthan", "Jaipur", "Education"),
        ("Suresh Kumar", "INS-202", "Rajasthan", "Jodhpur", "Health"),
        ("Meena Devi", "INS-203", "Delhi", "New Delhi", "NGO Audit"),
        ("Amit Singh", "INS-204", "Bihar", "Patna", "Infrastructure"),
        ("Neha Gupta", "INS-205", "Uttar Pradesh", "Lucknow", "Education"),
        ("Vikram Rathore", "INS-206", "Madhya Pradesh", "Bhopal", "Health"),
        ("Deepak Joshi", "INS-207", "Gujarat", "Ahmedabad", "NGO Audit"),
        ("Sunita Rani", "INS-208", "Rajasthan", "Kota", "Education"),
    ]
    inspectors = []
    for name, eid, state, dist, spec in inspector_data:
        insp = Inspector(
            name=name, employee_id=eid, state=state, district=dist,
            specialization=spec, is_available=random.choice([True, True, True, False]),
            current_load=random.randint(0, 3), total_inspections=random.randint(5, 30),
        )
        inspectors.append(insp)
    db.add_all(inspectors)
    db.flush()

    # ── Inspections ────────────────────────────────────────────────
    statuses = ["pending", "in_progress", "completed", "completed", "completed", "cancelled"]
    types = ["surprise", "surprise", "scheduled", "follow_up"]
    compliance = ["compliant", "non_compliant", "partial"]

    for inst in institutes:
        num_inspections = random.randint(2, 5)
        for _ in range(num_inspections):
            status = random.choice(statuses)
            insp = Inspection(
                institute_id=inst.id,
                inspector_id=random.choice(inspectors).id if status != "pending" else None,
                type=random.choice(types),
                status=status,
                gps_verified=random.choice([True, True, False]),
                compliance_status=random.choice(compliance) if status == "completed" else None,
                notes=f"{'Routine' if status == 'completed' else 'Scheduled'} inspection at {inst.district}",
                latitude=inst.latitude + random.uniform(-0.01, 0.01),
                longitude=inst.longitude + random.uniform(-0.01, 0.01),
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
                completed_date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)) if status == "completed" else None,
            )
            db.add(insp)
    db.flush()

    # ── Alerts ─────────────────────────────────────────────────────
    alert_templates = [
        ("cctv_offline", "warning", "CCTV Offline", "Camera feed interrupted for more than 4 hours"),
        ("attendance_mismatch", "critical", "Attendance Discrepancy", "Reported attendance significantly differs from AI-detected count"),
        ("location_mismatch", "critical", "Inspector Location Mismatch", "Inspector GPS does not match expected inspection location"),
        ("complaint_spike", "warning", "Complaint Spike Detected", "Multiple complaints received from same institution in short period"),
        ("inspection_violation", "critical", "Inspection Non-Compliance", "Institution failed compliance check during recent inspection"),
        ("high_risk", "critical", "High Risk Institution", "Institution risk score has exceeded critical threshold"),
        ("cctv_offline", "info", "CCTV Maintenance Due", "Scheduled maintenance window approaching for camera system"),
        ("attendance_mismatch", "warning", "Low Attendance Detected", "AI camera count shows unusually low attendance"),
    ]

    for inst in institutes:
        num_alerts = random.randint(1, 3)
        for _ in range(num_alerts):
            tpl = random.choice(alert_templates)
            alert = Alert(
                institute_id=inst.id,
                type=tpl[0], severity=tpl[1], title=tpl[2],
                message=f"{tpl[3]} — {inst.name}",
                is_resolved=random.choice([True, False]),
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 120)),
            )
            db.add(alert)
    db.flush()

    # ── Attendance Records ─────────────────────────────────────────
    for inst in institutes:
        for day_offset in range(7):
            reported = inst.reported_beneficiaries
            actual = int(reported * random.uniform(0.4, 1.1))
            disc = abs(reported - actual) / max(reported, 1) * 100
            ar = AttendanceRecord(
                institute_id=inst.id,
                date=datetime.now(timezone.utc) - timedelta(days=day_offset),
                reported_count=reported,
                ai_detected_count=actual,
                discrepancy_percentage=round(disc, 1),
                cctv_source=f"CAM-{inst.id}-01",
                is_verified=disc < 10,
            )
            db.add(ar)
    db.flush()

    # ── Complaints ─────────────────────────────────────────────────
    complaint_data = [
        ("staff_absent", "Teachers are not coming regularly"),
        ("staff_absent", "Staff is usually absent on Mondays"),
        ("service_not_received", "Did not receive mid-day meal today"),
        ("fake_attendance", "Attendance register shows 100 but only 40 present"),
        ("infrastructure", "Classroom roof is leaking, no repair done"),
        ("misbehavior", "Staff misbehaved with parents"),
        ("other", "Government scheme benefits not reaching beneficiaries"),
    ]

    for inst in institutes:
        num_complaints = random.randint(0, 3)
        for _ in range(num_complaints):
            tpl = random.choice(complaint_data)
            comp = Complaint(
                institute_id=inst.id,
                beneficiary_name="Anonymous" if random.choice([True, False]) else f"Beneficiary {random.randint(1,100)}",
                category=tpl[0],
                description=tpl[1],
                status=random.choice(["pending", "investigating", "resolved"]),
                is_anonymous=random.choice([True, False]),
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
            )
            db.add(comp)
    db.flush()

    # ── Beneficiaries ──────────────────────────────────────────────
    first_names = ["Amit", "Priya", "Rahul", "Sunita", "Deepak", "Meena", "Vikram", "Neha", "Suresh", "Kavita"]
    last_names = ["Kumar", "Devi", "Singh", "Rani", "Sharma", "Gupta", "Verma", "Joshi", "Patel", "Rao"]

    for inst in institutes:
        num_ben = random.randint(3, 6)
        for _ in range(num_ben):
            ben = Beneficiary(
                institute_id=inst.id,
                name=f"{random.choice(first_names)} {random.choice(last_names)}",
                service_received=random.choice([True, True, True, False]),
                service_rating=random.randint(1, 5),
                feedback=random.choice([None, "Good service", "Needs improvement", "Satisfied", None]),
                attendance_confirmed=random.choice([True, True, False]),
            )
            db.add(ben)
    db.flush()

    # ── Video Calls ────────────────────────────────────────────────
    vc_statuses = ["completed", "completed", "completed", "missed", "scheduled"]
    roles = ["project_incharge", "staff", "beneficiary"]
    for inst in institutes:
        num_vc = random.randint(1, 3)
        for _ in range(num_vc):
            status = random.choice(vc_statuses)
            started = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 15), hours=random.randint(0, 12))
            duration = random.randint(60, 1800) if status == "completed" else 0
            vc = VideoCall(
                institute_id=inst.id,
                initiated_by="Dileep Bairwa",
                called_person=f"{random.choice(first_names)} {random.choice(last_names)}",
                role=random.choice(roles),
                status=status,
                scheduled_time=started,
                started_at=started if status in ["completed", "in_progress"] else None,
                ended_at=started + timedelta(seconds=duration) if status == "completed" else None,
                duration_seconds=duration,
                location_verified=random.choice([True, False]),
                latitude=inst.latitude + random.uniform(-0.005, 0.005),
                longitude=inst.longitude + random.uniform(-0.005, 0.005),
                notes=f"{'Routine verification' if status == 'completed' else 'Unanswered'} call",
            )
            db.add(vc)
    db.flush()

    # ── Risk Scores ────────────────────────────────────────────────
    for inst in institutes:
        rs = RiskScore(
            institute_id=inst.id,
            attendance_mismatch_score=random.randint(0, 30),
            cctv_offline_score=random.randint(0, 20),
            inspection_violation_score=random.randint(0, 30),
            complaint_score=random.randint(0, 15),
            location_anomaly_score=random.randint(0, 15),
            delayed_report_score=random.randint(0, 10),
            total_score=inst.risk_score,
        )
        db.add(rs)

    db.commit()
    print(f"✅ Seeded {len(institutes)} institutes, {len(users)} users, {len(inspectors)} inspectors")
    db.close()


if __name__ == "__main__":
    seed()
