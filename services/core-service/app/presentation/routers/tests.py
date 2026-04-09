from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.presentation.schemas import QuestionResponse, TestGenerateRequest, TestResponse, TestSubmitRequest, TestResultResponse
from app.application.manager_use_cases import TestManager
from app.presentation.dependencies import get_test_manager, get_current_user_id, get_question_repo, get_test_repo
from app.domain.ports import QuestionRepository, TestRepository

router = APIRouter()

@router.get("/questions/random", response_model=List[QuestionResponse], tags=["Questions"])
def get_random_questions(
    permit_code: str,
    topic_id: Optional[int] = None,
    count: int = 30,
    repo: QuestionRepository = Depends(get_question_repo),
    user_id: int = Depends(get_current_user_id)
):
    # mode derived by provided params
    mode = "TOPIC" if topic_id else "PERMIT"
    permit_id = 1 # Mapping needs to happen here from code to id
    return repo.get_questions(mode=mode, count=count, permit_id=permit_id, topic_id=topic_id)


@router.post("/tests/generate", response_model=TestResponse, tags=["Tests"])
def generate_test(
    request: TestGenerateRequest,
    user_id: int = Depends(get_current_user_id),
    manager: TestManager = Depends(get_test_manager)
):
    return manager.generate_test(user_id, request)


@router.post("/tests/{test_id}/submit", response_model=TestResultResponse, tags=["Tests"])
def submit_test(
    test_id: int,
    request: TestSubmitRequest,
    user_id: int = Depends(get_current_user_id),
    manager: TestManager = Depends(get_test_manager)
):
    return manager.submit_test(user_id, test_id, request)


@router.get("/tests/{test_id}", response_model=TestResponse, tags=["Tests"])
def get_test(
    test_id: int,
    repo: TestRepository = Depends(get_test_repo),
    user_id: int = Depends(get_current_user_id)
):
    test_obj = repo.get_test_by_id(test_id)
    if not test_obj or test_obj.user_id != user_id:
        raise HTTPException(status_code=404, detail="Test not found")
    return test_obj
