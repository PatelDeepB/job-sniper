from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class LLMResponse:
    """Immutable result from any LLM provider call."""
    generated_text: str
    model_used: str
    token_estimate: int
    is_free_tier: bool


class BaseLLMProvider(ABC):
    """
    Abstract base for all LLM provider implementations.
    Each provider must implement generate() with identical call signatures
    to allow runtime swapping without modifying any caller code.
    """

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        api_key: Optional[str],
        max_tokens: int = 300,
        custom_model_id: Optional[str] = None,
    ) -> LLMResponse:
        """
        Generate text from the LLM given a system and user prompt.

        Args:
            system_prompt: Instructions defining the AI's role and behavior.
            user_prompt: The specific content or question to respond to.
            api_key: User-supplied API key (None for providers with no-auth free tiers).
            max_tokens: Maximum tokens in the response.
            custom_model_id: Optional model override (e.g., user wants gpt-4o instead of gpt-4o-mini).

        Returns:
            LLMResponse dataclass with the generated text and metadata.

        Raises:
            ValueError: If required api_key is missing.
            RuntimeError: If the provider API call fails after retries.
        """
        ...

    @property
    @abstractmethod
    def default_model_id(self) -> str:
        """The default model this provider uses when no custom_model_id is given."""
        ...

    @property
    @abstractmethod
    def is_free_tier(self) -> bool:
        """Whether this provider offers a meaningful free API tier."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider display name."""
        ...
