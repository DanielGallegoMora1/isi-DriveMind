from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional, Dict
from app.domain.models import Question, Test, TestAttempt, Permit, Topic

class QuestionRepository(ABC):
    @abstractmethod
    def get_permits(self) -> List[Permit]:
        pass

    @abstractmethod
    def get_topics(self, permit_id: Optional[int] = None) -> List[Topic]:
        pass

    @abstractmethod
    def get_permit_by_code(self, permit_code: str) -> Optional[Permit]:
        pass

    @abstractmethod
    def get_questions(
        self,
        mode: str,
        count: int = 30,
        permit_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> List[Question]:
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

    @abstractmethod
    def save_attempt_with_answers(self, attempt: TestAttempt, answers: List[dict]) -> TestAttempt:
        pass


class StatsRepository(ABC):
    @abstractmethod
    def get_summary(self, *, user_id: str, permit_id: Optional[int] = None) -> Dict:
        pass

    @abstractmethod
    def get_by_topic(self, *, user_id: str, permit_id: Optional[int] = None) -> List[Dict]:
        pass

    @abstractmethod
    def get_history(
        self,
        *,
        user_id: str,
        permit_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict]:
        pass

    @abstractmethod
    def get_trend(self, *, user_id: str, permit_id: Optional[int] = None) -> List[Dict]:
        pass

    @abstractmethod
    def get_failed_distribution(self, *, user_id: str, permit_id: Optional[int] = None) -> List[Dict]:
        pass

    @abstractmethod
    def get_activity_dates(self, *, user_id: str, permit_id: Optional[int] = None) -> List[date]:
        pass
