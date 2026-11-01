import {
  DEFAULT_LLM_SETTINGS,
  LLM_PROVIDER_OPTIONS,
  LLMProviderType,
  LLMSettings,
} from "../types/llm.js";

const LLM_SETTINGS_KEY = "jobsniper_llm_settings";

export class LLMSettingsService {
  public static async loadSettings(): Promise<LLMSettings> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(LLM_SETTINGS_KEY);
      return (result[LLM_SETTINGS_KEY] as LLMSettings) || DEFAULT_LLM_SETTINGS;
    }
    const rawData = localStorage.getItem(LLM_SETTINGS_KEY);
    return rawData ? JSON.parse(rawData) : DEFAULT_LLM_SETTINGS;
  }

  public static async saveSettings(settings: LLMSettings): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [LLM_SETTINGS_KEY]: settings });
      return;
    }
    localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
  }

  public static async getActiveProviderConfig(): Promise<{
    provider: LLMProviderType;
    apiKey: string | null;
  }> {
    const settings = await this.loadSettings();
    const apiKey = settings.apiKeys[settings.selectedProvider] || null;
    return { provider: settings.selectedProvider, apiKey };
  }

  /**
   * Render the LLM provider settings section into a given container element.
   * Handles provider switching, API key input, and persistence.
   */
  public static async renderProviderSettings(containerElement: HTMLElement): Promise<void> {
    const currentSettings = await this.loadSettings();

    containerElement.innerHTML = `
      <div class="llm-settings-section">
        <h4 class="settings-section-title">AI Engine Provider</h4>
        <p class="settings-hint">API keys are stored locally in your browser only. Never sent to our servers unmodified.</p>
        
        <div class="provider-grid" id="providerGrid"></div>
        
        <div class="api-key-input-group" id="apiKeyGroup" style="display:none;">
          <label class="api-key-label" id="apiKeyLabel">API Key</label>
          <div class="api-key-row">
            <input 
              type="password" 
              id="apiKeyInput" 
              class="api-key-input" 
              placeholder="Paste your API key here..."
              autocomplete="off"
            />
            <a id="getKeyLink" href="#" target="_blank" rel="noopener noreferrer" class="btn-get-key">
              Get Free Key
            </a>
          </div>
        </div>

        <div class="provider-status" id="providerStatus"></div>
      </div>
    `;

    const providerGrid = containerElement.querySelector<HTMLElement>("#providerGrid");
    if (providerGrid) {
      LLM_PROVIDER_OPTIONS.forEach((option) => {
        const isSelected = option.id === currentSettings.selectedProvider;
        const card = document.createElement("div");
        card.className = `provider-card ${isSelected ? "selected" : ""}`;
        card.dataset.providerId = option.id;

        const freeBadge = option.isFreeTier
          ? '<span class="badge-free">FREE</span>'
          : '<span class="badge-paid">PAID</span>';

        card.innerHTML = `
          <div class="provider-card-header">
            <span class="provider-card-name">${option.name}</span>
            ${freeBadge}
          </div>
          <p class="provider-card-desc">${option.description}</p>
        `;

        card.addEventListener("click", async () => {
          document.querySelectorAll(".provider-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          await this.handleProviderSelection(option.id, currentSettings, containerElement);
        });

        providerGrid.appendChild(card);
      });
    }

    await this.updateApiKeyVisibility(currentSettings.selectedProvider, currentSettings, containerElement);
  }

  private static async handleProviderSelection(
    providerId: LLMProviderType,
    currentSettings: LLMSettings,
    container: HTMLElement
  ): Promise<void> {
    const updatedSettings: LLMSettings = { ...currentSettings, selectedProvider: providerId };
    await this.saveSettings(updatedSettings);
    await this.updateApiKeyVisibility(providerId, updatedSettings, container);
  }

  private static async updateApiKeyVisibility(
    providerId: LLMProviderType,
    settings: LLMSettings,
    container: HTMLElement
  ): Promise<void> {
    const providerOption = LLM_PROVIDER_OPTIONS.find((p) => p.id === providerId);
    if (!providerOption) {
      return;
    }

    const apiKeyGroup = container.querySelector<HTMLElement>("#apiKeyGroup");
    const apiKeyLabel = container.querySelector<HTMLElement>("#apiKeyLabel");
    const apiKeyInput = container.querySelector<HTMLInputElement>("#apiKeyInput");
    const getKeyLink = container.querySelector<HTMLAnchorElement>("#getKeyLink");
    const statusElement = container.querySelector<HTMLElement>("#providerStatus");

    if (providerOption.requiresApiKey) {
      if (apiKeyGroup) {
        apiKeyGroup.style.display = "block";
      }
      if (apiKeyLabel) {
        apiKeyLabel.textContent = `${providerOption.name} API Key`;
      }
      if (apiKeyInput) {
        apiKeyInput.value = settings.apiKeys[providerId] || "";
        apiKeyInput.addEventListener("change", async () => {
          const currentSaved = await this.loadSettings();
          const updated: LLMSettings = {
            ...currentSaved,
            apiKeys: { ...currentSaved.apiKeys, [providerId]: apiKeyInput.value.trim() }
          };
          await this.saveSettings(updated);
        });
      }
      if (getKeyLink) {
        getKeyLink.href = providerOption.getApiKeyUrl;
        getKeyLink.textContent = providerOption.isFreeTier ? "Get Free Key" : "Get API Key";
      }
    } else {
      if (apiKeyGroup) {
        apiKeyGroup.style.display = "none";
      }
    }

    if (statusElement) {
      const hasRequiredKey = !providerOption.requiresApiKey || !!settings.apiKeys[providerId];
      statusElement.innerHTML = hasRequiredKey
        ? `<span class="status-ready">✅ ${providerOption.name} ready</span>`
        : `<span class="status-missing">⚠️ API key required for ${providerOption.name}</span>`;
    }
  }
}
