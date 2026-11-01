/**
 * Form Matching and Human Simulation Engine for ATS Applications.
 */

export class FormMatcher {
  public static async simulateHumanTyping(
    inputElement: HTMLInputElement | HTMLTextAreaElement,
    textToType: string
  ): Promise<void> {
    inputElement.focus();
    inputElement.value = "";

    // Chunk typing simulation to be fast yet natural for event listeners
    const chunks = this.createTypingChunks(textToType);
    for (const chunk of chunks) {
      inputElement.value += chunk;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await this.sleep(15 + Math.floor(Math.random() * 25));
    }

    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    inputElement.blur();
  }

  public static async selectDropdownOption(
    selectElement: HTMLSelectElement,
    targetValueKeywords: readonly string[]
  ): Promise<boolean> {
    const options = Array.from(selectElement.options);
    for (const keyword of targetValueKeywords) {
      const matchedOption = options.find((opt) =>
        opt.text.toLowerCase().includes(keyword.toLowerCase()) ||
        opt.value.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matchedOption) {
        selectElement.value = matchedOption.value;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  public static findFieldByFuzzyKeywords(
    formElement: HTMLElement,
    keywords: readonly string[]
  ): HTMLInputElement | HTMLTextAreaElement | null {
    const inputs = Array.from(formElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input:not([type='hidden']):not([type='submit']), textarea"
    ));

    for (const input of inputs) {
      const identifier = `${input.name} ${input.id} ${input.placeholder} ${input.getAttribute("aria-label") || ""}`.toLowerCase();
      const hasMatch = keywords.some((kw) => identifier.includes(kw.toLowerCase()));
      if (hasMatch) {
        return input;
      }

      const associatedLabel = this.findAssociatedLabel(input);
      if (associatedLabel && keywords.some((kw) => associatedLabel.toLowerCase().includes(kw.toLowerCase()))) {
        return input;
      }
    }

    return null;
  }

  private static findAssociatedLabel(inputElement: HTMLElement): string | null {
    if (inputElement.id) {
      const label = document.querySelector<HTMLLabelElement>(`label[for='${inputElement.id}']`);
      if (label && label.textContent) {
        return label.textContent.trim();
      }
    }

    const parentLabel = inputElement.closest("label");
    if (parentLabel && parentLabel.textContent) {
      return parentLabel.textContent.trim();
    }

    return null;
  }

  private static createTypingChunks(text: string): readonly string[] {
    const chunks: string[] = [];
    let index = 0;
    while (index < text.length) {
      const chunkSize = Math.min(text.length - index, Math.floor(Math.random() * 3) + 1);
      chunks.push(text.slice(index, index + chunkSize));
      index += chunkSize;
    }
    return chunks;
  }

  private static sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
