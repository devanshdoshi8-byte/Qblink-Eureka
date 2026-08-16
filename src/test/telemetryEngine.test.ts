import { describe, it, expect } from "vitest";
import {
  calculateQueueCongestion,
  calculateFlowVelocity,
  calculateArrivalReliability,
  calculateDailyOutput,
  getBusinessCustomerNoun,
  VisitorRecord,
} from "../lib/telemetryEngine";

describe("Executive Operations Telemetry Engine (Feature 4)", () => {
  describe("getBusinessCustomerNoun", () => {
    it("adapts terminology across clinics, restaurants, salons, and civic centers", () => {
      expect(getBusinessCustomerNoun("Dr. Mehta Dental Clinic")).toEqual({
        singular: "patient",
        plural: "patients",
      });
      expect(getBusinessCustomerNoun("Artisan Grill & Cafe")).toEqual({
        singular: "guest",
        plural: "guests",
      });
      expect(getBusinessCustomerNoun("Luxe Beauty Salon")).toEqual({
        singular: "client",
        plural: "clients",
      });
      expect(getBusinessCustomerNoun("City Municipal Civic Center")).toEqual({
        singular: "citizen",
        plural: "citizens",
      });
      expect(getBusinessCustomerNoun("Generic Store")).toEqual({
        singular: "customer",
        plural: "customers",
      });
    });
  });

  describe("calculateQueueCongestion", () => {
    it("returns Normal when waiting count is 0", () => {
      const result = calculateQueueCongestion({ waitingCount: 0 });
      expect(result.level).toBe("normal");
      expect(result.label).toBe("Normal");
      expect(result.estimatedWaitMinutes).toBe(0);
    });

    it("returns Peaking when queue is moderately full (4 waiting)", () => {
      const result = calculateQueueCongestion({ waitingCount: 4, estimatedServiceMinutes: 5 });
      expect(result.level).toBe("peaking");
      expect(result.label).toBe("Peaking");
      expect(result.estimatedWaitMinutes).toBe(20);
    });

    it("returns Bottleneck Detected when queue depth is heavy (10 waiting)", () => {
      const result = calculateQueueCongestion({ waitingCount: 10, estimatedServiceMinutes: 5 });
      expect(result.level).toBe("bottleneck");
      expect(result.label).toBe("Bottleneck Detected");
      expect(result.estimatedWaitMinutes).toBe(50);
    });

    it("detects bottleneck from rapid arrival spike in last 30 minutes", () => {
      const now = Date.now();
      const recentVisitors: VisitorRecord[] = Array.from({ length: 12 }, (_, i) => ({
        id: `v-${i}`,
        token_number: i + 1,
        status: "waiting",
        joined_at: new Date(now - i * 60000).toISOString(),
        called_at: null,
        served_at: null,
      }));

      const result = calculateQueueCongestion({
        waitingCount: 5,
        estimatedServiceMinutes: 5,
        recentVisitors,
        now,
      });

      expect(result.level).toBe("bottleneck");
    });
  });

  describe("calculateFlowVelocity", () => {
    it("returns 'Not enough data' when fewer than 2 completed records exist", () => {
      const result = calculateFlowVelocity({ visitors: [] });
      expect(result.hasData).toBe(false);
      expect(result.displayValue).toBe("Not enough data");
      expect(result.averageMinutes).toBeNull();
    });

    it("calculates accurate rolling velocity when valid records exist", () => {
      const visitors: VisitorRecord[] = [
        {
          id: "1",
          token_number: 1,
          status: "served",
          joined_at: "2026-08-16T10:00:00Z",
          called_at: "2026-08-16T10:05:00Z",
          served_at: "2026-08-16T10:09:00Z", // 4 mins
        },
        {
          id: "2",
          token_number: 2,
          status: "served",
          joined_at: "2026-08-16T10:10:00Z",
          called_at: "2026-08-16T10:15:00Z",
          served_at: "2026-08-16T10:21:00Z", // 6 mins
        },
      ];

      const result = calculateFlowVelocity({ visitors, baselineMinutes: 5 });
      expect(result.hasData).toBe(true);
      expect(result.averageMinutes).toBe(5);
      expect(result.displayValue).toBe("5 min / customer");
    });
  });

  describe("calculateArrivalReliability", () => {
    it("returns 'Building baseline' when fewer than 3 called decisions exist", () => {
      const result = calculateArrivalReliability({ visitors: [] });
      expect(result.hasData).toBe(false);
      expect(result.displayValue).toBe("Building baseline");
    });

    it("calculates real on-time percentage when >= 3 decisions exist", () => {
      const visitors: VisitorRecord[] = [
        { id: "1", token_number: 1, status: "served", joined_at: "", called_at: "", served_at: "" },
        { id: "2", token_number: 2, status: "served", joined_at: "", called_at: "", served_at: "" },
        { id: "3", token_number: 3, status: "served", joined_at: "", called_at: "", served_at: "" },
        { id: "4", token_number: 4, status: "skipped", joined_at: "", called_at: "", served_at: null },
      ];

      const result = calculateArrivalReliability({ visitors });
      expect(result.hasData).toBe(true);
      expect(result.onTimePercentage).toBe(75); // 3 of 4 = 75%
      expect(result.displayValue).toBe("75% on-time");
    });
  });

  describe("calculateDailyOutput", () => {
    it("accurately counts served records for today", () => {
      const today = new Date().toISOString();
      const visitors: VisitorRecord[] = [
        { id: "1", token_number: 1, status: "served", joined_at: today, called_at: today, served_at: today },
        { id: "2", token_number: 2, status: "waiting", joined_at: today, called_at: null, served_at: null },
      ];

      const result = calculateDailyOutput({ visitors, customerNoun: "patients" });
      expect(result.servedCount).toBe(1);
      expect(result.displayValue).toBe("1 served today");
    });
  });
});
