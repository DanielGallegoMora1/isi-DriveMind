from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.config import settings
from app.infrastructure.database.repositories.postgres_question_repo import PostgresQuestionRepository
from app.infrastructure.database.repositories.postgres_test_repo import PostgresTestRepository
from app.infrastructure.database.repositories.postgres_stats_repo import PostgresStatsRepository
from app.application.manager_use_cases import TestManager
from app.presentation.errors import forbidden_problem, unauthorized_problem

def get_question_repo(db: Session = Depends(get_db)) -> PostgresQuestionRepository:
    return PostgresQuestionRepository(db)

def get_test_repo(db: Session = Depends(get_db)) -> PostgresTestRepository:
    return PostgresTestRepository(db)


def get_stats_repo(db: Session = Depends(get_db)) -> PostgresStatsRepository:
    return PostgresStatsRepository(db)

def get_test_manager(
    question_repo: PostgresQuestionRepository = Depends(get_question_repo),
    test_repo: PostgresTestRepository = Depends(get_test_repo),
    stats_repo: PostgresStatsRepository = Depends(get_stats_repo),
) -> TestManager:
    return TestManager(question_repo, test_repo, stats_repo)


bearer = HTTPBearer(auto_error=False)
BearerDep = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]


def get_current_payload(credentials: BearerDep) -> dict:
    if credentials is None:
        raise unauthorized_problem("missing_token")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except jwt.PyJWTError as exc:
        raise unauthorized_problem("invalid_token") from exc

    if "sub" not in payload:
        raise unauthorized_problem("invalid_token")

    return payload


CurrentPayloadDep = Annotated[dict, Depends(get_current_payload)]


def get_current_user_id(payload: CurrentPayloadDep) -> str:
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise unauthorized_problem("invalid_token")
    return sub


def require_role(*allowed_roles: str):
    def _check(payload: CurrentPayloadDep) -> dict:
        if payload.get("role") not in allowed_roles:
            raise forbidden_problem("forbidden")
        return payload

    return _check
