import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isStaffAudioEnabled,
  setStaffAudioEnabled,
  playArrivalChime,
  playCallNextChime,
} from "../lib/audioChime";

describe("audioChime", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to enabled if not explicitly set in localStorage", () => {
    expect(isStaffAudioEnabled()).toBe(true);
  });

  it("persists muted state in localStorage", () => {
    setStaffAudioEnabled(false);
    expect(isStaffAudioEnabled()).toBe(false);
    expect(localStorage.getItem("qblink:staffAudioEnabled")).toBe("false");

    setStaffAudioEnabled(true);
    expect(isStaffAudioEnabled()).toBe(true);
    expect(localStorage.getItem("qblink:staffAudioEnabled")).toBe("true");
  });

  it("does not throw when AudioContext is invoked in node/jsdom environment", () => {
    expect(() => playArrivalChime()).not.toThrow();
    expect(() => playCallNextChime()).not.toThrow();
  });

  it("gracefully no-ops when muted", () => {
    setStaffAudioEnabled(false);
    expect(() => playArrivalChime()).not.toThrow();
    expect(() => playCallNextChime()).not.toThrow();
  });
});
