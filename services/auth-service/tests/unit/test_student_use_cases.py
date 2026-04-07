from uuid import uuid4
import pytest

from app.application.student_use_cases import assign_licenses, revoke_license
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
