reset_tokens = {}

import secrets

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    OAuth2PasswordRequestForm,
)

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.user import User

from app.schemas.auth import (
    UserCreate,
)

from app.schemas.password import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.core.dependencies import (
    get_current_user,
)

router = APIRouter()


@router.post("/signup")
def signup(
    user: UserCreate,
    db: Session = Depends(get_db),
):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {"message": "User created successfully"}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    if not verify_password(
        form_data.password,
        db_user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    access_token = create_access_token(data={"sub": db_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "plan": current_user.plan,
    }


@router.post("/forgot-password")
def forgot_password(
    email_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    user = db.query(User).filter(User.email == email_data.email).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    token = secrets.token_hex(16)

    reset_tokens[token] = user.email

    return {"reset_token": token}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    token = data.token

    new_password = data.new_password

    if token not in reset_tokens:

        raise HTTPException(
            status_code=400,
            detail="Invalid token",
        )

    email = reset_tokens[token]

    user = db.query(User).filter(User.email == email).first()

    user.hashed_password = hash_password(new_password)

    db.commit()

    del reset_tokens[token]

    return {"message": "Password reset successful"}
