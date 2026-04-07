from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.models import StudentLicense
from app.domain.ports import StudentLicenseRepository
from app.infrastructure.database import models as orm


def _to_domain(row: orm.StudentLicenseORM) -> StudentLicense:
    return StudentLicense(
        user_id=row.user_id,
        license_code=row.license_code,
        status=row.status,
        assigned_at=row.assigned_at,
    )


class SqlLicenseRepository(StudentLicenseRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def assign(self, user_id: UUID, license_codes: list[str]) -> list[StudentLicense]:
        results = []
        for code in license_codes:
            existing = (
                self._db.query(orm.StudentLicenseORM)
                .filter_by(user_id=user_id, license_code=code)
                .first()
            )
            if existing:
                results.append(_to_domain(existing))
                continue
            row = orm.StudentLicenseORM(
                user_id=user_id, license_code=code, status="active"
            )
            self._db.add(row)
            results.append(row)
        self._db.commit()
        return [
            _to_domain(r) if isinstance(r, orm.StudentLicenseORM) else r
            for r in results
        ]

    def revoke(self, user_id: UUID, license_code: str) -> None:
        row = (
            self._db.query(orm.StudentLicenseORM)
            .filter_by(user_id=user_id, license_code=license_code)
            .first()
        )
        if not row:
            raise ValueError("license_not_found")
        self._db.delete(row)
        self._db.commit()

    def list_by_user(self, user_id: UUID) -> list[StudentLicense]:
        rows = self._db.query(orm.StudentLicenseORM).filter_by(user_id=user_id).all()
        return [_to_domain(r) for r in rows]
