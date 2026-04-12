from sqlalchemy.orm import Session
from sqlalchemy import select, case
from sqlalchemy.sql.expression import func
from typing import List, Optional, Dict

from app.domain.models import Permit, Topic, Question, Option
from app.domain.ports import QuestionRepository
from app.infrastructure.database.models import (
    PermitModel,
    TopicModel,
    QuestionModel,
    CorrectOptionModel,
    AttemptAnswerModel,
    AttemptModel,
)

class PostgresQuestionRepository(QuestionRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_permits(self) -> List[Permit]:
        stmt = select(PermitModel)
        models = self.session.execute(stmt).scalars().all()
        return [Permit(id=m.id, code=m.code, name=m.name) for m in models]

    def get_topics(self, permit_id: Optional[int] = None) -> List[Topic]:
        stmt = select(TopicModel)
        if permit_id:
            stmt = stmt.where(TopicModel.permit_id == permit_id)
        models = self.session.execute(stmt).scalars().all()
        return [Topic(id=m.id, permit_id=m.permit_id, topic_number=m.topic_number, name=m.name) for m in models]

    def get_permit_by_code(self, permit_code: str) -> Optional[Permit]:
        stmt = select(PermitModel).where(PermitModel.code == permit_code)
        model = self.session.execute(stmt).scalar_one_or_none()
        if model is None:
            return None
        return Permit(id=model.id, code=model.code, name=model.name)

    def _to_domain_question(self, model: QuestionModel) -> Question:
        options = [Option(id=o.id, question_id=o.question_id, label=o.label, text=o.text) for o in model.options]
        return Question(
            id=model.id,
            external_id=model.external_id,
            permit_id=model.permit_id,
            topic_id=model.topic_id,
            statement=model.statement,
            difficulty=model.difficulty,
            requires_image=model.requires_image,
            image_description=model.image_description,
            base_explanation=model.base_explanation,
            options=options,
        )

    def get_questions(
        self,
        mode: str,
        count: int = 30,
        permit_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> List[Question]:
        if mode == "FAILED":
            return self._get_failed_questions(count=count, permit_id=permit_id, topic_id=topic_id, user_id=user_id)

        stmt = select(QuestionModel)

        if mode in {"PERMIT", "RANDOM"} and permit_id:
            stmt = stmt.where(QuestionModel.permit_id == permit_id)
        if mode == "TOPIC" and topic_id:
            stmt = stmt.where(QuestionModel.topic_id == topic_id)

        stmt = stmt.order_by(func.random()).limit(count)
        models = self.session.execute(stmt).scalars().all()

        return [self._to_domain_question(model) for model in models]

    def _get_failed_questions(
        self,
        *,
        count: int,
        permit_id: Optional[int],
        topic_id: Optional[int],
        user_id: Optional[str],
    ) -> List[Question]:
        base_filters = []
        if permit_id is not None:
            base_filters.append(QuestionModel.permit_id == permit_id)
        if topic_id is not None:
            base_filters.append(QuestionModel.topic_id == topic_id)

        failed_ids: list[int] = []
        if user_id is not None:
            failed_stmt = (
                select(
                    AttemptAnswerModel.question_id,
                    func.count(AttemptAnswerModel.id).label("wrong_count"),
                    func.max(AttemptAnswerModel.answered_at).label("last_wrong_at"),
                )
                .join(AttemptModel, AttemptModel.id == AttemptAnswerModel.attempt_id)
                .join(QuestionModel, QuestionModel.id == AttemptAnswerModel.question_id)
                .where(AttemptModel.user_id == user_id)
                .where(AttemptAnswerModel.is_correct.is_(False))
            )

            for condition in base_filters:
                failed_stmt = failed_stmt.where(condition)

            failed_stmt = (
                failed_stmt.group_by(AttemptAnswerModel.question_id)
                .order_by(
                    func.count(AttemptAnswerModel.id).desc(),
                    func.max(AttemptAnswerModel.answered_at).desc(),
                    AttemptAnswerModel.question_id.asc(),
                )
                .limit(count)
            )

            failed_rows = self.session.execute(failed_stmt).all()
            failed_ids = [row.question_id for row in failed_rows]

        selected_models: list[QuestionModel] = []
        if failed_ids:
            ordering = case({qid: idx for idx, qid in enumerate(failed_ids)}, value=QuestionModel.id)
            failed_questions_stmt = select(QuestionModel).where(QuestionModel.id.in_(failed_ids)).order_by(ordering)
            selected_models = self.session.execute(failed_questions_stmt).scalars().all()

        remaining = max(count - len(selected_models), 0)
        if remaining:
            backfill_stmt = select(QuestionModel)
            for condition in base_filters:
                backfill_stmt = backfill_stmt.where(condition)
            if failed_ids:
                backfill_stmt = backfill_stmt.where(QuestionModel.id.not_in(failed_ids))

            backfill_stmt = backfill_stmt.order_by(QuestionModel.id.asc()).limit(remaining)
            backfill_models = self.session.execute(backfill_stmt).scalars().all()
            selected_models.extend(backfill_models)

        return [self._to_domain_question(model) for model in selected_models[:count]]

    def get_correct_answers(self, question_ids: List[int]) -> Dict[int, str]:
        if not question_ids:
            return {}
        stmt = select(CorrectOptionModel).where(CorrectOptionModel.question_id.in_(question_ids))
        models = self.session.execute(stmt).scalars().all()
        return {m.question_id: m.correct_label for m in models}
