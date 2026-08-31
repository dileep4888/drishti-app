"""DRISHTI AI — Vercel Serverless Backend.

All models, routes, and seed data consolidated into a single file
for Vercel's Python runtime (no relative imports needed).
"""
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Configuration ───────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "drishti-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./drishti.db")
if DATABASE_URL.startswith("mysql"):
    DATABASE_URL = "sqlite:///./drishti.db"

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def now_utc():
    return datetime.now(timezone.utc)


# ── Password & Token Helpers ────────────────────────────────────────────

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta=None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = "", db: Session = Depends(get_db)):
    cred_exc = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise cred_exc
    return user


# ── SQLAlchemy Models ───────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="department_official")
    phone = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)


class Institute(Base):
    __tablename__ = "institutes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    scheme = Column(String(255), nullable=True)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="low")
    trust_score = Column(Integer, default=100)
    reported_beneficiaries = Column(Integer, default=0)
    reported_staff = Column(Integer, default=0)
    status = Column(String(50), default="active")
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    cctv_devices = relationship("CCTVDevice", back_populates="institute")
    inspections = relationship("Inspection", back_populates="institute")
    alerts = relationship("Alert", back_populates="institute")
    complaints = relationship("Complaint", back_populates="institute")
    attendance_records = relationship("AttendanceRecord", back_populates="institute")
    beneficiaries = relationship("Beneficiary", back_populates="institute")


class CCTVDevice(Base):
    __tablename__ = "cctv_devices"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    name = Column(String(255), nullable=False)
    rtsp_url = Column(String(500), nullable=True)
    status = Column(String(20), default="online")
    last_online = Column(DateTime, nullable=True)
    last_offline = Column(DateTime, nullable=True)
    location_description = Column(String(255), nullable=True)
    people_detected = Column(Integer, default=0)
    is_recording = Column(Boolean, default=True)
    institute = relationship("Institute", back_populates="cctv_devices")


class Inspector(Base):
    __tablename__ = "inspectors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True)
    current_load = Column(Integer, default=0)
    total_inspections = Column(Integer, default=0)
    inspections = relationship("Inspection", back_populates="inspector")


class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    inspector_id = Column(Integer, ForeignKey("inspectors.id"), nullable=True)
    type = Column(String(50), default="surprise")
    status = Column(String(50), default="pending")
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_verified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    compliance_status = Column(String(50), nullable=True)
    checklist_items = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    institute = relationship("Institute", back_populates="inspections")
    inspector = relationship("Inspector", back_populates="inspections")
    evidence = relationship("Evidence", back_populates="inspection")


class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    type = Column(String(50), nullable=False)
    file_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=now_utc)
    metadata_json = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    inspection = relationship("Inspection", back_populates="evidence")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    date = Column(DateTime, nullable=False)
    reported_count = Column(Integer, default=0)
    ai_detected_count = Column(Integer, default=0)
    discrepancy_percentage = Column(Float, default=0.0)
    cctv_source = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)
    institute = relationship("Institute", back_populates="attendance_records")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=True)
    type = Column(String(50), nullable=False)
    severity = Column(String(20), default="warning")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    institute = relationship("Institute", back_populates="alerts")


class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    beneficiary_name = Column(String(255), nullable=True)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="pending")
    sentiment_score = Column(Float, nullable=True)
    ai_category = Column(String(255), nullable=True)
    is_anonymous = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    institute = relationship("Institute", back_populates="complaints")


class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    name = Column(String(255), nullable=False)
    service_received = Column(Boolean, default=True)
    service_rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    attendance_confirmed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    institute = relationship("Institute", back_populates="beneficiaries")


class VideoCall(Base):
    __tablename__ = "video_calls"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    initiated_by = Column(String(255), nullable=True)
    called_person = Column(String(255), nullable=True)
    role = Column(String(50), nullable=True)
    status = Column(String(50), default="scheduled")
    scheduled_time = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    location_verified = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    recording_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)


