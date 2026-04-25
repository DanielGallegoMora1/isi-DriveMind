from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.application import auth_use_cases
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.user_repository import SqlUserRepository
from app.presentation.dependencies import CurrentUserDep
from app.presentation.schemas import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    LoginResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: DbDep) -> LoginResponse:
    user_repo = SqlUserRepository(db)
    try:
        result = auth_use_cases.login(body.email, body.password, user_repo)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return LoginResponse(
        access_token=result["access_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"],
        user=UserResponse(**result["user"].__dict__),
    )


@router.get("/me", response_model=UserResponse)
def me(db: DbDep, current: CurrentUserDep) -> UserResponse:
    user_repo = SqlUserRepository(db)
    try:
        user = auth_use_cases.get_me(UUID(current["sub"]), user_repo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found"
        )
    return UserResponse(**user.__dict__)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    body: ChangePasswordRequest, db: DbDep, current: CurrentUserDep
) -> ChangePasswordResponse:
    user_repo = SqlUserRepository(db)

    try:
        auth_use_cases.change_password(
            UUID(current["sub"]),
            body.current_password,
            body.new_password,
            user_repo,
        )
    except ValueError as e:
        code = str(e)
        if code == "user_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found"
            )
        if code == "invalid_current_password":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_current_password",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=code)

    return ChangePasswordResponse(message="password_changed")
