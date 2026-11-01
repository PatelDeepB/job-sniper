from backend.app.schemas.llm import LLMProviderType
from backend.app.services.llm.base import BaseLLMProvider
from backend.app.services.llm.claude_provider import ClaudeProvider
from backend.app.services.llm.gemini_provider import GeminiProvider
from backend.app.services.llm.groq_provider import GroqProvider
from backend.app.services.llm.nvidia_provider import NvidiaProvider
from backend.app.services.llm.openai_provider import OpenAIProvider

_PROVIDER_REGISTRY: dict[LLMProviderType, BaseLLMProvider] = {
    LLMProviderType.GEMINI: GeminiProvider(),
    LLMProviderType.OPENAI: OpenAIProvider(),
    LLMProviderType.CLAUDE: ClaudeProvider(),
    LLMProviderType.NVIDIA: NvidiaProvider(),
    LLMProviderType.GROQ: GroqProvider(),
}


def get_provider(provider_type: LLMProviderType) -> BaseLLMProvider:
    """
    Factory function returning the concrete LLM provider instance.

    Args:
        provider_type: Enum value identifying the desired provider.

    Returns:
        BaseLLMProvider concrete implementation.

    Raises:
        KeyError: If the provider_type is not registered (should never happen with valid enum values).
    """
    provider = _PROVIDER_REGISTRY.get(provider_type)
    if provider is None:
        supported = [p.value for p in LLMProviderType]
        raise KeyError(f"Provider '{provider_type}' is not registered. Supported: {supported}")
    return provider


def list_providers() -> list[dict]:
    """Return metadata about all available providers for the settings UI."""
    return [
        {
            "id": provider_type.value,
            "name": provider.provider_name,
            "default_model": provider.default_model_id,
            "is_free_tier": provider.is_free_tier,
            "requires_api_key": provider_type != LLMProviderType.NVIDIA,
        }
        for provider_type, provider in _PROVIDER_REGISTRY.items()
    ]
