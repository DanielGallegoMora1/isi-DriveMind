from pydantic import BaseModel, Field, field_validator, model_validator
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


class PermitListResponse(BaseModel):
    items: List[PermitResponse]

class TopicResponse(BaseModel):
    id: int
    permit_id: int
    topic_number: int
    name: str


class TopicListResponse(BaseModel):
    items: List[TopicResponse]

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


class QuestionListResponse(BaseModel):
    items: List[QuestionResponse]

# --- Tests Generate ---
class TestGenerateRequest(BaseModel):
    permit_code: str
    mode: str
    topic_id: Optional[int] = None
    count: int = Field(default=30, ge=1, le=100)

    @field_validator('mode', mode='before')
    @classmethod
    def normalize_mode(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError('mode must be a string')
        normalized = value.lower()
        mode_aliases = {
            'license': 'PERMIT',
            'permit': 'PERMIT',
            'topic': 'TOPIC',
            'random': 'RANDOM',
            'failed': 'FAILED',
        }

        mapped = mode_aliases.get(normalized)
        if mapped is None:
            raise ValueError('mode must be one of: license, topic, random, failed')
        return mapped

    @model_validator(mode='after')
    def check_topic_id(self):
        if self.mode == 'TOPIC' and self.topic_id is None:
            raise ValueError('topic_id is required when mode is TOPIC')
        return self

class TestResponse(BaseModel):
    id: int
    user_id: str
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
    def check_answers_not_empty(self):
        if len(self.answers) == 0:
            raise ValueError('At least one answer must be submitted')
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
    by_topic: List[TopicStat] = Field(default_factory=list)

# --- Stats Summary ---
class StatsSummary(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    accuracy_pct: float
    pass_rate_pct: float
    current_streak_days: int


class StatsGoal(BaseModel):
    target_accuracy_pct: float
    current_accuracy_pct: float
    progress_pct: float

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


class ProblemValidationError(BaseModel):
    field: str
    message: str


class ProblemDetail(BaseModel):
    type: str
    title: str
    status: int
    detail: str
    instance: str
    errors: List[ProblemValidationError] = Field(default_factory=list)


class StatsResponse(BaseModel):
    summary: StatsSummary
    goal: StatsGoal
    by_topic: List[TopicStat] = Field(default_factory=list)
    history: List[StatsHistoryItem] = Field(default_factory=list)
    trend: List[StatsTrendItem] = Field(default_factory=list)
    failed_distribution: List[FailedDistributionItem] = Field(default_factory=list)
