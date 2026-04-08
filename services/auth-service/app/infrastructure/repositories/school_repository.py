from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.models import School, User
from app.domain.ports import SchoolRepository
from app.infrastructure.database import models as orm


def _school_to_domain(row: orm.SchoolORM) -> School:
    return School(
        id=row.id,
        name=row.name,
        email=row.email,
        tax_id=row.tax_id,
        address=row.address,
        phone=row.phone,
        active=row.active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _user_to_domain(row: orm.UserORM) -> User:
    return User(
        id=row.id,
        email=row.email,
        full_name=row.full_name,
        role=row.role,
        school_id=row.school_id,
        document_id=row.document_id,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


class SqlSchoolRepository(SchoolRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self, school: School, admin_user: User, admin_password_hash: str
    ) -> tuple[School, User]:
        school_row = orm.SchoolORM(
            id=school.id,
            name=school.name,
            email=school.email,
            tax_id=school.tax_id,
            address=school.address,
            phone=school.phone,
            active=school.active,
        )
        self._db.add(school_row)
        self._db.flush()  # get id before user FK

        user_row = orm.UserORM(
            id=admin_user.id,
            email=admin_user.email,
            full_name=admin_user.full_name,
            role=admin_user.role,
            school_id=school_row.id,
            document_id=admin_user.document_id,
            is_active=admin_user.is_active,
            password_hash=admin_password_hash,
        )
        self._db.add(user_row)
        self._db.commit()
        self._db.refresh(school_row)
        self._db.refresh(user_row)
        return _school_to_domain(school_row), _user_to_domain(user_row)

    def get_by_id(self, school_id: UUID) -> School | None:
        row = self._db.get(orm.SchoolORM, school_id)
        return _school_to_domain(row) if row else None

    def list(
        self,
        limit: int,
        offset: int,
        name: str | None = None,
        active: bool | None = None,
        sort: str | None = None,
    ) -> tuple[list[School], int]:
        query = self._db.query(orm.SchoolORM)
        if name:
            query = query.filter(orm.SchoolORM.name.ilike(f"%{name}%"))
        if active is not None:
            query = query.filter(orm.SchoolORM.active == active)
        if sort:
            descending = sort.startswith("-")
            field_name = sort.lstrip("-")
            column = getattr(orm.SchoolORM, field_name, None)
            if column is not None:
                query = query.order_by(column.desc() if descending else column.asc())
        total = query.count()
        rows = query.offset(offset).limit(limit).all()
        return [_school_to_domain(r) for r in rows], total

    def update(self, school: School) -> School:
        row = self._db.get(orm.SchoolORM, school.id)
        if not row:
            raise ValueError(f"School {school.id} not found")
        row.name = school.name
        row.active = school.active
        row.address = school.address
        row.phone = school.phone
        self._db.commit()
        self._db.refresh(row)
        return _school_to_domain(row)
