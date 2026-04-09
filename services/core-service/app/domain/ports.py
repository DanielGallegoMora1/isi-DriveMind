from abc import ABC, abstractmethod
from typing import List, Optional, Tuple, Dict
from app.domain.models import Question, Test, TestAttempt, Permit, Topic

class QuestionRepository(ABC):
    @abstractmethod
    def get_permits(self) -> List[Permit]:
        pass

    @abstractmethod
    def get_topics(self, permit_id: Optional[int] = None) -> List[Topic]:
        pass

    @abstractmethod
    def get_questions(self, mode: str, count: int = 30, permit_id: Optional[int] = None, topic_id: Optional[int] = None) -> List[Question]:
        pass
        
    @abstractmethod
    def get_correct_answers(self, question_ids: List[int]) -> Dict[int, str]:
        pass

class TestRepository(ABC):
    @abstractmethod
    def save_test(self, test: Test) -> Test:
        pass
        
    @abstractmethod
    def get_test_by_id(self, test_id: int) -> Optional[Test]:
        pass

    @abstractmethod
    def save_attempt(self, attempt: TestAttempt) -> TestAttempt:
        pass
