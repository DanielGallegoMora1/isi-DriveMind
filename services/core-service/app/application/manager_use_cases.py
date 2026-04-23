from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List

from app.domain.models import Test, TestAttempt
from app.domain.ports import QuestionRepository, TestRepository, StatsRepository
from app.infrastructure.config import settings
from app.presentation.schemas import (
    StatsGoal,
    ReviewItem,
    TestGenerateRequest,
    TestSubmitRequest,
    TestResultResponse,
    TopicStat,
    StatsResponse,
    StatsSummary,
    StatsHistoryItem,
    StatsTrendItem,
    FailedDistributionItem,
)

class TestManager:
    def __init__(
        self,
        question_repo: QuestionRepository,
        test_repo: TestRepository,
        stats_repo: StatsRepository | None = None,
    ):
        self.question_repo = question_repo
        self.test_repo = test_repo
        self.stats_repo = stats_repo

    @staticmethod
    def _compute_current_streak_days(activity_dates: list[date]) -> int:
        if not activity_dates:
            return 0

        streak = 1
        previous_date = activity_dates[0]

        for activity_date in activity_dates[1:]:
            if previous_date - activity_date != timedelta(days=1):
                break
            streak += 1
            previous_date = activity_date

        return streak

    @staticmethod
    def _compute_best_streak_days(activity_dates: list[date]) -> int:
        if not activity_dates:
            return 0

        best_streak = 1
        current_streak = 1

        for previous_date, activity_date in zip(activity_dates, activity_dates[1:]):
            if previous_date - activity_date == timedelta(days=1):
                current_streak += 1
                best_streak = max(best_streak, current_streak)
                continue

            current_streak = 1

        return best_streak

    def generate_test(self, user_id: str, request: TestGenerateRequest) -> Test:
        permit = self.question_repo.get_permit_by_code(request.permit_code)
        if permit is None:
            raise ValueError("permit_not_found")

        questions = self.question_repo.get_questions(
            mode=request.mode,
            count=request.count,
            permit_id=permit.id,
            topic_id=request.topic_id,
            user_id=user_id,
        )

        test = Test(
            id=0, # DB will assign
            user_id=user_id,
            mode=request.mode,
            permit_id=permit.id,
            num_questions=request.count,
            topic_id=request.topic_id,
            questions=questions
        )
        return self.test_repo.save_test(test)

    def submit_test(self, user_id: str, test_id: int, request: TestSubmitRequest) -> TestResultResponse:
        test = self.test_repo.get_test_by_id(test_id)
        if test is None or test.user_id != user_id:
            raise ValueError("test_not_found")

        finished_at = datetime.now()
        if request.started_at is not None:
            started_at = request.started_at
        elif request.duration_seconds is not None:
            started_at = finished_at - timedelta(seconds=request.duration_seconds)
        else:
            started_at = test.created_at

        if started_at > finished_at:
            raise ValueError("invalid_started_at")

        submitted_ids = [ans.question_id for ans in request.answers]
        if len(submitted_ids) != len(set(submitted_ids)):
            raise ValueError("duplicate_answers")

        test_question_ids = [q.id for q in test.questions]
        expected_ids = set(test_question_ids)
        submitted_id_set = set(submitted_ids)

        if not submitted_id_set.issubset(expected_ids):
            raise ValueError("answers_not_in_test")

        question_by_id = {q.id: q for q in test.questions}
        for ans in request.answers:
            question = question_by_id.get(ans.question_id)
            if question is None:
                raise ValueError("answers_not_in_test")

            valid_labels = {option.label for option in question.options}
            if ans.selected_label not in valid_labels:
                raise ValueError("invalid_option_for_question")

        correct_answers = self.question_repo.get_correct_answers(test_question_ids)
        answers_by_question_id = {ans.question_id: ans.selected_label for ans in request.answers}

        correct_count = 0
        wrong_count = 0
        
        topic_accumulator: dict[int, dict[str, int]] = defaultdict(lambda: {"correct": 0, "wrong": 0})
        answer_rows: list[dict] = []
        review_items: list[ReviewItem] = []

        for question in test.questions:
            expected_label = correct_answers.get(question.id)
            if expected_label is None:
                raise ValueError("correct_answer_not_found")
            selected_label = answers_by_question_id.get(question.id)
            is_answered = selected_label is not None
            is_correct = is_answered and selected_label == expected_label

            if is_correct:
                correct_count += 1
                topic_accumulator[question.topic_id]["correct"] += 1
            elif is_answered:
                wrong_count += 1
                topic_accumulator[question.topic_id]["wrong"] += 1

            if selected_label is not None:
                answer_rows.append(
                    {
                        "question_id": question.id,
                        "selected_label": selected_label,
                        "correct_label": expected_label,
                        "is_correct": is_correct,
                    }
                )
            review_items.append(
                ReviewItem(
                    question_id=question.id,
                    selected_label=selected_label,
                    is_answered=is_answered,
                    correct_label=expected_label,
                    is_correct=is_correct,
                )
            )

        attempt = TestAttempt(
            id=0,
            test_id=test_id,
            user_id=user_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            started_at=started_at,
            score=round((correct_count / test.num_questions) * 100) if test.num_questions else 0,
            total_questions=test.num_questions,
            finished_at=finished_at,
        )

        self.test_repo.save_attempt_with_answers(attempt, answer_rows)

        by_topic = []
        for topic_id in sorted(topic_accumulator.keys()):
            correct = topic_accumulator[topic_id]["correct"]
            wrong = topic_accumulator[topic_id]["wrong"]
            total = correct + wrong
            accuracy_pct = round((correct / total) * 100, 2) if total else 0.0
            by_topic.append(TopicStat(topic_id=topic_id, correct=correct, wrong=wrong, accuracy_pct=accuracy_pct))

        return TestResultResponse(
            test_id=test_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            passed=attempt.is_passed(),
            score=attempt.score,
            by_topic=by_topic,
            review_items=review_items,
        )

    def get_stats(
        self,
        *,
        user_id: str,
        permit_code: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> StatsResponse:
        if self.stats_repo is None:
            raise ValueError("stats_repo_not_configured")

        permit_id: int | None = None
        if permit_code is not None:
            permit = self.question_repo.get_permit_by_code(permit_code)
            if permit is None:
                raise ValueError("permit_not_found")
            permit_id = permit.id

        summary_data = self.stats_repo.get_summary(user_id=user_id, permit_id=permit_id)
        by_topic_data = self.stats_repo.get_by_topic(user_id=user_id, permit_id=permit_id)
        history_data = self.stats_repo.get_history(user_id=user_id, permit_id=permit_id, limit=limit, offset=offset)
        trend_data = self.stats_repo.get_trend(user_id=user_id, permit_id=permit_id)
        failed_distribution_data = self.stats_repo.get_failed_distribution(user_id=user_id, permit_id=permit_id)
        activity_dates = self.stats_repo.get_activity_dates(user_id=user_id, permit_id=permit_id)

        current_accuracy_pct = float(summary_data.get("accuracy_pct", 0.0) or 0.0)
        target_accuracy_pct = float(settings.stats_target_accuracy_pct)
        progress_pct = 0.0
        if target_accuracy_pct > 0:
            progress_pct = round(min((current_accuracy_pct / target_accuracy_pct) * 100, 100.0), 2)

        summary_payload = {
            **summary_data,
            "pass_rate_pct": float(summary_data.get("pass_rate_pct", 0.0) or 0.0),
            "average_score": float(summary_data.get("average_score", 0.0) or 0.0),
            "current_streak_days": self._compute_current_streak_days(activity_dates),
            "best_streak_days": self._compute_best_streak_days(activity_dates),
            "last_activity_at": summary_data.get("last_activity_at"),
            "average_time_seconds": float(summary_data.get("average_time_seconds", 0.0) or 0.0),
            "total_time_seconds": int(summary_data.get("total_time_seconds", 0) or 0),
        }

        return StatsResponse(
            summary=StatsSummary(**summary_payload),
            goal=StatsGoal(
                target_accuracy_pct=target_accuracy_pct,
                current_accuracy_pct=round(current_accuracy_pct, 2),
                progress_pct=progress_pct,
            ),
            by_topic=[TopicStat(**item) for item in by_topic_data],
            history=[StatsHistoryItem(**item) for item in history_data],
            trend=[StatsTrendItem(**item) for item in trend_data],
            failed_distribution=[FailedDistributionItem(**item) for item in failed_distribution_data],
        )
