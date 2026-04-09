from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from app.domain.models import Test, TestAttempt, Question, Option
from app.domain.ports import TestRepository
from app.infrastructure.database.models import TestModel, TestQuestionModel, AttemptModel, AttemptAnswerModel, QuestionModel

class PostgresTestRepository(TestRepository):
    def __init__(self, session: Session):
        self.session = session

    def save_test(self, test: Test) -> Test:
        test_model = TestModel(
            user_id=test.user_id,
            mode=test.mode,
            permit_id=test.permit_id,
            topic_id=test.topic_id,
            num_questions=test.num_questions,
            created_at=test.created_at
        )
        self.session.add(test_model)
        self.session.flush()

        for q in test.questions:
            tq = TestQuestionModel(test_id=test_model.id, question_id=q.id)
            self.session.add(tq)
            
        self.session.commit()
        self.session.refresh(test_model)
        test.id = test_model.id
        return test

    def get_test_by_id(self, test_id: int) -> Optional[Test]:
        stmt = select(TestModel).where(TestModel.id == test_id)
        model = self.session.execute(stmt).scalar_one_or_none()
        if not model:
            return None
            
        # Reconstruct domain model
        tq_stmt = select(TestQuestionModel).where(TestQuestionModel.test_id == test_id)
        tq_models = self.session.execute(tq_stmt).scalars().all()
        q_ids = [tq.question_id for tq in tq_models]
        
        questions = []
        if q_ids:
            q_stmt = select(QuestionModel).where(QuestionModel.id.in_(q_ids))
            q_models = self.session.execute(q_stmt).scalars().all()
            for m in q_models:
                options = [Option(id=o.id, question_id=o.question_id, label=o.label, text=o.text) for o in m.options]
                q = Question(
                    id=m.id, external_id=m.external_id, permit_id=m.permit_id, topic_id=m.topic_id,
                    statement=m.statement, options=options
                )
                questions.append(q)
                
        return Test(
            id=model.id,
            user_id=model.user_id,
            mode=model.mode,
            permit_id=model.permit_id,
            topic_id=model.topic_id,
            num_questions=model.num_questions,
            created_at=model.created_at,
            questions=questions
        )

    def save_attempt(self, attempt: TestAttempt) -> TestAttempt:
        attempt_model = AttemptModel(
            test_id=attempt.test_id,
            user_id=attempt.user_id,
            started_at=attempt.started_at,
            finished_at=attempt.finished_at,
            score=attempt.score,
            total_questions=attempt.total_questions,
            correct_count=attempt.correct_count,
            wrong_count=attempt.wrong_count
        )
        self.session.add(attempt_model)
        self.session.commit()
        self.session.refresh(attempt_model)
        attempt.id = attempt_model.id
        return attempt
