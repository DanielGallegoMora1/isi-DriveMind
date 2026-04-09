import pytest
from app.infrastructure.database.models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.repositories.postgres_question_repo import PostgresQuestionRepository

# Usamos in-memory sqlite pero probamos las interacciones específicas del Adapter del Repo
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_repos.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(setup_db):
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def test_get_permits_empty(db_session):
    repo = PostgresQuestionRepository(db_session)
    permits = repo.get_permits()
    assert isinstance(permits, list)
    assert len(permits) == 0

def test_fetch_topics_for_invalid_permit_id(db_session):
    repo = PostgresQuestionRepository(db_session)
    topics = repo.get_topics(permit_id=9999)
    assert isinstance(topics, list)
    assert len(topics) == 0
