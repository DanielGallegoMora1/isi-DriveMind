from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.models import User
from app.domain.ports import UserRepository
from app.infrastructure.database import models as orm


def _to_domain(row: orm.UserORM) -> User:
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


class SqlUserRepository(UserRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        row = self._db.get(orm.UserORM, user_id)
        return _to_domain(row) if row else None

    def get_by_email(self, email: str) -> User | None:
        row = self._db.query(orm.UserORM).filter_by(email=email).first()
        return _to_domain(row) if row else None

    def get_password_hash(self, email: str) -> str | None:
        row = self._db.query(orm.UserORM).filter_by(email=email).first()
        return row.password_hash if row else None

    def update_password_hash(self, user_id: UUID, password_hash: str) -> None:
        row = self._db.get(orm.UserORM, user_id)
        if not row:
            raise ValueError(f"User {user_id} not found")
        row.password_hash = password_hash
        self._db.commit()

    def list_by_school(
        self,
        school_id: UUID,
        limit: int,
        offset: int,
        active: bool | None = None,
        license_code: str | None = None,
    ) -> tuple[list[User], int]:
        query = self._db.query(orm.UserORM).filter_by(
            school_id=school_id, role="student"
        )
        if active is not None:
            query = query.filter(orm.UserORM.is_active == active)
        if license_code is not None:
            query = query.join(orm.StudentLicenseORM).filter(
                orm.StudentLicenseORM.license_code == license_code
            )
        total = query.count()
        rows = query.offset(offset).limit(limit).all()
        return [_to_domain(r) for r in rows], total


    def deactivate_non_system_by_school(self, school_id: UUID) -> int:
        updated = (
            self._db.query(orm.UserORM)
            .filter(orm.UserORM.school_id == school_id)
            .filter(orm.UserORM.role != "system_admin")
            .update({orm.UserORM.is_active: False}, synchronize_session=False)
        )
        self._db.commit()
        return int(updated)

    def create(self, user: User, password_hash: str) -> User:
        row = orm.UserORM(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            school_id=user.school_id,
            document_id=user.document_id,
            is_active=user.is_active,
            password_hash=password_hash,
        )
        self._db.add(row)
        self._db.commit()
        self._db.refresh(row)
        return _to_domain(row)

    def update(self, user: User) -> User:
        row = self._db.get(orm.UserORM, user.id)
        if not row:
            raise ValueError(f"User {user.id} not found")
        row.full_name = user.full_name
        row.document_id = user.document_id
        row.is_active = user.is_active
        self._db.commit()
        self._db.refresh(row)
        return _to_domain(row)
