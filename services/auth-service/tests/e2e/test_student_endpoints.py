def test_assign_license_endpoint(client, db_session):
    from app.infrastructure.database.models import UserORM, SchoolORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    # 1. Setup school
    school_id = uuid.uuid4()
    school = SchoolORM(
        id=school_id,
        name="Test School",
        active=True,
        email="s@s.com",
        tax_id="a",
        address="",
        phone="",
    )
    db_session.add(school)

    # 2. Setup school_admin
    admin = UserORM(
        id=uuid.uuid4(),
        email="adm@s.com",
        password_hash=pwd_context.hash("p"),
        role="school_admin",
        school_id=school_id,
        full_name="A",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    # 3. Login school_admin
    token = client.post(
        "/v1/auth/login", json={"email": "adm@s.com", "password": "p"}
    ).json()["access_token"]

    # 4. Create Student via endpoint (as school_admin)
    res_student = client.post(
        "/v1/auth/students",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "est@s.com",
            "password": "p",
            "full_name": "E",
            "document_id": "D1",
            "licenses": ["B"],
        },
    )

    assert res_student.status_code == 201
    student_id = res_student.json()["id"]
    assert "B" in res_student.json()["licenses"]

    # 5. Assign License via Endpoint
    res_append = client.post(
        f"/v1/auth/students/{student_id}/licenses",
        headers={"Authorization": f"Bearer {token}"},
        json={"license_codes": ["A2"]},
    )
    assert res_append.status_code == 200
    assert "A2" in res_append.json()["licenses"]
    assert "B" in res_append.json()["licenses"]