class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    attendance_mismatch_score = Column(Integer, default=0)
    cctv_offline_score = Column(Integer, default=0)
    inspection_violation_score = Column(Integer, default=0)
    complaint_score = Column(Integer, default=0)
    location_anomaly_score = Column(Integer, default=0)
    delayed_report_score = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    calculated_at = Column(DateTime, default=now_utc)


# ── Seed Data ───────────────────────────────────────────────────────────

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(User).first():
        db.close()
        return
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
        inst = Institute(name=name, type=typ, scheme=scheme, state=state, district=dist,
                         latitude=lat, longitude=lng, risk_score=risk, risk_level=rlevel,
                         trust_score=trust, reported_beneficiaries=ben, reported_staff=staff,
                         contact_person=f"Contact - {name[:15]}",
                         contact_phone=f"+91-{random.randint(70000,99999)}{random.randint(10000,99999)}",
                         status="active")
        institutes.append(inst)
    db.add_all(institutes)
    db.flush()

    locations = ["Main Gate", "Classroom A", "Classroom B", "Playground", "Staff Room", "Entrance Hall", "Office", "Corridor"]
    for inst in institutes:
        for j in range(random.randint(2, 5)):
            status = random.choices(["online", "offline"], weights=[80, 20])[0]
            db.add(CCTVDevice(institute_id=inst.id,
                              name=f"CAM-{inst.id}-{j+1:02d} - {random.choice(locations)}",
                              rtsp_url=f"rtsp://192.168.{inst.id}.{j+10}:554/stream{j+1}",
                              status=status, people_detected=random.randint(0, 50) if status == "online" else 0,
                              is_recording=status == "online", location_description=random.choice(locations),
                              last_online=now_utc() - timedelta(hours=random.randint(0, 48)) if status == "online" else None,
                              last_offline=now_utc() - timedelta(hours=random.randint(1, 24)) if status == "offline" else None))
    db.flush()

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
        insp = Inspector(name=name, employee_id=eid, state=state, district=dist,
                         specialization=spec, is_available=random.choice([True, True, True, False]),
                         current_load=random.randint(0, 3), total_inspections=random.randint(5, 30))
        inspectors.append(insp)
    db.add_all(inspectors)
    db.flush()

    for inst in institutes:
        for _ in range(random.randint(2, 5)):
            status = random.choice(["pending", "in_progress", "completed", "completed", "completed", "cancelled"])
            db.add(Inspection(institute_id=inst.id,
                              inspector_id=random.choice(inspectors).id if status != "pending" else None,
                              type=random.choice(["surprise", "surprise", "scheduled", "follow_up"]),
                              status=status, gps_verified=random.choice([True, True, False]),
                              compliance_status=random.choice(["compliant", "non_compliant", "partial"]) if status == "completed" else None,
                              notes=f"{'Routine' if status == 'completed' else 'Scheduled'} inspection at {inst.district}",
                              latitude=inst.latitude + random.uniform(-0.01, 0.01),
                              longitude=inst.longitude + random.uniform(-0.01, 0.01),
                              created_at=now_utc() - timedelta(days=random.randint(1, 60)),
                              completed_date=now_utc() - timedelta(days=random.randint(0, 30)) if status == "completed" else None))
    db.flush()

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
        for _ in range(random.randint(1, 3)):
            tpl = random.choice(alert_templates)
            db.add(Alert(institute_id=inst.id, type=tpl[0], severity=tpl[1], title=tpl[2],
                         message=f"{tpl[3]} — {inst.name}", is_resolved=random.choice([True, False]),
                         created_at=now_utc() - timedelta(hours=random.randint(1, 120))))
    db.flush()

    for inst in institutes:
        for day_offset in range(7):
            reported = inst.reported_beneficiaries
            actual = int(reported * random.uniform(0.4, 1.1))
            disc = abs(reported - actual) / max(reported, 1) * 100
            db.add(AttendanceRecord(institute_id=inst.id, date=now_utc() - timedelta(days=day_offset),
                                    reported_count=reported, ai_detected_count=actual,
                                    discrepancy_percentage=round(disc, 1), cctv_source=f"CAM-{inst.id}-01",
                                    is_verified=disc < 10))
    db.flush()

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
        for _ in range(random.randint(0, 3)):
            tpl = random.choice(complaint_data)
            db.add(Complaint(institute_id=inst.id,
                             beneficiary_name="Anonymous" if random.choice([True, False]) else f"Beneficiary {random.randint(1,100)}",
                             category=tpl[0], description=tpl[1],
                             status=random.choice(["pending", "investigating", "resolved"]),
                             is_anonymous=random.choice([True, False]),
                             created_at=now_utc() - timedelta(days=random.randint(1, 30))))
    db.flush()

    first_names = ["Amit", "Priya", "Rahul", "Sunita", "Deepak", "Meena", "Vikram", "Neha", "Suresh", "Kavita"]
    last_names = ["Kumar", "Devi", "Singh", "Rani", "Sharma", "Gupta", "Verma", "Joshi", "Patel", "Rao"]
    for inst in institutes:
        for _ in range(random.randint(3, 6)):
            db.add(Beneficiary(institute_id=inst.id,
                               name=f"{random.choice(first_names)} {random.choice(last_names)}",
                               service_received=random.choice([True, True, True, False]),
                               service_rating=random.randint(1, 5),
                               feedback=random.choice([None, "Good service", "Needs improvement", "Satisfied", None]),
                               attendance_confirmed=random.choice([True, True, False])))
    db.flush()

    for inst in institutes:
        for _ in range(random.randint(1, 3)):
            status = random.choice(["completed", "completed", "completed", "missed", "scheduled"])
            started = now_utc() - timedelta(days=random.randint(1, 15), hours=random.randint(0, 12))
            duration = random.randint(60, 1800) if status == "completed" else 0
            db.add(VideoCall(institute_id=inst.id, initiated_by="Dileep Bairwa",
                             called_person=f"{random.choice(first_names)} {random.choice(last_names)}",
                             role=random.choice(["project_incharge", "staff", "beneficiary"]),
                             status=status, scheduled_time=started,
                             started_at=started if status in ["completed", "in_progress"] else None,
                             ended_at=started + timedelta(seconds=duration) if status == "completed" else None,
                             duration_seconds=duration, location_verified=random.choice([True, False]),
                             latitude=inst.latitude + random.uniform(-0.005, 0.005),
                             longitude=inst.longitude + random.uniform(-0.005, 0.005),
                             notes=f"{'Routine verification' if status == 'completed' else 'Unanswered'} call"))
    db.flush()

    for inst in institutes:
        db.add(RiskScore(institute_id=inst.id,
                         attendance_mismatch_score=random.randint(0, 30),
                         cctv_offline_score=random.randint(0, 20),
                         inspection_violation_score=random.randint(0, 30),
                         complaint_score=random.randint(0, 15),
                         location_anomaly_score=random.randint(0, 15),
                         delayed_report_score=random.randint(0, 10),
                         total_score=inst.risk_score))
    db.commit()
    db.close()
    print("Seed complete.")


