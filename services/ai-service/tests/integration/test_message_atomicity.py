from __future__ import annotations

from tests.conftest import auth_headers


def _create_conversation(client, user_id: str) -> str:
    response = client.post(
        "/api/v1/ai/conversations",
        headers=auth_headers(sub=user_id),
        json={"title": "atomicidad"},
    )
    assert response.status_code == 201
    return response.json()["conversation"]["id"]


def _list_messages(client, user_id: str, conversation_id: str) -> list[dict]:
    response = client.get(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=user_id),
        params={"conversation_id": conversation_id, "limit": 50, "offset": 0},
    )
    assert response.status_code == 200
    return response.json()["items"]


def test_successful_send_writes_exactly_two_messages(client):
    owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    conversation_id = _create_conversation(client, owner)

    response = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=owner),
        json={"conversation_id": conversation_id, "content": "hola"},
    )
    assert response.status_code == 201

    items = _list_messages(client, owner, conversation_id)
    assert len(items) == 2
    assert items[0]["role"] == "user"
    assert items[1]["role"] == "assistant"


def test_provider_failure_writes_no_messages(client, fake_provider):
    owner = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    conversation_id = _create_conversation(client, owner)

    fake_provider.set_mode("timeout")
    response = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=owner),
        json={"conversation_id": conversation_id, "content": "hola"},
    )
    assert response.status_code == 503

    items = _list_messages(client, owner, conversation_id)
    assert items == []
