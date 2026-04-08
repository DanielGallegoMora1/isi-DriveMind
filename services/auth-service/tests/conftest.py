import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.infrastructure.database.models import Base
from app.infrastructure.database.database import get_db

# En un entorno real, usarías una BBDD distinta sacada de variables de entorno (ej. pytest-env)
# Para no complicar la ejecución local del alumno, instanciamos SQLite en memoria para tests
# NOTA: En un caso 100% estricto con UUIDs y constraints de Postgres, SQLite puede quedarse corto.
# Pero dado que el Sprint exige simplicidad y no tenemos un test-container de PG listo,
# usaremos sqlite en memoria mode='sqlite:///:memory:'.
# IMPORTANTE: Si la BBDD de dev usa UUID puros y SQLite no los soporta bien,
# la mejor alternativa es levantar en el `docker-compose.yml` una base `auth_test_db`.

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_database):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
