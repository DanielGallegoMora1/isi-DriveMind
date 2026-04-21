from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ConversationSchema(BaseModel):
    id: str
    user_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime


class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class CreateConversationRequest(BaseModel):
    title: str | None = None


class CreateConversationResponse(BaseModel):
    conversation: ConversationSchema


class ListConversationsResponse(BaseModel):
    items: list[ConversationSchema]
    total: int
    limit: int
    offset: int


class ConversationDetailResponse(BaseModel):
    conversation: ConversationSchema
    messages: list[MessageSchema]


class CreateMessageRequest(BaseModel):
    conversation_id: str
    content: str = Field(min_length=1)


class CreateMessageResponse(BaseModel):
    message: MessageSchema
    assistant_reply: str


class ListMessagesResponse(BaseModel):
    items: list[MessageSchema]
    total: int
    limit: int
    offset: int
