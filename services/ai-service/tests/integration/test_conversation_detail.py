from __future__ import annotations

from tests.conftest import auth_headers


def test_get_conversation_detail_returns_conversation_and_messages(client):
    create_conversation = client.post(
        "/api/v1/ai/conversations",
        headers=auth_headers(sub="11111111-1111-4111-8111-111111111111"),
        json={"title": "detalle"},
    )
    assert create_conversation.status_code == 201
    conversation_id = create_conversation.json()["conversation"]["id"]

    send_message = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub="11111111-1111-4111-8111-111111111111"),
        json={"conversation_id": conversation_id, "content": "hola"},
    )
    assert send_message.status_code == 201

    detail = client.get(
        f"/api/v1/ai/conversations/{conversation_id}",
        headers=auth_headers(sub="11111111-1111-4111-8111-111111111111"),
    )

    assert detail.status_code == 200
    body = detail.json()
    assert set(body.keys()) == {"conversation", "messages"}
    assert body["conversation"]["id"] == conversation_id
    assert len(body["messages"]) == 2
    assert body["messages"][0]["role"] == "user"
    assert body["messages"][1]["role"] == "assistant"


def test_foreign_conversation_returns_404_problem(client):
    create_conversation = client.post(
        "/api/v1/ai/conversations",
        headers=auth_headers(sub="22222222-2222-4222-8222-222222222222"),
        json={"title": "privado"},
    )
    assert create_conversation.status_code == 201
    conversation_id = create_conversation.json()["conversation"]["id"]

    response = client.get(
        f"/api/v1/ai/conversations/{conversation_id}",
        headers=auth_headers(sub="33333333-3333-4333-8333-333333333333"),
    )

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    problem = response.json()
    assert problem["title"] == "Not Found"
    assert problem["detail"] == "conversation_not_found"
