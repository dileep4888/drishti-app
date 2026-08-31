"""Seed Firestore with demo data for DRISHTI AI."""
import random
from datetime import datetime, timedelta, timezone

from .database import get_firestore
from .security import get_password_hash


def now_utc():
    return datetime.now(timezone.utc)


def seed():
    db = get_firestore()

    # Check if already seeded
    existing = list(db.collection("users").limit(1).stream())
    if existing:
        print("Firestore already seeded.")
        return

    batch = db.batch()

    # ── Users ──────────────────────────────────────────────────────
    users_data = [
        {"name": "Dileep Bairwa", "email": "dileepbairwa48@gmail.com",
         "hashed_password": get_password_hash("highxgamer"), "role": "super_admin",
         "state": "Rajasthan", "district": "Jaipur", "phone": "9898989898", "is_active": True, "created_at": now_utc()},
        {"name": "Priya Sharma", "email": "priya@demo.com",
         "hashed_password": get_password_hash("demo1234"), "role": "department_official",
         "state": "Rajasthan", "district": "Jaipur", "is_active": True, "created_at": now_utc()},
        {"name": "Rahul Verma", "email": "rahul@demo.com",
         "hashed_password": get_password_hash("demo1234"), "role": "inspector",
         "state": "Rajasthan", "district": "Jaipur", "is_active": True, "created_at": now_utc()},
        {"name": "Anita Devi", "email": "anita@demo.com",
         "hashed_password": get_password_hash("demo1234"), "role": "state_authority",
         "state": "Rajasthan", "is_active": True, "created_at": now_utc()},
    ]
    user_refs = []
    for u in users_data:
        ref = db.collection("users").document()
        batch.set(ref, u)
        user_refs.append(ref)

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

    inst_refs = []
    for name, typ, scheme, state, dist, lat, lng, risk, rlevel, trust, ben, staff in institute_data:
        ref = db.collection("institutes").document()
        batch.set(ref, {
            "name": name, "type": typ, "scheme": scheme, "state": state, "district": dist,
            "latitude": lat, "longitude": lng, "risk_score": risk, "risk_level": rlevel,
            "trust_score": trust, "reported_beneficiaries": ben, "reported_staff": staff,
            "contact_person": f"Contact - {name[:15]}",
            "contact_phone": f"+91-{random.randint(70000,99999)}{random.randint(10000,99999)}",
            "status": "active", "created_at": now_utc(),
        })
        inst_refs.append(ref)

    # Commit batch 1 (users + institutes)
    batch.commit()
    print(f"  Seeded {len(users_data)} users, {len(institute_data)} institutes")

    # ── CCTV Devices ───────────────────────────────────────────────
    locations = ["Main Gate", "Classroom A", "Classroom B", "Playground", "Staff Room", "Entrance Hall", "Office", "Corridor"]
    batch2 = db.batch()
    cctv_count = 0

    # Get institute doc IDs
    inst_docs = [doc.id for doc in db.collection("institutes").stream()]

    for idx, inst_id in enumerate(inst_docs):
        inst_info = institute_data[idx]
        num_cameras = random.randint(2, 5)
        for j in range(num_cameras):
            status = random.choices(["online", "offline"], weights=[80, 20])[0]
            ref = db.collection("cctv_devices").document()
            batch2.set(ref, {
                "institute_id": inst_id,
                "name": f"CAM-{idx+1}-{j+1:02d} - {random.choice(locations)}",
                "rtsp_url": f"rtsp://192.168.{idx+1}.{j+10}:554/stream{j+1}",
                "status": status,
                "people_detected": random.randint(0, 50) if status == "online" else 0,
                "is_recording": status == "online",
                "location_description": random.choice(locations),
                "last_online": now_utc() - timedelta(hours=random.randint(0, 48)) if status == "online" else None,
                "last_offline": now_utc() - timedelta(hours=random.randint(1, 24)) if status == "offline" else None,
            })
            cctv_count += 1

    batch2.commit()
    print(f"  Seeded {cctv_count} CCTV devices")

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

    inspector_refs = []
    batch3 = db.batch()
    for name, eid, state, dist, spec in inspector_data:
        ref = db.collection("inspectors").document()
        batch3.set(ref, {
            "name": name, "employee_id": eid, "state": state, "district": dist,
            "specialization": spec, "is_available": random.choice([True, True, True, False]),
            "current_load": random.randint(0, 3), "total_inspections": random.randint(5, 30),
        })
        inspector_refs.append(ref)
    batch3.commit()
    inspector_ids = [ref.id for ref in inspector_refs]

    # ── Inspections ────────────────────────────────────────────────
    statuses = ["pending", "in_progress", "completed", "completed", "completed", "cancelled"]
    types = ["surprise", "surprise", "scheduled", "follow_up"]
    compliance = ["compliant", "non_compliant", "partial"]

    batch4 = db.batch()
    insp_count = 0
    for inst_id in inst_docs:
        inst_info = institute_data[inst_docs.index(inst_id)]
        num_inspections = random.randint(2, 5)
        for _ in range(num_inspections):
            status = random.choice(statuses)
            ref = db.collection("inspections").document()
            batch4.set(ref, {
                "institute_id": inst_id,
                "inspector_id": random.choice(inspector_ids) if status != "pending" else None,
                "type": random.choice(types),
                "status": status,
                "gps_verified": random.choice([True, True, False]),
                "compliance_status": random.choice(compliance) if status == "completed" else None,
                "notes": f"{'Routine' if status == 'completed' else 'Scheduled'} inspection at {inst_info[4]}",
                "latitude": inst_info[5] + random.uniform(-0.01, 0.01),
                "longitude": inst_info[6] + random.uniform(-0.01, 0.01),
                "created_at": now_utc() - timedelta(days=random.randint(1, 60)),
                "completed_date": now_utc() - timedelta(days=random.randint(0, 30)) if status == "completed" else None,
            })
            insp_count += 1
    batch4.commit()
    print(f"  Seeded {insp_count} inspections")

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

    batch5 = db.batch()
    alert_count = 0
    for inst_id in inst_docs:
        inst_info = institute_data[inst_docs.index(inst_id)]
        num_alerts = random.randint(1, 3)
        for _ in range(num_alerts):
            tpl = random.choice(alert_templates)
            ref = db.collection("alerts").document()
            batch5.set(ref, {
                "institute_id": inst_id, "type": tpl[0], "severity": tpl[1],
                "title": tpl[2], "message": f"{tpl[3]} — {inst_info[0]}",
                "is_resolved": random.choice([True, False]),
                "created_at": now_utc() - timedelta(hours=random.randint(1, 120)),
            })
            alert_count += 1
    batch5.commit()
    print(f"  Seeded {alert_count} alerts")

    # ── Attendance Records ─────────────────────────────────────────
    batch6 = db.batch()
    att_count = 0
    for inst_id in inst_docs:
        inst_info = institute_data[inst_docs.index(inst_id)]
        reported = inst_info[10]  # reported_beneficiaries
        for day_offset in range(7):
            actual = int(reported * random.uniform(0.4, 1.1))
            disc = abs(reported - actual) / max(reported, 1) * 100
            ref = db.collection("attendance_records").document()
            batch6.set(ref, {
                "institute_id": inst_id,
                "date": now_utc() - timedelta(days=day_offset),
                "reported_count": reported,
                "ai_detected_count": actual,
                "discrepancy_percentage": round(disc, 1),
                "cctv_source": f"CAM-{inst_docs.index(inst_id)+1}-01",
                "is_verified": disc < 10,
                "created_at": now_utc() - timedelta(days=day_offset),
            })
            att_count += 1
    batch6.commit()
    print(f"  Seeded {att_count} attendance records")

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

    batch7 = db.batch()
    comp_count = 0
    for inst_id in inst_docs:
        num_complaints = random.randint(0, 3)
        for _ in range(num_complaints):
            tpl = random.choice(complaint_data)
            ref = db.collection("complaints").document()
            batch7.set(ref, {
                "institute_id": inst_id,
                "beneficiary_name": "Anonymous" if random.choice([True, False]) else f"Beneficiary {random.randint(1,100)}",
                "category": tpl[0], "description": tpl[1],
                "status": random.choice(["pending", "investigating", "resolved"]),
                "is_anonymous": random.choice([True, False]),
                "created_at": now_utc() - timedelta(days=random.randint(1, 30)),
            })
            comp_count += 1
    batch7.commit()
    print(f"  Seeded {comp_count} complaints")

    # ── Beneficiaries ──────────────────────────────────────────────
    first_names = ["Amit", "Priya", "Rahul", "Sunita", "Deepak", "Meena", "Vikram", "Neha", "Suresh", "Kavita"]
    last_names = ["Kumar", "Devi", "Singh", "Rani", "Sharma", "Gupta", "Verma", "Joshi", "Patel", "Rao"]

    batch8 = db.batch()
    ben_count = 0
    for inst_id in inst_docs:
        num_ben = random.randint(3, 6)
        for _ in range(num_ben):
            ref = db.collection("beneficiaries").document()
            batch8.set(ref, {
                "institute_id": inst_id,
                "name": f"{random.choice(first_names)} {random.choice(last_names)}",
                "service_received": random.choice([True, True, True, False]),
                "service_rating": random.randint(1, 5),
                "feedback": random.choice([None, "Good service", "Needs improvement", "Satisfied", None]),
                "attendance_confirmed": random.choice([True, True, False]),
                "created_at": now_utc(),
            })
            ben_count += 1
    batch8.commit()
    print(f"  Seeded {ben_count} beneficiaries")

    # ── Video Calls ────────────────────────────────────────────────
    vc_statuses = ["completed", "completed", "completed", "missed", "scheduled"]
    roles = ["project_incharge", "staff", "beneficiary"]

    batch9 = db.batch()
    vc_count = 0
    for inst_id in inst_docs:
        num_vc = random.randint(1, 3)
        for _ in range(num_vc):
            status = random.choice(vc_statuses)
            started = now_utc() - timedelta(days=random.randint(1, 15), hours=random.randint(0, 12))
            duration = random.randint(60, 1800) if status == "completed" else 0
            inst_idx = inst_docs.index(inst_id)
            ref = db.collection("video_calls").document()
            batch9.set(ref, {
                "institute_id": inst_id,
                "initiated_by": "Dileep Bairwa",
                "called_person": f"{random.choice(first_names)} {random.choice(last_names)}",
                "role": random.choice(roles), "status": status,
                "scheduled_time": started,
                "started_at": started if status in ["completed", "in_progress"] else None,
                "ended_at": started + timedelta(seconds=duration) if status == "completed" else None,
                "duration_seconds": duration,
                "location_verified": random.choice([True, False]),
                "latitude": institute_data[inst_idx][5] + random.uniform(-0.005, 0.005),
                "longitude": institute_data[inst_idx][6] + random.uniform(-0.005, 0.005),
                "notes": f"{'Routine verification' if status == 'completed' else 'Unanswered'} call",
                "created_at": now_utc(),
            })
            vc_count += 1
    batch9.commit()
    print(f"  Seeded {vc_count} video calls")

    # ── Risk Scores ────────────────────────────────────────────────
    batch10 = db.batch()
    for inst_id in inst_docs:
        inst_idx = inst_docs.index(inst_id)
        ref = db.collection("risk_scores").document()
        batch10.set(ref, {
            "institute_id": inst_id,
            "attendance_mismatch_score": random.randint(0, 30),
            "cctv_offline_score": random.randint(0, 20),
            "inspection_violation_score": random.randint(0, 30),
            "complaint_score": random.randint(0, 15),
            "location_anomaly_score": random.randint(0, 15),
            "delayed_report_score": random.randint(0, 10),
            "total_score": institute_data[inst_idx][7],  # risk_score
            "calculated_at": now_utc(),
        })
    batch10.commit()

    print(f"✅ Seed complete! {len(institute_data)} institutes, {len(users_data)} users, {len(inspector_data)} inspectors")


if __name__ == "__main__":
    seed()
