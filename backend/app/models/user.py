from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("inspector", "pmu_admin", "department_official", "ngo_incharge", name="user_role"),
        nullable=False,
    )
    phone = Column(String(15), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
