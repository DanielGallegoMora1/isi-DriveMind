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
        "/api/v1/auth/login", json={"email": "adm@s.com", "password": "p"}
    ).json()["access_token"]

    # 4. Create Student via endpoint (as school_admin)
    res_student = client.post(
        "/api/v1/auth/students",
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
        f"/api/v1/auth/students/{student_id}/licenses",
        headers={"Authorization": f"Bearer {token}"},
        json={"license_codes": ["A2"]},
    )
    assert res_append.status_code == 200
    assert "A2" in res_append.json()["licenses"]
    assert "B" in res_append.json()["licenses"]


def test_student_management_endpoints_reject_non_student_targets(client, db_session):
    from app.infrastructure.database.models import SchoolORM, UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    school_id = uuid.uuid4()
    db_session.add(
        SchoolORM(
            id=school_id,
            name="Test School",
            active=True,
            email="school@test.com",
            tax_id="tax",
            address="",
            phone="",
        )
    )

    admin = UserORM(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=pwd_context.hash("p"),
        role="school_admin",
        school_id=school_id,
        full_name="Admin",
        is_active=True,
    )
    same_school_manager = UserORM(
        id=uuid.uuid4(),
        email="manager@test.com",
        password_hash=pwd_context.hash("p"),
        role="school_admin",
        school_id=school_id,
        full_name="Manager",
        is_active=True,
    )
    db_session.add(admin)
    db_session.add(same_school_manager)
    db_session.commit()

    token = client.post(
        "/api/v1/auth/login", json={"email": "admin@test.com", "password": "p"}
    ).json()["access_token"]

    target_id = str(same_school_manager.id)

    responses = [
        client.get(
            f"/api/v1/auth/students/{target_id}",
            headers={"Authorization": f"Bearer {token}"},
        ),
        client.patch(
            f"/api/v1/auth/students/{target_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"full_name": "Updated"},
        ),
        client.post(
            f"/api/v1/auth/students/{target_id}/licenses",
            headers={"Authorization": f"Bearer {token}"},
            json={"license_codes": ["B"]},
        ),
        client.delete(
            f"/api/v1/auth/students/{target_id}/licenses/B",
            headers={"Authorization": f"Bearer {token}"},
        ),
    ]

    for response in responses:
        assert response.status_code == 404
        assert response.json()["detail"] == "student_not_found"


def test_list_students_endpoint_supports_search_sort_and_excludes_admins(client, db_session):
    from app.infrastructure.database.models import SchoolORM, StudentLicenseORM, UserORM
    from app.application.auth_use_cases import pwd_context
    import uuid

    school_id = uuid.uuid4()
    db_session.add(
        SchoolORM(
            id=school_id,
            name="Autoescuela Norte",
            active=True,
            email="norte@test.com",
            tax_id="tax",
            address="",
            phone="",
        )
    )

    admin = UserORM(
        id=uuid.uuid4(),
        email="admin@norte.com",
        password_hash=pwd_context.hash("p"),
        role="school_admin",
        school_id=school_id,
        full_name="Admin Norte",
        is_active=True,
    )
    alpha_student = UserORM(
        id=uuid.uuid4(),
        email="alpha@student.com",
        password_hash=pwd_context.hash("p"),
        role="student",
        school_id=school_id,
        full_name="Alpha Student",
        document_id="DOC-001",
        is_active=True,
    )
    zeta_student = UserORM(
        id=uuid.uuid4(),
        email="zeta@student.com",
        password_hash=pwd_context.hash("p"),
        role="student",
        school_id=school_id,
        full_name="Zeta Student",
        document_id="DOC-999",
        is_active=True,
    )
    same_school_staff = UserORM(
        id=uuid.uuid4(),
        email="staff@norte.com",
        password_hash=pwd_context.hash("p"),
        role="school_admin",
        school_id=school_id,
        full_name="Staff Norte",
        is_active=True,
    )
    db_session.add_all([admin, alpha_student, zeta_student, same_school_staff])
    db_session.flush()
    db_session.add(StudentLicenseORM(user_id=alpha_student.id, license_code="B", status="active"))
    db_session.add(StudentLicenseORM(user_id=zeta_student.id, license_code="B", status="active"))
    db_session.commit()

    token = client.post(
        "/api/v1/auth/login", json={"email": "admin@norte.com", "password": "p"}
    ).json()["access_token"]

    response = client.get(
        "/api/v1/auth/students",
        headers={"Authorization": f"Bearer {token}"},
        params={"license": "B", "search": "student", "sort": "email"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert [item["email"] for item in payload["items"]] == [
        "alpha@student.com",
        "zeta@student.com",
    ]
