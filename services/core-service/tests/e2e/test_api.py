import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.infrastructure.database.session import get_db
from app.infrastructure.database.models import Base, PermitModel, TopicModel, QuestionModel, OptionModel, CorrectOptionModel

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

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Sembrar un permiso (Permit) y un tema (Topic)
    permit = PermitModel(code="B", name="Coche")
    db.add(permit)
    db.commit()
    db.refresh(permit)

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Señales de Tránsito")
    db.add(topic)
    db.commit()
    db.refresh(topic)

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
    response = client.get("/api/v1/permits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["code"] == "B"

def test_generate_test_unauthorized():
    # 1. Test missing authorization block (401)
    req_payload = {"permit_code": "B", "mode": "PERMIT"}
    response = client.post("/api/v1/tests/generate", json=req_payload)
    assert response.status_code == 401

def test_generate_test_invalid_inputs():
    headers = {"Authorization": "Bearer super-fake-jwt-token"}
    # Missing required query params inside request body triggers 422 Unprocessable Entity
    response = client.post("/api/v1/tests/generate", json={"mode": "RANDOM"}, headers=headers)
    assert response.status_code == 422
    data = response.json()
    assert "permit_code" in data["detail"][0]["loc"]

    # Invalid mode (not UPPERCASE)
    response = client.post("/api/v1/tests/generate", json={"permit_code": "B", "mode": "random"}, headers=headers)
    assert response.status_code == 422

def test_get_non_existent_test():
    headers = {"Authorization": "Bearer super-fake-jwt-token"}
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
    headers = {"Authorization": "Bearer super-fake-jwt-token"}
    
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
