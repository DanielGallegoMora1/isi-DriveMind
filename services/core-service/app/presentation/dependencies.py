from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated

from app.infrastructure.database.session import get_db
from app.infrastructure.database.repositories.postgres_question_repo import PostgresQuestionRepository
from app.infrastructure.database.repositories.postgres_test_repo import PostgresTestRepository
from app.application.manager_use_cases import TestManager

def get_question_repo(db: Session = Depends(get_db)) -> PostgresQuestionRepository:
    return PostgresQuestionRepository(db)

def get_test_repo(db: Session = Depends(get_db)) -> PostgresTestRepository:
    return PostgresTestRepository(db)

def get_test_manager(
    question_repo: PostgresQuestionRepository = Depends(get_question_repo),
    test_repo: PostgresTestRepository = Depends(get_test_repo)
) -> TestManager:
    return TestManager(question_repo, test_repo)

# JWT Verification Placeholder
def get_current_user_id(authorization: str = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    # TODO: Decode JWT using secret key, extract user ID. Returning dummy for now.
    return 1