# ── FastAPI App ─────────────────────────────────────────────────────────

app = FastAPI(title="DRISHTI AI", version="3.0.0",
              description="Digital Real-time Intelligent Surveillance, Tracking & Inspection System")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# Startup seed
try:
    seed()
except Exception as e:
    print(f"Seed error (non-fatal): {e}")

# ── Auth Routes ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "department_official"
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

class RegisterResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    access_token: str

class LoginResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    access_token: str


@app.post("/auth/register", response_model=RegisterResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=req.name, email=req.email, hashed_password=get_password_hash(req.password),
                role=req.role, phone=req.phone, state=req.state, district=req.district)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.email})
    return RegisterResponse(id=user.id, name=user.name, email=user.email, role=user.role, access_token=token)


@app.post("/auth/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(data={"sub": user.email})
    return LoginResponse(id=user.id, name=user.name, email=user.email, role=user.role, access_token=token)


# ── Dashboard Stats ────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "active_projects": db.query(Institute).count(),
        "total_institutes": db.query(Institute).count(),
        "live_cctv_cameras": db.query(CCTVDevice).filter(CCTVDevice.status == "online").count(),
        "total_cctv_cameras": db.query(CCTVDevice).count(),
        "inspections_today": db.query(Inspection).count(),
        "pending_inspections": db.query(Inspection).filter(Inspection.status == "pending").count(),
        "completed_inspections": db.query(Inspection).filter(Inspection.status == "completed").count(),
        "high_risk_locations": db.query(Institute).filter(Institute.risk_score >= 61).count(),
        "medium_risk_locations": db.query(Institute).filter(Institute.risk_score.between(31, 60)).count(),
        "low_risk_locations": db.query(Institute).filter(Institute.risk_score.between(0, 30)).count(),
        "anomalies_detected": db.query(Alert).filter(Alert.is_resolved == False).count(),
        "unresolved_alerts": db.query(Alert).filter(Alert.is_resolved == False).count(),
        "total_complaints": db.query(Complaint).count(),
        "pending_complaints": db.query(Complaint).filter(Complaint.status == "pending").count(),
        "total_beneficiaries": db.query(Beneficiary).count(),
    }


