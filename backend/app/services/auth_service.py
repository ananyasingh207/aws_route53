import os
import time
from typing import Optional
import jwt
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from app.models import User

password_hash = PasswordHash(hashers=[Argon2Hasher(), BcryptHasher()])

from app.config import (
    JWT_SECRET_KEY as SECRET_KEY,
    JWT_ALGORITHM as ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ROOT_USER_NAME,
    ROOT_USER_EMAIL,
    ROOT_USER_PASSWORD,
)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(user_id: int) -> str:
    expire = int(time.time()) + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def init_root_user(db: Session) -> None:
    """Idempotently creates root user from environment configuration if not already existing."""
    if not ROOT_USER_EMAIL or not ROOT_USER_PASSWORD:
        return

    existing_user = db.query(User).filter(User.email == ROOT_USER_EMAIL).first()
    if not existing_user:
        root_user = User(
            name=ROOT_USER_NAME or "Route53 Administrator",
            email=ROOT_USER_EMAIL,
            password=hash_password(ROOT_USER_PASSWORD),
        )
        db.add(root_user)
        db.commit()
        db.refresh(root_user)


init_dev_user = init_root_user

