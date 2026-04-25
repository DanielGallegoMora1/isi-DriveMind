from uuid import UUID
from app.infrastructure.config import settings
import jwt
from passlib.context import CryptContext

from app.domain.models import User
from app.domain.ports import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
TOKEN_EXPIRE_SECONDS = settings.access_token_expire_minutes * 60
MIN_PASSWORD_LENGTH = 8


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(user: User) -> str:
    payload: dict = {"sub": str(user.id), "role": user.role}
    # school_admin necesita su school_id en el token para filtrar sus propios alumnos
    if user.school_id is not None:
        payload["school_id"] = str(user.school_id)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def login(email: str, password: str, user_repo: UserRepository) -> dict:
    user = user_repo.get_by_email(email)
    if not user:
        raise ValueError("invalid_credentials")

    password_hash = user_repo.get_password_hash(email)
    if not password_hash or not _verify_password(password, password_hash):
        raise ValueError("invalid_credentials")

    if not user.is_active:
        raise ValueError("user_inactive")

    token = _create_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_SECONDS,
        "user": user,
    }


def get_me(user_id: UUID, user_repo: UserRepository) -> User:
    user = user_repo.get_by_id(user_id)
    if not user:
        raise ValueError("user_not_found")
    return user


def change_password(
    user_id: UUID,
    current_password: str,
    new_password: str,
    user_repo: UserRepository,
) -> None:
    user = user_repo.get_by_id(user_id)
    if not user:
        raise ValueError("user_not_found")

    if len(new_password) < MIN_PASSWORD_LENGTH:
        raise ValueError("password_too_short")

    password_hash = user_repo.get_password_hash(user.email)
    if not password_hash or not _verify_password(current_password, password_hash):
        raise ValueError("invalid_current_password")

    if _verify_password(new_password, password_hash):
        raise ValueError("password_must_be_different")

    user_repo.update_password_hash(user.id, _hash_password(new_password))


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise ValueError("invalid_token")
