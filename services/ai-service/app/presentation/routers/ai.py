from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from app.application.ai_use_cases import AiUseCases
from app.presentation.dependencies import get_ai_use_cases, get_current_user_id
from app.presentation.schemas import (
    ConversationDetailResponse,
    ConversationSchema,
    CreateConversationRequest,
    CreateConversationResponse,
    CreateMessageRequest,
    CreateMessageResponse,
    ListConversationsResponse,
    ListMessagesResponse,
    MessageSchema,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/conversations", response_model=CreateConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: CreateConversationRequest,
    use_cases: AiUseCases = Depends(get_ai_use_cases),
    user_id: str = Depends(get_current_user_id),
) -> CreateConversationResponse:
    conversation = use_cases.create_conversation(user_id=user_id, title=payload.title)
    return CreateConversationResponse(conversation=ConversationSchema.model_validate(conversation, from_attributes=True))


@router.get("/conversations", response_model=ListConversationsResponse)
def list_conversations(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="-updated_at"),
    use_cases: AiUseCases = Depends(get_ai_use_cases),
    user_id: str = Depends(get_current_user_id),
) -> ListConversationsResponse:
    result = use_cases.list_conversations(user_id=user_id, limit=limit, offset=offset, sort=sort)
    return ListConversationsResponse(
        items=[ConversationSchema.model_validate(item, from_attributes=True) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_detail(
    conversation_id: str,
    use_cases: AiUseCases = Depends(get_ai_use_cases),
    user_id: str = Depends(get_current_user_id),
) -> ConversationDetailResponse:
    conversation, messages = use_cases.get_conversation_detail(user_id=user_id, conversation_id=conversation_id)
    return ConversationDetailResponse(
        conversation=ConversationSchema.model_validate(conversation, from_attributes=True),
        messages=[MessageSchema.model_validate(item, from_attributes=True) for item in messages],
    )


@router.post("/messages", response_model=CreateMessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    payload: CreateMessageRequest,
    use_cases: AiUseCases = Depends(get_ai_use_cases),
    user_id: str = Depends(get_current_user_id),
) -> CreateMessageResponse:
    message, assistant_reply = use_cases.send_message(
        user_id=user_id,
        conversation_id=payload.conversation_id,
        content=payload.content,
    )
    return CreateMessageResponse(
        message=MessageSchema.model_validate(message, from_attributes=True),
        assistant_reply=assistant_reply,
    )


@router.get("/messages", response_model=ListMessagesResponse)
def list_messages(
    conversation_id: str = Query(...),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_cases: AiUseCases = Depends(get_ai_use_cases),
    user_id: str = Depends(get_current_user_id),
) -> ListMessagesResponse:
    result = use_cases.list_messages(
        user_id=user_id,
        conversation_id=conversation_id,
        limit=limit,
        offset=offset,
    )
    return ListMessagesResponse(
        items=[MessageSchema.model_validate(item, from_attributes=True) for item in result.items],
        total=result.total,
        limit=result.limit,
        offset=result.offset,
    )
