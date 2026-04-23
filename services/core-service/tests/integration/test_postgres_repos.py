import pytest
from datetime import datetime
from app.infrastructure.database.models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.repositories.postgres_question_repo import PostgresQuestionRepository
from app.infrastructure.database.repositories.postgres_test_repo import PostgresTestRepository
from app.infrastructure.database.repositories.postgres_stats_repo import PostgresStatsRepository
from sqlalchemy.exc import IntegrityError
from app.infrastructure.database.models import (
    PermitModel,
    TopicModel,
    QuestionModel,
    OptionModel,
    CorrectOptionModel,
    TestModel,
    TestQuestionModel,
    AttemptModel,
    AttemptAnswerModel,
)
from app.domain.models import TestAttempt

# Usamos in-memory sqlite pero probamos las interacciones específicas del Adapter del Repo
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_repos.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(setup_db):
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def test_get_permits_empty(db_session):
    repo = PostgresQuestionRepository(db_session)
    permits = repo.get_permits()
    assert isinstance(permits, list)
    assert len(permits) == 0

def test_fetch_topics_for_invalid_permit_id(db_session):
    repo = PostgresQuestionRepository(db_session)
    topics = repo.get_topics(permit_id=9999)
    assert isinstance(topics, list)
    assert len(topics) == 0


def test_get_permit_by_code_returns_expected_permit(db_session):
    permit = PermitModel(code="D", name="Truck")
    db_session.add(permit)
    db_session.commit()

    repo = PostgresQuestionRepository(db_session)
    resolved = repo.get_permit_by_code("D")

    assert resolved is not None
    assert resolved.code == "D"
    assert resolved.name == "Truck"


def test_failed_mode_prioritizes_failed_pool_and_deterministic_backfill(db_session):
    permit = PermitModel(code="B", name="B")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Base")
    db_session.add(topic)
    db_session.flush()

    questions = []
    for i in range(1, 6):
        q = QuestionModel(
            external_id=f"Q-{i}",
            permit_id=permit.id,
            topic_id=topic.id,
            statement=f"Question {i}",
            requires_image=False,
        )
        db_session.add(q)
        db_session.flush()
        db_session.add_all(
            [
                OptionModel(question_id=q.id, label="a", text="A"),
                OptionModel(question_id=q.id, label="b", text="B"),
                OptionModel(question_id=q.id, label="c", text="C"),
                CorrectOptionModel(question_id=q.id, correct_label="a"),
            ]
        )
        questions.append(q)

    test_model = TestModel(user_id="77", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=30)
    db_session.add(test_model)
    db_session.flush()
    db_session.add_all([
        TestQuestionModel(test_id=test_model.id, question_id=q.id)
        for q in questions
    ])
    db_session.flush()

    # question 2 failed twice, question 4 failed once
    attempt_1 = AttemptModel(
        test_id=test_model.id,
        user_id="77",
        total_questions=30,
        correct_count=28,
        wrong_count=2,
    )
    attempt_2 = AttemptModel(
        test_id=test_model.id,
        user_id="77",
        total_questions=30,
        correct_count=29,
        wrong_count=1,
    )
    db_session.add_all([attempt_1, attempt_2])
    db_session.flush()

    from app.infrastructure.database.models import AttemptAnswerModel

    db_session.add_all(
        [
            AttemptAnswerModel(attempt_id=attempt_1.id, question_id=questions[1].id, selected_label="b", is_correct=False),
            AttemptAnswerModel(attempt_id=attempt_1.id, question_id=questions[3].id, selected_label="b", is_correct=False),
            AttemptAnswerModel(attempt_id=attempt_2.id, question_id=questions[1].id, selected_label="c", is_correct=False),
        ]
    )
    db_session.commit()

    repo = PostgresQuestionRepository(db_session)
    generated = repo.get_questions(mode="FAILED", count=4, permit_id=permit.id, user_id="77")

    generated_ids = [q.id for q in generated]
    assert generated_ids[:2] == [questions[1].id, questions[3].id]
    assert len(set(generated_ids)) == 4
    assert generated_ids[2:] == [questions[0].id, questions[2].id]


