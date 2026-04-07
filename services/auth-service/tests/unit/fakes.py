from uuid import UUID
from typing import Optional

from app.domain.models import User, School, StudentLicense
from app.domain.ports import UserRepository, SchoolRepository, StudentLicenseRepository


class FakeUserRepository(UserRepository):
    def __init__(self):
        self.users: dict[UUID, User] = {}
        self.raise_on_save = False

    def create(self, user: User, password_hash: str) -> User:
        if self.raise_on_save:
            raise ValueError("ValidationError")
        self.users[user.id] = user
        return user

    def update(self, user: User) -> User:
        if self.raise_on_save:
            raise ValueError("ValidationError")
        self.users[user.id] = user
        return user

    def get_by_email(self, email: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.email == email), None)

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.users.get(user_id)

    def get_password_hash(self, email: str) -> Optional[str]:
        user = self.get_by_email(email)
        return getattr(user, "password_hash", None) if user else None

    def list_by_school(
        self,
        school_id: UUID,
        limit: int,
        offset: int,
        active: bool | None = None,
        license_code: str | None = None,
        sort: str | None = None,
    ) -> tuple[list[User], int]:
        matches = [
            u
            for u in self.users.values()
            if u.school_id == school_id and u.role == "student"
        ]
        if active is not None:
            matches = [u for u in matches if u.is_active == active]
        return matches[offset : offset + limit], len(matches)


class FakeSchoolRepository(SchoolRepository):
    def __init__(self):
        self.schools: dict[UUID, School] = {}

    def create(
        self, school: School, admin_user: User, admin_password_hash: str
    ) -> tuple[School, User]:
        self.schools[school.id] = school
        admin_user.school_id = school.id
        return school, admin_user

    def get_by_id(self, school_id: UUID) -> Optional[School]:
        return self.schools.get(school_id)

    def list(
        self,
        limit: int,
        offset: int,
        name: str | None = None,
        active: bool | None = None,
        sort: str | None = None,
    ) -> tuple[list[School], int]:
        values = list(self.schools.values())
        return values[offset : offset + limit], len(values)

    def update(self, school: School) -> School:
        self.schools[school.id] = school
        return school


class FakeStudentLicenseRepository(StudentLicenseRepository):
    def __init__(self):
        self.licenses: list[StudentLicense] = []

    def list_by_user(self, user_id: UUID) -> list[StudentLicense]:
        return [l for l in self.licenses if l.user_id == user_id]

    def assign(self, user_id: UUID, license_codes: list[str]) -> list[StudentLicense]:
        results = []
        for code in license_codes:
            existing = [
                l
                for l in self.licenses
                if l.user_id == user_id and l.license_code == code
            ]
            if not existing:
                new_lic = StudentLicense(
                    user_id=user_id, license_code=code, status="active"
                )
                self.licenses.append(new_lic)
                results.append(new_lic)
            else:
                results.append(existing[0])
        return results

    def revoke(self, user_id: UUID, license_code: str) -> None:
        self.licenses = [
            l
            for l in self.licenses
            if not (l.user_id == user_id and l.license_code == license_code)
        ]
