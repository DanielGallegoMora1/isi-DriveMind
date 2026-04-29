from uuid import uuid4
import pytest

from app.application.student_use_cases import (
    assign_licenses,
    list_students,
    revoke_license,
    update_student,
)
from app.domain.models import User
from tests.unit.fakes import FakeUserRepository, FakeStudentLicenseRepository


def test_assign_license_success():
    user_repo = FakeUserRepository()
    lic_repo = FakeStudentLicenseRepository()

    school_id = uuid4()
    student_id = uuid4()

    student = User(
        id=student_id,
        school_id=school_id,
        document_id=None,
        email="student@test.com",
        role="student",
        full_name="Student",
        is_active=True,
    )
    user_repo.users[student_id] = student

    # Act
    updated_licenses = assign_licenses(
        student_id=student_id,
        school_id=school_id,  # matching school
        license_codes=["A", "B"],
        user_repo=user_repo,
        license_repo=lic_repo,
    )

    # Assert
    codes = [l.license_code for l in updated_licenses]
    assert "A" in codes
    assert "B" in codes
    assert len(lic_repo.licenses) == 2


def test_assign_license_wrong_school():
    user_repo = FakeUserRepository()
    lic_repo = FakeStudentLicenseRepository()

    student_id = uuid4()
    student = User(
        id=student_id,
        school_id=uuid4(),
        document_id=None,
        email="student@test.com",
        role="student",
        full_name="Student",
        is_active=True,
    )
    user_repo.users[student_id] = student

    with pytest.raises(ValueError) as exc:
        assign_licenses(
            student_id=student_id,
            school_id=uuid4(),  # Different school
            license_codes=["A"],
            user_repo=user_repo,
            license_repo=lic_repo,
        )
    assert "student_not_found" in str(exc.value)


def test_assign_license_rejects_non_student_even_in_same_school():
    user_repo = FakeUserRepository()
    lic_repo = FakeStudentLicenseRepository()

    school_id = uuid4()
    admin_id = uuid4()
    user_repo.users[admin_id] = User(
        id=admin_id,
        school_id=school_id,
        document_id=None,
        email="admin@test.com",
        role="school_admin",
        full_name="Admin",
        is_active=True,
    )

    with pytest.raises(ValueError) as exc:
        assign_licenses(
            student_id=admin_id,
            school_id=school_id,
            license_codes=["B"],
            user_repo=user_repo,
            license_repo=lic_repo,
        )

    assert str(exc.value) == "student_not_found"


def test_update_student_rejects_non_student_even_in_same_school():
    user_repo = FakeUserRepository()

    school_id = uuid4()
    admin_id = uuid4()
    user_repo.users[admin_id] = User(
        id=admin_id,
        school_id=school_id,
        document_id=None,
        email="admin@test.com",
        role="school_admin",
        full_name="Admin",
        is_active=True,
    )

    with pytest.raises(ValueError) as exc:
        update_student(
            student_id=admin_id,
            school_id=school_id,
            full_name="Nuevo nombre",
            document_id=None,
            active=None,
            user_repo=user_repo,
        )

    assert str(exc.value) == "student_not_found"


def test_list_students_supports_search_and_sort():
    user_repo = FakeUserRepository()
    school_id = uuid4()

    alpha_id = uuid4()
    beta_id = uuid4()
    user_repo.users[alpha_id] = User(
        id=alpha_id,
        school_id=school_id,
        document_id="DOC-9",
        email="zeta@test.com",
        role="student",
        full_name="Zeta Student",
        is_active=True,
    )
    user_repo.users[beta_id] = User(
        id=beta_id,
        school_id=school_id,
        document_id="DOC-1",
        email="alpha@test.com",
        role="student",
        full_name="Alpha Student",
        is_active=True,
    )

    students, total = list_students(
        school_id=school_id,
        limit=10,
        offset=0,
        user_repo=user_repo,
        search="alpha",
        sort="email",
    )

    assert total == 1
    assert [student.email for student in students] == ["alpha@test.com"]


def test_revoke_license_rejects_non_student_even_in_same_school():
    user_repo = FakeUserRepository()
    lic_repo = FakeStudentLicenseRepository()

    school_id = uuid4()
    admin_id = uuid4()
    user_repo.users[admin_id] = User(
        id=admin_id,
        school_id=school_id,
        document_id=None,
        email="admin@test.com",
        role="school_admin",
        full_name="Admin",
        is_active=True,
    )

    with pytest.raises(ValueError) as exc:
        revoke_license(
            student_id=admin_id,
            school_id=school_id,
            license_code="B",
            user_repo=user_repo,
            license_repo=lic_repo,
        )

    assert str(exc.value) == "student_not_found"
