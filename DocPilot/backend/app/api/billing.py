from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.core.dependencies import (
    get_current_user,
)

router = APIRouter()


@router.get("/me")
def get_plan(
    current_user=Depends(get_current_user),
):

    return {
        "username": current_user.username,
        "plan": current_user.plan,
    }


@router.post("/upgrade")
def upgrade_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    current_user.plan = "pro"

    db.commit()

    db.refresh(current_user)

    return {
        "message": "Upgraded to pro plan.",
        "plan": current_user.plan,
    }


@router.post("/downgrade")
def downgrade_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    current_user.plan = "free"

    db.commit()

    db.refresh(current_user)

    return {
        "message": "Downgraded to free plan.",
        "plan": current_user.plan,
    }