def test_failed_mode_with_sufficient_pool_returns_only_failed_questions(db_session):
    permit = PermitModel(code="F", name="F")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Failed Pool")
    db_session.add(topic)
    db_session.flush()

    questions = []
    for i in range(1, 36):
        q = QuestionModel(
            external_id=f"F-{i}",
            permit_id=permit.id,
            topic_id=topic.id,
            statement=f"Failed Question {i}",
            requires_image=False,
        )
        db_session.add(q)
        db_session.flush()
        db_session.add_all(
            [
                OptionModel(question_id=q.id, label="a", text="A"),
                OptionModel(question_id=q.id, label="b", text="B"),
                OptionModel(question_id=q.id, label="c", text="C"),
                CorrectOptionModel(question_id=q.id, correct_label="a"),
            ]
        )
        questions.append(q)

    test_model = TestModel(user_id="pool-user", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=30)
    db_session.add(test_model)
    db_session.flush()
    db_session.add_all([TestQuestionModel(test_id=test_model.id, question_id=q.id) for q in questions])
    db_session.flush()

    attempt = AttemptModel(
        test_id=test_model.id,
        user_id="pool-user",
        total_questions=35,
        correct_count=0,
        wrong_count=35,
    )
    db_session.add(attempt)
    db_session.flush()

    db_session.add_all(
        [
            AttemptAnswerModel(
                attempt_id=attempt.id,
                question_id=q.id,
                selected_label="b",
                is_correct=False,
            )
            for q in questions
        ]
    )
    db_session.commit()

    repo = PostgresQuestionRepository(db_session)
    generated = repo.get_questions(mode="FAILED", count=30, permit_id=permit.id, user_id="pool-user")

    generated_ids = [q.id for q in generated]
    failed_ids = {q.id for q in questions}
    assert len(generated_ids) == 30
    assert len(set(generated_ids)) == 30
    assert all(question_id in failed_ids for question_id in generated_ids)


def test_save_attempt_with_answers_persists_answer_rows(db_session):
    permit = PermitModel(code="A1", name="A1")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=9, name="Urban")
    db_session.add(topic)
    db_session.flush()

    question = QuestionModel(
        external_id="QA-1",
        permit_id=permit.id,
        topic_id=topic.id,
        statement="Pregunta",
        requires_image=False,
    )
    db_session.add(question)
    db_session.flush()

    test_model = TestModel(user_id="88", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=30)
    db_session.add(test_model)
    db_session.flush()

    repo = PostgresTestRepository(db_session)
    attempt = TestAttempt(
        id=0,
        test_id=test_model.id,
        user_id="88",
        correct_count=1,
        wrong_count=0,
        total_questions=1,
        score=100,
    )
    saved = repo.save_attempt_with_answers(
        attempt,
        answers=[
            {
                "question_id": question.id,
                "selected_label": "a",
                "is_correct": True,
            }
        ],
    )

    assert saved.id > 0

    from app.infrastructure.database.models import AttemptAnswerModel

    rows = db_session.query(AttemptAnswerModel).filter(AttemptAnswerModel.attempt_id == saved.id).all()
    assert len(rows) == 1
    assert rows[0].question_id == question.id
    assert rows[0].selected_label == "a"
    assert rows[0].is_correct is True


def test_save_attempt_with_answers_rolls_back_on_answer_constraint_error(db_session):
    permit = PermitModel(code="E", name="E")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Rollback")
    db_session.add(topic)
    db_session.flush()

    question = QuestionModel(
        external_id="QE-1",
        permit_id=permit.id,
        topic_id=topic.id,
        statement="Pregunta rollback",
        requires_image=False,
    )
    db_session.add(question)
    db_session.flush()

    test_model = TestModel(user_id="user-rollback", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=2)
    db_session.add(test_model)
    db_session.flush()

    repo = PostgresTestRepository(db_session)
    attempt = TestAttempt(
        id=0,
        test_id=test_model.id,
        user_id="user-rollback",
        correct_count=1,
        wrong_count=1,
        total_questions=2,
        score=50,
    )

    with pytest.raises(IntegrityError):
        repo.save_attempt_with_answers(
            attempt,
            answers=[
                {"question_id": question.id, "selected_label": "a", "is_correct": True},
                {"question_id": question.id, "selected_label": "b", "is_correct": False},
            ],
        )

    # session should remain usable and no partial attempt should persist
    attempts = db_session.query(AttemptModel).filter(AttemptModel.test_id == test_model.id).all()
    assert attempts == []


