from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.application import student_use_cases
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.license_repository import SqlLicenseRepository
from app.infrastructure.repositories.user_repository import SqlUserRepository
from app.presentation.dependencies import require_role
from app.presentation.schemas import (
    AssignLicensesRequest,
    CreateStudentRequest,
    PaginatedStudentsResponse,
    PatchStudentRequest,
    StudentResponse,
)

router = APIRouter(prefix="/api/v1/auth/students", tags=["students"])

DbDep = Annotated[Session, Depends(get_db)]


def _build_student_response(
    student, license_repo: SqlLicenseRepository
) -> StudentResponse:
    """Construye StudentResponse enriquecida con los license_codes del alumno."""
    licenses = license_repo.list_by_user(student.id)
    return StudentResponse(
        **{k: v for k, v in student.__dict__.items() if k != "licenses"},
        licenses=[l.license_code for l in licenses],
    )


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    body: CreateStudentRequest,
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
) -> StudentResponse:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    try:
        student = student_use_cases.create_student(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            document_id=body.document_id,
            license_codes=body.licenses,
            school_id=school_id,
            user_repo=user_repo,
            license_repo=license_repo,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return _build_student_response(student, license_repo)


@router.get("", response_model=PaginatedStudentsResponse)
def list_students(
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    active: Annotated[bool | None, Query()] = None,
    license: Annotated[str | None, Query()] = None,
) -> PaginatedStudentsResponse:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    students, total = student_use_cases.list_students(
        school_id, limit, offset, user_repo, active, license
    )
    return PaginatedStudentsResponse(
        items=[_build_student_response(s, license_repo) for s in students],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: UUID,
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
) -> StudentResponse:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    try:
        student = student_use_cases.get_student(student_id, school_id, user_repo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="student_not_found"
        )
    return _build_student_response(student, license_repo)


@router.patch("/{student_id}", response_model=StudentResponse)
def patch_student(
    student_id: UUID,
    body: PatchStudentRequest,
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
) -> StudentResponse:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    try:
        student = student_use_cases.update_student(
            student_id,
            school_id,
            body.full_name,
            body.document_id,
            body.active,
            user_repo,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="student_not_found"
        )
    return _build_student_response(student, license_repo)


# POST /licenses → devuelve {student} según contrato, NO list[LicenseResponse]
@router.post("/{student_id}/licenses", response_model=StudentResponse)
def assign_licenses(
    student_id: UUID,
    body: AssignLicensesRequest,
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
) -> StudentResponse:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    try:
        student_use_cases.assign_licenses(
            student_id, school_id, body.license_codes, user_repo, license_repo
        )
        student = student_use_cases.get_student(student_id, school_id, user_repo)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="student_not_found"
        )
    return _build_student_response(student, license_repo)


@router.delete(
    "/{student_id}/licenses/{license_code}", status_code=status.HTTP_204_NO_CONTENT
)
def revoke_license(
    student_id: UUID,
    license_code: str,
    db: DbDep,
    current: Annotated[dict, Depends(require_role("school_admin"))],
) -> None:
    user_repo = SqlUserRepository(db)
    license_repo = SqlLicenseRepository(db)
    school_id = UUID(current["school_id"])
    try:
        student_use_cases.revoke_license(
            student_id, school_id, license_code, user_repo, license_repo
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="student_not_found"
        )
