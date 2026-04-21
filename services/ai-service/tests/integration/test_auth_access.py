from __future__ import annotations

from tests.conftest import auth_headers


def test_all_supported_roles_can_access_ai_endpoints(client):
    for role in ("student", "school_admin", "system_admin"):
        response = client.post(
            "/api/v1/ai/conversations",
            headers=auth_headers(role=role),
            json={"title": f"chat-{role}"},
        )

        assert response.status_code == 201
        body = response.json()
        assert "conversation" in body


def test_missing_token_returns_401_problem(client):
    response = client.get("/api/v1/ai/conversations")

    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["title"] == "Unauthorized"
    assert body["detail"] == "missing_token"


def test_invalid_token_returns_401_problem(client):
    response = client.get(
        "/api/v1/ai/conversations",
        headers={"Authorization": "Bearer invalid"},
    )

    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    body = response.json()
    assert body["title"] == "Unauthorized"
    assert body["detail"] == "invalid_token"
