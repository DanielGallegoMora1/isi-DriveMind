from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class Permit:
    id: int
    code: str
    name: str

@dataclass
class Topic:
    id: int
    permit_id: int
    topic_number: int
    name: str

@dataclass
class Option:
    id: int
    question_id: int
    label: str
    text: str

@dataclass
class Question:
    id: int
    external_id: str
    permit_id: int
    topic_id: int
    statement: str
    difficulty: Optional[int] = None
    requires_image: bool = False
    image_description: Optional[str] = None
    base_explanation: Optional[str] = None
    options: List[Option] = field(default_factory=list)

@dataclass
class Test:
    id: int
    user_id: str
    mode: str
    num_questions: int = 30
    permit_id: Optional[int] = None
    topic_id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)
    questions: List[Question] = field(default_factory=list)

@dataclass
class TestAttempt:
    id: int
    test_id: int
    user_id: str
    correct_count: int
    wrong_count: int
    started_at: datetime = field(default_factory=datetime.now)
    finished_at: Optional[datetime] = None
    score: Optional[int] = None
    total_questions: int = 30
    
    def is_passed(self) -> bool:
        return self.wrong_count <= 3
