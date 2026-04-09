from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.sql.expression import func
from typing import List, Optional, Dict

from app.domain.models import Permit, Topic, Question, Option
from app.domain.ports import QuestionRepository
from app.infrastructure.database.models import PermitModel, TopicModel, QuestionModel, CorrectOptionModel

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

    def get_questions(self, mode: str, count: int = 30, permit_id: Optional[int] = None, topic_id: Optional[int] = None) -> List[Question]:
        stmt = select(QuestionModel)
        
        if mode == 'PERMIT' and permit_id:
            stmt = stmt.where(QuestionModel.permit_id == permit_id)
        elif mode == 'TOPIC' and topic_id:
            stmt = stmt.where(QuestionModel.topic_id == topic_id)
        # FAILED mode not fully implemented yet in repo logic natively, 
        # usually handled by passing specific question IDs or similar. For now, random fallback.
        
        stmt = stmt.order_by(func.random()).limit(count)
        models = self.session.execute(stmt).scalars().all()
        
        results = []
        for m in models:
            options = [Option(id=o.id, question_id=o.question_id, label=o.label, text=o.text) for o in m.options]
            q = Question(
                id=m.id,
                external_id=m.external_id,
                permit_id=m.permit_id,
                topic_id=m.topic_id,
                statement=m.statement,
                difficulty=m.difficulty,
                requires_image=m.requires_image,
                image_description=m.image_description,
                base_explanation=m.base_explanation,
                options=options
            )
            results.append(q)
        return results

    def get_correct_answers(self, question_ids: List[int]) -> Dict[int, str]:
        if not question_ids:
            return {}
        stmt = select(CorrectOptionModel).where(CorrectOptionModel.question_id.in_(question_ids))
        models = self.session.execute(stmt).scalars().all()
        return {m.question_id: m.correct_label for m in models}
