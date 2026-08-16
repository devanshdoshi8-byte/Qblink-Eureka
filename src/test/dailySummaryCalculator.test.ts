import { describe, it, expect } from "vitest";
import {
  computeDailyPerformanceSummary,
  VisitorHistoryRecord,
} from "@/lib/dailySummaryCalculator";

describe("Daily Business Performance Summary", () => {
  it("calculates accurate summary stats from realistic visitor records", () => {
    const records: VisitorHistoryRecord[] = [
      {
        id: "v-1",
        token_number: 1,
        status: "served",
        joined_at: "2026-08-15T09:00:00.000Z",
        called_at: "2026-08-15T09:10:00.000Z", // 10 min wait
        served_at: "2026-08-15T09:15:00.000Z", // 5 min service
      },
      {
        id: "v-2",
        token_number: 2,
        status: "served",
        joined_at: "2026-08-15T09:05:00.000Z",
        called_at: "2026-08-15T09:15:00.000Z", // 10 min wait
        served_at: "2026-08-15T09:22:00.000Z", // 7 min service
      },
      {
        id: "v-3",
        token_number: 3,
        status: "skipped",
        joined_at: "2026-08-15T09:10:00.000Z",
        called_at: "2026-08-15T09:25:00.000Z",
        served_at: null,
      },
    ];

    const summary = computeDailyPerformanceSummary({
      businessId: "biz-1",
      businessName: "Glow Salon",
      visitors: records,
    });

    expect(summary.totalJoined.value).toBe(3);
    expect(summary.totalServed.value).toBe(2);
    expect(summary.totalNoShow.value).toBe(1);
    expect(summary.avgWaitMinutes.value).toBe(10);
    expect(summary.avgServiceMinutes.value).toBe(6);
    expect(summary.noShowRatePct.value).toBe(33);
    expect(summary.peakHour.hasData).toBe(true);
  });

  it("handles empty queues honestly without fabricating fake data", () => {
    const summary = computeDailyPerformanceSummary({
      businessId: "biz-empty",
      businessName: "New Clinic",
      visitors: [],
    });

    expect(summary.totalJoined.value).toBe(0);
    expect(summary.totalServed.value).toBe(0);
    expect(summary.avgWaitMinutes.hasData).toBe(false);
    expect(summary.avgServiceMinutes.hasData).toBe(false);
    expect(summary.peakHour.hasData).toBe(false);
  });
});
