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

def test_test_submit_request_requires_30_answers():
    with pytest.raises(ValidationError) as exc:
        TestSubmitRequest(answers=[AnswerItem(question_id=1, selected_label="a")])
    assert "Exactly 30 answers must be submitted" in str(exc.value)

def test_test_submit_request_valid_30_answers():
    answers = [AnswerItem(question_id=i, selected_label="b") for i in range(1, 31)]
    req = TestSubmitRequest(answers=answers)
    assert len(req.answers) == 30