# ── Institutes ─────────────────────────────────────────────────────────

def _ser_inst(inst, db):
    return {
        "id": inst.id, "name": inst.name, "type": inst.type, "scheme": inst.scheme,
        "state": inst.state, "district": inst.district, "address": inst.address,
        "latitude": inst.latitude, "longitude": inst.longitude,
        "risk_score": inst.risk_score, "risk_level": inst.risk_level, "trust_score": inst.trust_score,
        "reported_beneficiaries": inst.reported_beneficiaries, "reported_staff": inst.reported_staff,
        "status": inst.status, "contact_person": inst.contact_person,
        "cctv_online": db.query(CCTVDevice).filter(CCTVDevice.institute_id == inst.id, CCTVDevice.status == "online").count(),
        "cctv_total": db.query(CCTVDevice).filter(CCTVDevice.institute_id == inst.id).count(),
        "complaint_count": db.query(Complaint).filter(Complaint.institute_id == inst.id).count(),
        "active_alerts": db.query(Alert).filter(Alert.institute_id == inst.id, Alert.is_resolved == False).count(),
    }


@app.get("/api/institutes")
def get_institutes(risk_level: str = None, state: str = None, type: str = None,
                   db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Institute)
    if risk_level: q = q.filter(Institute.risk_level == risk_level)
    if state: q = q.filter(Institute.state == state)
    if type: q = q.filter(Institute.type == type)
    return [_ser_inst(i, db) for i in q.order_by(Institute.risk_score.desc()).all()]


