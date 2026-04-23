from datetime import date, timedelta
from typing import Optional

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.domain.ports import StatsRepository
from app.infrastructure.database.models import (
    AttemptAnswerModel,
    AttemptModel,
    PermitModel,
    QuestionModel,
    TestModel,
    TopicModel,
)


class PostgresStatsRepository(StatsRepository):
    def __init__(self, session: Session):
        self.session = session

    def _attempt_filters(self, *, user_id: str, permit_id: Optional[int]) -> list:
        filters = [AttemptModel.user_id == user_id]
        if permit_id is not None:
            filters.append(TestModel.permit_id == permit_id)
        return filters

    @staticmethod
    def _coerce_date(value) -> date | None:
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            return date.fromisoformat(value)
        return None

    @staticmethod
    def _build_accuracy_payload(correct_sum: int | float, questions_sum: int | float) -> float:
        total_questions = int(questions_sum or 0)
        if total_questions == 0:
            return 0.0
        return round((float(correct_sum or 0) / total_questions) * 100, 2)

    def _activity_at_expression(self):
        return func.coalesce(AttemptModel.finished_at, AttemptModel.started_at)

    def _activity_date_expression(self):
        return func.date(self._activity_at_expression())

    def _get_daily_attempt_rows(self, *, user_id: str, permit_id: Optional[int]) -> list[dict]:
        activity_date_expr = self._activity_date_expression()
        stmt = (
            select(
                activity_date_expr.label("activity_date"),
                func.count(AttemptModel.id).label("tests"),
                func.coalesce(func.sum(AttemptModel.correct_count), 0).label("correct_sum"),
                func.coalesce(func.sum(AttemptModel.total_questions), 0).label("questions_sum"),
            )
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .group_by(activity_date_expr)
            .order_by(activity_date_expr.asc())
        )
        rows = self.session.execute(stmt).all()
        return [
            {
                "activity_date": self._coerce_date(row.activity_date),
                "tests": int(row.tests or 0),
                "correct_sum": int(row.correct_sum or 0),
                "questions_sum": int(row.questions_sum or 0),
            }
            for row in rows
            if self._coerce_date(row.activity_date) is not None
        ]

    def _duration_seconds_expression(self):
        if self.session.bind and self.session.bind.dialect.name == "sqlite":
            return (func.julianday(AttemptModel.finished_at) - func.julianday(AttemptModel.started_at)) * 86400.0
        return func.extract("epoch", AttemptModel.finished_at - AttemptModel.started_at)

    def get_summary(self, *, user_id: str, permit_id: Optional[int] = None) -> dict:
        passed_case = case((AttemptModel.wrong_count <= 3, 1), else_=0)
        duration_seconds = self._duration_seconds_expression()
        valid_duration_seconds = case(
            (
                (AttemptModel.started_at.is_not(None))
                & (AttemptModel.finished_at.is_not(None))
                & (AttemptModel.finished_at >= AttemptModel.started_at),
                duration_seconds,
            ),
            else_=None,
        )
        activity_at = func.coalesce(AttemptModel.finished_at, AttemptModel.started_at)
        stmt = (
            select(
                func.count(AttemptModel.id).label("total_tests"),
                func.coalesce(func.sum(passed_case), 0).label("passed_tests"),
                func.coalesce(func.sum(AttemptModel.correct_count), 0).label("total_correct"),
                func.coalesce(func.sum(AttemptModel.total_questions), 0).label("total_questions"),
                func.coalesce(func.avg(AttemptModel.score), 0).label("average_score"),
                func.max(activity_at).label("last_activity_at"),
                func.coalesce(func.avg(valid_duration_seconds), 0).label("average_time_seconds"),
                func.coalesce(func.sum(valid_duration_seconds), 0).label("total_time_seconds"),
            )
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
        )
        row = self.session.execute(stmt).one()

        total_tests = int(row.total_tests or 0)
        passed_tests = int(row.passed_tests or 0)
        failed_tests = total_tests - passed_tests
        total_questions = int(row.total_questions or 0)
        accuracy_pct = round((float(row.total_correct or 0) / total_questions) * 100, 2) if total_questions else 0.0
        pass_rate_pct = round((passed_tests / total_tests) * 100, 2) if total_tests else 0.0

        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "accuracy_pct": accuracy_pct,
            "pass_rate_pct": pass_rate_pct,
            "average_score": round(float(row.average_score or 0), 2),
            "last_activity_at": row.last_activity_at,
            "average_time_seconds": round(float(row.average_time_seconds or 0), 2),
            "total_time_seconds": int(round(float(row.total_time_seconds or 0))),
        }

    def get_by_topic(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        correct_case = case((AttemptAnswerModel.is_correct.is_(True), 1), else_=0)
        wrong_case = case((AttemptAnswerModel.is_correct.is_(False), 1), else_=0)
        stmt = (
            select(
                QuestionModel.topic_id.label("topic_id"),
                TopicModel.name.label("topic_name"),
                func.sum(correct_case).label("correct"),
                func.sum(wrong_case).label("wrong"),
            )
            .select_from(AttemptAnswerModel)
            .join(AttemptModel, AttemptModel.id == AttemptAnswerModel.attempt_id)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .join(QuestionModel, QuestionModel.id == AttemptAnswerModel.question_id)
            .join(TopicModel, TopicModel.id == QuestionModel.topic_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .group_by(QuestionModel.topic_id, TopicModel.name)
            .order_by(QuestionModel.topic_id.asc())
        )
        rows = self.session.execute(stmt).all()

        result = []
        for row in rows:
            correct = int(row.correct or 0)
            wrong = int(row.wrong or 0)
            total = correct + wrong
            result.append(
                {
                    "topic_id": int(row.topic_id),
                    "topic_name": row.topic_name,
                    "correct": correct,
                    "wrong": wrong,
                    "accuracy_pct": round((correct / total) * 100, 2) if total else 0.0,
                }
            )
        return result

    def get_history(
        self,
        *,
        user_id: str,
        permit_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        stmt = (
            select(
                AttemptModel.test_id.label("test_id"),
                func.coalesce(AttemptModel.finished_at, AttemptModel.started_at).label("created_at"),
                case((AttemptModel.wrong_count <= 3, True), else_=False).label("passed"),
                AttemptModel.score.label("score"),
                AttemptModel.correct_count.label("correct_count"),
                AttemptModel.wrong_count.label("wrong_count"),
                TestModel.topic_id.label("topic_id"),
                TestModel.mode.label("test_type"),
                PermitModel.code.label("permit_code"),
                AttemptModel.total_questions.label("total_questions"),
            )
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .outerjoin(PermitModel, PermitModel.id == TestModel.permit_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .order_by(func.coalesce(AttemptModel.finished_at, AttemptModel.started_at).desc(), AttemptModel.id.desc())
            .limit(limit)
            .offset(offset)
        )

        rows = self.session.execute(stmt).all()
        result = []
        for row in rows:
            total_questions = int(row.total_questions or 0)
            accuracy = round((int(row.correct_count or 0) / total_questions) * 100, 2) if total_questions else 0.0
            result.append(
                {
                    "test_id": int(row.test_id),
                    "created_at": row.created_at,
                    "passed": bool(row.passed),
                    "score": int(row.score) if row.score is not None else None,
                    "correct_count": int(row.correct_count or 0),
                    "wrong_count": int(row.wrong_count or 0),
                    "accuracy_pct": accuracy,
                    "permit_code": row.permit_code,
                    "topic_id": int(row.topic_id) if row.topic_id is not None else None,
                    "test_type": row.test_type,
                }
            )
        return result

    def get_trend(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        result = []
        for row in self._get_daily_attempt_rows(user_id=user_id, permit_id=permit_id):
            result.append(
                {
                    "period": row["activity_date"].isoformat(),
                    "tests": row["tests"],
                    "accuracy_pct": self._build_accuracy_payload(row["correct_sum"], row["questions_sum"]),
                }
            )
        return result

    def get_failed_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        stmt = (
            select(
                QuestionModel.topic_id.label("topic_id"),
                TopicModel.name.label("topic_name"),
                func.count(AttemptAnswerModel.id).label("wrong_count"),
            )
            .select_from(AttemptAnswerModel)
            .join(AttemptModel, AttemptModel.id == AttemptAnswerModel.attempt_id)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .join(QuestionModel, QuestionModel.id == AttemptAnswerModel.question_id)
            .join(TopicModel, TopicModel.id == QuestionModel.topic_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .where(AttemptAnswerModel.is_correct.is_(False))
            .group_by(QuestionModel.topic_id, TopicModel.name)
            .order_by(func.count(AttemptAnswerModel.id).desc(), QuestionModel.topic_id.asc())
        )

        rows = self.session.execute(stmt).all()
        return [
            {
                "topic_id": int(row.topic_id),
                "topic_name": row.topic_name,
                "wrong_count": int(row.wrong_count or 0),
            }
            for row in rows
        ]

    def get_activity_dates(self, *, user_id: str, permit_id: Optional[int] = None) -> list[date]:
        activity_at = func.coalesce(AttemptModel.finished_at, AttemptModel.started_at)

        if self.session.bind and self.session.bind.dialect.name == "sqlite":
            activity_date_expr = func.date(activity_at)
        else:
            activity_date_expr = func.date(activity_at)

        stmt = (
            select(activity_date_expr.label("activity_date"))
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .group_by(activity_date_expr)
            .order_by(activity_date_expr.desc())
        )

        rows = self.session.execute(stmt).all()
        activity_dates: list[date] = []
        for row in rows:
            value = row.activity_date
            if isinstance(value, date):
                activity_dates.append(value)
            elif isinstance(value, str):
                activity_dates.append(date.fromisoformat(value))
        return activity_dates

    def get_test_type_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        stmt = (
            select(
                TestModel.mode.label("test_type"),
                func.count(AttemptModel.id).label("tests"),
            )
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .group_by(TestModel.mode)
            .order_by(func.count(AttemptModel.id).desc(), TestModel.mode.asc())
        )
        rows = self.session.execute(stmt).all()
        total_tests = sum(int(row.tests or 0) for row in rows)
        return [
            {
                "test_type": row.test_type,
                "tests": int(row.tests or 0),
                "percentage": round((int(row.tests or 0) / total_tests) * 100, 2) if total_tests else 0.0,
            }
            for row in rows
        ]

    def get_daily_activity(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        rows = self._get_daily_attempt_rows(user_id=user_id, permit_id=permit_id)
        return [
            {
                "date": row["activity_date"].isoformat(),
                "tests": row["tests"],
            }
            for row in rows
        ]

    def get_accuracy_comparison(
        self,
        *,
        user_id: str,
        permit_id: Optional[int] = None,
        window_days: int = 7,
    ) -> dict:
        # Trend definition used by the stats insights block:
        # compare weighted accuracy (sum(correct_count) / sum(total_questions))
        # for the latest `window_days` calendar window with activity against the
        # immediately previous window of the same size, anchored at the latest
        # activity date for the filtered dataset.
        rows = self._get_daily_attempt_rows(user_id=user_id, permit_id=permit_id)
        if not rows:
            return {
                "window_days": window_days,
                "recent_accuracy_pct": 0.0,
                "previous_accuracy_pct": 0.0,
                "change_pct_points": 0.0,
            }

        anchor_date = rows[-1]["activity_date"]
        recent_start = anchor_date - timedelta(days=window_days - 1)
        previous_end = recent_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=window_days - 1)

        recent_correct_sum = 0
        recent_questions_sum = 0
        previous_correct_sum = 0
        previous_questions_sum = 0

        for row in rows:
            activity_date = row["activity_date"]
            if recent_start <= activity_date <= anchor_date:
                recent_correct_sum += row["correct_sum"]
                recent_questions_sum += row["questions_sum"]
            elif previous_start <= activity_date <= previous_end:
                previous_correct_sum += row["correct_sum"]
                previous_questions_sum += row["questions_sum"]

        recent_accuracy = self._build_accuracy_payload(recent_correct_sum, recent_questions_sum)
        previous_accuracy = self._build_accuracy_payload(previous_correct_sum, previous_questions_sum)
        return {
            "window_days": window_days,
            "recent_accuracy_pct": recent_accuracy,
            "previous_accuracy_pct": previous_accuracy,
            "change_pct_points": round(recent_accuracy - previous_accuracy, 2),
        }
