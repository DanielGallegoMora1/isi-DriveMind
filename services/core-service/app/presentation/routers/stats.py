from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.application.manager_use_cases import TestManager
from app.presentation.dependencies import get_current_payload, get_test_manager
from app.presentation.errors import forbidden_problem, not_found_problem
from app.presentation.schemas import StatsResponse

router = APIRouter(prefix="/stats", tags=["Stats"])

CurrentPayloadDep = Annotated[dict, Depends(get_current_payload)]
TestManagerDep = Annotated[TestManager, Depends(get_test_manager)]

@router.get("", response_model=StatsResponse)
def get_stats(
    payload: CurrentPayloadDep,
    manager: TestManagerDep,
    permit_code: Annotated[str | None, Query()] = None,
    student_id: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    current_user_id = str(payload["sub"])
    target_user_id = current_user_id

    if student_id is not None:
        if student_id != current_user_id and payload.get("role") not in {"school_admin", "system_admin"}:
            raise forbidden_problem("forbidden")
        target_user_id = student_id

    try:
        return manager.get_stats(
            user_id=target_user_id,
            permit_code=permit_code,
            limit=limit,
            offset=offset,
        )
    except ValueError as exc:
        if str(exc) == "permit_not_found":
            raise not_found_problem("permit_not_found") from exc
        raise
