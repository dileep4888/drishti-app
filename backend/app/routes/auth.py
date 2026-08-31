from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from ..database import get_firestore
from ..security import verify_password, get_password_hash, create_access_token
from ..models import now_utc

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
    id: str
    name: str
    email: str
    role: str
    access_token: str


class LoginResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    access_token: str


@router.post("/register", response_model=RegisterResponse)
def register(req: RegisterRequest):
    db = get_firestore()
    users_ref = db.collection("users")

    # Check if email already exists
    existing = list(users_ref.where("email", "==", req.email).limit(1).stream())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = {
        "name": req.name,
        "email": req.email,
        "hashed_password": get_password_hash(req.password),
        "role": req.role,
        "phone": req.phone,
        "state": req.state,
        "district": req.district,
        "is_active": True,
        "created_at": now_utc(),
    }

    _, doc_ref = users_ref.add(user_data)

    token = create_access_token(data={"sub": req.email})
    return RegisterResponse(
        id=doc_ref.id, name=req.name, email=req.email, role=req.role, access_token=token
    )


@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_firestore()
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", form.username).limit(1)
    docs = list(query.stream())

    if not docs:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_doc = docs[0]
    user_data = user_doc.to_dict()

    if not verify_password(form.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": form.username})
    return LoginResponse(
        id=user_doc.id, name=user_data["name"], email=user_data["email"],
        role=user_data["role"], access_token=token,
    )
