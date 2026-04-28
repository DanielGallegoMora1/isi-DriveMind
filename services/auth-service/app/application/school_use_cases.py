from uuid import UUID, uuid4

from app.domain.models import School, User
from app.domain.ports import SchoolRepository, UserRepository
from app.application.auth_use_cases import pwd_context


def create_school(
    email: str,
    password: str,
    name: str,
    tax_id: str | None,
    address: str | None,
    phone: str | None,
    school_repo: SchoolRepository,
    user_repo: UserRepository,
) -> tuple[School, User]:
    if user_repo.get_by_email(email):
        raise ValueError("email_already_exists")

    school = School(
        id=uuid4(),
        name=name,
        email=email,
        tax_id=tax_id,
        address=address,
        phone=phone,
        active=True,
        created_at=None,  # set by DB
        updated_at=None,
    )
    admin = User(
        id=uuid4(),
        email=email,
        full_name=f"{name} Admin",
        role="school_admin",
        school_id=school.id,
        document_id=None,
        is_active=True,
        created_at=None,
        updated_at=None,
    )
    password_hash = pwd_context.hash(password)
    return school_repo.create(school, admin, password_hash)


def list_schools(
    limit: int,
    offset: int,
    name: str | None,
    active: bool | None,
    sort: str | None,
    school_repo: SchoolRepository,
) -> tuple[list[School], int]:
    return school_repo.list(
        limit=limit, offset=offset, name=name, active=active, sort=sort
    )


def get_school(school_id: UUID, school_repo: SchoolRepository) -> School:
    school = school_repo.get_by_id(school_id)
    if not school:
        raise ValueError("school_not_found")
    return school


def update_school(
    school_id: UUID,
    name: str | None,
    active: bool | None,
    address: str | None,
    phone: str | None,
    school_repo: SchoolRepository,
) -> School:
    school = school_repo.get_by_id(school_id)
    if not school:
        raise ValueError("school_not_found")
    if name is not None:
        school.name = name
    if active is not None:
        school.active = active
    if address is not None:
        school.address = address
    if phone is not None:
        school.phone = phone
    return school_repo.update(school)


def delete_school(
    school_id: UUID,
    school_repo: SchoolRepository,
    user_repo: UserRepository,
) -> None:
    school = school_repo.get_by_id(school_id)
    if not school:
        raise ValueError("school_not_found")

    school_repo.soft_delete(school_id)
    user_repo.deactivate_non_system_by_school(school_id)
