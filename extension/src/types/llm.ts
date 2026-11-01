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
    defaultModel: "meta/llama-3.1-70b-instruct",
    isFreeTier: true,
    requiresApiKey: false,
    getApiKeyUrl: "https://build.nvidia.com/meta/llama-3_1-70b-instruct",
    description: "Llama 3.1 70B: Free. No API key required. Great quality."
  },
  {
    id: "groq",
    name: "Groq (Free + Ultra-Fast)",
    defaultModel: "llama-3.1-70b-versatile",
    isFreeTier: true,
    requiresApiKey: true,
    getApiKeyUrl: "https://console.groq.com/keys",
    description: "Llama 3.1 70B: Free API key, ~300 tokens/sec. Fastest available."
  },
  {
    id: "gemini",
    name: "Google Gemini Flash",
    defaultModel: "gemini-1.5-flash",
    isFreeTier: true,
    requiresApiKey: true,
    getApiKeyUrl: "https://aistudio.google.com/app/apikey",
    description: "Gemini 1.5 Flash: 1M free tokens/day. Excellent quality."
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o Mini",
    defaultModel: "gpt-4o-mini",
    isFreeTier: false,
    requiresApiKey: true,
    getApiKeyUrl: "https://platform.openai.com/api-keys",
    description: "GPT-4o Mini: Paid. High quality, widely trusted."
  },
  {
    id: "claude",
    name: "Anthropic Claude Haiku",
    defaultModel: "claude-3-haiku-20240307",
    isFreeTier: false,
    requiresApiKey: true,
    getApiKeyUrl: "https://console.anthropic.com/settings/keys",
    description: "Claude 3 Haiku: Paid. Best for nuanced writing quality."
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
