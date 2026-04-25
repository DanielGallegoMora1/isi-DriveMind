from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.models import School, StudentLicense, User


class UserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: UUID) -> User | None: ...

    @abstractmethod
    def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    def get_password_hash(self, email: str) -> str | None: ...

    @abstractmethod
    def update_password_hash(self, user_id: UUID, password_hash: str) -> None: ...

    @abstractmethod
    def create(self, user: User, password_hash: str) -> User: ...

    @abstractmethod
    def update(self, user: User) -> User: ...

    @abstractmethod
    def list_by_school(
        self,
        school_id: UUID,
        limit: int,
        offset: int,
        active: bool | None = None,
        license_code: str | None = None,
    ) -> tuple[list[User], int]: ...


class SchoolRepository(ABC):
    @abstractmethod
    def create(
        self, school: School, admin_user: User, admin_password_hash: str
    ) -> tuple[School, User]: ...

    @abstractmethod
    def get_by_id(self, school_id: UUID) -> School | None: ...

    @abstractmethod
    def list(
        self,
        limit: int,
        offset: int,
        name: str | None = None,
        active: bool | None = None,
        sort: str | None = None,
    ) -> tuple[list[School], int]: ...

    @abstractmethod
    def update(self, school: School) -> School: ...


class StudentLicenseRepository(ABC):
    @abstractmethod
    def assign(
        self, user_id: UUID, license_codes: list[str]
    ) -> list[StudentLicense]: ...

    @abstractmethod
    def revoke(self, user_id: UUID, license_code: str) -> None: ...

    @abstractmethod
    def list_by_user(self, user_id: UUID) -> list[StudentLicense]: ...