def test_stats_repo_returns_real_sections(db_session):
    permit = PermitModel(code="C", name="C")
    db_session.add(permit)
    db_session.flush()

    topic_1 = TopicModel(permit_id=permit.id, topic_number=1, name="Normas")
    topic_2 = TopicModel(permit_id=permit.id, topic_number=2, name="Seguridad")
    db_session.add_all([topic_1, topic_2])
    db_session.flush()

    q1 = QuestionModel(external_id="QC-1", permit_id=permit.id, topic_id=topic_1.id, statement="Q1", requires_image=False)
    q2 = QuestionModel(external_id="QC-2", permit_id=permit.id, topic_id=topic_2.id, statement="Q2", requires_image=False)
    db_session.add_all([q1, q2])
    db_session.flush()

    test_model = TestModel(user_id="501", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=2)
    db_session.add(test_model)
    db_session.flush()
    db_session.add_all(
        [
            TestQuestionModel(test_id=test_model.id, question_id=q1.id),
            TestQuestionModel(test_id=test_model.id, question_id=q2.id),
        ]
    )
    db_session.flush()

    attempt_1 = AttemptModel(
        test_id=test_model.id,
        user_id="501",
        started_at=datetime(2026, 1, 10, 10, 0, 0),
        finished_at=datetime(2026, 1, 10, 10, 2, 0),
        total_questions=2,
        correct_count=2,
        wrong_count=0,
        score=100,
    )
    attempt_2 = AttemptModel(
        test_id=test_model.id,
        user_id="501",
        started_at=datetime(2026, 1, 11, 12, 0, 0),
        finished_at=datetime(2026, 1, 11, 12, 3, 0),
        total_questions=5,
        correct_count=1,
        wrong_count=4,
        score=20,
    )
    db_session.add_all([attempt_1, attempt_2])
    db_session.flush()

    db_session.add_all(
        [
            AttemptAnswerModel(attempt_id=attempt_1.id, question_id=q1.id, selected_label="a", is_correct=True),
            AttemptAnswerModel(attempt_id=attempt_1.id, question_id=q2.id, selected_label="a", is_correct=True),
            AttemptAnswerModel(attempt_id=attempt_2.id, question_id=q1.id, selected_label="a", is_correct=True),
            AttemptAnswerModel(attempt_id=attempt_2.id, question_id=q2.id, selected_label="b", is_correct=False),
        ]
    )
    db_session.commit()

    repo = PostgresStatsRepository(db_session)

    summary = repo.get_summary(user_id="501", permit_id=permit.id)
    assert summary["total_tests"] == 2
    assert summary["passed_tests"] == 1
    assert summary["failed_tests"] == 1
    assert summary["accuracy_pct"] == 42.86
    assert summary["pass_rate_pct"] == 50.0
    assert summary["average_score"] == 60.0
    assert summary["last_activity_at"] == datetime(2026, 1, 11, 12, 3, 0)
    assert summary["average_time_seconds"] == 150.0
    assert summary["total_time_seconds"] == 300

    activity_dates = repo.get_activity_dates(user_id="501", permit_id=permit.id)
    assert activity_dates == [attempt_2.finished_at.date(), attempt_1.finished_at.date()]


    by_topic = repo.get_by_topic(user_id="501", permit_id=permit.id)
    assert len(by_topic) == 2
    assert by_topic[0]["topic_id"] == topic_1.id
    assert by_topic[0]["topic_name"] == "Normas"

    history = repo.get_history(user_id="501", permit_id=permit.id, limit=10, offset=0)
    assert len(history) == 2
    assert history[0]["permit_code"] == "C"
    assert history[0]["test_type"] == "PERMIT"

    trend = repo.get_trend(user_id="501", permit_id=permit.id)
    assert len(trend) == 2
    assert trend[0] == {"period": "2026-01-10", "tests": 1, "accuracy_pct": 100.0}
    assert trend[1] == {"period": "2026-01-11", "tests": 1, "accuracy_pct": 20.0}

    failed_distribution = repo.get_failed_distribution(user_id="501", permit_id=permit.id)
    assert failed_distribution == [{"topic_id": topic_2.id, "topic_name": "Seguridad", "wrong_count": 1}]

    test_type_distribution = repo.get_test_type_distribution(user_id="501", permit_id=permit.id)
    assert test_type_distribution == [{"test_type": "PERMIT", "tests": 2, "percentage": 100.0}]

    daily_activity = repo.get_daily_activity(user_id="501", permit_id=permit.id)
    assert daily_activity == [
        {"date": "2026-01-10", "tests": 1},
        {"date": "2026-01-11", "tests": 1},
    ]

    accuracy_comparison = repo.get_accuracy_comparison(user_id="501", permit_id=permit.id, window_days=1)
    assert accuracy_comparison == {
        "window_days": 1,
        "recent_accuracy_pct": 20.0,
        "previous_accuracy_pct": 100.0,
        "change_pct_points": -80.0,
    }


