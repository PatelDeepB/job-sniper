from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.llm import LLMProviderConfig, LLMProviderType
from backend.app.services.llm.base import LLMResponse
from backend.app.services.llm.factory import get_provider, list_providers
from backend.app.services.open_text_service import OpenTextAnswerService

client = TestClient(app)


def test_list_providers_returns_all_five():
    providers = list_providers()
    provider_ids = [p["id"] for p in providers]

    assert len(providers) == 5
    assert "nvidia" in provider_ids
    assert "groq" in provider_ids
    assert "gemini" in provider_ids
    assert "openai" in provider_ids
    assert "claude" in provider_ids


def test_get_provider_instances():
    for p_type in LLMProviderType:
        provider = get_provider(p_type)
        assert provider.default_model_id is not None
        assert isinstance(provider.is_free_tier, bool)
        assert isinstance(provider.provider_name, str)


def test_get_provider_invalid_key_raises():
    with pytest.raises(KeyError):
        get_provider("unsupported_provider")  # type: ignore


def test_api_list_providers_endpoint():
    response = client.get("/api/v1/llm/providers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    nvidia_meta = next(p for p in data if p["id"] == "nvidia")
    assert nvidia_meta["is_free_tier"] is True
    assert nvidia_meta["requires_api_key"] is False


@pytest.mark.asyncio
async def test_nvidia_generate_success_mocked():
    provider = get_provider(LLMProviderType.NVIDIA)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "I bring deep experience in high-throughput APIs."}}],
        "usage": {"total_tokens": 42},
    }

    with patch("httpx.AsyncClient.post", AsyncMock(return_value=mock_response)):
        result = await provider.generate(
            system_prompt="System instructions",
            user_prompt="Why work here?",
            api_key=None,
        )

        assert result.generated_text == "I bring deep experience in high-throughput APIs."
        assert result.is_free_tier is True
        assert result.token_estimate == 42


@pytest.mark.asyncio
async def test_gemini_missing_api_key_raises():
    provider = get_provider(LLMProviderType.GEMINI)

    with pytest.raises(ValueError, match="Gemini requires a valid API key"):
        await provider.generate(
            system_prompt="System",
            user_prompt="Question",
            api_key=None,
        )


@pytest.mark.asyncio
async def test_open_text_answer_service():
    mock_llm_response = LLMResponse(
        generated_text="I specialize in FastAPI and Docker microservices with proven scalability.",
        model_used="meta/llama-3.1-70b-instruct",
        token_estimate=35,
        is_free_tier=True,
    )

    with patch.object(
        get_provider(LLMProviderType.NVIDIA), "generate", AsyncMock(return_value=mock_llm_response)
    ):
        config = LLMProviderConfig(provider=LLMProviderType.NVIDIA, api_key=None)
        response = await OpenTextAnswerService.answer_open_question(
            question="Why are you a good fit for this role?",
            job_title="Senior Backend Engineer",
            company_name="Datadog",
            candidate_skills=["Python", "FastAPI", "Docker"],
            candidate_summary="Backend engineer with 5 years experience.",
            provider_config=config,
        )

        assert "FastAPI" in response.generated_text
        assert response.is_free_tier is True
