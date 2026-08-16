import { describe, it, expect, vi, beforeEach } from "vitest";
import { announceTokenChange, resetSpokenTokenHistory } from "../features/publicDisplay/utils/audioAnnouncer";
import { publicUrl } from "../lib/publicUrl";

class MockSpeechSynthesisUtterance {
  text: string;
  rate: number = 1;
  pitch: number = 1;
  lang: string = "en-US";
  constructor(text: string) {
    this.text = text;
  }
}

describe("Public Queue Display Kiosk Mode (Feature 5)", () => {
  beforeEach(() => {
    resetSpokenTokenHistory();
    vi.restoreAllMocks();
    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  describe("Web Speech API Audio Announcer", () => {
    it("does not announce when audio is disabled", () => {
      const speakMock = vi.fn();
      (window as any).speechSynthesis = { speak: speakMock, cancel: vi.fn() };

      announceTokenChange({
        tokenNumber: 42,
        counterLabel: "Counter 1",
        enabled: false,
      });

      expect(speakMock).not.toHaveBeenCalled();
    });

    it("announces token when audio is enabled", () => {
      const speakMock = vi.fn();
      (window as any).speechSynthesis = { speak: speakMock, cancel: vi.fn() };

      announceTokenChange({
        tokenNumber: 42,
        counterLabel: "Counter 1",
        enabled: true,
      });

      expect(speakMock).toHaveBeenCalledTimes(1);
    });

    it("prevents duplicate announcements for the same token (idempotency)", () => {
      const speakMock = vi.fn();
      (window as any).speechSynthesis = { speak: speakMock, cancel: vi.fn() };

      // First call
      announceTokenChange({ tokenNumber: 42, counterLabel: "Counter 1", enabled: true });
      expect(speakMock).toHaveBeenCalledTimes(1);

      // Duplicate immediate call with same token
      announceTokenChange({ tokenNumber: 42, counterLabel: "Counter 1", enabled: true });
      expect(speakMock).toHaveBeenCalledTimes(1); // Still 1!

      // New token
      announceTokenChange({ tokenNumber: 43, counterLabel: "Counter 1", enabled: true });
      expect(speakMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Dynamic Join QR URL Generation", () => {
    it("generates correct public join URL for customers without redirection", () => {
      const queueId = "123e4567-e89b-12d3-a456-426614174000";
      const url = publicUrl(`/join/${queueId}`);

      expect(url).toContain(`/join/${queueId}`);
      expect(url).not.toContain("/dashboard");
      expect(url).not.toContain("/admin");
    });
  });
});
