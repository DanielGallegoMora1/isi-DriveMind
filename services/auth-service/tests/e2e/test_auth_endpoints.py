def test_login_endpoint_success(client, db_session):
    from app.infrastructure.database.models import UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    # Seed db
    admin_id = uuid.uuid4()
    admin = UserORM(
        id=admin_id,
        email="root@admin.com",
        password_hash=pwd_context.hash("rootpwd"),
        role="system_admin",
        full_name="Root Admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    # Act
    response = client.post(
        "/api/v1/auth/login", json={"email": "root@admin.com", "password": "rootpwd"}
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "system_admin"


def test_login_endpoint_failure(client):
    response = client.post(
        "/api/v1/auth/login", json={"email": "non@existent.com", "password": "bad"}
    )
    assert response.status_code == 401


def test_login_endpoint_accepts_bootstrap_demo_credentials(client, db_session, monkeypatch):
    from app.infrastructure.bootstrap import ensure_demo_users
    from app.infrastructure.config import settings

    monkeypatch.setattr(settings, "bootstrap_demo_users", True)
    ensure_demo_users(db_session)

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": settings.demo_system_admin_email,
            "password": settings.demo_system_admin_password,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == settings.demo_system_admin_email
    assert data["user"]["role"] == "system_admin"


def test_change_password_endpoint_success(client, db_session):
    from app.application.auth_use_cases import pwd_context
    from app.infrastructure.database.models import UserORM
    import uuid

    user_id = uuid.uuid4()
    db_session.add(
        UserORM(
            id=user_id,
            email="student@example.com",
            password_hash=pwd_context.hash("old-password"),
            role="student",
            full_name="Student Demo",
            is_active=True,
        )
    )
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "old-password"},
    )
    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]

    response = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "old-password", "new_password": "new-password"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "password_changed"

    new_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "new-password"},
    )
    assert new_login_response.status_code == 200


def test_change_password_endpoint_rejects_invalid_current_password(client, db_session):
    from app.application.auth_use_cases import pwd_context
    from app.infrastructure.database.models import UserORM
    import uuid

    user_id = uuid.uuid4()
    db_session.add(
        UserORM(
            id=user_id,
            email="student2@example.com",
            password_hash=pwd_context.hash("old-password"),
            role="student",
            full_name="Student Demo",
            is_active=True,
        )
    )
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "student2@example.com", "password": "old-password"},
    )
    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]

    response = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "wrong-password", "new_password": "new-password"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid_current_password"


def test_change_password_endpoint_requires_authentication(client):
    response = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "old-password", "new_password": "new-password"},
    )

    assert response.status_code == 401
