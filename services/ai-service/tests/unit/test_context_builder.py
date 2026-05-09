from __future__ import annotations

from app.application.ai_use_cases import build_provider_messages
from app.huggingFace_client import SYSTEM_PROMPT


def test_build_provider_messages_uses_default_window_order_and_current_user_last():
    history = [{"role": "assistant", "content": f"m-{index}"} for index in range(12)]

    payload = build_provider_messages(
        system_prompt="sistema",
        prior_messages=history,
        context_window_messages=10,
        current_user_content="pregunta",
    )

    assert payload[0] == {"role": "system", "content": "sistema"}
    assert len(payload) == 12  # system + 10 prior + current user
    assert payload[-1] == {"role": "user", "content": "pregunta"}
    assert payload[1]["content"] == "m-2"
    assert payload[-2]["content"] == "m-11"


def test_build_provider_messages_uses_custom_window():
    history = [{"role": "user", "content": f"m-{index}"} for index in range(10)]

    payload = build_provider_messages(
        system_prompt="sistema",
        prior_messages=history,
        context_window_messages=6,
        current_user_content="pregunta",
    )

    assert len(payload) == 8  # system + 6 prior + current user
    assert [item["content"] for item in payload[1:-1]] == [
        "m-4",
        "m-5",
        "m-6",
        "m-7",
        "m-8",
        "m-9",
    ]


def test_build_provider_messages_includes_all_when_history_shorter_than_window():
    history = [{"role": "assistant", "content": "a"}, {"role": "user", "content": "b"}]

    payload = build_provider_messages(
        system_prompt="sistema",
        prior_messages=history,
        context_window_messages=10,
        current_user_content="pregunta",
    )

    assert len(payload) == 4
    assert payload[1]["content"] == "a"
    assert payload[2]["content"] == "b"


def test_system_prompt_explicitly_limits_answer_to_latest_user_message():
    assert "ÚLTIMO mensaje enviado por el usuario" in SYSTEM_PROMPT
    assert "contexto es SOLO de referencia" in SYSTEM_PROMPT
