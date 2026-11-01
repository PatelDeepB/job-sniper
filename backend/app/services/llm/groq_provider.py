from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.1-70b-versatile"


class GroqProvider(BaseLLMProvider):
    """
    Groq provider (ultra-fast LPU inference).
    Free tier: Generous rate limits on open-source models including Llama 3.1 70B.
    Inference speed: ~300 tokens/sec (fastest available free option).
    Docs: https://console.groq.com/docs/openai
    Get a free key: https://console.groq.com/keys
    """

    @property
    def default_model_id(self) -> str:
        return DEFAULT_GROQ_MODEL

    @property
    def is_free_tier(self) -> bool:
        return True

    @property
    def provider_name(self) -> str:
        return "Groq (Ultra-Fast)"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        if not api_key:
            raise ValueError(
                "Groq requires a free API key. Get one at https://console.groq.com/keys "
                "(takes 30 seconds, no credit card needed)"
            )

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

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                GROQ_API_BASE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"Groq API error {response.status_code}: {response.text[:200]}"
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
