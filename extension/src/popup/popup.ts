import { LLMSettingsService } from "../services/llm_settings.js";
import { StorageService } from "../services/storage.js";
import { MasterProfile, TargetPreferences } from "../types/profile.js";

class PopupController {
  private currentActiveTabId: number | null = null;
  private currentActivePlatform: "greenhouse" | "lever" | null = null;

  public async initialize(): Promise<void> {
    this.setupTabNavigation();
    this.setupEventListeners();
    await this.loadInitialData();
    await this.inspectActiveBrowserTab();
    await this.initializeAIEngineSettings();
  }

  private setupTabNavigation(): void {
    const tabButtons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
    const tabPanes = document.querySelectorAll<HTMLElement>(".tab-pane");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTabId = button.dataset.tab;
        if (!targetTabId) {
          return;
        }

        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanes.forEach((pane) => pane.classList.remove("active"));

        button.classList.add("active");
        const activePane = document.getElementById(targetTabId);
        if (activePane) {
          activePane.classList.add("active");
        }
      });
    });
  }

  private setupEventListeners(): void {
    const profileForm = document.getElementById("profileForm") as HTMLFormElement | null;
    if (profileForm) {
      profileForm.addEventListener("submit", (event) => this.handleProfileSubmit(event));
    }

    const preferencesForm = document.getElementById("preferencesForm") as HTMLFormElement | null;
    if (preferencesForm) {
      preferencesForm.addEventListener("submit", (event) => this.handlePreferencesSubmit(event));
    }

    const autoSnipeToggle = document.getElementById("autoSnipeToggle") as HTMLInputElement | null;
    if (autoSnipeToggle) {
      autoSnipeToggle.addEventListener("change", () => this.handleAutoSnipeToggle(autoSnipeToggle.checked));
    }

    const autofillButton = document.getElementById("btnAutofillCurrent") as HTMLButtonElement | null;
    if (autofillButton) {
      autofillButton.addEventListener("click", () => this.triggerAutofill());
    }

    const tailorButton = document.getElementById("btnTailorResume") as HTMLButtonElement | null;
    if (tailorButton) {
      tailorButton.addEventListener("click", () => this.triggerResumeTailoring());
    }
  }

  private async loadInitialData(): Promise<void> {
    const profile = await StorageService.loadProfile();
    const stats = await StorageService.loadStats();

    this.renderStats(stats.jobsSnipedCount, stats.formsAutoFilledCount, stats.hoursSavedEstimate);
    this.populateProfileForm(profile);
    this.populatePreferencesForm(profile.preferences);

    const autoSnipeToggle = document.getElementById("autoSnipeToggle") as HTMLInputElement | null;
    if (autoSnipeToggle) {
      autoSnipeToggle.checked = profile.preferences.autoSnipeEnabled;
    }

    await this.renderSniperFeed();
  }

  private async initializeAIEngineSettings(): Promise<void> {
    const container = document.getElementById("aiEngineSettingsContainer");
    if (container) {
      await LLMSettingsService.renderProviderSettings(container);
    }
  }

  private renderStats(snipedCount: number, filledCount: number, hoursSaved: number): void {
    const statSnipedElement = document.getElementById("statSniped");
    const statFilledElement = document.getElementById("statFilled");
    const statHoursElement = document.getElementById("statHours");

    if (statSnipedElement) {
      statSnipedElement.textContent = String(snipedCount);
    }
    if (statFilledElement) {
      statFilledElement.textContent = String(filledCount);
    }
    if (statHoursElement) {
      statHoursElement.textContent = `${hoursSaved}h`;
    }
  }

  private populateProfileForm(profile: MasterProfile): void {
    (document.getElementById("fullName") as HTMLInputElement).value = profile.contact.fullName;
    (document.getElementById("email") as HTMLInputElement).value = profile.contact.email;
    (document.getElementById("phone") as HTMLInputElement).value = profile.contact.phone;
    (document.getElementById("location") as HTMLInputElement).value = profile.contact.location;
    (document.getElementById("linkedInUrl") as HTMLInputElement).value = profile.contact.linkedInUrl;
    (document.getElementById("githubUrl") as HTMLInputElement).value = profile.contact.githubUrl;
    (document.getElementById("headline") as HTMLInputElement).value = profile.headline;
    (document.getElementById("coreSkills") as HTMLTextAreaElement).value = profile.coreSkills.join(", ");
  }

  private populatePreferencesForm(preferences: TargetPreferences): void {
    (document.getElementById("targetTitles") as HTMLInputElement).value = preferences.targetTitles.join(", ");
    (document.getElementById("minSalary") as HTMLInputElement).value = String(preferences.minSalaryUSD);
    (document.getElementById("yearsExp") as HTMLInputElement).value = "3";
    (document.getElementById("remoteOnly") as HTMLInputElement).checked = preferences.remoteOnly;
  }

  private async inspectActiveBrowserTab(): Promise<void> {
    const pageStatusText = document.getElementById("pageStatusText");
    const autofillButton = document.getElementById("btnAutofillCurrent") as HTMLButtonElement | null;
    const tailorButton = document.getElementById("btnTailorResume") as HTMLButtonElement | null;

    if (typeof chrome === "undefined" || !chrome.tabs) {
      if (pageStatusText) {
        pageStatusText.textContent = "Local preview mode (Non-extension environment)";
      }
      return;
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.id || !currentTab.url) {
      if (pageStatusText) {
        pageStatusText.textContent = "No active tab detected.";
      }
      return;
    }

    this.currentActiveTabId = currentTab.id;
    const urlString = currentTab.url.toLowerCase();

    if (urlString.includes("greenhouse.io")) {
      this.currentActivePlatform = "greenhouse";
      if (pageStatusText) {
        pageStatusText.textContent = "Greenhouse job application detected!";
      }
      this.enableActionButtons(autofillButton, tailorButton);
      return;
    }

    if (urlString.includes("jobs.lever.co")) {
      this.currentActivePlatform = "lever";
      if (pageStatusText) {
        pageStatusText.textContent = "Lever job application detected!";
      }
      this.enableActionButtons(autofillButton, tailorButton);
      return;
    }

    if (pageStatusText) {
      pageStatusText.textContent = "Not on an ATS application page. Navigate to Greenhouse or Lever.";
    }
  }

  private enableActionButtons(autofillButton: HTMLButtonElement | null, tailorButton: HTMLButtonElement | null): void {
    if (autofillButton) {
      autofillButton.disabled = false;
    }
    if (tailorButton) {
      tailorButton.disabled = false;
    }
  }

  private async handleProfileSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const existingProfile = await StorageService.loadProfile();

    const skillsArray = (document.getElementById("coreSkills") as HTMLTextAreaElement).value
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    const updatedProfile: MasterProfile = {
      ...existingProfile,
      contact: {
        fullName: (document.getElementById("fullName") as HTMLInputElement).value.trim(),
        email: (document.getElementById("email") as HTMLInputElement).value.trim(),
        phone: (document.getElementById("phone") as HTMLInputElement).value.trim(),
        location: (document.getElementById("location") as HTMLInputElement).value.trim(),
        linkedInUrl: (document.getElementById("linkedInUrl") as HTMLInputElement).value.trim(),
        githubUrl: (document.getElementById("githubUrl") as HTMLInputElement).value.trim(),
        portfolioUrl: existingProfile.contact.portfolioUrl
      },
      headline: (document.getElementById("headline") as HTMLInputElement).value.trim(),
      coreSkills: skillsArray
    };

    await StorageService.saveProfile(updatedProfile);
    this.displayTemporaryNotice("Profile saved successfully!");
  }

  private async handlePreferencesSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const existingProfile = await StorageService.loadProfile();

    const titlesArray = (document.getElementById("targetTitles") as HTMLInputElement).value
      .split(",")
      .map((title) => title.trim())
      .filter((title) => title.length > 0);

    const updatedPreferences: TargetPreferences = {
      ...existingProfile.preferences,
      targetTitles: titlesArray,
      minSalaryUSD: Number((document.getElementById("minSalary") as HTMLInputElement).value) || 100000,
      remoteOnly: (document.getElementById("remoteOnly") as HTMLInputElement).checked
    };

    await StorageService.saveProfile({
      ...existingProfile,
      preferences: updatedPreferences
    });

    this.displayTemporaryNotice("Preferences updated!");
  }

  private async handleAutoSnipeToggle(enabled: boolean): Promise<void> {
    const existingProfile = await StorageService.loadProfile();
    await StorageService.saveProfile({
      ...existingProfile,
      preferences: {
        ...existingProfile.preferences,
        autoSnipeEnabled: enabled
      }
    });

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: "UPDATE_SNIPER_STATUS",
        enabled
      });
    }
  }

  private async triggerAutofill(): Promise<void> {
    if (!this.currentActiveTabId) {
      return;
    }

    if (typeof chrome !== "undefined" && chrome.tabs) {
      await chrome.tabs.sendMessage(this.currentActiveTabId, {
        action: "EXECUTE_AUTOFILL",
        platform: this.currentActivePlatform
      });
      await StorageService.incrementApplicationStats(false);
      const updatedStats = await StorageService.loadStats();
      this.renderStats(updatedStats.jobsSnipedCount, updatedStats.formsAutoFilledCount, updatedStats.hoursSavedEstimate);
    }
  }

  private async triggerResumeTailoring(): Promise<void> {
    if (!this.currentActiveTabId) {
      return;
    }

    if (typeof chrome !== "undefined" && chrome.tabs) {
      await chrome.tabs.sendMessage(this.currentActiveTabId, {
        action: "GENERATE_ATS_RESUME",
        platform: this.currentActivePlatform
      });
    }
  }

  private async renderSniperFeed(): Promise<void> {
    const feedContainer = document.getElementById("sniperFeedList");
    if (!feedContainer) {
      return;
    }

    const records = await StorageService.getSnipedJobs();
    if (records.length === 0) {
      return;
    }

    feedContainer.innerHTML = "";
    records.slice(0, 5).forEach((record) => {
      const itemElement = document.createElement("div");
      itemElement.className = "feed-item";
      itemElement.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <strong style="font-size:0.75rem;">${record.companyName}</strong>
          <span style="font-size:0.6875rem; color:var(--accent-success);">${record.atsMatchScore}% ATS</span>
        </div>
        <div style="font-size:0.6875rem; color:var(--text-secondary);">${record.jobTitle}</div>
      `;
      feedContainer.appendChild(itemElement);
    });
  }

  private displayTemporaryNotice(messageText: string): void {
    const noticeElement = document.createElement("div");
    noticeElement.textContent = messageText;
    noticeElement.style.cssText = "position:fixed; bottom:1rem; left:1rem; right:1rem; background:#10b981; color:#ffffff; padding:0.5rem; border-radius:0.375rem; text-align:center; font-weight:600; font-size:0.75rem; z-index:100;";
    document.body.appendChild(noticeElement);

    setTimeout(() => {
      noticeElement.remove();
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const controller = new PopupController();
  controller.initialize();
});