@app.get("/api/institutes/{institute_id}")
def get_institute_detail(institute_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inst = db.query(Institute).filter(Institute.id == institute_id).first()
    if not inst: raise HTTPException(status_code=404, detail="Institute not found")
    data = _ser_inst(inst, db)
    data["cctv_devices"] = [{"id": c.id, "name": c.name, "status": c.status, "people_detected": c.people_detected,
                             "is_recording": c.is_recording, "location": c.location_description} for c in inst.cctv_devices]
    data["inspections"] = [{"id": i.id, "type": i.type, "status": i.status, "gps_verified": i.gps_verified,
                            "compliance_status": i.compliance_status, "created_at": i.created_at.isoformat() if i.created_at else None} for i in inst.inspections[:10]]
    data["complaints"] = [{"id": c.id, "category": c.category, "description": c.description,
                           "status": c.status, "created_at": c.created_at.isoformat() if c.created_at else None} for c in inst.complaints[:10]]
    data["alerts"] = [{"id": a.id, "type": a.type, "severity": a.severity, "title": a.title,
                       "is_resolved": a.is_resolved, "created_at": a.created_at.isoformat() if a.created_at else None} for a in inst.alerts[:10]]
    data["attendance_records"] = [{"id": ar.id, "date": ar.date.isoformat() if ar.date else None,
                                   "reported_count": ar.reported_count, "ai_detected_count": ar.ai_detected_count,
                                   "discrepancy_percentage": ar.discrepancy_percentage} for ar in inst.attendance_records[:10]]
    data["beneficiaries"] = [{"id": b.id, "name": b.name, "service_received": b.service_received,
                              "service_rating": b.service_rating} for b in inst.beneficiaries[:10]]
    return data


# ── Inspections ────────────────────────────────────────────────────────

@app.get("/api/inspections")
def get_inspections(status: str = None, type: str = None,
                    db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Inspection)
    if status: q = q.filter(Inspection.status == status)
    if type: q = q.filter(Inspection.type == type)
    results = []
    for insp in q.order_by(Inspection.created_at.desc()).all():
        inst = db.query(Institute).filter(Institute.id == insp.institute_id).first()
        inspector = db.query(Inspector).filter(Inspector.id == insp.inspector_id).first()
        results.append({"id": insp.id, "institute_id": insp.institute_id,
                        "institute_name": inst.name if inst else "Unknown", "institute_district": inst.district if inst else "",
                        "inspector_name": inspector.name if inspector else "Unassigned", "inspector_id": inspector.employee_id if inspector else None,
                        "type": insp.type, "status": insp.status, "gps_verified": insp.gps_verified,
                        "compliance_status": insp.compliance_status, "notes": insp.notes,
                        "created_at": insp.created_at.isoformat() if insp.created_at else None,
                        "completed_date": insp.completed_date.isoformat() if insp.completed_date else None})
    return results


@app.post("/api/inspections/{inspection_id}/assign-random")
def assign_random_inspector(inspection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection: raise HTTPException(status_code=404, detail="Inspection not found")
    if inspection.inspector_id: raise HTTPException(status_code=400, detail="Inspector already assigned")
    recent_ids = [i.inspector_id for i in db.query(Inspection).filter(
        Inspection.institute_id == inspection.institute_id, Inspection.inspector_id.isnot(None)
    ).order_by(Inspection.created_at.desc()).limit(3).all()]
    available = db.query(Inspector).filter(Inspector.is_available == True,
        Inspector.id.notin_(recent_ids) if recent_ids else True).all()
    if not available: available = db.query(Inspector).filter(Inspector.is_available == True).all()
    if not available: raise HTTPException(status_code=404, detail="No available inspectors")
    chosen = random.choice(available)
    inspection.inspector_id = chosen.id
    inspection.status = "pending"
    chosen.current_load += 1
    db.commit()
    return {"message": f"Inspector {chosen.name} ({chosen.employee_id}) assigned", "inspector_id": chosen.id}


# ── Alerts ─────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(severity: str = None, resolved: bool = None,
               db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Alert)
    if severity: q = q.filter(Alert.severity == severity)
    if resolved is not None: q = q.filter(Alert.is_resolved == resolved)
    results = []
    for a in q.order_by(Alert.created_at.desc()).all():
        inst = db.query(Institute).filter(Institute.id == a.institute_id).first()
        results.append({"id": a.id, "institute_id": a.institute_id, "institute_name": inst.name if inst else "System",
                        "type": a.type, "severity": a.severity, "title": a.title, "message": a.message,
                        "is_resolved": a.is_resolved, "created_at": a.created_at.isoformat() if a.created_at else None})
    return results


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert: raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolved_at = now_utc()
    alert.resolved_by = user.name
    db.commit()
    return {"message": "Alert resolved"}


# ── CCTV ───────────────────────────────────────────────────────────────

@app.get("/api/cctv")
def get_cctv_devices(status: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(CCTVDevice)
    if status: q = q.filter(CCTVDevice.status == status)
    results = []
    for d in q.all():
        inst = db.query(Institute).filter(Institute.id == d.institute_id).first()
        results.append({"id": d.id, "institute_id": d.institute_id, "institute_name": inst.name if inst else "Unknown",
                        "name": d.name, "status": d.status, "people_detected": d.people_detected,
                        "is_recording": d.is_recording, "location": d.location_description,
                        "rtsp_url": d.rtsp_url, "last_online": d.last_online.isoformat() if d.last_online else None})
    return results


# ── Complaints ─────────────────────────────────────────────────────────

@app.get("/api/complaints")
def get_complaints(category: str = None, status: str = None,
                   db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Complaint)
    if category: q = q.filter(Complaint.category == category)
    if status: q = q.filter(Complaint.status == status)
    results = []
    for c in q.order_by(Complaint.created_at.desc()).all():
        inst = db.query(Institute).filter(Institute.id == c.institute_id).first()
        results.append({"id": c.id, "institute_id": c.institute_id, "institute_name": inst.name if inst else "Unknown",
                        "beneficiary_name": c.beneficiary_name, "category": c.category, "description": c.description,
                        "status": c.status, "ai_category": c.ai_category, "is_anonymous": c.is_anonymous,
                        "created_at": c.created_at.isoformat() if c.created_at else None})
    return results


# ── Analytics ──────────────────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    risk_dist = [
        {"name": "Low Risk", "value": db.query(Institute).filter(Institute.risk_level == "low").count(), "color": "#22c55e"},
        {"name": "Medium Risk", "value": db.query(Institute).filter(Institute.risk_level == "medium").count(), "color": "#eab308"},
        {"name": "High Risk", "value": db.query(Institute).filter(Institute.risk_level == "high").count(), "color": "#ef4444"},
        {"name": "Critical", "value": db.query(Institute).filter(Institute.risk_level == "critical").count(), "color": "#7c2d12"},
    ]
    insp_status = [
        {"name": "Pending", "value": db.query(Inspection).filter(Inspection.status == "pending").count()},
        {"name": "In Progress", "value": db.query(Inspection).filter(Inspection.status == "in_progress").count()},
        {"name": "Completed", "value": db.query(Inspection).filter(Inspection.status == "completed").count()},
        {"name": "Cancelled", "value": db.query(Inspection).filter(Inspection.status == "cancelled").count()},
    ]
    complaint_cats = [{"name": c[0], "value": c[1]} for c in db.query(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category).all()]
    alert_types = [{"name": a[0], "value": a[1]} for a in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all()]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    attendance_comparison = []
    for a in db.query(AttendanceRecord).all():
        inst = db.query(Institute).filter(Institute.id == a.institute_id).first()
        attendance_comparison.append({"name": inst.name[:15] if inst else "Unknown", "reported": a.reported_count, "actual": a.ai_detected_count})
    return {
        "risk_distribution": risk_dist, "inspection_status": insp_status,
        "complaint_categories": complaint_cats, "alert_types": alert_types,
        "inspection_trend": [{"month": m, "inspections": random.randint(20, 80), "complaints": random.randint(5, 25)} for m in months],
        "attendance_comparison": attendance_comparison,
        "cctv_status": [{"name": "Online", "value": db.query(CCTVDevice).filter(CCTVDevice.status == "online").count(), "color": "#22c55e"},
                        {"name": "Offline", "value": db.query(CCTVDevice).filter(CCTVDevice.status == "offline").count(), "color": "#ef4444"}],
    }


# ── Risk Map ───────────────────────────────────────────────────────────

@app.get("/api/risk-map")
def get_risk_map(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": i.id, "name": i.name, "type": i.type, "lat": i.latitude, "lng": i.longitude,
             "risk_score": i.risk_score, "risk_level": i.risk_level, "trust_score": i.trust_score, "district": i.district}
            for i in db.query(Institute).filter(Institute.latitude.isnot(None), Institute.longitude.isnot(None)).all()]


