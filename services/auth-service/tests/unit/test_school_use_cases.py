from uuid import uuid4

import pytest

from app.application.school_use_cases import delete_school
from app.domain.models import School, User
from tests.unit.fakes import FakeSchoolRepository, FakeUserRepository


def test_delete_school_deactivates_school_and_related_non_system_users():
    school_id = uuid4()
    system_admin_id = uuid4()
    school_admin_id = uuid4()
    student_id = uuid4()
    other_student_id = uuid4()
    school_repo = FakeSchoolRepository()
    user_repo = FakeUserRepository()
    school_repo.schools[school_id] = School(
        id=school_id,
        name="Autoescuela Centro",
        email="admin@centro.test",
        tax_id="TAX-1",
        address="Calle Mayor",
        phone="600000000",
        active=True,
    )
    user_repo.users[system_admin_id] = User(
        id=system_admin_id,
        email="sys@example.com",
        full_name="Sys",
        role="system_admin",
        school_id=school_id,
        document_id=None,
        is_active=True,
    )
    user_repo.users[school_admin_id] = User(
        id=school_admin_id,
        email="school@example.com",
        full_name="School Admin",
        role="school_admin",
        school_id=school_id,
        document_id=None,
        is_active=True,
    )
    user_repo.users[student_id] = User(
        id=student_id,
        email="student@example.com",
        full_name="Student",
        role="student",
        school_id=school_id,
        document_id=None,
        is_active=True,
    )
    user_repo.users[other_student_id] = User(
        id=other_student_id,
        email="other@example.com",
        full_name="Other",
        role="student",
        school_id=uuid4(),
        document_id=None,
        is_active=True,
    )

    delete_school(school_id, school_repo, user_repo)

    assert school_repo.schools[school_id].active is False
    assert user_repo.users[school_admin_id].is_active is False
    assert user_repo.users[student_id].is_active is False
    assert user_repo.users[system_admin_id].is_active is True
    assert user_repo.users[other_student_id].is_active is True


def test_delete_school_unknown_school_raises_school_not_found():
    school_repo = FakeSchoolRepository()
    user_repo = FakeUserRepository()

    with pytest.raises(ValueError) as exc:
        delete_school(uuid4(), school_repo, user_repo)

    assert str(exc.value) == "school_not_found"
