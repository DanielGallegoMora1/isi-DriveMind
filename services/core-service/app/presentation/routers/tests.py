from fastapi import APIRouter, Depends
from typing import Optional
from app.presentation.schemas import QuestionListResponse, TestGenerateRequest, TestResponse, TestSubmitRequest, TestResultResponse
from app.application.manager_use_cases import TestManager
from app.presentation.dependencies import get_test_manager, get_current_user_id, get_question_repo, get_test_repo
from app.domain.ports import QuestionRepository, TestRepository
from app.presentation.errors import not_found_problem, unprocessable_problem

router = APIRouter()

@router.get("/questions/random", response_model=QuestionListResponse, tags=["Questions"])
def get_random_questions(
    permit_code: Optional[str] = None,
    topic_id: Optional[int] = None,
    count: int = 30,
    repo: QuestionRepository = Depends(get_question_repo),
    user_id: str = Depends(get_current_user_id)
):
    permit_id: Optional[int] = None
    if permit_code is not None:
        permit = repo.get_permit_by_code(permit_code)
        if permit is None:
            raise not_found_problem("permit_not_found")
        permit_id = permit.id

    if topic_id is not None:
        mode = "TOPIC"
    elif permit_id is not None:
        mode = "PERMIT"
    else:
        mode = "RANDOM"

    items = repo.get_questions(mode=mode, count=count, permit_id=permit_id, topic_id=topic_id)
    return {"items": items}


@router.post("/tests/generate", response_model=TestResponse, tags=["Tests"])
def generate_test(
    request: TestGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    manager: TestManager = Depends(get_test_manager)
):
    try:
        return manager.generate_test(user_id, request)
    except ValueError as exc:
        if str(exc) == "permit_not_found":
            raise not_found_problem("permit_not_found") from exc
        raise


@router.post("/tests/{test_id}/submit", response_model=TestResultResponse, tags=["Tests"])
def submit_test(
    test_id: int,
    request: TestSubmitRequest,
    user_id: str = Depends(get_current_user_id),
    manager: TestManager = Depends(get_test_manager)
):
    try:
        return manager.submit_test(user_id, test_id, request)
    except ValueError as exc:
        detail = str(exc)
        if detail == "test_not_found":
            raise not_found_problem(detail) from exc
        if detail in {"duplicate_answers", "answers_not_in_test", "invalid_option_for_question", "invalid_started_at"}:
            raise unprocessable_problem(detail) from exc
        raise


@router.get("/tests/{test_id}", response_model=TestResponse, tags=["Tests"])
def get_test(
    test_id: int,
    repo: TestRepository = Depends(get_test_repo),
    user_id: str = Depends(get_current_user_id)
):
    test_obj = repo.get_test_by_id(test_id)
    if not test_obj or test_obj.user_id != user_id:
        raise not_found_problem("test_not_found")
    return test_obj
