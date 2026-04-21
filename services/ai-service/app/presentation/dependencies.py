from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.application.ai_use_cases import AiUseCases
from app.infrastructure.config import settings
from app.infrastructure.database.database import get_db
from app.infrastructure.database.repositories.ai_repository import SqlAlchemyAiRepository
from app.infrastructure.providers.hf_openai_adapter import HuggingFaceOpenAIAdapter
from app.presentation.errors import forbidden_problem, unauthorized_problem


def get_ai_provider() -> HuggingFaceOpenAIAdapter:
    return HuggingFaceOpenAIAdapter()


def get_ai_use_cases(
    db: Session = Depends(get_db),
    provider: HuggingFaceOpenAIAdapter = Depends(get_ai_provider),
) -> AiUseCases:
    return AiUseCases(repository=SqlAlchemyAiRepository(db), provider=provider)


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

    role = payload.get("role")
    if role not in {"student", "school_admin", "system_admin"}:
        raise forbidden_problem("forbidden")

    return payload


CurrentPayloadDep = Annotated[dict, Depends(get_current_payload)]


def get_current_user_id(payload: CurrentPayloadDep) -> str:
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.strip():
        raise unauthorized_problem("invalid_token")
    return sub
