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
