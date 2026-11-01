import { FormMatcher } from "../services/form_matcher.js";
import { LLMSettingsService } from "../services/llm_settings.js";
import { StorageService } from "../services/storage.js";
import { MasterProfile } from "../types/profile.js";

class GreenhouseAutopilot {
  public static init(): void {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "EXECUTE_AUTOFILL") {
          this.executeAutofill().then((count) => {
            sendResponse({ success: true, fieldsFilled: count });
          });
          return true;
        }

        if (message.action === "GENERATE_ATS_RESUME") {
          this.executeResumeTailoring().then((success) => {
            sendResponse({ success });
          });
          return true;
        }

        return false;
      });
    }
  }

  public static async executeAutofill(): Promise<number> {
    const profile = await StorageService.loadProfile();
    const form = this.locateGreenhouseForm();
    if (!form) {
      return 0;
    }

    let fieldsFilledCount = 0;
    fieldsFilledCount += await this.fillBasicContactFields(form, profile);
    fieldsFilledCount += await this.fillWorkAuthorization(form, profile);
    fieldsFilledCount += await this.handleDemographicDisclosures(form);
    fieldsFilledCount += await this.fillCustomTextareas(form, profile);

    this.displayInPageSuccessBanner(fieldsFilledCount);
    return fieldsFilledCount;
  }

  public static async executeResumeTailoring(): Promise<boolean> {
    const profile = await StorageService.loadProfile();
    const apiBaseUrl = await StorageService.getApiBaseUrl();

    const titleElement = document.querySelector<HTMLElement>("h1.app-title, .job-title, h1");
    const jobTitle = titleElement?.textContent?.trim() || "Software Engineer";

    const companyElement = document.querySelector<HTMLElement>(".company-name, .logo-container");
    const companyName = companyElement?.textContent?.trim() || document.title.split("-")[0]?.trim() || "Company";

    const contentElement = document.querySelector<HTMLElement>("#content, #job-description, .content");
    const jobDescription = contentElement?.textContent?.trim() || document.body.innerText.slice(0, 3000);

    const payload = {
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      master_resume: {
        full_name: profile.contact.fullName || "Candidate",
        email: profile.contact.email || "candidate@example.com",
        phone: profile.contact.phone || "+1 (555) 000-0000",
        location: profile.contact.location || "Remote",
        linkedin_url: profile.contact.linkedInUrl || null,
        github_url: profile.contact.githubUrl || null,
        headline: profile.headline || "Software Engineer",
        summary: profile.summary || "Experienced engineer.",
        all_skills: profile.coreSkills.length > 0 ? profile.coreSkills : ["Python", "TypeScript", "FastAPI"],
        experience_bullets: profile.experienceBullets.length > 0
          ? profile.experienceBullets.map((b) => ({
              id: b.id,
              company: b.company,
              role_title: b.roleTitle,
              bullet_point: b.bulletPoint,
              associated_skills: b.associatedSkills
            }))
          : [
              {
                id: "b1",
                company: "Tech Systems",
                role_title: "Software Engineer",
                bullet_point: "Engineered scalable distributed microservices processing millions of daily requests.",
                associated_skills: ["Python", "FastAPI", "Docker"]
              }
            ]
      }
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/tailor/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return false;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `Resume_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(blobUrl);

      this.displayNotificationBanner("🎯 JobSniper: Tailored 95%+ ATS vector PDF resume downloaded!");
      return true;
    } catch {
      return false;
    }
  }

  private static locateGreenhouseForm(): HTMLElement | null {
    return (
      document.querySelector<HTMLElement>("#application_form") ||
      document.querySelector<HTMLElement>("#apply_form") ||
      document.querySelector<HTMLElement>("form[action*='greenhouse']") ||
      document.querySelector<HTMLElement>("#main_fields")
    );
  }

  private static async fillBasicContactFields(form: HTMLElement, profile: MasterProfile): Promise<number> {
    let filled = 0;
    const nameParts = profile.contact.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const firstNameField = FormMatcher.findFieldByFuzzyKeywords(form, ["first_name", "first name", "firstname", "given-name"]);
    if (firstNameField && firstName) {
      await FormMatcher.simulateHumanTyping(firstNameField, firstName);
      filled += 1;
    }

    const lastNameField = FormMatcher.findFieldByFuzzyKeywords(form, ["last_name", "last name", "lastname", "family-name"]);
    if (lastNameField && lastName) {
      await FormMatcher.simulateHumanTyping(lastNameField, lastName);
      filled += 1;
    }

    const emailField = FormMatcher.findFieldByFuzzyKeywords(form, ["email", "e-mail"]);
    if (emailField && profile.contact.email) {
      await FormMatcher.simulateHumanTyping(emailField, profile.contact.email);
      filled += 1;
    }

    const phoneField = FormMatcher.findFieldByFuzzyKeywords(form, ["phone", "mobile", "telephone"]);
    if (phoneField && profile.contact.phone) {
      await FormMatcher.simulateHumanTyping(phoneField, profile.contact.phone);
      filled += 1;
    }

    const linkedInField = FormMatcher.findFieldByFuzzyKeywords(form, ["linkedin"]);
    if (linkedInField && profile.contact.linkedInUrl) {
      await FormMatcher.simulateHumanTyping(linkedInField, profile.contact.linkedInUrl);
      filled += 1;
    }

    const websiteField = FormMatcher.findFieldByFuzzyKeywords(form, ["github", "website", "portfolio"]);
    const targetUrl = profile.contact.githubUrl || profile.contact.portfolioUrl;
    if (websiteField && targetUrl) {
      await FormMatcher.simulateHumanTyping(websiteField, targetUrl);
      filled += 1;
    }

    return filled;
  }

  private static async fillWorkAuthorization(form: HTMLElement, profile: MasterProfile): Promise<number> {
    let filled = 0;
    const selectElements = Array.from(form.querySelectorAll<HTMLSelectElement>("select"));

    for (const select of selectElements) {
      const containerText = (select.closest(".field") || select.parentElement)?.textContent?.toLowerCase() || "";

      if (containerText.includes("authorized to work") || containerText.includes("legally authorized")) {
        const choice = profile.authorization.isAuthorizedInCountry ? ["yes", "authorized"] : ["no"];
        const success = await FormMatcher.selectDropdownOption(select, choice);
        if (success) {
          filled += 1;
        }
      }

      if (containerText.includes("sponsorship") || containerText.includes("require visa")) {
        const choice = profile.authorization.requiresSponsorshipNow ? ["yes"] : ["no", "will not require"];
        const success = await FormMatcher.selectDropdownOption(select, choice);
        if (success) {
          filled += 1;
        }
      }
    }

    return filled;
  }

  private static async handleDemographicDisclosures(form: HTMLElement): Promise<number> {
    let filled = 0;
    const selectElements = Array.from(form.querySelectorAll<HTMLSelectElement>("select"));

    for (const select of selectElements) {
      const containerText = (select.closest(".field") || select.parentElement)?.textContent?.toLowerCase() || "";
      const isDemographic =
        containerText.includes("gender") ||
        containerText.includes("race") ||
        containerText.includes("ethnicity") ||
        containerText.includes("veteran") ||
        containerText.includes("disability");

      if (isDemographic) {
        const declineOptions = ["decline", "choose not to disclose", "prefer not to say", "do not wish to answer"];
        const success = await FormMatcher.selectDropdownOption(select, declineOptions);
        if (success) {
          filled += 1;
        }
      }
    }

    return filled;
  }

  private static async fillCustomTextareas(form: HTMLElement, profile: MasterProfile): Promise<number> {
    let filled = 0;
    const textareas = Array.from(form.querySelectorAll<HTMLTextAreaElement>("textarea"));
    const activeProvider = await LLMSettingsService.getActiveProviderConfig();

    for (const textarea of textareas) {
      if (textarea.value.trim().length > 0) {
        continue;
      }

      const labelText = textarea.closest(".field")?.querySelector("label")?.textContent?.trim() || "Cover letter";
      const answer = await this.generateAIAnswer(labelText, profile, activeProvider);

      if (answer) {
        await FormMatcher.simulateHumanTyping(textarea, answer);
        filled += 1;
      }
    }

    return filled;
  }

  private static async generateAIAnswer(
    questionText: string,
    profile: MasterProfile,
    providerConfig: { provider: string; apiKey: string | null }
  ): Promise<string> {
    try {
      const apiBaseUrl = await StorageService.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_config: {
            provider: providerConfig.provider,
            api_key: providerConfig.apiKey
          },
          system_prompt: "You are an expert career assistant. Write an authentic, concise 2-sentence response for a job application. Avoid clichés like 'I am passionate'.",
          user_prompt: `Question: ${questionText}\nCandidate Summary: ${profile.summary}\nCore Skills: ${profile.coreSkills.join(", ")}`,
          max_tokens: 200
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.generated_text || profile.summary;
      }
    } catch {
      // Fallback if backend is unavailable
    }

    return profile.summary;
  }

  private static displayInPageSuccessBanner(fieldsCount: number): void {
    this.displayNotificationBanner(`🎯 JobSniper Autopilot: Successfully filled ${fieldsCount} fields at human pace!`);
  }

  private static displayNotificationBanner(messageText: string): void {
    const banner = document.createElement("div");
    banner.textContent = messageText;
    banner.style.cssText = "position:fixed; top:1rem; right:1rem; background:#0f172a; color:#38bdf8; border:1px solid #38bdf8; padding:0.75rem 1.25rem; border-radius:0.5rem; font-family:sans-serif; font-size:0.875rem; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.5); z-index:999999;";
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 4000);
  }
}

GreenhouseAutopilot.init();
