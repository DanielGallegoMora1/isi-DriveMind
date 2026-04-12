from collections import defaultdict
from typing import List
from datetime import datetime

from app.domain.models import Test, TestAttempt
from app.domain.ports import QuestionRepository, TestRepository, StatsRepository
from app.presentation.schemas import (
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

        submitted_ids = [ans.question_id for ans in request.answers]
        if len(submitted_ids) != len(set(submitted_ids)):
            raise ValueError("duplicate_answers")

        test_question_ids = [q.id for q in test.questions]
        expected_ids = set(test_question_ids)
        submitted_id_set = set(submitted_ids)

        if len(request.answers) != test.num_questions or submitted_id_set != expected_ids:
            raise ValueError("answers_not_in_test")

        question_by_id = {q.id: q for q in test.questions}
        for ans in request.answers:
            question = question_by_id.get(ans.question_id)
            if question is None:
                raise ValueError("answers_not_in_test")

            valid_labels = {option.label for option in question.options}
            if ans.selected_label not in valid_labels:
                raise ValueError("invalid_option_for_question")

        q_ids = list(submitted_id_set)
        correct_answers = self.question_repo.get_correct_answers(q_ids)

        correct_count = 0
        wrong_count = 0
        
        topic_accumulator: dict[int, dict[str, int]] = defaultdict(lambda: {"correct": 0, "wrong": 0})
        answer_rows: list[dict] = []

        for ans in request.answers:
            expected_label = correct_answers.get(ans.question_id)
            question = question_by_id[ans.question_id]
            is_correct = expected_label == ans.selected_label

            if is_correct:
                correct_count += 1
                topic_accumulator[question.topic_id]["correct"] += 1
            else:
                wrong_count += 1
                topic_accumulator[question.topic_id]["wrong"] += 1

            answer_rows.append(
                {
                    "question_id": ans.question_id,
                    "selected_label": ans.selected_label,
                    "is_correct": is_correct,
                }
            )

        attempt = TestAttempt(
            id=0,
            test_id=test_id,
            user_id=user_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            score=round((correct_count / test.num_questions) * 100) if test.num_questions else 0,
            total_questions=test.num_questions,
            finished_at=datetime.now(),
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

        return StatsResponse(
            summary=StatsSummary(**summary_data),
            by_topic=[TopicStat(**item) for item in by_topic_data],
            history=[StatsHistoryItem(**item) for item in history_data],
            trend=[StatsTrendItem(**item) for item in trend_data],
            failed_distribution=[FailedDistributionItem(**item) for item in failed_distribution_data],
        )
