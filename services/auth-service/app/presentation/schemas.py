from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


# ─── Auth ────────────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    school_id: UUID | None
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str


# ─── Schools ─────────────────────────────────────────────────────────────────


class CreateSchoolRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    tax_id: str | None = None
    address: str | None = None
    phone: str | None = None


class SchoolResponse(BaseModel):
    id: UUID
    name: str
    email: str | None
    tax_id: str | None
    address: str | None
    phone: str | None
    active: bool
    created_at: datetime | None
    updated_at: datetime | None


class CreateSchoolResponse(BaseModel):
    school: SchoolResponse
    admin_user: UserResponse


class PatchSchoolRequest(BaseModel):
    name: str | None = None
    active: bool | None = None
    address: str | None = None
    phone: str | None = None


class PaginatedSchoolsResponse(BaseModel):
    items: list[SchoolResponse]
    total: int
    limit: int
    offset: int


# ─── Students ─────────────────────────────────────────────────────────────────


class CreateStudentRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    document_id: str | None = None
    licenses: list[str] = []


class PatchStudentRequest(BaseModel):
    full_name: str | None = None
    document_id: str | None = None
    active: bool | None = None


class StudentResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    document_id: str | None
    licenses: list[str] = []
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None


class PaginatedStudentsResponse(BaseModel):
    items: list[StudentResponse]
    total: int
    limit: int
    offset: int


class AssignLicensesRequest(BaseModel):
    license_codes: list[str]


class LicenseResponse(BaseModel):
    license_code: str
    status: str
    assigned_at: datetime | None
