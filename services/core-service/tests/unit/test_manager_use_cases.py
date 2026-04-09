import pytest
from datetime import datetime
from typing import List, Dict, Optional

from app.application.manager_use_cases import TestManager
from app.domain.models import Question, Test, TestAttempt, Permit, Topic, Option
from app.domain.ports import QuestionRepository, TestRepository
from app.presentation.schemas import TestGenerateRequest, TestSubmitRequest, AnswerItem

class FakeQuestionRepository(QuestionRepository):
    def __init__(self):
        self.questions = []
        for i in range(1, 31):
            opts = [Option(id=1, question_id=i, label='a', text='A'),
                    Option(id=2, question_id=i, label='b', text='B'),
                    Option(id=3, question_id=i, label='c', text='C')]
            q = Question(id=i, external_id=f"ext_{i}", permit_id=1, topic_id=1, statement=f"Q{i}", difficulty=1, options=opts)
            self.questions.append(q)
        
    def get_permits(self) -> List[Permit]:
        return [Permit(id=1, code="B", name="B")]

    def get_topics(self, permit_id: Optional[int] = None) -> List[Topic]:
        return [Topic(id=1, permit_id=1, number=1, name="Init")]

    def get_questions(self, mode: str, count: int = 30, permit_id: Optional[int] = None, topic_id: Optional[int] = None) -> List[Question]:
        return self.questions[:count]

    def get_correct_answers(self, question_ids: List[int]) -> Dict[int, str]:
        return {q.id: 'a' for q in self.questions if q.id in question_ids}


class FakeTestRepository(TestRepository):
    def __init__(self):
        self.tests: Dict[int, Test] = {}
        self.attempts: Dict[int, TestAttempt] = {}
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


@pytest.fixture
def test_manager():
    return TestManager(question_repo=FakeQuestionRepository(), test_repo=FakeTestRepository())


def test_generate_test(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id=10, request=request)
    
    assert test.id == 1
    assert test.user_id == 10
    assert test.mode == "RANDOM"
    assert test.num_questions == 30
    assert len(test.questions) == 30
    assert test.questions[0].statement == "Q1"


def test_submit_test_passed(test_manager: TestManager):
    # Generar un test primero para guardarlo
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id=10, request=request)
    
    # Fake repo ensures all correct answers are 'a'
    answers = [AnswerItem(question_id=i, selected_label='a') for i in range(1, 31)]
    submit_req = TestSubmitRequest(answers=answers)
    
    result = test_manager.submit_test(user_id=10, test_id=test.id, request=submit_req)
    
    assert result.passed is True
    assert result.correct_count == 30
    assert result.wrong_count == 0
    assert result.score == 100


def test_submit_test_failed(test_manager: TestManager):
    request = TestGenerateRequest(permit_code="B", mode="RANDOM", count=30)
    test = test_manager.generate_test(user_id=10, request=request)
    
    # Fallamos 5 preguntas (max 3 para aprobar), contestamos todo con 'b' menos las primeras 25
    answers = [AnswerItem(question_id=i, selected_label='a') for i in range(1, 26)]
    answers.extend([AnswerItem(question_id=i, selected_label='b') for i in range(26, 31)])
    
    submit_req = TestSubmitRequest(answers=answers)
    
    result = test_manager.submit_test(user_id=10, test_id=test.id, request=submit_req)
    
    assert result.passed is False
    assert result.correct_count == 25
    assert result.wrong_count == 5
