import pytest
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models import Base, PermitModel, TopicModel, QuestionModel, OptionModel, CorrectOptionModel
from app.infrastructure.config import settings

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_e2e.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def _auth_headers(
    sub: str = "1",
    role: str = "student",
    expires_delta: timedelta = timedelta(minutes=10),
) -> dict[str, str]:
    payload = {
        "sub": sub,
        "role": role,
        "exp": datetime.now(timezone.utc) + expires_delta,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Sembrar un permiso (Permit) y un tema (Topic)
    permit = PermitModel(code="B", name="Coche")
    db.add(permit)
    db.commit()
    db.refresh(permit)

    permit_a1 = PermitModel(code="A1", name="Moto")
    db.add(permit_a1)
    db.commit()
    db.refresh(permit_a1)

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Señales de Tránsito")
    db.add(topic)
    db.commit()
    db.refresh(topic)

    topic_a1 = TopicModel(permit_id=permit_a1.id, topic_number=7, name="Motos Urbanas")
    db.add(topic_a1)
    db.commit()
    db.refresh(topic_a1)

    # 2. Sembrar exactamente 30 preguntas para poder generar un test válido
    for i in range(1, 31):
        q = QuestionModel(
            external_id=f"EXT-Q-{i}", 
            permit_id=permit.id, 
            topic_id=topic.id, 
            statement=f"¿Qué significa la señal {i}?",
            difficulty=2,
            requires_image=False
        )
        db.add(q)
        db.flush()
        
        # Opciones A, B, C
        for l in ['a', 'b', 'c']:
            db.add(OptionModel(question_id=q.id, label=l, text=f"Opción {l} de la pregunta {i}"))
            
        # Opción correcta = 'b' para todas
        db.add(CorrectOptionModel(question_id=q.id, correct_label='b'))

    q_a1 = QuestionModel(
        external_id="EXT-A1-1",
        permit_id=permit_a1.id,
        topic_id=topic_a1.id,
        statement="Pregunta permiso A1",
        difficulty=1,
        requires_image=False,
    )
    db.add(q_a1)
    db.flush()
    for l in ['a', 'b', 'c']:
        db.add(OptionModel(question_id=q_a1.id, label=l, text=f"Opción {l} A1"))
    db.add(CorrectOptionModel(question_id=q_a1.id, correct_label='c'))
        
    db.commit()
    db.close()

    yield
    # Limpiar DB tras el test
    Base.metadata.drop_all(bind=engine)

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_permits():
    response = client.get("/api/v1/permits", headers=_auth_headers())
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    assert any(item["code"] == "B" for item in data["items"])


def test_get_permits_unauthorized_problem_details():
    response = client.get("/api/v1/permits")
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["status"] == 401
    assert body["title"] == "Unauthorized"
    assert body["detail"] == "missing_token"

def test_generate_test_unauthorized():
    # 1. Test missing authorization block (401)
    req_payload = {"permit_code": "B", "mode": "PERMIT"}
    response = client.post("/api/v1/tests/generate", json=req_payload)
    assert response.status_code == 401


def test_generate_test_invalid_token_returns_problem():
    req_payload = {"permit_code": "B", "mode": "PERMIT"}
    headers = {"Authorization": "Bearer not-a-valid-jwt"}
    response = client.post("/api/v1/tests/generate", json=req_payload, headers=headers)
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["title"] == "Unauthorized"
    assert body["detail"] == "invalid_token"


def test_generate_test_expired_token_returns_problem():
    req_payload = {"permit_code": "B", "mode": "PERMIT"}
    headers = _auth_headers(sub="1", role="student", expires_delta=timedelta(minutes=-1))
    response = client.post("/api/v1/tests/generate", json=req_payload, headers=headers)
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["detail"] == "invalid_token"


def test_generate_test_accepts_uuid_sub_claim():
    req_payload = {"permit_code": "B", "mode": "PERMIT"}
    headers = _auth_headers(sub="550e8400-e29b-41d4-a716-446655440000", role="student")
    response = client.post("/api/v1/tests/generate", json=req_payload, headers=headers)
    assert response.status_code == 200

def test_generate_test_invalid_inputs():
    headers = _auth_headers()
    # Missing required query params inside request body triggers 422 Unprocessable Entity
    response = client.post("/api/v1/tests/generate", json={"mode": "RANDOM"}, headers=headers)
    assert response.status_code == 422
    data = response.json()
    assert data["detail"] == "validation_error"
    assert any("permit_code" in err["field"] for err in data["errors"])

    # Invalid mode
    response = client.post("/api/v1/tests/generate", json={"permit_code": "B", "mode": "invalid-mode"}, headers=headers)
    assert response.status_code == 422


def test_generate_test_accepts_contract_mode_license():
    headers = _auth_headers()
    response = client.post(
        "/api/v1/tests/generate",
        json={"permit_code": "B", "mode": "license"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "PERMIT"

def test_get_non_existent_test():
    headers = _auth_headers()
    response = client.get("/api/v1/tests/9999", headers=headers)
    # Using REST RFC 7807 so check details
    assert response.status_code == 404

def test_generate_test_and_submit():
    # 1. Generar test (modo PERMIT)
    req_payload = {
        "permit_code": "B",
        "mode": "PERMIT"
    }
    # Simulamos el Header Authorization para que pase nuestra dependencia "get_current_user_id"
    headers = _auth_headers()
    
    gen_response = client.post("/api/v1/tests/generate", json=req_payload, headers=headers)
    assert gen_response.status_code == 200
    
    gen_data = gen_response.json()
    assert gen_data["mode"] == "PERMIT"
    assert len(gen_data["questions"]) == 30
    
    test_id = gen_data["id"]
    
    # 2. Enviar respuestas al test (equivocarse en 3 a propósito: elegimos 'a' que es incorrecta para las primeras 3)
    answers = []
    for idx, q in enumerate(gen_data["questions"]):
        # La respuesta correcta sembrada era 'b'. 
        selected = 'a' if idx < 3 else 'b' 
        answers.append({"question_id": q["id"], "selected_label": selected})
        
    submit_response = client.post(f"/api/v1/tests/{test_id}/submit", json={"answers": answers}, headers=headers)
    assert submit_response.status_code == 200
    
    submit_data = submit_response.json()
    assert submit_data["test_id"] == test_id
    assert submit_data["correct_count"] == 27
    assert submit_data["wrong_count"] == 3
    # Debe ser TRUE porque la regla dice wrong_count <= 3
    assert submit_data["passed"] is True
    assert len(submit_data["review_items"]) == 30
    first_review_item = next(item for item in submit_data["review_items"] if item["question_id"] == gen_data["questions"][0]["id"])
    assert first_review_item == {
        "question_id": gen_data["questions"][0]["id"],
        "selected_label": "a",
        "is_answered": True,
        "correct_label": "b",
        "is_correct": False,
    }


def test_topics_filter_by_permit_code_and_unknown_permit_problem():
    headers = _auth_headers()

    ok_response = client.get("/api/v1/topics", params={"permit_code": "A1"}, headers=headers)
    assert ok_response.status_code == 200
    ok_data = ok_response.json()
    assert "items" in ok_data
    assert len(ok_data["items"]) == 1
    assert ok_data["items"][0]["name"] == "Motos Urbanas"

    unknown = client.get("/api/v1/topics", params={"permit_code": "ZX"}, headers=headers)
    assert unknown.status_code == 404
    assert unknown.headers["content-type"].startswith("application/problem+json")
    problem = unknown.json()
    assert problem["title"] == "Not Found"
    assert problem["detail"] == "permit_not_found"


def test_submit_test_accepts_partial_answers_and_marks_unanswered_in_review():
    headers = _auth_headers()

    gen_response = client.post(
        "/api/v1/tests/generate",
        json={"permit_code": "B", "mode": "PERMIT"},
        headers=headers,
    )
    assert gen_response.status_code == 200
    gen_data = gen_response.json()

    answers = [
        {"question_id": gen_data["questions"][0]["id"], "selected_label": "b"},
        {"question_id": gen_data["questions"][1]["id"], "selected_label": "a"},
    ]

    submit_response = client.post(f"/api/v1/tests/{gen_data['id']}/submit", json={"answers": answers}, headers=headers)
    assert submit_response.status_code == 200

    submit_data = submit_response.json()
    assert submit_data["correct_count"] == 1
    assert submit_data["wrong_count"] == 1
    assert submit_data["passed"] is True
    assert submit_data["score"] == 3
    assert len(submit_data["review_items"]) == 30
    answered_review = next(item for item in submit_data["review_items"] if item["question_id"] == gen_data["questions"][0]["id"])
    unanswered_review = next(item for item in submit_data["review_items"] if item["question_id"] == gen_data["questions"][2]["id"])

    assert answered_review["selected_label"] == "b"
    assert answered_review["is_answered"] is True
    assert answered_review["is_correct"] is True
    assert unanswered_review == {
        "question_id": gen_data["questions"][2]["id"],
        "selected_label": None,
        "is_answered": False,
        "correct_label": "b",
        "is_correct": False,
    }


def test_questions_random_uses_permit_code_resolver():
    headers = _auth_headers()
    response = client.get(
        "/api/v1/questions/random",
        params={"permit_code": "A1", "count": 1},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["statement"] == "Pregunta permiso A1"


def test_questions_random_without_filters_returns_items_wrapper():
    headers = _auth_headers()
    response = client.get(
        "/api/v1/questions/random",
        params={"count": 2},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 2


def _generate_and_submit_for_user(sub: str, wrong_first_n: int = 0) -> int:
    headers = _auth_headers(sub=sub, role="student")
    generate_payload = {"permit_code": "B", "mode": "PERMIT"}
    generated = client.post("/api/v1/tests/generate", json=generate_payload, headers=headers)
    assert generated.status_code == 200
    test_data = generated.json()

    answers = []
    for idx, q in enumerate(test_data["questions"]):
        selected = "a" if idx < wrong_first_n else "b"
        answers.append({"question_id": q["id"], "selected_label": selected})

    submitted = client.post(
        f"/api/v1/tests/{test_data['id']}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert submitted.status_code == 200
    return test_data["id"]


def test_stats_returns_real_sections_for_student():
    _generate_and_submit_for_user(sub="55", wrong_first_n=4)

    response = client.get("/api/v1/stats", headers=_auth_headers(sub="55", role="student"))
    assert response.status_code == 200
    payload = response.json()

    assert payload["summary"]["total_tests"] >= 1
    assert "pass_rate_pct" in payload["summary"]
    assert "current_streak_days" in payload["summary"]
    assert payload["summary"]["pass_rate_pct"] == 0.0
    assert payload["summary"]["current_streak_days"] >= 1
    assert payload["goal"] == {
        "target_accuracy_pct": 90.0,
        "current_accuracy_pct": 86.67,
        "progress_pct": 96.3,
    }
    assert isinstance(payload["by_topic"], list)
    assert isinstance(payload["history"], list)
    assert isinstance(payload["trend"], list)
    assert isinstance(payload["failed_distribution"], list)
    assert payload["summary"]["failed_tests"] >= 1


def test_stats_forbidden_for_cross_student_without_admin_role():
    _generate_and_submit_for_user(sub="71", wrong_first_n=1)

    response = client.get(
        "/api/v1/stats",
        params={"student_id": 71},
        headers=_auth_headers(sub="72", role="student"),
    )
    assert response.status_code == 403
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["detail"] == "forbidden"


def test_stats_admin_can_query_other_student():
    _generate_and_submit_for_user(sub="91", wrong_first_n=2)

    response = client.get(
        "/api/v1/stats",
        params={"student_id": 91},
        headers=_auth_headers(sub="999", role="system_admin"),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["total_tests"] >= 1


def test_stats_admin_can_query_other_student_by_uuid():
    target_user = "550e8400-e29b-41d4-a716-446655440111"
    _generate_and_submit_for_user(sub=target_user, wrong_first_n=2)

    response = client.get(
        "/api/v1/stats",
        params={"student_id": target_user},
        headers=_auth_headers(sub="550e8400-e29b-41d4-a716-446655440999", role="system_admin"),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["total_tests"] >= 1
