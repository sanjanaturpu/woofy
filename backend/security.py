"""Password hashing and JWT helpers."""
import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
JWT_SECRET = os.getenv("WOOFY_JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("WOOFY_JWT_EXPIRE_MINUTES", "720"))

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)

def create_access_token(user_id: int) -> str:
    if not JWT_SECRET:
        raise RuntimeError("WOOFY_JWT_SECRET is not configured.")
    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expires}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        return None
