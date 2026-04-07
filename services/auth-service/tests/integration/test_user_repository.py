import pytest
from uuid import uuid4

from app.domain.models import User
from app.infrastructure.repositories.user_repository import SqlUserRepository
from app.infrastructure.database.models import SchoolORM


def test_sql_user_repo_list_by_school(db_session):
    repo = SqlUserRepository(db_session)
    school_id = uuid4()

    # Arrange: We need the school to exist to satisfy FK constraints if using PG,
    # but SQLite memory might not enforce FKs by default unless PRAGMA is set.
    # Let's add it cleanly anyway.
    db_session.add(
        SchoolORM(
            id=school_id,
            name="Dep Test School",
            active=True,
            email="a",
            tax_id="a",
            address="",
            phone="",
        )
    )
    db_session.commit()

    user1 = User(
        id=uuid4(),
        school_id=school_id,
        document_id=None,
        email="s1@test.com",
        role="student",
        full_name="S1",
        is_active=True,
    )
    user2 = User(
        id=uuid4(),
        school_id=school_id,
        document_id=None,
        email="s2@test.com",
        role="student",
        full_name="S2",
        is_active=False,
    )

    repo.create(user1, "hash1")
    repo.create(user2, "hash2")

    # Act: Filter by active
    active_students, total = repo.list_by_school(
        school_id, limit=10, offset=0, active=True
    )

    # Assert
    assert total == 1
    assert active_students[0].email == "s1@test.com"


def test_sql_user_repo_get_password_hash(db_session):
    repo = SqlUserRepository(db_session)
    school_id = uuid4()
    user = User(
        school_id=school_id,
        document_id=None,
        id=uuid4(),
        email="pwd@test.com",
        role="student",
        full_name="P",
        is_active=True,
    )

    # For save to work, we need an ORM object, repo.save maps it via _user_to_orm.
    # Wait, save method of UserRepo receives User object, but doesn't receive password_hash?
    # Ah, User object has password_hash? No, schema doesn't have it on Domain.
    # The SqlUserRepository `save` method might lack password_hash injection. We just test getting it if we seed it directly via ORM for this test.
    from app.infrastructure.database.models import UserORM

    db_user = UserORM(
        id=user.id,
        email="pwdhash@test.com",
        password_hash="SECRET_HASH",
        role="student",
        full_name="P",
        is_active=True,
    )
    db_session.add(db_user)
    db_session.commit()

    # Act
    found_hash = repo.get_password_hash("pwdhash@test.com")
    assert found_hash == "SECRET_HASH"
