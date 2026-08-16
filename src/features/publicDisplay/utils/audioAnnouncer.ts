/**
 * Web Speech API Announcer for Public Queue Display
 * 
 * Announces token arrivals with idempotency guards to prevent duplicate speech.
 */

let lastSpokenToken: string | null = null;

export interface AnnounceTokenOptions {
  tokenNumber: number | string | null;
  queueName?: string;
  counterLabel?: string | null;
  queueType?: string;
  enabled?: boolean;
}

export function announceTokenChange({
  tokenNumber,
  queueName,
  counterLabel,
  queueType = "standard",
  enabled = false,
}: AnnounceTokenOptions): void {
  if (
    !enabled ||
    !tokenNumber ||
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }

  const tokenKey = `${tokenNumber}-${counterLabel || "default"}`;
  if (lastSpokenToken === tokenKey) {
    return; // Already announced this token
  }

  lastSpokenToken = tokenKey;

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    let phrase = `Now serving, token ${tokenNumber}.`;
    if (queueType === "restaurant") {
      phrase = `Now seating, token ${tokenNumber}. ${counterLabel ? `Please proceed to ${counterLabel}.` : ""}`;
    } else if (counterLabel) {
      phrase = `Now serving, token ${tokenNumber}, at ${counterLabel}.`;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.95; // Clear, measured delivery
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Speech synthesis announcement skipped:", error);
  }
}

export function resetSpokenTokenHistory(): void {
  lastSpokenToken = null;
}
