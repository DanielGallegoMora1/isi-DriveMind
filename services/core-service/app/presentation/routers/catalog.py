from typing import Optional, Annotated

from fastapi import APIRouter, Depends

from app.presentation.schemas import PermitListResponse, TopicListResponse
from app.domain.ports import QuestionRepository
from app.presentation.dependencies import get_question_repo, get_current_user_id
from app.presentation.errors import not_found_problem

router = APIRouter(tags=["Catalog"])

CurrentUserIdDep = Annotated[int, Depends(get_current_user_id)]


@router.get("/permits", response_model=PermitListResponse)
def get_permits(
    _: CurrentUserIdDep,
    repo: QuestionRepository = Depends(get_question_repo),
):
    return {"items": repo.get_permits()}


@router.get("/topics", response_model=TopicListResponse)
def get_topics(
    _: CurrentUserIdDep,
    permit_code: Optional[str] = None,
    repo: QuestionRepository = Depends(get_question_repo),
):
    permit_id: int | None = None
    if permit_code:
        permit = repo.get_permit_by_code(permit_code)
        if permit is None:
            raise not_found_problem("permit_not_found")
        permit_id = permit.id
    return {"items": repo.get_topics(permit_id=permit_id)}
