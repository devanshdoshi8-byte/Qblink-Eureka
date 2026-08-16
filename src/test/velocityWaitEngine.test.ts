import { describe, it, expect } from "vitest";
import {
  calculateRollingVelocityWait,
  extractServiceDuration,
  CompletedServiceSample,
} from "@/lib/velocityWaitEngine";

describe("Rolling Service Velocity Engine", () => {
  it("returns 0 wait when ahead count is 0", () => {
    const result = calculateRollingVelocityWait({
      aheadCount: 0,
      historicalServiceTime: 6,
    });
    expect(result.estimatedMinutes).toBe(0);
    expect(result.confidenceScore).toBe(100);
  });

  it("falls back to baseline when no recent samples exist", () => {
    const result = calculateRollingVelocityWait({
      aheadCount: 3,
      historicalServiceTime: 5,
      recentCompletedSamples: [],
    });
    expect(result.estimatedMinutes).toBe(15);
    expect(result.baselineWaitMinutes).toBe(15);
    expect(result.sampleCount).toBe(0);
  });

  it("adapts dynamically when recent counter velocity is faster than historical baseline", () => {
    // Historical is 10 min, but staff is moving rapidly at 4-5 min per person
    const now = Date.now();
    const samples: CompletedServiceSample[] = [
      { joinedAt: now - 30 * 60000, calledAt: now - 25 * 60000, servedAt: now - 20 * 60000 }, // 5 min
      { joinedAt: now - 20 * 60000, calledAt: now - 15 * 60000, servedAt: now - 11 * 60000 }, // 4 min
      { joinedAt: now - 11 * 60000, calledAt: now - 7 * 60000, servedAt: now - 3 * 60000 },   // 4 min
      { joinedAt: now - 7 * 60000, calledAt: now - 5 * 60000, servedAt: now - 1 * 60000 },    // 4 min
    ];

    const result = calculateRollingVelocityWait({
      aheadCount: 4,
      historicalServiceTime: 10,
      recentCompletedSamples: samples,
    });

    // Static baseline would be 4 * 10 = 40 min
    // Rolling velocity should pull wait down significantly (< 30 min)
    expect(result.estimatedMinutes).toBeLessThan(result.baselineWaitMinutes);
    expect(result.effectiveVelocity).toBeLessThan(10);
    expect(result.sampleCount).toBe(4);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70);
  });

  it("rejects extreme outliers from distorting wait time", () => {
    const now = Date.now();
    // Baseline is 5 min. One customer had an abnormal 90 min visit (e.g. system glitch or forgot to click serve)
    const samples: CompletedServiceSample[] = [
      { joinedAt: now - 120 * 60000, calledAt: now - 100 * 60000, servedAt: now - 10 * 60000 }, // 90 min outlier!
      { joinedAt: now - 15 * 60000, calledAt: now - 10 * 60000, servedAt: now - 5 * 60000 },   // 5 min normal
      { joinedAt: now - 10 * 60000, calledAt: now - 5 * 60000, servedAt: now - 1 * 60000 },    // 4 min normal
    ];

    const result = calculateRollingVelocityWait({
      aheadCount: 2,
      historicalServiceTime: 5,
      recentCompletedSamples: samples,
    });

    expect(result.outliersExcluded).toBe(1);
    expect(result.sampleCount).toBe(2);
    expect(result.estimatedMinutes).toBeLessThan(15); // Outlier did not blow up the estimate
  });

  it("extracts service duration correctly from ISO strings and numbers", () => {
    const sample: CompletedServiceSample = {
      joinedAt: "2026-08-15T10:00:00.000Z",
      calledAt: "2026-08-15T10:10:00.000Z",
      servedAt: "2026-08-15T10:16:30.000Z", // 6.5 mins
    };
    const dur = extractServiceDuration(sample);
    expect(dur).toBeCloseTo(6.5, 1);
  });
});
