import { describe, it, expect } from "vitest";
import {
  calculateGraceExpiry,
  getRemainingGraceSeconds,
  formatGraceCountdown,
  canRequestGrace,
} from "@/lib/arrivalGraceEngine";

describe("Arrival Grace Engine", () => {
  it("calculates expiry timestamp within bounded 1-5 minute range", () => {
    const now = 1000000;
    const expiry2Min = calculateGraceExpiry(2, now);
    expect(expiry2Min).toBe(now + 2 * 60 * 1000);

    // Bounded min 1 min
    const expiry0 = calculateGraceExpiry(0, now);
    expect(expiry0).toBe(now + 1 * 60 * 1000);

    // Bounded max 5 min
    const expiry10 = calculateGraceExpiry(10, now);
    expect(expiry10).toBe(now + 5 * 60 * 1000);
  });

  it("formats remaining countdown nicely as mm:ss", () => {
    expect(formatGraceCountdown(120)).toBe("02:00");
    expect(formatGraceCountdown(65)).toBe("01:05");
    expect(formatGraceCountdown(9)).toBe("00:09");
    expect(formatGraceCountdown(0)).toBe("00:00");
  });

  it("allows grace requests only when customer is position 1 or called", () => {
    expect(canRequestGrace({ aheadCount: 0, myStatus: "waiting" })).toBe(true);
    expect(canRequestGrace({ aheadCount: 3, myStatus: "called" })).toBe(true);
    expect(canRequestGrace({ aheadCount: 4, myStatus: "waiting" })).toBe(false);
    expect(canRequestGrace({ aheadCount: 0, myStatus: "waiting", currentGraceStatus: "active" })).toBe(false);
  });
});
