from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"


class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini provider.
    Latest model: gemini-3.8-flash.
    Free tier: High daily allowance on Google AI Studio.
    Docs: https://ai.google.dev/gemini-api/docs
    """

    @property
    def default_model_id(self) -> str:
        return DEFAULT_GEMINI_MODEL

    @property
    def is_free_tier(self) -> bool:
        return True

    @property
    def provider_name(self) -> str:
        return "Google Gemini"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        if not api_key:
            raise ValueError("Gemini requires a valid API key. Get one free at https://aistudio.google.com/app/apikey")

        model_id = custom_model_id or self.default_model_id
        endpoint = f"{GEMINI_API_BASE}/{model_id}:generateContent?key={api_key}"

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            },
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(endpoint, json=payload)
            if response.status_code != 200:
                raise RuntimeError(
                    f"Gemini API error {response.status_code}: {response.text[:200]}"
                )

            data = response.json()
            generated_text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
            token_estimate = data.get("usageMetadata", {}).get("totalTokenCount", len(user_prompt.split()))

        return LLMResponse(
            generated_text=generated_text,
            model_used=model_id,
            token_estimate=token_estimate,
            is_free_tier=self.is_free_tier,
        )
