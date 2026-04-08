from uuid import uuid4
import pytest

from app.application.auth_use_cases import login
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
