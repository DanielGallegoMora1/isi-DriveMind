from app.application.auth_use_cases import login
from app.infrastructure.bootstrap import ensure_demo_users
from app.infrastructure.config import settings
from app.infrastructure.repositories.user_repository import SqlUserRepository


def test_demo_bootstrap_creates_login_credentials(db_session, monkeypatch):
    monkeypatch.setattr(settings, "bootstrap_demo_users", True)
    ensure_demo_users(db_session)

    repo = SqlUserRepository(db_session)

    system_admin = login(settings.demo_system_admin_email, "Admin123!", repo)
    school_admin = login(settings.demo_school_email, "School123!", repo)
    student = login(settings.demo_student_email, "Student123!", repo)

    assert system_admin["user"].role == "system_admin"
    assert school_admin["user"].role == "school_admin"
    assert student["user"].role == "student"


def test_demo_bootstrap_is_idempotent(db_session, monkeypatch):
    monkeypatch.setattr(settings, "bootstrap_demo_users", True)
    ensure_demo_users(db_session)
    ensure_demo_users(db_session)

    repo = SqlUserRepository(db_session)

    assert repo.get_by_email(settings.demo_system_admin_email) is not None
    assert repo.get_by_email(settings.demo_school_email) is not None
    assert repo.get_by_email(settings.demo_student_email) is not None
