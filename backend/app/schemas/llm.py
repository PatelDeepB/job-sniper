from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class LLMProviderType(str, Enum):
    """Supported LLM provider types for open-text question answering."""
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"
    NVIDIA = "nvidia"
    GROQ = "groq"


class LLMProviderConfig(BaseModel):
    """
    Runtime LLM provider configuration sent by the Chrome extension.
    API keys are stored in chrome.storage (local to the user's browser)
    and never persisted on the server.
    """
    provider: LLMProviderType = Field(
        default=LLMProviderType.NVIDIA,
        description="Selected LLM provider. NVIDIA and Groq are free."
    )
    api_key: Optional[str] = Field(
        default=None,
        description="User-supplied API key. Required for Gemini, OpenAI, Claude. Optional for NVIDIA/Groq.",
        min_length=1,
        max_length=512
    )
    custom_model_id: Optional[str] = Field(
        default=None,
        description="Optional override for the default model ID of the chosen provider."
    )


class LLMGenerateRequest(BaseModel):
    """Standalone LLM text generation request for custom open-text questions."""
    provider_config: LLMProviderConfig
    system_prompt: str = Field(min_length=10, max_length=2000)
    user_prompt: str = Field(min_length=5, max_length=4000)
    max_tokens: int = Field(default=300, ge=50, le=1000)


class LLMGenerateResponse(BaseModel):
    """LLM generation result with metadata."""
    provider_used: LLMProviderType
    model_used: str
    generated_text: str
    token_estimate: int
    is_free_tier: bool
