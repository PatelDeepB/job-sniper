from typing import Optional

import httpx

from backend.app.services.llm.base import BaseLLMProvider, LLMResponse

NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_NVIDIA_MODEL = "meta/llama-3.1-70b-instruct"
NVIDIA_FREE_API_KEY = "nvapi-free"


class NvidiaProvider(BaseLLMProvider):
    """
    NVIDIA NIM (Neural Interface Models) provider.
    Runs meta/llama-3.1-70b-instruct for FREE on NVIDIA's hosted inference infrastructure.
    Users can also pass their own NVIDIA NIM API key for higher rate limits.
    Docs: https://build.nvidia.com/explore/discover
    Free API: https://build.nvidia.com/meta/llama-3_1-70b-instruct
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
        # NVIDIA NIM offers free inference; use provided key or the public free key
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
