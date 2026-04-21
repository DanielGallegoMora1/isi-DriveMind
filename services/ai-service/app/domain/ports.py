from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Generic, Protocol, TypeVar


T = TypeVar("T")


@dataclass
class Conversation:
    id: str
    user_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime


@dataclass
class Message:
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


@dataclass
class PaginatedResult(Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


class AiRepositoryPort(Protocol):
    def create_conversation(self, *, user_id: str, title: str | None) -> Conversation: ...

    def list_conversations(
        self,
        *,
        user_id: str,
        limit: int,
        offset: int,
        sort: str,
    ) -> PaginatedResult[Conversation]: ...

    def get_conversation(self, *, conversation_id: str, user_id: str) -> Conversation | None: ...

    def list_messages(
        self,
        *,
        conversation_id: str,
        user_id: str,
        limit: int,
        offset: int,
    ) -> PaginatedResult[Message]: ...

    def list_all_messages_for_conversation(
        self,
        *,
        conversation_id: str,
        user_id: str,
    ) -> list[Message]: ...

    def list_recent_messages(
        self,
        *,
        conversation_id: str,
        user_id: str,
        limit: int,
    ) -> list[Message]: ...

    def create_message_pair(
        self,
        *,
        conversation_id: str,
        user_id: str,
        user_content: str,
        assistant_content: str,
    ) -> tuple[Message, Message]: ...


class AiProviderPort(Protocol):
    def generate_reply(self, *, messages: list[dict[str, str]]) -> str: ...
