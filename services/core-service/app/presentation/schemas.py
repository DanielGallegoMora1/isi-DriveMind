from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal
from datetime import datetime

# --- Common Responses ---
class PaginatedResponse(BaseModel):
    items: list
    total: int
    limit: int
    offset: int

# --- Permits & Topics ---
class PermitResponse(BaseModel):
    id: int
    code: str
    name: str

class TopicResponse(BaseModel):
    id: int
    permit_id: int
    topic_number: int
    name: str

# --- Questions ---
class OptionResponse(BaseModel):
    id: int
    label: Literal['a', 'b', 'c']
    text: str

class QuestionResponse(BaseModel):
    id: int
    external_id: str
    topic_id: int
    statement: str
    difficulty: Optional[int] = None
    requires_image: bool = False
    image_description: Optional[str] = None
    options: List[OptionResponse]

# --- Tests Generate ---
class TestGenerateRequest(BaseModel):
    permit_code: str
    mode: Literal['RANDOM', 'TOPIC', 'PERMIT', 'FAILED']
    topic_id: Optional[int] = None
    count: int = Field(default=30, ge=1, le=100)

    @model_validator(mode='after')
    def check_topic_id(self):
        if self.mode == 'TOPIC' and self.topic_id is None:
            raise ValueError('topic_id is required when mode is TOPIC')
        return self

class TestResponse(BaseModel):
    id: int
    user_id: int
    mode: str
    permit_id: Optional[int] = None
    topic_id: Optional[int] = None
    num_questions: int
    created_at: datetime
    questions: List[QuestionResponse]

# --- Test Submit ---
class AnswerItem(BaseModel):
    question_id: int
    selected_label: Literal['a', 'b', 'c']

class TestSubmitRequest(BaseModel):
    answers: List[AnswerItem]
    
    @model_validator(mode='after')
    def check_answers_count(self):
        if len(self.answers) != 30:
            raise ValueError('Exactly 30 answers must be submitted')
        return self

class TopicStat(BaseModel):
    topic_id: int
    correct: int
    wrong: int
    accuracy_pct: float

class TestResultResponse(BaseModel):
    test_id: int
    correct_count: int
    wrong_count: int
    passed: bool
    score: Optional[int] = None
    by_topic: List[TopicStat] = []

# --- Stats Summary ---
class StatsSummary(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    accuracy_pct: float

class StatsHistoryItem(BaseModel):
    test_id: int
    created_at: datetime
    passed: bool
    score: Optional[int] = None
    correct_count: int
    wrong_count: int
    accuracy_pct: float
    permit_code: Optional[str] = None
    topic_id: Optional[int] = None

class StatsTrendItem(BaseModel):
    period: str
    tests: int
    accuracy_pct: float

class FailedDistributionItem(BaseModel):
    topic_id: int
    wrong_count: int

class StatsResponse(BaseModel):
    summary: StatsSummary
    by_topic: List[TopicStat] = []
    history: List[StatsHistoryItem] = []
    trend: List[StatsTrendItem] = []
    failed_distribution: List[FailedDistributionItem] = []
