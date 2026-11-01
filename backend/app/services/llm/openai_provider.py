from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

OPENAI_API_BASE = "https://api.openai.com/v1/chat/completions"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI provider.
    Recommended model: gpt-4o-mini (cheap, high quality for job application text).
    Docs: https://platform.openai.com/docs/api-reference
    """

    @property
    def default_model_id(self) -> str:
        return DEFAULT_OPENAI_MODEL

    @property
    def is_free_tier(self) -> bool:
        return False

    @property
    def provider_name(self) -> str:
        return "OpenAI"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        if not api_key:
            raise ValueError("OpenAI requires a valid API key. Get one at https://platform.openai.com/api-keys")

        model_id = custom_model_id or self.default_model_id

        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                OPENAI_API_BASE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"OpenAI API error {response.status_code}: {response.text[:200]}"
                )

            data = response.json()
            generated_text = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            token_estimate = data.get("usage", {}).get("total_tokens", len(user_prompt.split()))

        return LLMResponse(
            generated_text=generated_text,
            model_used=model_id,
            token_estimate=token_estimate,
            is_free_tier=self.is_free_tier,
        )
