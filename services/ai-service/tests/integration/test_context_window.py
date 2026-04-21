from __future__ import annotations

from tests.conftest import auth_headers


def _seed_conversation_with_messages(client, owner_id: str, count: int) -> str:
    create = client.post(
        "/api/v1/ai/conversations",
        headers=auth_headers(sub=owner_id),
        json={"title": "ctx"},
    )
    assert create.status_code == 201
    conversation_id = create.json()["conversation"]["id"]

    for index in range(count):
        sent = client.post(
            "/api/v1/ai/messages",
            headers=auth_headers(sub=owner_id),
            json={"conversation_id": conversation_id, "content": f"msg-{index}"},
        )
        assert sent.status_code == 201

    return conversation_id


def test_default_context_window_10_is_used(client, fake_provider):
    owner = "44444444-4444-4444-8444-444444444444"
    conversation_id = _seed_conversation_with_messages(client, owner, 12)

    response = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=owner),
        json={"conversation_id": conversation_id, "content": "mensaje-actual"},
    )
    assert response.status_code == 201

    sent_payload = fake_provider.calls[-1]
    assert sent_payload[0]["role"] == "system"
    assert sent_payload[-1] == {"role": "user", "content": "mensaje-actual"}
    assert len(sent_payload) == 12  # system + 10 prior + current user


def test_context_window_respects_configured_value(client, fake_provider):
    owner = "55555555-5555-4555-8555-555555555555"
    conversation_id = _seed_conversation_with_messages(client, owner, 9)

    from app.infrastructure.config import settings

    original_value = settings.ai_context_window_messages
    settings.ai_context_window_messages = 6
    try:
        response = client.post(
            "/api/v1/ai/messages",
            headers=auth_headers(sub=owner),
            json={"conversation_id": conversation_id, "content": "mensaje-actual"},
        )
        assert response.status_code == 201
    finally:
        settings.ai_context_window_messages = original_value

    sent_payload = fake_provider.calls[-1]
    assert len(sent_payload) == 8  # system + 6 prior + current user


def test_context_window_includes_all_messages_when_shorter(client, fake_provider):
    owner = "66666666-6666-4666-8666-666666666666"
    conversation_id = _seed_conversation_with_messages(client, owner, 1)

    response = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=owner),
        json={"conversation_id": conversation_id, "content": "mensaje-actual"},
    )
    assert response.status_code == 201

    sent_payload = fake_provider.calls[-1]
    assert len(sent_payload) == 4  # system + 2 prior + current user
