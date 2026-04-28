import pytest
from uuid import uuid4

from app.domain.models import School
from app.infrastructure.repositories.school_repository import SqlSchoolRepository
from app.infrastructure.database.models import UserORM


def test_sql_school_repository_save_and_list(db_session):
    repo = SqlSchoolRepository(db_session)

    # Arrange
    admin_user = UserORM(
        id=uuid4(),
        email="testschooladmin@example.com",
        password_hash="fakehash",
        role="school_admin",
        full_name="Test Admin",
        is_active=True,
    )
    school = School(
        id=uuid4(),
        name="SQL Test School",
        email="test@school.com",
        tax_id="12345",
        address="",
        phone="",
        active=True,
    )

    # Act
    saved_school, saved_admin = repo.create(school, admin_user, "fakehash")

    # Assert
    assert saved_school.name == "SQL Test School"
    assert saved_admin.school_id == school.id

    # Test List
    schools, total = repo.list(limit=10, offset=0, name="SQL")
    assert total == 1
    assert schools[0].name == "SQL Test School"


def test_sql_school_repository_sort(db_session):
    repo = SqlSchoolRepository(db_session)
    # Arrange
    for i in range(3):
        school = School(
            id=uuid4(),
            name=f"School {i}",
            email=f"{i}@test.com",
            tax_id="123",
            address="",
            phone="",
            active=True,
        )
        repo._db.add(
            UserORM(
                id=uuid4(),
                email=f"a{i}@a.com",
                password_hash="",
                role="school_admin",
                full_name="",
                school_id=school.id,
                is_active=True,
            )
        )
        saved, _ = repo.create(
            school,
            UserORM(
                id=uuid4(),
                email=f"b{i}@a.com",
                password_hash="",
                role="school_admin",
                full_name="",
                is_active=True,
            ),
            "hash",
        )

    # Act: Descending sort by name
    schools, total = repo.list(limit=10, offset=0, sort="-name")

    # Assert
    # since db_session rolls back per test, total should be 3
    assert total == 3
    assert schools[0].name == "School 2"
    assert schools[2].name == "School 0"


def test_sql_school_delete_use_case_deactivates_school_and_related_users(db_session):
    from app.application.school_use_cases import delete_school
    from app.infrastructure.database.models import SchoolORM
    from app.infrastructure.repositories.user_repository import SqlUserRepository

    school_repo = SqlSchoolRepository(db_session)
    user_repo = SqlUserRepository(db_session)
    school = School(
        id=uuid4(),
        name="Delete Me School",
        email="delete@school.com",
        tax_id="DEL-1",
        address="",
        phone="",
        active=True,
    )
    saved_school, saved_admin = school_repo.create(
        school,
        UserORM(
            id=uuid4(),
            email="delete.admin@school.com",
            password_hash="hash",
            role="school_admin",
            full_name="Delete Admin",
            is_active=True,
        ),
        "hash",
    )
    student = UserORM(
        id=uuid4(),
        email="delete.student@school.com",
        password_hash="hash",
        role="student",
        full_name="Delete Student",
        school_id=saved_school.id,
        is_active=True,
    )
    system_admin = UserORM(
        id=uuid4(),
        email="delete.sys@school.com",
        password_hash="hash",
        role="system_admin",
        full_name="Delete Sys",
        school_id=saved_school.id,
        is_active=True,
    )
    db_session.add_all([student, system_admin])
    db_session.commit()

    delete_school(saved_school.id, school_repo, user_repo)

    school_row = db_session.get(SchoolORM, saved_school.id)
    school_admin_row = db_session.get(UserORM, saved_admin.id)
    student_row = db_session.get(UserORM, student.id)
    system_admin_row = db_session.get(UserORM, system_admin.id)
    assert school_row.active is False
    assert school_admin_row.is_active is False
    assert student_row.is_active is False
    assert system_admin_row.is_active is True
