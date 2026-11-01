import { FormMatcher } from "../services/form_matcher.js";
import { StorageService } from "../services/storage.js";
import { MasterProfile } from "../types/profile.js";

class LeverAutopilot {
  public static init(): void {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "EXECUTE_AUTOFILL") {
          this.executeAutofill().then((count) => {
            sendResponse({ success: true, fieldsFilled: count });
          });
          return true;
        }
        return false;
      });
    }
  }

  public static async executeAutofill(): Promise<number> {
    const profile = await StorageService.loadProfile();
    const form = this.locateLeverForm();
    if (!form) {
      return 0;
    }

    let fieldsFilledCount = 0;
    fieldsFilledCount += await this.fillStandardFields(form, profile);
    fieldsFilledCount += await this.fillCustomQuestions(form, profile);

    this.displayInPageSuccessBanner(fieldsFilledCount);
    return fieldsFilledCount;
  }

  private static locateLeverForm(): HTMLElement | null {
    return (
      document.querySelector<HTMLElement>("form.application-form") ||
      document.querySelector<HTMLElement>("form[action*='lever.co']") ||
      document.querySelector<HTMLElement>(".application-form")
    );
  }

  private static async fillStandardFields(form: HTMLElement, profile: MasterProfile): Promise<number> {
    let filled = 0;

    const nameInput = form.querySelector<HTMLInputElement>("input[name='name']");
    if (nameInput && profile.contact.fullName) {
      await FormMatcher.simulateHumanTyping(nameInput, profile.contact.fullName);
      filled += 1;
    }

    const emailInput = form.querySelector<HTMLInputElement>("input[name='email']");
    if (emailInput && profile.contact.email) {
      await FormMatcher.simulateHumanTyping(emailInput, profile.contact.email);
      filled += 1;
    }

    const phoneInput = form.querySelector<HTMLInputElement>("input[name='phone']");
    if (phoneInput && profile.contact.phone) {
      await FormMatcher.simulateHumanTyping(phoneInput, profile.contact.phone);
      filled += 1;
    }

    const orgInput = form.querySelector<HTMLInputElement>("input[name='org']");
    if (orgInput && profile.headline) {
      await FormMatcher.simulateHumanTyping(orgInput, profile.headline);
      filled += 1;
    }

    const linkedInInput = form.querySelector<HTMLInputElement>("input[name='urls[LinkedIn]']");
    if (linkedInInput && profile.contact.linkedInUrl) {
      await FormMatcher.simulateHumanTyping(linkedInInput, profile.contact.linkedInUrl);
      filled += 1;
    }

    const gitHubInput = form.querySelector<HTMLInputElement>("input[name='urls[GitHub]']");
    if (gitHubInput && profile.contact.githubUrl) {
      await FormMatcher.simulateHumanTyping(gitHubInput, profile.contact.githubUrl);
      filled += 1;
    }

    const otherUrlInput = form.querySelector<HTMLInputElement>("input[name='urls[Portfolio]'], input[name='urls[Other]']");
    if (otherUrlInput && profile.contact.portfolioUrl) {
      await FormMatcher.simulateHumanTyping(otherUrlInput, profile.contact.portfolioUrl);
      filled += 1;
    }

    return filled;
  }

  private static async fillCustomQuestions(form: HTMLElement, profile: MasterProfile): Promise<number> {
    let filled = 0;
    const selectElements = Array.from(form.querySelectorAll<HTMLSelectElement>("select"));

    for (const select of selectElements) {
      const containerText = select.closest(".application-question")?.textContent?.toLowerCase() || "";

      if (containerText.includes("authorized to work") || containerText.includes("legally authorized")) {
        const choice = profile.authorization.isAuthorizedInCountry ? ["yes"] : ["no"];
        const success = await FormMatcher.selectDropdownOption(select, choice);
        if (success) {
          filled += 1;
        }
      }

      if (containerText.includes("sponsorship")) {
        const choice = profile.authorization.requiresSponsorshipNow ? ["yes"] : ["no"];
        const success = await FormMatcher.selectDropdownOption(select, choice);
        if (success) {
          filled += 1;
        }
      }

      const isDemographic = containerText.includes("gender") || containerText.includes("race") || containerText.includes("veteran");
      if (isDemographic) {
        const declineOptions = ["decline", "prefer not to say", "choose not to disclose"];
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
    banner.textContent = `🎯 JobSniper Lever Autopilot: Filled ${fieldsCount} fields at human pace!`;
    banner.style.cssText = "position:fixed; top:1rem; right:1rem; background:#0f172a; color:#38bdf8; border:1px solid #38bdf8; padding:0.75rem 1.25rem; border-radius:0.5rem; font-family:sans-serif; font-size:0.875rem; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.5); z-index:999999;";
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 4000);
  }
}

LeverAutopilot.init();
