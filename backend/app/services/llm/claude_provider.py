from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

CLAUDE_API_BASE = "https://api.anthropic.com/v1/messages"
DEFAULT_CLAUDE_MODEL = "claude-3-5-haiku-latest"
ANTHROPIC_VERSION = "2023-06-01"


class ClaudeProvider(BaseLLMProvider):
    """
    Anthropic Claude provider.
    Latest model: claude-3-5-haiku-latest (fastest & highest quality Haiku for job applications).
    Docs: https://docs.anthropic.com/claude/reference/messages_post
    """

    @property
    def default_model_id(self) -> str:
        return DEFAULT_CLAUDE_MODEL

    @property
    def is_free_tier(self) -> bool:
        return False

    @property
    def provider_name(self) -> str:
        return "Anthropic Claude"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        if not api_key:
            raise ValueError("Claude requires a valid API key. Get one at https://console.anthropic.com/settings/keys")

        model_id = custom_model_id or self.default_model_id

        payload = {
            "model": model_id,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                CLAUDE_API_BASE,
                json=payload,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": ANTHROPIC_VERSION,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"Claude API error {response.status_code}: {response.text[:200]}"
                )

            data = response.json()
            generated_text = (
                data.get("content", [{}])[0].get("text", "").strip()
            )
            token_estimate = (
                data.get("usage", {}).get("input_tokens", 0)
                + data.get("usage", {}).get("output_tokens", 0)
            )

        return LLMResponse(
            generated_text=generated_text,
            model_used=model_id,
            token_estimate=token_estimate,
            is_free_tier=self.is_free_tier,
        )
