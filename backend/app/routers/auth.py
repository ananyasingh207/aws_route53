from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    COOKIE_SAMESITE,
    COOKIE_SECURE,
)
from app.dependencies import get_db, get_current_user
from app.models import User
from app.schemas import AuthResponse, LoginRequest, UserResponse
from app.services.auth_service import create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=AuthResponse, summary="User login endpoint")
async def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)

    # Set HttpOnly cookie for session persistence (supports production cross-site HTTPS SameSite=none Secure=True)
    response.set_cookie(
        key="route53_session",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthResponse(
        message="Login successful",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)


@router.post("/logout", summary="User logout endpoint")
async def logout(response: Response):
    response.delete_cookie(
        key="route53_session",
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    return {"message": "Logout successful"}
