from typing import Optional
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.auth_service import decode_access_token


def get_current_user(
    route53_session: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to extract and validate the authenticated user.

    Accepts JWT from either:
      1. Authorization: Bearer <token> header (preferred for cross-site production)
      2. route53_session HttpOnly cookie (fallback for same-site local dev)
    """
    token: Optional[str] = None

    # Prefer Authorization header (avoids cross-site third-party cookie issues)
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    # Fallback to cookie
    if not token:
        token = route53_session

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session or expired token",
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session format",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


__all__ = ["get_db", "get_current_user"]