def test_stats_repo_summary_handles_zero_attempts(db_session):
    permit = PermitModel(code="G", name="G")
    db_session.add(permit)
    db_session.commit()

    repo = PostgresStatsRepository(db_session)

    summary = repo.get_summary(user_id="no-attempts", permit_id=permit.id)

    assert summary == {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "accuracy_pct": 0.0,
        "pass_rate_pct": 0.0,
        "average_score": 0.0,
        "last_activity_at": None,
        "average_time_seconds": 0.0,
        "total_time_seconds": 0,
    }


def test_stats_repo_ignores_invalid_negative_durations(db_session):
    permit = PermitModel(code="I", name="I")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Timing")
    db_session.add(topic)
    db_session.flush()

    question = QuestionModel(external_id="QI-1", permit_id=permit.id, topic_id=topic.id, statement="QI", requires_image=False)
    db_session.add(question)
    db_session.flush()

    test_model = TestModel(user_id="timing-user", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=1)
    db_session.add(test_model)
    db_session.flush()

    db_session.add_all(
        [
            AttemptModel(
                test_id=test_model.id,
                user_id="timing-user",
                started_at=datetime(2026, 1, 10, 10, 5, 0),
                finished_at=datetime(2026, 1, 10, 10, 0, 0),
                total_questions=1,
                correct_count=1,
                wrong_count=0,
                score=100,
            ),
            AttemptModel(
                test_id=test_model.id,
                user_id="timing-user",
                started_at=datetime(2026, 1, 10, 11, 0, 0),
                finished_at=datetime(2026, 1, 10, 11, 2, 0),
                total_questions=1,
                correct_count=1,
                wrong_count=0,
                score=100,
            ),
        ]
    )
    db_session.commit()

    repo = PostgresStatsRepository(db_session)

    summary = repo.get_summary(user_id="timing-user", permit_id=permit.id)

    assert summary["average_time_seconds"] == 120.0
    assert summary["total_time_seconds"] == 120


def test_stats_repo_returns_distinct_activity_dates_descending(db_session):
    permit = PermitModel(code="H", name="H")
    db_session.add(permit)
    db_session.flush()

    topic = TopicModel(permit_id=permit.id, topic_number=1, name="Activity")
    db_session.add(topic)
    db_session.flush()

    question = QuestionModel(external_id="QH-1", permit_id=permit.id, topic_id=topic.id, statement="QH", requires_image=False)
    db_session.add(question)
    db_session.flush()

    test_model = TestModel(user_id="activity-user", mode="PERMIT", permit_id=permit.id, topic_id=None, num_questions=1)
    db_session.add(test_model)
    db_session.flush()

    db_session.add_all(
        [
            AttemptModel(
                test_id=test_model.id,
                user_id="activity-user",
                total_questions=1,
                correct_count=1,
                wrong_count=0,
                score=100,
                finished_at=datetime(2026, 1, 8, 10, 0, 0),
            ),
            AttemptModel(
                test_id=test_model.id,
                user_id="activity-user",
                total_questions=1,
                correct_count=1,
                wrong_count=0,
                score=100,
                finished_at=datetime(2026, 1, 8, 18, 0, 0),
            ),
            AttemptModel(
                test_id=test_model.id,
                user_id="activity-user",
                total_questions=1,
                correct_count=1,
                wrong_count=0,
                score=100,
                finished_at=datetime(2026, 1, 7, 9, 0, 0),
            ),
        ]
    )
    db_session.commit()

    repo = PostgresStatsRepository(db_session)

    activity_dates = repo.get_activity_dates(user_id="activity-user", permit_id=permit.id)

    assert activity_dates == [datetime(2026, 1, 8).date(), datetime(2026, 1, 7).date()]
