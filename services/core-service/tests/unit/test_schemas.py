import pytest
from pydantic import ValidationError
from app.presentation.schemas import TestGenerateRequest, TestSubmitRequest, AnswerItem

def test_test_generate_request_requires_topic_id_if_mode_is_topic():
    with pytest.raises(ValidationError) as exc:
        TestGenerateRequest(permit_code="B", mode="TOPIC")
    assert "topic_id is required when mode is TOPIC" in str(exc.value)

def test_test_generate_request_random_mode_ok():
    req = TestGenerateRequest(permit_code="B", mode="RANDOM")
    assert req.mode == "RANDOM"
    assert req.count == 30


def test_test_generate_request_accepts_contract_mode_values():
    req = TestGenerateRequest(permit_code="B", mode="license")
    assert req.mode == "PERMIT"

    topic_req = TestGenerateRequest(permit_code="B", mode="topic", topic_id=7)
    assert topic_req.mode == "TOPIC"

def test_test_submit_request_accepts_empty_answers_collection():
    req = TestSubmitRequest(answers=[])
    assert req.answers == []

def test_test_submit_request_valid_answers_collection():
    answers = [AnswerItem(question_id=i, selected_label="b") for i in range(1, 13)]
    req = TestSubmitRequest(answers=answers)
    assert len(req.answers) == 12


def test_test_submit_request_accepts_optional_timing_fields():
    req = TestSubmitRequest(
        answers=[AnswerItem(question_id=1, selected_label="a")],
        started_at="2026-01-10T10:00:00",
        duration_seconds=120,
    )

    assert req.started_at.isoformat() == "2026-01-10T10:00:00"
    assert req.duration_seconds == 120
