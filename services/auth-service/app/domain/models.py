from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID


def _now():
    return datetime.now(timezone.utc)


@dataclass
class School:
    id: UUID
    name: str
    email: str | None
    tax_id: str | None
    address: str | None
    phone: str | None
    active: bool
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)


@dataclass
class User:
    id: UUID
    email: str
    full_name: str
    role: str  # 'student' | 'school_admin' | 'system_admin'
    school_id: UUID | None
    document_id: str | None
    is_active: bool
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)


@dataclass
class StudentLicense:
    user_id: UUID
    license_code: str
    status: str  # 'active' | 'suspended' | 'finished'
    assigned_at: datetime = field(default_factory=_now)
