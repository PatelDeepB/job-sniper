from typing import List

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.llm import (
    LLMGenerateRequest,
    LLMGenerateResponse,
    LLMProviderType,
)
from backend.app.services.llm.factory import get_provider, list_providers

router = APIRouter(prefix="/llm", tags=["LLM Provider"])


@router.get("/providers", status_code=status.HTTP_200_OK)
async def get_available_providers() -> List[dict]:
    """
    Return metadata for all supported LLM providers.
    Used by the Chrome extension settings panel to populate the provider dropdown.
    """
    return list_providers()


@router.post("/generate", response_model=LLMGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_text(request: LLMGenerateRequest) -> LLMGenerateResponse:
    """
    Generate text using the user's chosen LLM provider and API key.

    API keys are forwarded directly from the Chrome extension's local storage
    and are never stored or logged on this server.
    """
    provider = get_provider(request.provider_config.provider)

    try:
        result = await provider.generate(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            api_key=request.provider_config.api_key,
            max_tokens=request.max_tokens,
            custom_model_id=request.provider_config.custom_model_id,
        )
    except ValueError as validation_error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(validation_error),
        )
    except RuntimeError as api_error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM provider error: {api_error}",
        )

    return LLMGenerateResponse(
        provider_used=request.provider_config.provider,
        model_used=result.model_used,
        generated_text=result.generated_text,
        token_estimate=result.token_estimate,
        is_free_tier=result.is_free_tier,
    )
