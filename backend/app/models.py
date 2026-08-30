from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .database import Base


# ── Enums ──────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    DEPARTMENT_OFFICIAL = "department_official"
    STATE_AUTHORITY = "state_authority"
    DISTRICT_AUTHORITY = "district_authority"
    INSPECTOR = "inspector"
    NGO_INSTITUTE = "ngo_institute"
    BENEFICIARY = "beneficiary"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, enum.Enum):
    CCTV_OFFLINE = "cctv_offline"
    ATTENDANCE_MISMATCH = "attendance_mismatch"
    LOCATION_MISMATCH = "location_mismatch"
    COMPLAINT_SPIKE = "complaint_spike"
    INSPECTION_VIOLATION = "inspection_violation"
    HIGH_RISK = "high_risk"


class ComplaintCategory(str, enum.Enum):
    STAFF_ABSENT = "staff_absent"
    SERVICE_NOT_RECEIVED = "service_not_received"
    FAKE_ATTENDANCE = "fake_attendance"
    INFRASTRUCTURE = "infrastructure"
    MISBEHAVIOR = "misbehavior"
    OTHER = "other"


class ComplaintStatus(str, enum.Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class InspectionType(str, enum.Enum):
    SURPRISE = "surprise"
    SCHEDULED = "scheduled"
    FOLLOW_UP = "follow_up"


class InspectionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CCTVStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class VCStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"


# ── Models ─────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.DEPARTMENT_OFFICIAL.value)
    phone = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))




class Institute(Base):
    __tablename__ = "institutes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # NGO, Education, Health, etc.
    scheme = Column(String(255), nullable=True)  # Govt scheme name
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    risk_score = Column(Integer, default=0)  # 0-100
    risk_level = Column(String(20), default=RiskLevel.LOW.value)
    trust_score = Column(Integer, default=100)  # 0-100
    reported_beneficiaries = Column(Integer, default=0)
    reported_staff = Column(Integer, default=0)
    status = Column(String(50), default="active")
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    status = Column(String(20), default=CCTVStatus.ONLINE.value)
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
    current_load = Column(Integer, default=0)  # pending assignments
    total_inspections = Column(Integer, default=0)

    inspections = relationship("Inspection", back_populates="inspector")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    inspector_id = Column(Integer, ForeignKey("inspectors.id"), nullable=True)
    type = Column(String(50), default=InspectionType.SURPRISE.value)
    status = Column(String(50), default=InspectionStatus.PENDING.value)
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_verified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    compliance_status = Column(String(50), nullable=True)  # compliant, non_compliant, partial
    checklist_items = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institute = relationship("Institute", back_populates="inspections")
    inspector = relationship("Inspector", back_populates="inspections")
    evidence = relationship("Evidence", back_populates="inspection")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    type = Column(String(50), nullable=False)  # photo, video, audio, document
    file_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(Text, nullable=True)  # EXIF data, etc.
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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institute = relationship("Institute", back_populates="attendance_records")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=True)
    type = Column(String(50), nullable=False)
    severity = Column(String(20), default=AlertSeverity.WARNING.value)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institute = relationship("Institute", back_populates="alerts")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    beneficiary_name = Column(String(255), nullable=True)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=ComplaintStatus.PENDING.value)
    sentiment_score = Column(Float, nullable=True)  # NLP score -1 to 1
    ai_category = Column(String(255), nullable=True)  # AI-classified category
    is_anonymous = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institute = relationship("Institute", back_populates="complaints")


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    name = Column(String(255), nullable=False)
    service_received = Column(Boolean, default=True)
    service_rating = Column(Integer, nullable=True)  # 1-5
    feedback = Column(Text, nullable=True)
    attendance_confirmed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institute = relationship("Institute", back_populates="beneficiaries")


class VideoCall(Base):
    __tablename__ = "video_calls"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"))
    initiated_by = Column(String(255), nullable=True)  # official name
    called_person = Column(String(255), nullable=True)  # project incharge / staff
    role = Column(String(50), nullable=True)  # project_incharge, staff, beneficiary
    status = Column(String(50), default=VCStatus.SCHEDULED.value)
    scheduled_time = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    location_verified = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    recording_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
