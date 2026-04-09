from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey, Integer, Boolean, DateTime, SmallInteger, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship

class Base(DeclarativeBase):
    pass

class PermitModel(Base):
    __tablename__ = "permits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    topics: Mapped[List["TopicModel"]] = relationship(back_populates="permit", cascade="all, delete-orphan")
    questions: Mapped[List["QuestionModel"]] = relationship(back_populates="permit")
    tests: Mapped[List["TestModel"]] = relationship(back_populates="permit")

class TopicModel(Base):
    __tablename__ = "topics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    permit_id: Mapped[int] = mapped_column(ForeignKey("permits.id", ondelete="CASCADE"), nullable=False)
    topic_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    permit: Mapped["PermitModel"] = relationship(back_populates="topics")
    questions: Mapped[List["QuestionModel"]] = relationship(back_populates="topic")

class QuestionModel(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    permit_id: Mapped[int] = mapped_column(ForeignKey("permits.id", ondelete="RESTRICT"), nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="RESTRICT"), nullable=False)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    requires_image: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    image_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    base_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    permit: Mapped["PermitModel"] = relationship(back_populates="questions")
    topic: Mapped["TopicModel"] = relationship(back_populates="questions")
    options: Mapped[List["OptionModel"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    correct_option: Mapped["CorrectOptionModel"] = relationship(back_populates="question", uselist=False, cascade="all, delete-orphan")

class OptionModel(Base):
    __tablename__ = "question_options"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(1), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    question: Mapped["QuestionModel"] = relationship(back_populates="options")

class CorrectOptionModel(Base):
    __tablename__ = "question_correct_options"
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    correct_label: Mapped[str] = mapped_column(String(1), nullable=False)

    question: Mapped["QuestionModel"] = relationship(back_populates="correct_option")

class TestModel(Base):
    __tablename__ = "tests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[str] = mapped_column(Text, nullable=False)
    permit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("permits.id", ondelete="RESTRICT"), nullable=True)
    topic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("topics.id", ondelete="RESTRICT"), nullable=True)
    num_questions: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    permit: Mapped["PermitModel"] = relationship(back_populates="tests")
    test_questions: Mapped[List["TestQuestionModel"]] = relationship(back_populates="test", cascade="all, delete-orphan")
    attempts: Mapped[List["AttemptModel"]] = relationship(back_populates="test", cascade="all, delete-orphan")

class TestQuestionModel(Base):
    __tablename__ = "test_questions"
    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"), primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="RESTRICT"), primary_key=True)

    test: Mapped["TestModel"] = relationship(back_populates="test_questions")

class AttemptModel(Base):
    __tablename__ = "test_attempts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    wrong_count: Mapped[int] = mapped_column(Integer, nullable=False)

    test: Mapped["TestModel"] = relationship(back_populates="attempts")
    answers: Mapped[List["AttemptAnswerModel"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")

class AttemptAnswerModel(Base):
    __tablename__ = "attempt_answers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False)
    selected_label: Mapped[str] = mapped_column(String(1), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    attempt: Mapped["AttemptModel"] = relationship(back_populates="answers")
