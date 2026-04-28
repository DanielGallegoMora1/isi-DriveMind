from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.application import school_use_cases
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.school_repository import SqlSchoolRepository
from app.infrastructure.repositories.user_repository import SqlUserRepository
from app.presentation.dependencies import require_role
from app.presentation.schemas import (
    CreateSchoolRequest,
    CreateSchoolResponse,
    PaginatedSchoolsResponse,
    PatchSchoolRequest,
    SchoolResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth/schools", tags=["schools"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post(
    "", response_model=CreateSchoolResponse, status_code=status.HTTP_201_CREATED
)
def create_school(
    body: CreateSchoolRequest,
    db: DbDep,
    _: Annotated[dict, Depends(require_role("system_admin"))],
) -> CreateSchoolResponse:
    school_repo = SqlSchoolRepository(db)
    user_repo = SqlUserRepository(db)
    try:
        school, admin = school_use_cases.create_school(
            email=body.email,
            password=body.password,
            name=body.name,
            tax_id=body.tax_id,
            address=body.address,
            phone=body.phone,
            school_repo=school_repo,
            user_repo=user_repo,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return CreateSchoolResponse(
        school=SchoolResponse(**school.__dict__),
        admin_user=UserResponse(**admin.__dict__),
    )


@router.get("", response_model=PaginatedSchoolsResponse)
def list_schools(
    db: DbDep,
    _: Annotated[dict, Depends(require_role("system_admin"))],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    name: Annotated[str | None, Query()] = None,
    active: Annotated[bool | None, Query()] = None,
    sort: Annotated[str | None, Query(pattern=r"^-?(name|active|created_at)$")] = None,
) -> PaginatedSchoolsResponse:
    school_repo = SqlSchoolRepository(db)
    schools, total = school_use_cases.list_schools(
        limit, offset, name, active, sort, school_repo
    )
    return PaginatedSchoolsResponse(
        items=[SchoolResponse(**s.__dict__) for s in schools],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: UUID,
    db: DbDep,
    _: Annotated[dict, Depends(require_role("system_admin"))],
) -> SchoolResponse:
    school_repo = SqlSchoolRepository(db)
    try:
        school = school_use_cases.get_school(school_id, school_repo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="school_not_found"
        )
    return SchoolResponse(**school.__dict__)


@router.patch("/{school_id}", response_model=SchoolResponse)
def patch_school(
    school_id: UUID,
    body: PatchSchoolRequest,
    db: DbDep,
    _: Annotated[dict, Depends(require_role("system_admin"))],
) -> SchoolResponse:
    school_repo = SqlSchoolRepository(db)
    try:
        school = school_use_cases.update_school(
            school_id, body.name, body.active, body.address, body.phone, school_repo
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="school_not_found"
        )
    return SchoolResponse(**school.__dict__)



@router.delete("/{school_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school(
    school_id: UUID,
    db: DbDep,
    _: Annotated[dict, Depends(require_role("system_admin"))],
) -> None:
    school_repo = SqlSchoolRepository(db)
    user_repo = SqlUserRepository(db)
    try:
        school_use_cases.delete_school(school_id, school_repo, user_repo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="school_not_found"
        )
