from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

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

    # Set HttpOnly cookie for session persistence
    response.set_cookie(
        key="route53_session",
        value=token,
        httponly=True,
        secure=False,  # Set to False for local HTTP development
        samesite="lax",
        path="/",
        max_age=1800,  # 30 minutes
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
    )
    return {"message": "Logout successful"}
