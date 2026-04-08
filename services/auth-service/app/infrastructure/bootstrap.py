import uuid

from sqlalchemy.orm import Session

from app.application.auth_use_cases import pwd_context
from app.infrastructure.config import settings
from app.infrastructure.database.models import SchoolORM, StudentLicenseORM, UserORM


def _build_user(
    *,
    email: str,
    password: str,
    full_name: str,
    role: str,
    school_id: uuid.UUID | None = None,
    document_id: str | None = None,
) -> UserORM:
    return UserORM(
        id=uuid.uuid4(),
        email=email,
        password_hash=pwd_context.hash(password),
        role=role,
        full_name=full_name,
        school_id=school_id,
        document_id=document_id,
        is_active=True,
    )


def ensure_demo_users(db: Session) -> None:
    if not settings.bootstrap_demo_users:
        return

    system_admin = db.query(UserORM).filter_by(email=settings.demo_system_admin_email).first()
    if system_admin is None:
        db.add(
            _build_user(
                email=settings.demo_system_admin_email,
                password=settings.demo_system_admin_password,
                full_name=settings.demo_system_admin_full_name,
                role="system_admin",
            )
        )

    school = db.query(SchoolORM).filter_by(email=settings.demo_school_email).first()
    if school is None:
        school = SchoolORM(
            id=uuid.uuid4(),
            name=settings.demo_school_name,
            email=settings.demo_school_email,
            active=True,
        )
        db.add(school)
        db.flush()

    school_admin = db.query(UserORM).filter_by(email=settings.demo_school_email).first()
    if school_admin is None:
        db.add(
            _build_user(
                email=settings.demo_school_email,
                password=settings.demo_school_password,
                full_name=settings.demo_school_admin_full_name,
                role="school_admin",
                school_id=school.id,
            )
        )
    elif school_admin.school_id != school.id:
        school_admin.school_id = school.id

    student = db.query(UserORM).filter_by(email=settings.demo_student_email).first()
    if student is None:
        student = _build_user(
            email=settings.demo_student_email,
            password=settings.demo_student_password,
            full_name=settings.demo_student_full_name,
            role="student",
            school_id=school.id,
            document_id=settings.demo_student_document_id,
        )
        db.add(student)
        db.flush()
    elif student.school_id != school.id:
        student.school_id = school.id

    student_license = (
        db.query(StudentLicenseORM)
        .filter_by(
            user_id=student.id,
            license_code=settings.demo_student_license_code,
        )
        .first()
    )
    if student_license is None:
        db.add(
            StudentLicenseORM(
                user_id=student.id,
                license_code=settings.demo_student_license_code,
                status="active",
            )
        )

    db.commit()
