from datetime import date
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
)


class PostgresStatsRepository(StatsRepository):
    def __init__(self, session: Session):
        self.session = session

    def _attempt_filters(self, *, user_id: str, permit_id: Optional[int]) -> list:
        filters = [AttemptModel.user_id == user_id]
        if permit_id is not None:
            filters.append(TestModel.permit_id == permit_id)
        return filters

    def get_summary(self, *, user_id: str, permit_id: Optional[int] = None) -> dict:
        passed_case = case((AttemptModel.wrong_count <= 3, 1), else_=0)
        stmt = (
            select(
                func.count(AttemptModel.id).label("total_tests"),
                func.coalesce(func.sum(passed_case), 0).label("passed_tests"),
                func.coalesce(func.sum(AttemptModel.correct_count), 0).label("total_correct"),
                func.coalesce(func.sum(AttemptModel.total_questions), 0).label("total_questions"),
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
        }

    def get_by_topic(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        correct_case = case((AttemptAnswerModel.is_correct.is_(True), 1), else_=0)
        wrong_case = case((AttemptAnswerModel.is_correct.is_(False), 1), else_=0)
        stmt = (
            select(
                QuestionModel.topic_id.label("topic_id"),
                func.sum(correct_case).label("correct"),
                func.sum(wrong_case).label("wrong"),
            )
            .select_from(AttemptAnswerModel)
            .join(AttemptModel, AttemptModel.id == AttemptAnswerModel.attempt_id)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .join(QuestionModel, QuestionModel.id == AttemptAnswerModel.question_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .group_by(QuestionModel.topic_id)
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
                }
            )
        return result

    def get_trend(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        if self.session.bind and self.session.bind.dialect.name == "sqlite":
            period_expr = func.strftime("%Y-%W", AttemptModel.finished_at)
        else:
            period_expr = func.to_char(func.date_trunc("week", AttemptModel.finished_at), "YYYY-IW")

        stmt = (
            select(
                period_expr.label("period"),
                func.count(AttemptModel.id).label("tests"),
                func.coalesce(func.sum(AttemptModel.correct_count), 0).label("correct_sum"),
                func.coalesce(func.sum(AttemptModel.total_questions), 0).label("questions_sum"),
            )
            .select_from(AttemptModel)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .where(AttemptModel.finished_at.is_not(None))
            .group_by(period_expr)
            .order_by(period_expr.asc())
        )

        rows = self.session.execute(stmt).all()
        result = []
        for row in rows:
            total_questions = int(row.questions_sum or 0)
            accuracy = round((float(row.correct_sum or 0) / total_questions) * 100, 2) if total_questions else 0.0
            result.append(
                {
                    "period": str(row.period),
                    "tests": int(row.tests or 0),
                    "accuracy_pct": accuracy,
                }
            )
        return result

    def get_failed_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> list[dict]:
        stmt = (
            select(
                QuestionModel.topic_id.label("topic_id"),
                func.count(AttemptAnswerModel.id).label("wrong_count"),
            )
            .select_from(AttemptAnswerModel)
            .join(AttemptModel, AttemptModel.id == AttemptAnswerModel.attempt_id)
            .join(TestModel, TestModel.id == AttemptModel.test_id)
            .join(QuestionModel, QuestionModel.id == AttemptAnswerModel.question_id)
            .where(*self._attempt_filters(user_id=user_id, permit_id=permit_id))
            .where(AttemptAnswerModel.is_correct.is_(False))
            .group_by(QuestionModel.topic_id)
            .order_by(func.count(AttemptAnswerModel.id).desc(), QuestionModel.topic_id.asc())
        )

        rows = self.session.execute(stmt).all()
        return [{"topic_id": int(row.topic_id), "wrong_count": int(row.wrong_count or 0)} for row in rows]

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
