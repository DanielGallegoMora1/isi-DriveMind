from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.ports import Conversation, Message, PaginatedResult
from app.infrastructure.database.models import ConversationModel, MessageModel


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _to_domain_conversation(model: ConversationModel) -> Conversation:
    return Conversation(
        id=str(model.id),
        user_id=str(model.user_id),
        title=model.title,
        created_at=_to_utc(model.created_at),
        updated_at=_to_utc(model.updated_at),
    )


def _to_domain_message(model: MessageModel) -> Message:
    return Message(
        id=str(model.id),
        conversation_id=str(model.conversation_id),
        role=model.role,
        content=model.content,
        created_at=_to_utc(model.created_at),
    )


class SqlAlchemyAiRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_conversation(self, *, user_id: str, title: str | None) -> Conversation:
        conversation = ConversationModel(user_id=user_id, title=title)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return _to_domain_conversation(conversation)

    def list_conversations(
        self,
        *,
        user_id: str,
        limit: int,
        offset: int,
        sort: str,
    ) -> PaginatedResult[Conversation]:
        sort_column = ConversationModel.updated_at
        descending = sort.startswith("-")
        query = select(ConversationModel).where(ConversationModel.user_id == user_id)
        query = query.order_by(sort_column.desc() if descending else sort_column.asc())
        items = self.db.execute(query.limit(limit).offset(offset)).scalars().all()

        total = self.db.scalar(
            select(func.count()).select_from(ConversationModel).where(ConversationModel.user_id == user_id)
        )
        return PaginatedResult(
            items=[_to_domain_conversation(item) for item in items],
            total=int(total or 0),
            limit=limit,
            offset=offset,
        )

    def get_conversation(self, *, conversation_id: str, user_id: str) -> Conversation | None:
        query = select(ConversationModel).where(
            ConversationModel.id == conversation_id,
            ConversationModel.user_id == user_id,
        )
        model = self.db.execute(query).scalar_one_or_none()
        if model is None:
            return None
        return _to_domain_conversation(model)

    def _is_owner(self, *, conversation_id: str, user_id: str) -> bool:
        query = select(func.count()).select_from(ConversationModel).where(
            ConversationModel.id == conversation_id,
            ConversationModel.user_id == user_id,
        )
        return bool(self.db.scalar(query))

    def list_messages(
        self,
        *,
        conversation_id: str,
        user_id: str,
        limit: int,
        offset: int,
    ) -> PaginatedResult[Message]:
        if not self._is_owner(conversation_id=conversation_id, user_id=user_id):
            return PaginatedResult(items=[], total=0, limit=limit, offset=offset)

        query = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at.asc())
        )
        items = self.db.execute(query.limit(limit).offset(offset)).scalars().all()
        total = self.db.scalar(
            select(func.count()).select_from(MessageModel).where(MessageModel.conversation_id == conversation_id)
        )
        return PaginatedResult(
            items=[_to_domain_message(item) for item in items],
            total=int(total or 0),
            limit=limit,
            offset=offset,
        )

    def list_all_messages_for_conversation(
        self,
        *,
        conversation_id: str,
        user_id: str,
    ) -> list[Message]:
        if not self._is_owner(conversation_id=conversation_id, user_id=user_id):
            return []

        query = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at.asc())
        )
        return [_to_domain_message(item) for item in self.db.execute(query).scalars().all()]

    def list_recent_messages(
        self,
        *,
        conversation_id: str,
        user_id: str,
        limit: int,
    ) -> list[Message]:
        if not self._is_owner(conversation_id=conversation_id, user_id=user_id):
            return []

        query = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at.desc())
            .limit(limit)
        )
        items = list(self.db.execute(query).scalars().all())
        items.reverse()
        return [_to_domain_message(item) for item in items]

    def create_message_pair(
        self,
        *,
        conversation_id: str,
        user_id: str,
        user_content: str,
        assistant_content: str,
    ) -> tuple[Message, Message]:
        conversation = self.db.execute(
            select(ConversationModel).where(
                ConversationModel.id == conversation_id,
                ConversationModel.user_id == user_id,
            )
        ).scalar_one_or_none()
        if conversation is None:
            raise ValueError("conversation_not_found")

        now = datetime.now(timezone.utc)
        user_message = MessageModel(
            conversation_id=conversation_id,
            role="user",
            content=user_content,
            created_at=now,
        )
        assistant_message = MessageModel(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
            created_at=now,
        )
        conversation.updated_at = now

        self.db.add(user_message)
        self.db.add(assistant_message)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(user_message)
        self.db.refresh(assistant_message)
        return _to_domain_message(user_message), _to_domain_message(assistant_message)
