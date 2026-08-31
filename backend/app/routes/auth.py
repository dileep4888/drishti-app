from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User
from ..security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "department_official"
    phone: str | None = None
    state: str | None = None
    district: str | None = None


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


@router.post("/register", response_model=RegisterResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        phone=req.phone,
        state=req.state,
        district=req.district,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email})
    return RegisterResponse(
        id=user.id, name=user.name, email=user.email, role=user.role, access_token=token
    )


@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.email})
    return LoginResponse(
        id=user.id, name=user.name, email=user.email, role=user.role, access_token=token
    )
