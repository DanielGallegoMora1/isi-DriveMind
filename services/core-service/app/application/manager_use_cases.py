from typing import List, Dict
from datetime import datetime

from app.domain.models import Test, TestAttempt
from app.domain.ports import QuestionRepository, TestRepository
from app.presentation.schemas import TestGenerateRequest, TestSubmitRequest, TestResultResponse, TopicStat

class TestManager:
    def __init__(self, question_repo: QuestionRepository, test_repo: TestRepository):
        self.question_repo = question_repo
        self.test_repo = test_repo

    def generate_test(self, user_id: int, request: TestGenerateRequest) -> Test:
        questions = self.question_repo.get_questions(
            mode=request.mode,
            count=request.count,
            permit_id=request.permit_code if hasattr(request, 'permit_id') else 1, # Mapped properly later
            topic_id=request.topic_id
        )

        test = Test(
            id=0, # DB will assign
            user_id=user_id,
            mode=request.mode,
            num_questions=request.count,
            topic_id=request.topic_id,
            questions=questions
        )
        return self.test_repo.save_test(test)

    def submit_test(self, user_id: int, test_id: int, request: TestSubmitRequest) -> TestResultResponse:
        q_ids = [ans.question_id for ans in request.answers]
        correct_answers = self.question_repo.get_correct_answers(q_ids)

        correct_count = 0
        wrong_count = 0
        
        # Simulating basic grading
        for ans in request.answers:
            if correct_answers.get(ans.question_id) == ans.selected_label:
                correct_count += 1
            else:
                wrong_count += 1

        attempt = TestAttempt(
            id=0,
            test_id=test_id,
            user_id=user_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            score=int((correct_count / 30.0) * 100) if correct_count + wrong_count == 30 else 0,
            finished_at=datetime.now()
        )
        
        self.test_repo.save_attempt(attempt)

        return TestResultResponse(
            test_id=test_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            passed=attempt.is_passed(),
            score=attempt.score,
            by_topic=[] # Future aggregation implementation
        )
