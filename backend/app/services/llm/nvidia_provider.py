from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_NVIDIA_MODEL = "meta/llama-3.3-70b-instruct"
NVIDIA_FREE_API_KEY = "nvapi-free"


class NvidiaProvider(BaseLLMProvider):
    """
    NVIDIA NIM provider.
    Latest model: meta/llama-3.3-70b-instruct (Free hosted inference on NVIDIA architecture).
    Docs: https://build.nvidia.com/explore/discover
    """

    @property
    def default_model_id(self) -> str:
        return DEFAULT_NVIDIA_MODEL

    @property
    def is_free_tier(self) -> bool:
        return True

    @property
    def provider_name(self) -> str:
        return "NVIDIA NIM"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        effective_api_key = api_key or NVIDIA_FREE_API_KEY
        model_id = custom_model_id or self.default_model_id

        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                NVIDIA_API_BASE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {effective_api_key}",
                    "Content-Type": "application/json",
                },
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"NVIDIA NIM API error {response.status_code}: {response.text[:200]}"
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
