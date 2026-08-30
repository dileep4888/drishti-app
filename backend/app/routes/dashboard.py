from fastapi import APIRouter, Depends

from app.core.deps import require_role, get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/officials-only")
def officials_view(current_user: User = Depends(require_role("department_official", "pmu_admin"))):
    """
    Example of a locked-down route: only department officials and PMU admins
    can hit this. Inspectors/NGO users get a 403.
    Next step: replace this stub with real queries — institute risk scores,
    live inspection counts, flagged alerts, etc.
    """
    return {"message": f"Welcome {current_user.name}", "role": current_user.role}


@router.get("/me")
def whoami(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "role": current_user.role}
