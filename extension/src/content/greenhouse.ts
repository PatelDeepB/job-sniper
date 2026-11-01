import { FormMatcher } from "../services/form_matcher.js";
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
          return true; // Keep message channel open for async response
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

    this.displayInPageSuccessBanner(fieldsFilledCount);
    return fieldsFilledCount;
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

  private static displayInPageSuccessBanner(fieldsCount: number): void {
    const banner = document.createElement("div");
    banner.textContent = `🎯 JobSniper Autopilot: Successfully filled ${fieldsCount} fields at human pace!`;
    banner.style.cssText = "position:fixed; top:1rem; right:1rem; background:#0f172a; color:#38bdf8; border:1px solid #38bdf8; padding:0.75rem 1.25rem; border-radius:0.5rem; font-family:sans-serif; font-size:0.875rem; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.5); z-index:999999;";
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 4000);
  }
}

GreenhouseAutopilot.init();
