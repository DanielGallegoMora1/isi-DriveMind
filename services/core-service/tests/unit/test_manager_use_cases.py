import pytest
from typing import List, Dict, Optional
from datetime import datetime

from app.application.manager_use_cases import TestManager
from app.domain.models import Question, Test, TestAttempt, Permit, Topic, Option
from app.domain.ports import QuestionRepository, TestRepository, StatsRepository
from app.presentation.schemas import TestGenerateRequest, TestSubmitRequest, AnswerItem

class FakeQuestionRepository(QuestionRepository):
    def __init__(self):
        self.questions = []
        self.last_get_questions_kwargs: dict = {}
        for i in range(1, 31):
            opts = [Option(id=1, question_id=i, label='a', text='A'),
                    Option(id=2, question_id=i, label='b', text='B'),
                    Option(id=3, question_id=i, label='c', text='C')]
            q = Question(id=i, external_id=f"ext_{i}", permit_id=1, topic_id=1, statement=f"Q{i}", difficulty=1, options=opts)
            self.questions.append(q)
        
    def get_permits(self) -> List[Permit]:
        return [Permit(id=1, code="B", name="B")]

    def get_topics(self, permit_id: Optional[int] = None) -> List[Topic]:
        return [Topic(id=1, permit_id=1, topic_number=1, name="Init")]

    def get_permit_by_code(self, permit_code: str) -> Optional[Permit]:
        if permit_code == "B":
            return Permit(id=1, code="B", name="B")
        return None

    def get_questions(
        self,
        mode: str,
        count: int = 30,
        permit_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> List[Question]:
        self.last_get_questions_kwargs = {
            "mode": mode,
            "count": count,
            "permit_id": permit_id,
            "topic_id": topic_id,
            "user_id": user_id,
        }
        return self.questions[:count]

    def get_correct_answers(self, question_ids: List[int]) -> Dict[int, str]:
        return {q.id: 'a' for q in self.questions if q.id in question_ids}


class FakeTestRepository(TestRepository):
    def __init__(self):
        self.tests: Dict[int, Test] = {}
        self.attempts: Dict[int, TestAttempt] = {}
        self.saved_attempt_answers: List[dict] = []
        self._test_seq = 1
        self._attempt_seq = 1

    def save_test(self, test: Test) -> Test:
        test.id = self._test_seq
        self._test_seq += 1
        self.tests[test.id] = test
        return test

    def get_test_by_id(self, test_id: int) -> Optional[Test]:
        return self.tests.get(test_id)

    def save_attempt(self, attempt: TestAttempt) -> TestAttempt:
        attempt.id = self._attempt_seq
        self._attempt_seq += 1
        self.attempts[attempt.id] = attempt
        return attempt

    def save_attempt_with_answers(self, attempt: TestAttempt, answers: List[dict]) -> TestAttempt:
        saved = self.save_attempt(attempt)
        self.saved_attempt_answers = answers
        return saved


class FakeStatsRepository(StatsRepository):
    def __init__(self) -> None:
        self.last_kwargs: dict = {}

    def get_summary(self, *, user_id: str, permit_id: Optional[int] = None) -> dict:
        self.last_kwargs["summary"] = {"user_id": user_id, "permit_id": permit_id}
        return {
            "total_tests": 2,
            "passed_tests": 1,
            "failed_tests": 1,
            "accuracy_pct": 66.67,
            "pass_rate_pct": 50.0,
            "average_score": 55.5,
            "last_activity_at": datetime(2026, 1, 12, 9, 30),
            "average_time_seconds": 150.0,
            "total_time_seconds": 300,
        }

    def get_by_topic(self, *, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        self.last_kwargs["by_topic"] = {"user_id": user_id, "permit_id": permit_id}
        return [
            {"topic_id": 1, "topic_name": "Normas", "correct": 3, "wrong": 2, "accuracy_pct": 60.0},
            {"topic_id": 2, "topic_name": "Señales", "correct": 9, "wrong": 1, "accuracy_pct": 90.0},
        ]

    def get_history(
        self,
        *,
        user_id: str,
        permit_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[dict]:
        self.last_kwargs["history"] = {
            "user_id": user_id,
            "permit_id": permit_id,
            "limit": limit,
            "offset": offset,
        }
        return [
            {
                "test_id": 10,
                "created_at": datetime(2026, 1, 1),
                "passed": True,
                "score": 90,
                "correct_count": 27,
                "wrong_count": 3,
                "accuracy_pct": 90.0,
                "permit_code": "B",
                "topic_id": None,
                "test_type": "PERMIT",
            }
        ]

    def get_trend(self, *, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        self.last_kwargs["trend"] = {"user_id": user_id, "permit_id": permit_id}
        return [
            {"period": "2026-01-06", "tests": 1, "accuracy_pct": 50.0},
            {"period": "2026-01-08", "tests": 1, "accuracy_pct": 70.0},
            {"period": "2026-01-11", "tests": 1, "accuracy_pct": 90.0},
        ]

    def get_failed_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        self.last_kwargs["failed_distribution"] = {"user_id": user_id, "permit_id": permit_id}
        return [{"topic_id": 1, "wrong_count": 2}]

    def get_activity_dates(self, *, user_id: str, permit_id: Optional[int] = None) -> List[datetime.date]:
        self.last_kwargs["activity_dates"] = {"user_id": user_id, "permit_id": permit_id}
        return [
            datetime(2026, 1, 12).date(),
            datetime(2026, 1, 11).date(),
            datetime(2026, 1, 9).date(),
            datetime(2026, 1, 8).date(),
            datetime(2026, 1, 7).date(),
        ]

    def get_test_type_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        self.last_kwargs["test_type_distribution"] = {"user_id": user_id, "permit_id": permit_id}
        return [
            {"test_type": "PERMIT", "tests": 2, "percentage": 66.67},
            {"test_type": "FAILED", "tests": 1, "percentage": 33.33},
        ]

    def get_daily_activity(self, *, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        self.last_kwargs["daily_activity"] = {"user_id": user_id, "permit_id": permit_id}
        return [
            {"date": "2026-01-06", "tests": 1},
            {"date": "2026-01-08", "tests": 2},
            {"date": "2026-01-11", "tests": 1},
            {"date": "2026-01-12", "tests": 3},
        ]

    def get_accuracy_comparison(self, *, user_id: str, permit_id: Optional[int] = None, window_days: int = 7) -> dict:
        self.last_kwargs["accuracy_comparison"] = {
            "user_id": user_id,
            "permit_id": permit_id,
            "window_days": window_days,
        }
        return {
            "window_days": window_days,
            "recent_accuracy_pct": 78.0,
            "previous_accuracy_pct": 65.0,
            "change_pct_points": 13.0,
        }


@pytest.fixture
def test_manager():
    return TestManager(question_repo=FakeQuestionRepository(), test_repo=FakeTestRepository())


@pytest.fixture
def test_manager_with_stats():
    return TestManager(
        question_repo=FakeQuestionRepository(),
        test_repo=FakeTestRepository(),
        stats_repo=FakeStatsRepository(),
    )


def test_generate_test(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)
    
    assert test.id == 1
    assert test.user_id == "10"
    assert test.mode == "RANDOM"
    assert test.num_questions == 30
    assert len(test.questions) == 30
    assert test.questions[0].statement == "Q1"


def test_submit_test_passed(test_manager: TestManager):
    # Generar un test primero para guardarlo
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)
    
    # Fake repo ensures all correct answers are 'a'
    answers = [AnswerItem(question_id=i, selected_label='a') for i in range(1, 31)]
    submit_req = TestSubmitRequest(answers=answers)
    
    result = test_manager.submit_test(user_id="10", test_id=test.id, request=submit_req)
    
    assert result.passed is True
    assert result.correct_count == 30
    assert result.wrong_count == 0
    assert result.score == 100
    assert len(result.review_items) == 30
    assert result.review_items[0].question_id == 1
    assert result.review_items[0].selected_label == 'a'
    assert result.review_items[0].correct_label == 'a'
    assert result.review_items[0].is_correct is True


def test_submit_test_failed(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)
    
    # Fallamos 5 preguntas (max 3 para aprobar), contestamos todo con 'b' menos las primeras 25
    answers = [AnswerItem(question_id=i, selected_label='a') for i in range(1, 26)]
    answers.extend([AnswerItem(question_id=i, selected_label='b') for i in range(26, 31)])
    
    submit_req = TestSubmitRequest(answers=answers)
    
    result = test_manager.submit_test(user_id="10", test_id=test.id, request=submit_req)
    
    assert result.passed is False
    assert result.correct_count == 25
    assert result.wrong_count == 5


def test_generate_failed_mode_uses_request_count_and_mode(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="FAILED", count=12)

    generated = test_manager.generate_test(user_id="99", request=request)

    assert generated.mode == "FAILED"
    assert generated.num_questions == 12
    assert len(generated.questions) == 12

    question_repo = test_manager.question_repo
    assert question_repo.last_get_questions_kwargs["mode"] == "FAILED"
    assert question_repo.last_get_questions_kwargs["count"] == 12
    assert question_repo.last_get_questions_kwargs["user_id"] == "99"


def test_submit_test_computes_by_topic_and_persists_answer_rows(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    # Move last 10 questions to topic 2 so by_topic can be asserted
    for idx, question in enumerate(test.questions, start=1):
        if idx > 20:
            question.topic_id = 2

    # first 15 correct + next 5 wrong on topic 1, then 8 correct + 2 wrong on topic 2
    answers = []
    for idx, q in enumerate(test.questions, start=1):
        if idx <= 15:
            selected = "a"
        elif idx <= 20:
            selected = "b"
        elif idx <= 28:
            selected = "a"
        else:
            selected = "b"
        answers.append(AnswerItem(question_id=q.id, selected_label=selected))

    submit_req = TestSubmitRequest(answers=answers)

    result = test_manager.submit_test(user_id="10", test_id=test.id, request=submit_req)

    assert result.correct_count == 23
    assert result.wrong_count == 7
    assert result.passed is False
    assert result.score == 77
    assert len(result.by_topic) == 2

    topic_1 = next(item for item in result.by_topic if item.topic_id == 1)
    topic_2 = next(item for item in result.by_topic if item.topic_id == 2)
    assert topic_1.correct == 15
    assert topic_1.wrong == 5
    assert topic_1.accuracy_pct == 75.0
    assert topic_2.correct == 8
    assert topic_2.wrong == 2
    assert topic_2.accuracy_pct == 80.0

    review_item_16 = next(item for item in result.review_items if item.question_id == test.questions[15].id)
    assert review_item_16.selected_label == "b"
    assert review_item_16.correct_label == "a"
    assert review_item_16.is_correct is False

    test_repo = test_manager.test_repo
    assert len(test_repo.saved_attempt_answers) == 30
    assert test_repo.saved_attempt_answers[0]["question_id"] == test.questions[0].id
    assert "is_correct" in test_repo.saved_attempt_answers[0]


def test_submit_test_keeps_unanswered_questions_out_of_wrong_count_and_review_data(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    for idx, question in enumerate(test.questions, start=1):
        if idx > 20:
            question.topic_id = 2

    answers = [AnswerItem(question_id=i, selected_label="a") for i in range(1, 11)]
    submit_req = TestSubmitRequest(answers=answers)

    result = test_manager.submit_test(user_id="10", test_id=test.id, request=submit_req)

    assert result.correct_count == 10
    assert result.wrong_count == 0
    assert result.passed is True
    assert result.score == 33
    assert len(result.review_items) == 30

    answered_review = next(item for item in result.review_items if item.question_id == 1)
    unanswered_review = next(item for item in result.review_items if item.question_id == 30)
    assert answered_review.selected_label == "a"
    assert answered_review.is_answered is True
    assert answered_review.is_correct is True
    assert unanswered_review.selected_label is None
    assert unanswered_review.is_answered is False
    assert unanswered_review.correct_label == "a"
    assert unanswered_review.is_correct is False

    topic_1 = next(item for item in result.by_topic if item.topic_id == 1)
    assert topic_1.correct == 10
    assert topic_1.wrong == 0
    assert topic_1.accuracy_pct == 100.0
    assert all(item.topic_id != 2 for item in result.by_topic)

    test_repo = test_manager.test_repo
    assert len(test_repo.saved_attempt_answers) == 10


def test_submit_test_uses_test_created_at_as_default_started_at(test_manager: TestManager, monkeypatch: pytest.MonkeyPatch):
    fixed_finish = datetime(2026, 1, 12, 12, 0, 0)

    class FixedDateTime:
        @staticmethod
        def now():
            return fixed_finish

    monkeypatch.setattr("app.application.manager_use_cases.datetime", FixedDateTime)

    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)
    test.created_at = datetime(2026, 1, 12, 11, 45, 0)

    result = test_manager.submit_test(
        user_id="10",
        test_id=test.id,
        request=TestSubmitRequest(answers=[AnswerItem(question_id=i, selected_label="a") for i in range(1, 31)]),
    )

    assert result.score == 100
    saved_attempt = next(iter(test_manager.test_repo.attempts.values()))
    assert saved_attempt.started_at == datetime(2026, 1, 12, 11, 45, 0)
    assert saved_attempt.finished_at == fixed_finish


def test_submit_test_uses_duration_seconds_when_provided(test_manager: TestManager, monkeypatch: pytest.MonkeyPatch):
    fixed_finish = datetime(2026, 1, 12, 12, 0, 0)

    class FixedDateTime:
        @staticmethod
        def now():
            return fixed_finish

    monkeypatch.setattr("app.application.manager_use_cases.datetime", FixedDateTime)

    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)
    test.created_at = datetime(2026, 1, 12, 10, 0, 0)

    test_manager.submit_test(
        user_id="10",
        test_id=test.id,
        request=TestSubmitRequest(
            answers=[AnswerItem(question_id=i, selected_label="a") for i in range(1, 31)],
            duration_seconds=120,
        ),
    )

    saved_attempt = next(iter(test_manager.test_repo.attempts.values()))
    assert saved_attempt.started_at == datetime(2026, 1, 12, 11, 58, 0)
    assert saved_attempt.finished_at == fixed_finish


def test_submit_test_rejects_started_at_after_finish(test_manager: TestManager, monkeypatch: pytest.MonkeyPatch):
    fixed_finish = datetime(2026, 1, 12, 12, 0, 0)

    class FixedDateTime:
        @staticmethod
        def now():
            return fixed_finish

    monkeypatch.setattr("app.application.manager_use_cases.datetime", FixedDateTime)

    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    with pytest.raises(ValueError, match="invalid_started_at"):
        test_manager.submit_test(
            user_id="10",
            test_id=test.id,
            request=TestSubmitRequest(
                answers=[AnswerItem(question_id=i, selected_label="a") for i in range(1, 31)],
                started_at=datetime(2026, 1, 12, 12, 1, 0),
            ),
        )


def test_submit_test_accepts_empty_answer_submission(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    result = test_manager.submit_test(user_id="10", test_id=test.id, request=TestSubmitRequest(answers=[]))

    assert result.correct_count == 0
    assert result.wrong_count == 0
    assert result.passed is True
    assert result.score == 0
    assert len(result.review_items) == 30
    assert all(item.selected_label is None for item in result.review_items)
    assert all(item.is_answered is False for item in result.review_items)
    assert test_manager.test_repo.saved_attempt_answers == []


def test_submit_test_rejects_duplicate_question_answers(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    answers = [AnswerItem(question_id=i, selected_label="a") for i in range(1, 30)]
    answers.append(AnswerItem(question_id=1, selected_label="a"))

    with pytest.raises(ValueError, match="duplicate_answers"):
        test_manager.submit_test(user_id="10", test_id=test.id, request=TestSubmitRequest(answers=answers))


def test_submit_test_rejects_answers_for_question_not_in_test(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id="10", request=request)

    answers = [AnswerItem(question_id=i, selected_label="a") for i in range(1, 30)]
    answers.append(AnswerItem(question_id=999, selected_label="a"))

    with pytest.raises(ValueError, match="answers_not_in_test"):
        test_manager.submit_test(user_id="10", test_id=test.id, request=TestSubmitRequest(answers=answers))


def test_get_stats_assembles_all_sections_and_resolves_permit(test_manager_with_stats: TestManager):
    stats = test_manager_with_stats.get_stats(user_id="42", permit_code="B", limit=5, offset=10)

    assert stats.summary.total_tests == 2
    assert stats.summary.pass_rate_pct == 50.0
    assert stats.summary.average_score == 55.5
    assert stats.summary.current_streak_days == 2
    assert stats.summary.best_streak_days == 3
    assert stats.summary.last_activity_at == datetime(2026, 1, 12, 9, 30)
    assert stats.summary.average_time_seconds == 150.0
    assert stats.summary.total_time_seconds == 300
    assert stats.goal.target_accuracy_pct == 90.0
    assert stats.goal.current_accuracy_pct == 66.67
    assert stats.goal.progress_pct == 74.08
    assert len(stats.by_topic) == 2
    assert stats.by_topic[0].topic_name == "Normas"
    assert len(stats.history) == 1
    assert stats.history[0].test_type == "PERMIT"
    assert len(stats.trend) == 3
    assert stats.trend[0].period == "2026-01-06"
    assert len(stats.failed_distribution) == 1
    assert len(stats.test_type_distribution) == 2
    assert stats.test_type_distribution[0].test_type == "PERMIT"
    assert len(stats.weekly_activity) == 7
    assert stats.weekly_activity[0].date == "2026-01-06"
    assert stats.weekly_activity[1].tests == 0
    assert stats.weekly_activity[-1].date == "2026-01-12"
    assert stats.weekly_activity[-1].tests == 3
    assert stats.insights.strongest_topic.topic_name == "Señales"
    assert stats.insights.improvement_area.topic_name == "Normas"
    assert stats.insights.trend.window_days == 7
    assert stats.insights.trend.change_pct_points == 13.0
    assert stats.insights.trend.direction == "up"

    stats_repo = test_manager_with_stats.stats_repo
    assert stats_repo.last_kwargs["summary"] == {"user_id": "42", "permit_id": 1}
    assert stats_repo.last_kwargs["history"] == {"user_id": "42", "permit_id": 1, "limit": 5, "offset": 10}
    assert stats_repo.last_kwargs["activity_dates"] == {"user_id": "42", "permit_id": 1}
    assert stats_repo.last_kwargs["test_type_distribution"] == {"user_id": "42", "permit_id": 1}
    assert stats_repo.last_kwargs["daily_activity"] == {"user_id": "42", "permit_id": 1}
    assert stats_repo.last_kwargs["accuracy_comparison"] == {"user_id": "42", "permit_id": 1, "window_days": 7}


def test_get_stats_caps_goal_progress_and_handles_empty_accuracy(test_manager_with_stats: TestManager):
    stats_repo = test_manager_with_stats.stats_repo

    def zero_summary(*, user_id: str, permit_id: Optional[int] = None) -> dict:
        return {
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

    def no_activity(*, user_id: str, permit_id: Optional[int] = None) -> List[datetime.date]:
        return []

    def no_topics(*, user_id: str, permit_id: Optional[int] = None) -> List[dict]:
        return []

    def no_accuracy_comparison(*, user_id: str, permit_id: Optional[int] = None, window_days: int = 7) -> dict:
        return {
            "window_days": window_days,
            "recent_accuracy_pct": 0.0,
            "previous_accuracy_pct": 0.0,
            "change_pct_points": 0.0,
        }

    stats_repo.get_summary = zero_summary
    stats_repo.get_activity_dates = no_activity
    stats_repo.get_by_topic = no_topics
    stats_repo.get_accuracy_comparison = no_accuracy_comparison

    stats = test_manager_with_stats.get_stats(user_id="42")

    assert stats.summary.pass_rate_pct == 0.0
    assert stats.summary.current_streak_days == 0
    assert stats.summary.best_streak_days == 0
    assert stats.summary.last_activity_at is None
    assert stats.summary.average_time_seconds == 0.0
    assert stats.summary.total_time_seconds == 0
    assert stats.goal.current_accuracy_pct == 0.0
    assert stats.goal.progress_pct == 0.0
    assert stats.insights.strongest_topic is None
    assert stats.insights.improvement_area is None
    assert stats.insights.trend.direction == "stable"
    assert stats.insights.trend.change_pct_points == 0.0


def test_get_stats_caps_goal_progress_at_one_hundred(test_manager_with_stats: TestManager):
    stats_repo = test_manager_with_stats.stats_repo

    def high_accuracy_summary(*, user_id: str, permit_id: Optional[int] = None) -> dict:
        return {
            "total_tests": 4,
            "passed_tests": 4,
            "failed_tests": 0,
            "accuracy_pct": 96.0,
            "pass_rate_pct": 100.0,
            "average_score": 96.0,
            "last_activity_at": datetime(2026, 1, 12, 9, 30),
            "average_time_seconds": 100.0,
            "total_time_seconds": 400,
        }

    stats_repo.get_summary = high_accuracy_summary

    stats = test_manager_with_stats.get_stats(user_id="42")

    assert stats.goal.current_accuracy_pct == 96.0
    assert stats.goal.progress_pct == 100.0


def test_get_stats_raises_when_permit_code_not_found(test_manager_with_stats: TestManager):
    with pytest.raises(ValueError, match="permit_not_found"):
        test_manager_with_stats.get_stats(user_id="42", permit_code="ZZ")
