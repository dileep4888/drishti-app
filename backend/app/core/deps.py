from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None or "user_id" not in payload:
        raise credentials_error

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if user is None:
        raise credentials_error
    return user


def require_role(*allowed_roles: str):
    """
    Use as a route dependency to lock an endpoint to specific roles, e.g.:
    @router.get("/dashboard", dependencies=[Depends(require_role("department_official", "pmu_admin"))])
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not permitted to access this resource",
            )
        return current_user

    return role_checker
