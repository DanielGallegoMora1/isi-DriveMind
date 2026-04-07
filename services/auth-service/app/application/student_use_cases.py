from uuid import UUID, uuid4

from app.application.auth_use_cases import pwd_context
from app.domain.models import StudentLicense, User
from app.domain.ports import StudentLicenseRepository, UserRepository


def create_student(
    email: str,
    password: str,
    full_name: str,
    document_id: str | None,
    license_codes: list[str],
    school_id: UUID,
    user_repo: UserRepository,
    license_repo: StudentLicenseRepository,
) -> User:
    if user_repo.get_by_email(email):
        raise ValueError("email_already_exists")

    student = User(
        id=uuid4(),
        email=email,
        full_name=full_name,
        role="student",
        school_id=school_id,
        document_id=document_id,
        is_active=True,
        created_at=None,
        updated_at=None,
    )
    password_hash = pwd_context.hash(password)
    student = user_repo.create(student, password_hash)

    if license_codes:
        license_repo.assign(student.id, license_codes)

    return student


def list_students(
    school_id: UUID,
    limit: int,
    offset: int,
    user_repo: UserRepository,
    active: bool | None = None,
    license_code: str | None = None,
) -> tuple[list[User], int]:
    return user_repo.list_by_school(school_id, limit, offset, active, license_code)


def get_student(student_id: UUID, school_id: UUID, user_repo: UserRepository) -> User:
    user = user_repo.get_by_id(student_id)
    if not user or user.school_id != school_id:
        raise ValueError("student_not_found")
    return user


def update_student(
    student_id: UUID,
    school_id: UUID,
    full_name: str | None,
    document_id: str | None,
    active: bool | None,
    user_repo: UserRepository,
) -> User:
    user = user_repo.get_by_id(student_id)
    if not user or user.school_id != school_id:
        raise ValueError("student_not_found")
    if full_name is not None:
        user.full_name = full_name
    if document_id is not None:
        user.document_id = document_id
    if active is not None:
        user.is_active = active
    return user_repo.update(user)


def assign_licenses(
    student_id: UUID,
    school_id: UUID,
    license_codes: list[str],
    user_repo: UserRepository,
    license_repo: StudentLicenseRepository,
) -> list[StudentLicense]:
    user = user_repo.get_by_id(student_id)
    if not user or user.school_id != school_id:
        raise ValueError("student_not_found")
    return license_repo.assign(student_id, license_codes)


def revoke_license(
    student_id: UUID,
    school_id: UUID,
    license_code: str,
    user_repo: UserRepository,
    license_repo: StudentLicenseRepository,
) -> None:
    user = user_repo.get_by_id(student_id)
    if not user or user.school_id != school_id:
        raise ValueError("student_not_found")
    license_repo.revoke(student_id, license_code)
