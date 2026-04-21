from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.infrastructure.config import settings
from app.infrastructure.database.database import get_db
from app.infrastructure.database.models import Base
from app.main import app
from app.presentation.dependencies import get_ai_provider
from app.presentation.errors import ProviderRetryExhaustedError, ProviderTimeoutError, ProviderUpstreamError


class FakeProvider:
    def __init__(self) -> None:
        self.calls: list[list[dict[str, str]]] = []
        self.mode: str = "success"

    def set_mode(self, mode: str) -> None:
        self.mode = mode

    def generate_reply(self, *, messages: list[dict[str, str]]) -> str:
        self.calls.append(messages)

        if self.mode == "timeout":
            raise ProviderTimeoutError("provider_timeout")
        if self.mode == "upstream_5xx":
            raise ProviderUpstreamError("provider_upstream_error")
        if self.mode == "retry_exhausted":
            raise ProviderRetryExhaustedError("provider_retry_exhausted")

        return "respuesta-del-asistente"


TEST_DATABASE_URL = "sqlite:///./test_ai_service.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_database: None) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def fake_provider() -> FakeProvider:
    return FakeProvider()


@pytest.fixture
def client(db_session: Session, fake_provider: FakeProvider) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    def override_provider() -> FakeProvider:
        return fake_provider

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_ai_provider] = override_provider
    yield TestClient(app)
    app.dependency_overrides.clear()


def auth_headers(
    *,
    sub: str = "550e8400-e29b-41d4-a716-446655440000",
    role: str = "student",
    expires_delta: timedelta = timedelta(minutes=15),
) -> dict[str, str]:
    payload = {
        "sub": sub,
        "role": role,
        "exp": datetime.now(timezone.utc) + expires_delta,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return {"Authorization": f"Bearer {token}"}
