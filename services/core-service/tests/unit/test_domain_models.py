import pytest
from datetime import datetime
from app.domain.models import Question, Option, Test, TestAttempt, Permit, Topic

def test_create_permit():
    permit = Permit(id=1, code="B", name="Coche")
    assert permit.code == "B"
    assert permit.name == "Coche"

def test_create_topic():
    topic = Topic(id=1, permit_id=1, topic_number=1, name="Señales")
    assert topic.permit_id == 1
    assert topic.topic_number == 1

def test_create_question_with_options():
    options = [
        Option(id=1, question_id=1, label="a", text="Option A"),
        Option(id=2, question_id=1, label="b", text="Option B")
    ]
    question = Question(
        id=1,
        external_id="Q-001",
        permit_id=1,
        topic_id=1,
        statement="What is this sign?",
        difficulty=3,
        requires_image=False,
        options=options
    )
    assert question.statement == "What is this sign?"
    assert len(question.options) == 2
    assert question.options[0].label == "a"

def test_create_test_attempt():
    attempt = TestAttempt(
        id=1,
        test_id=10,
        user_id=100,
        started_at=datetime.now(),
        correct_count=28,
        wrong_count=2
    )
    assert attempt.user_id == 100
    assert attempt.is_passed() is True

def test_test_attempt_fails_with_more_than_3_errors():
    attempt = TestAttempt(
        id=2,
        test_id=10,
        user_id=100,
        started_at=datetime.now(),
        correct_count=26,
        wrong_count=4
    )
    assert attempt.is_passed() is False
