from __future__ import annotations

from openai import APITimeoutError, OpenAI

from app.infrastructure.config import settings
from app.presentation.errors import ProviderRetryExhaustedError, ProviderTimeoutError, ProviderUpstreamError


class HuggingFaceOpenAIAdapter:
    def __init__(self) -> None:
        self.client: OpenAI | None = None
        if settings.hf_token:
            self.client = OpenAI(
                base_url="https://router.huggingface.co/v1",
                api_key=settings.hf_token,
            )

    def generate_reply(self, *, messages: list[dict[str, str]]) -> str:
        if self.client is None:
            raise ProviderRetryExhaustedError("provider_retry_exhausted")

        attempts = max(1, settings.hf_max_retries + 1)
        last_error: Exception | None = None
        for _ in range(attempts):
            try:
                response = self.client.chat.completions.create(
                    model=settings.hf_model,
                    messages=messages,
                    timeout=settings.hf_timeout_seconds,
                )
                content = (response.choices[0].message.content or "").strip()
                if not content:
                    raise ProviderUpstreamError("provider_upstream_error")
                return content
            except APITimeoutError as exc:
                last_error = exc
            except Exception as exc:  # noqa: BLE001
                status_code = getattr(exc, "status_code", None)
                if status_code and int(status_code) >= 500:
                    raise ProviderUpstreamError("provider_upstream_error") from exc
                last_error = exc

        if isinstance(last_error, APITimeoutError):
            raise ProviderTimeoutError("provider_timeout") from last_error

        raise ProviderRetryExhaustedError("provider_retry_exhausted") from last_error
