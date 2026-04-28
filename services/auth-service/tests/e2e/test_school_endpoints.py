def test_create_school_as_system_admin(client, db_session):
    from app.infrastructure.database.models import UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    admin_id = uuid.uuid4()
    admin = UserORM(
        id=admin_id,
        email="sysadmin@example.com",
        password_hash=pwd_context.hash("pass"),
        role="system_admin",
        full_name="Sys",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    # Login to get token
    res = client.post(
        "/api/v1/auth/login", json={"email": "sysadmin@example.com", "password": "pass"}
    )
    token = res.json()["access_token"]

    # Act: create school
    res = client.post(
        "/api/v1/auth/schools",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "E2E School",
            "email": "e2e@school.com",
            "tax_id": "X123",
            "address": "",
            "phone": "",
            "password": "school_pass",
        },
    )
    assert res.status_code == 201
    assert res.json()["school"]["name"] == "E2E School"


def test_create_school_forbidden_role(client, db_session):
    # Setup a student (wrong role)
    from app.infrastructure.database.models import UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    student = UserORM(
        id=uuid.uuid4(),
        email="stu@example.com",
        password_hash=pwd_context.hash("pass"),
        role="student",
        full_name="Stu",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/login", json={"email": "stu@example.com", "password": "pass"}
    )
    token = res.json()["access_token"]

    res = client.post(
        "/api/v1/auth/schools",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "E2E", "email": "a@a.com", "tax_id": "1", "password": "x"},
    )

    # Assert
    assert res.status_code == 403


def _login_user(client, db_session, *, email, password, role, school_id=None):
    from app.infrastructure.database.models import UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    user = UserORM(
        id=uuid.uuid4(),
        email=email,
        password_hash=pwd_context.hash(password),
        role=role,
        full_name=email,
        school_id=school_id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_delete_school_as_system_admin_deactivates_school_and_related_users(client, db_session):
    from app.infrastructure.database.models import SchoolORM, UserORM
    import uuid

    school = SchoolORM(id=uuid.uuid4(), name="Delete E2E", email="delete-e2e@school.com", active=True)
    db_session.add(school)
    db_session.flush()
    school_admin = UserORM(
        id=uuid.uuid4(),
        email="delete-e2e-admin@school.com",
        password_hash="hash",
        role="school_admin",
        full_name="School Admin",
        school_id=school.id,
        is_active=True,
    )
    db_session.add(school_admin)
    db_session.commit()
    token = _login_user(client, db_session, email="delete-sys@example.com", password="pass", role="system_admin")

    res = client.delete(f"/api/v1/auth/schools/{school.id}", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 204
    db_session.refresh(school)
    db_session.refresh(school_admin)
    assert school.active is False
    assert school_admin.is_active is False


def test_delete_school_forbidden_for_non_system_admin(client, db_session):
    from app.infrastructure.database.models import SchoolORM
    import uuid

    school = SchoolORM(id=uuid.uuid4(), name="Forbidden Delete", email="forbidden@school.com", active=True)
    db_session.add(school)
    db_session.commit()
    token = _login_user(client, db_session, email="delete-student@example.com", password="pass", role="student")

    res = client.delete(f"/api/v1/auth/schools/{school.id}", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 403
    db_session.refresh(school)
    assert school.active is True


def test_delete_school_unknown_school_returns_404(client, db_session):
    import uuid

    token = _login_user(client, db_session, email="delete-sys-404@example.com", password="pass", role="system_admin")

    res = client.delete(f"/api/v1/auth/schools/{uuid.uuid4()}", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 404
    assert res.json()["detail"] == "school_not_found"
