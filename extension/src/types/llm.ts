/**
 * LLM Provider configuration types mirroring the backend schemas.
 * API keys are stored only in chrome.storage.local, never sent to our servers unintentionally.
 */

export type LLMProviderType = "gemini" | "openai" | "claude" | "nvidia" | "groq";

export interface LLMProviderOption {
  readonly id: LLMProviderType;
  readonly name: string;
  readonly defaultModel: string;
  readonly isFreeTier: boolean;
  readonly requiresApiKey: boolean;
  readonly getApiKeyUrl: string;
  readonly description: string;
}

export const LLM_PROVIDER_OPTIONS: readonly LLMProviderOption[] = [
  {
    id: "nvidia",
    name: "NVIDIA NIM (Free)",
    defaultModel: "meta/llama-3.3-70b-instruct",
    isFreeTier: true,
    requiresApiKey: false,
    getApiKeyUrl: "https://build.nvidia.com/meta/llama-3_3-70b-instruct",
    description: "Llama 3.3 70B: Free. Zero cost, no API key required. Flagship quality."
  },
  {
    id: "groq",
    name: "Groq (Free + Ultra-Fast)",
    defaultModel: "llama-3.3-70b-versatile",
    isFreeTier: true,
    requiresApiKey: true,
    getApiKeyUrl: "https://console.groq.com/keys",
    description: "Llama 3.3 70B: Free API key, ~300 tokens/sec. Instant responses."
  },
  {
    id: "gemini",
    name: "Google Gemini 3.8 Flash",
    defaultModel: "gemini-3.8-flash",
    isFreeTier: true,
    requiresApiKey: true,
    getApiKeyUrl: "https://aistudio.google.com/app/apikey",
    description: "Gemini 3.8 Flash: 1M free tokens/day. State of the art speed."
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o Mini",
    defaultModel: "gpt-4o-mini",
    isFreeTier: false,
    requiresApiKey: true,
    getApiKeyUrl: "https://platform.openai.com/api-keys",
    description: "GPT-4o Mini: Paid. High reliability, widely trusted."
  },
  {
    id: "claude",
    name: "Anthropic Claude 3.5 Haiku",
    defaultModel: "claude-3-5-haiku-latest",
    isFreeTier: false,
    requiresApiKey: true,
    getApiKeyUrl: "https://console.anthropic.com/settings/keys",
    description: "Claude 3.5 Haiku: Paid. Superior authentic human-like prose."
  }
] as const;

export interface LLMSettings {
  readonly selectedProvider: LLMProviderType;
  readonly apiKeys: Readonly<Record<LLMProviderType, string>>;
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  selectedProvider: "nvidia",
  apiKeys: {
    nvidia: "",
    groq: "",
    gemini: "",
    openai: "",
    claude: ""
  }
};
