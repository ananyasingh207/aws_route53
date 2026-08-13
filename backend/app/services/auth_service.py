import os
import time
from typing import Optional
import jwt
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from app.models import User

# Configure PasswordHash supporting Argon2 and Bcrypt
password_hash = PasswordHash(hashers=[Argon2Hasher(), BcryptHasher()])

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-development-secret-key-32chars")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def hash_password(password: str) -> str:
    """Hashes a plaintext password."""
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored hash."""
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(user_id: int) -> str:
    """Generates a signed JWT access token for a given user_id."""
    expire = int(time.time()) + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token. Returns payload dict or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def init_dev_user(db: Session) -> None:
    """Creates default development user (admin@example.com) if no user exists."""
    dev_email = "admin@example.com"
    existing_user = db.query(User).filter(User.email == dev_email).first()
    if not existing_user:
        dev_user = User(
            name="Route53 Administrator",
            email=dev_email,
            password=hash_password("password"),
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)
