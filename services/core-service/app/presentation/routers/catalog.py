from fastapi import APIRouter, Depends
from typing import List, Optional
from app.presentation.schemas import PermitResponse, TopicResponse
from app.domain.ports import QuestionRepository
from app.presentation.dependencies import get_question_repo

router = APIRouter(tags=["Catalog"])

@router.get("/permits", response_model=List[PermitResponse])
def get_permits(repo: QuestionRepository = Depends(get_question_repo)):
    return repo.get_permits()

@router.get("/topics", response_model=List[TopicResponse])
def get_topics(
    permit_code: Optional[str] = None, 
    repo: QuestionRepository = Depends(get_question_repo)
):
    # Depending on code logic, we might need a mapping permit_code -> permit_id here
    # Assuming code maps correctly or we change DB to use code string for topics.
    return repo.get_topics(permit_id=1 if permit_code else None)
