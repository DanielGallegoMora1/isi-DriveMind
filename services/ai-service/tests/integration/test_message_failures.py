from __future__ import annotations

import pytest

from tests.conftest import auth_headers


def _create_conversation(client, user_id: str) -> str:
    response = client.post(
        "/api/v1/ai/conversations",
        headers=auth_headers(sub=user_id),
        json={"title": "fallos"},
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


@pytest.mark.parametrize(
    ("failure_mode", "expected_detail", "expected_type"),
    [
        (
            "timeout",
            "provider_timeout",
            "https://drivemind.dev/problems/ai/provider-timeout",
        ),
        (
            "upstream_5xx",
            "provider_upstream_error",
            "https://drivemind.dev/problems/ai/provider-upstream-5xx",
        ),
        (
            "retry_exhausted",
            "provider_retry_exhausted",
            "https://drivemind.dev/problems/ai/provider-retry-exhausted",
        ),
    ],
)
def test_provider_failure_maps_problem_and_persists_nothing(
    client,
    fake_provider,
    failure_mode: str,
    expected_detail: str,
    expected_type: str,
):
    owner = "77777777-7777-4777-8777-777777777777"
    fake_provider.set_mode(failure_mode)
    conversation_id = _create_conversation(client, owner)

    response = client.post(
        "/api/v1/ai/messages",
        headers=auth_headers(sub=owner),
        json={"conversation_id": conversation_id, "content": "hola"},
    )

    assert response.status_code == 503
    assert response.headers["content-type"].startswith("application/problem+json")
    problem = response.json()
    assert problem["detail"] == expected_detail
    assert problem["type"] == expected_type

    items = _list_messages(client, owner, conversation_id)
    assert items == []
