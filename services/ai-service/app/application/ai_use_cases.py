from __future__ import annotations

from dataclasses import asdict

from app.domain.ports import AiProviderPort, AiRepositoryPort, Conversation, Message, PaginatedResult
from app.huggingFace_client import SYSTEM_PROMPT
from app.infrastructure.config import settings
from app.presentation.errors import (
    ProviderRetryExhaustedError,
    ProviderTimeoutError,
    ProviderUpstreamError,
    not_found_problem,
    provider_problem,
)


def build_provider_messages(
    *,
    system_prompt: str,
    prior_messages: list[dict[str, str]],
    context_window_messages: int,
    current_user_content: str,
) -> list[dict[str, str]]:
    window = prior_messages[-context_window_messages:] if context_window_messages > 0 else []
    return [
        {"role": "system", "content": system_prompt},
        *window,
        {"role": "user", "content": current_user_content},
    ]


class AiUseCases:
    def __init__(self, repository: AiRepositoryPort, provider: AiProviderPort) -> None:
        self.repository = repository
        self.provider = provider

    def create_conversation(self, *, user_id: str, title: str | None) -> Conversation:
        return self.repository.create_conversation(user_id=user_id, title=title)

    def list_conversations(
        self,
        *,
        user_id: str,
        limit: int,
        offset: int,
        sort: str,
    ) -> PaginatedResult[Conversation]:
        return self.repository.list_conversations(
            user_id=user_id,
            limit=limit,
            offset=offset,
            sort=sort,
        )

    def get_conversation_detail(self, *, user_id: str, conversation_id: str) -> tuple[Conversation, list[Message]]:
        conversation = self.repository.get_conversation(conversation_id=conversation_id, user_id=user_id)
        if conversation is None:
            raise not_found_problem("conversation_not_found")
        messages = self.repository.list_all_messages_for_conversation(
            conversation_id=conversation_id,
            user_id=user_id,
        )
        return conversation, messages

    def list_messages(
        self,
        *,
        user_id: str,
        conversation_id: str,
        limit: int,
        offset: int,
    ) -> PaginatedResult[Message]:
        conversation = self.repository.get_conversation(conversation_id=conversation_id, user_id=user_id)
        if conversation is None:
            raise not_found_problem("conversation_not_found")

        return self.repository.list_messages(
            conversation_id=conversation_id,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )

    def send_message(self, *, user_id: str, conversation_id: str, content: str) -> tuple[Message, str]:
        conversation = self.repository.get_conversation(conversation_id=conversation_id, user_id=user_id)
        if conversation is None:
            raise not_found_problem("conversation_not_found")

        prior_messages = self.repository.list_recent_messages(
            conversation_id=conversation_id,
            user_id=user_id,
            limit=settings.ai_context_window_messages,
        )
        prior_payload = [{"role": item.role, "content": item.content} for item in prior_messages]
        provider_messages = build_provider_messages(
            system_prompt=SYSTEM_PROMPT,
            prior_messages=prior_payload,
            context_window_messages=settings.ai_context_window_messages,
            current_user_content=content,
        )

        try:
            assistant_reply = self.provider.generate_reply(messages=provider_messages)
        except ProviderTimeoutError as exc:
            raise provider_problem(
                "provider_timeout",
                type_="https://drivemind.dev/problems/ai/provider-timeout",
            ) from exc
        except ProviderUpstreamError as exc:
            raise provider_problem(
                "provider_upstream_error",
                type_="https://drivemind.dev/problems/ai/provider-upstream-5xx",
            ) from exc
        except ProviderRetryExhaustedError as exc:
            raise provider_problem(
                "provider_retry_exhausted",
                type_="https://drivemind.dev/problems/ai/provider-retry-exhausted",
            ) from exc

        user_message, _assistant_message = self.repository.create_message_pair(
            conversation_id=conversation_id,
            user_id=user_id,
            user_content=content,
            assistant_content=assistant_reply,
        )
        return user_message, assistant_reply


def as_dict(item: object) -> dict:
    return asdict(item)