# ── Video Calls ────────────────────────────────────────────────────────

@app.get("/api/video-calls")
def get_video_calls(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = []
    for vc in db.query(VideoCall).order_by(VideoCall.created_at.desc()).all():
        inst = db.query(Institute).filter(Institute.id == vc.institute_id).first()
        results.append({"id": vc.id, "institute_id": vc.institute_id, "institute_name": inst.name if inst else "Unknown",
                        "initiated_by": vc.initiated_by, "called_person": vc.called_person, "role": vc.role,
                        "status": vc.status, "scheduled_time": vc.scheduled_time.isoformat() if vc.scheduled_time else None,
                        "started_at": vc.started_at.isoformat() if vc.started_at else None,
                        "ended_at": vc.ended_at.isoformat() if vc.ended_at else None,
                        "duration_seconds": vc.duration_seconds, "location_verified": vc.location_verified, "notes": vc.notes})
    return results


@app.post("/api/video-calls/initiate")
def initiate_vc(institute_id: int, called_person: str, role: str = "project_incharge",
                db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vc = VideoCall(institute_id=institute_id, initiated_by=user.name, called_person=called_person,
                   role=role, status="in_progress", started_at=now_utc())
    db.add(vc)
    db.commit()
    db.refresh(vc)
    return {"message": "Video call initiated", "call_id": vc.id}


@app.post("/api/video-calls/{call_id}/end")
def end_vc(call_id: int, notes: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vc = db.query(VideoCall).filter(VideoCall.id == call_id).first()
    if not vc: raise HTTPException(status_code=404, detail="Video call not found")
    vc.ended_at = now_utc()
    vc.status = "completed"
    vc.notes = notes
    if vc.started_at: vc.duration_seconds = int((vc.ended_at - vc.started_at).total_seconds())
    db.commit()
    return {"message": "Call ended", "duration": vc.duration_seconds}


# ── Beneficiaries ──────────────────────────────────────────────────────

@app.get("/api/beneficiaries")
def get_beneficiaries(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = []
    for b in db.query(Beneficiary).all():
        inst = db.query(Institute).filter(Institute.id == b.institute_id).first()
        results.append({"id": b.id, "institute_id": b.institute_id, "institute_name": inst.name if inst else "Unknown",
                        "name": b.name, "service_received": b.service_received, "service_rating": b.service_rating,
                        "feedback": b.feedback, "attendance_confirmed": b.attendance_confirmed})
    return results


# ── Predictive Inspection ──────────────────────────────────────────────

@app.get("/api/predictive-inspections")
def get_predictive_inspections(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    results = []
    for inst in db.query(Institute).order_by(Institute.risk_score.desc()).limit(5).all():
        reasons = []
        if inst.risk_score >= 61: reasons.append("High risk score")
        offline = db.query(CCTVDevice).filter(CCTVDevice.institute_id == inst.id, CCTVDevice.status == "offline").count()
        if offline > 0: reasons.append(f"{offline} CCTV cameras offline")
        comp = db.query(Complaint).filter(Complaint.institute_id == inst.id).count()
        if comp > 3: reasons.append(f"{comp} complaints received")
        latest = db.query(AttendanceRecord).filter(AttendanceRecord.institute_id == inst.id).order_by(AttendanceRecord.created_at.desc()).first()
        if latest and latest.discrepancy_percentage > 30: reasons.append(f"Attendance discrepancy: {latest.discrepancy_percentage:.0f}%")
        results.append({"institute_id": inst.id, "institute_name": inst.name, "risk_score": inst.risk_score,
                        "risk_level": inst.risk_level, "trust_score": inst.trust_score,
                        "priority": "HIGH" if inst.risk_score >= 61 else "MEDIUM" if inst.risk_score >= 31 else "LOW",
                        "reasons": reasons or ["Scheduled periodic inspection"]})
    return results


# ── Root ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"name": "DRISHTI AI", "version": "3.0.0", "backend": "Vercel Serverless + SQLite", "docs": "/docs", "status": "operational"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Vercel Handler ─────────────────────────────────────────────────────

try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None
