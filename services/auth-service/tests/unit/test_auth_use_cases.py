from uuid import uuid4
import pytest

from app.application.auth_use_cases import change_password, login
from app.domain.models import User
from tests.unit.fakes import FakeUserRepository


def test_login_success(monkeypatch):
    # Arrange
    repo = FakeUserRepository()
    school_id = uuid4()
    user = User(
        school_id=school_id,
        document_id=None,
        id=uuid4(),
        email="admin@test.com",
        role="system_admin",
        full_name="Admin",
        is_active=True,
    )
    setattr(user, "password_hash", "admin123")
    repo.users[user.id] = user

    # Mockear pwd_context.verify
    import app.application.auth_use_cases as auth_uc

    monkeypatch.setattr(
        auth_uc.pwd_context, "verify", lambda plain, hashed: plain == "admin123"
    )

    # Act
    token_data = login("admin@test.com", "admin123", repo)

    # Assert
    assert "access_token" in token_data
    assert token_data["user"].email == "admin@test.com"


def test_login_user_not_found():
    repo = FakeUserRepository()
    with pytest.raises(ValueError) as exc:
        login("nonexistent@test.com", "pass", repo)
    assert "invalid_credentials" in str(exc.value)


def test_change_password_success(monkeypatch):
    repo = FakeUserRepository()
    user = User(
        school_id=None,
        document_id=None,
        id=uuid4(),
        email="student@test.com",
        role="student",
        full_name="Student",
        is_active=True,
    )
    setattr(user, "password_hash", "old-password-hash")
    repo.users[user.id] = user

    import app.application.auth_use_cases as auth_uc

    monkeypatch.setattr(
        auth_uc.pwd_context,
        "verify",
        lambda plain, hashed: (plain == "old-password" and hashed == "old-password-hash")
        or (plain == "new-password" and hashed == "new-password-hash"),
    )
    monkeypatch.setattr(auth_uc.pwd_context, "hash", lambda plain: "new-password-hash")

    change_password(user.id, "old-password", "new-password", repo)

    assert getattr(repo.users[user.id], "password_hash") == "new-password-hash"


def test_change_password_rejects_invalid_current_password(monkeypatch):
    repo = FakeUserRepository()
    user = User(
        school_id=None,
        document_id=None,
        id=uuid4(),
        email="student@test.com",
        role="student",
        full_name="Student",
        is_active=True,
    )
    setattr(user, "password_hash", "stored-hash")
    repo.users[user.id] = user

    import app.application.auth_use_cases as auth_uc

    monkeypatch.setattr(auth_uc.pwd_context, "verify", lambda plain, hashed: False)

    with pytest.raises(ValueError) as exc:
        change_password(user.id, "bad-current", "new-password", repo)

    assert str(exc.value) == "invalid_current_password"


def test_change_password_rejects_short_password():
    repo = FakeUserRepository()
    user = User(
        school_id=None,
        document_id=None,
        id=uuid4(),
        email="student@test.com",
        role="student",
        full_name="Student",
        is_active=True,
    )
    setattr(user, "password_hash", "stored-hash")
    repo.users[user.id] = user

    with pytest.raises(ValueError) as exc:
        change_password(user.id, "old-password", "short", repo)

    assert str(exc.value) == "password_too_short"
