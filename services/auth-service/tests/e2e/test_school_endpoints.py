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
        "/v1/auth/login", json={"email": "sysadmin@example.com", "password": "pass"}
    )
    token = res.json()["access_token"]

    # Act: create school
    res = client.post(
        "/v1/auth/schools",
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
        "/v1/auth/login", json={"email": "stu@example.com", "password": "pass"}
    )
    token = res.json()["access_token"]

    res = client.post(
        "/v1/auth/schools",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "E2E", "email": "a@a.com", "tax_id": "1", "password": "x"},
    )

    # Assert
    assert res.status_code == 403
