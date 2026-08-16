import { describe, it, expect } from "vitest";
import {
  calculateBusinessRoi,
  sanitizeRoiInputs,
  formatCurrencyOutput,
  ROI_INDUSTRY_PRESETS,
} from "../lib/roiCalculatorEngine";

describe("Illustrative Business ROI Calculator Engine", () => {
  it("calculates exact baseline exposure matching the specification test case", () => {
    // Specification test: 120 visitors * ₹500 * 10% * 26 days * 12 months = ₹1,872,000
    const result = calculateBusinessRoi({
      dailyVisitors: 120,
      avgCustomerValue: 500,
      currentWalkawayRate: 10,
      operatingDaysPerMonth: 26,
      currency: "INR",
    });

    expect(result.dailyRevenueExposure).toBe(6000);
    expect(result.monthlyRevenueExposure).toBe(156000);
    expect(result.annualRevenueExposure).toBe(1872000);
    expect(result.dailyLostCustomers).toBe(12); // 120 * 10%
    expect(result.monthlyLostCustomers).toBe(312); // 12 * 26
    expect(result.annualLostCustomers).toBe(3744); // 312 * 12
  });

  it("calculates scenario opportunity when reducing walkaway rate from 15% to 10%", () => {
    const result = calculateBusinessRoi({
      dailyVisitors: 120,
      avgCustomerValue: 500,
      currentWalkawayRate: 15,
      targetWalkawayRate: 10,
      operatingDaysPerMonth: 26,
      currency: "INR",
    });

    expect(result.rateReductionPercent).toBe(5);
    // 5% of 120 = 6 customers/day * 500 * 26 = ₹78,000/month
    expect(result.monthlyOpportunityAddressed).toBe(78000);
    expect(result.annualOpportunityAddressed).toBe(936000);
    expect(result.monthlyCustomersRetained).toBe(156); // 120 * 0.05 * 26
    expect(result.annualCustomersRetained).toBe(1872);
  });

  it("sanitizes empty, negative, or invalid input safely", () => {
    const sanitized = sanitizeRoiInputs({
      dailyVisitors: -50 as any,
      avgCustomerValue: undefined,
      currentWalkawayRate: 150, // exceeds 100%
      targetWalkawayRate: -5,
      operatingDaysPerMonth: 45, // exceeds 31 days
    });

    expect(sanitized.dailyVisitors).toBe(0);
    expect(sanitized.avgCustomerValue).toBe(0);
    expect(sanitized.currentWalkawayRate).toBe(100);
    expect(sanitized.targetWalkawayRate).toBe(0);
    expect(sanitized.operatingDaysPerMonth).toBe(31);
  });

  it("formats currency values cleanly in INR and USD", () => {
    expect(formatCurrencyOutput(1872000, "INR")).toBe("₹18.72 Lakh");
    expect(formatCurrencyOutput(12000000, "INR")).toBe("₹1.20 Cr");
    expect(formatCurrencyOutput(45000, "INR")).toBe("₹45,000");

    expect(formatCurrencyOutput(250000, "USD")).toBe("$250.0k");
    expect(formatCurrencyOutput(1500000, "USD")).toBe("$1.50M");
    expect(formatCurrencyOutput(500, "USD")).toBe("$500");
  });

  it("loads industry presets with correct terminology", () => {
    const clinic = ROI_INDUSTRY_PRESETS.clinic;
    expect(clinic.visitorTerm).toBe("Daily Patients");
    expect(clinic.defaultWalkawayRate).toBe(12);

    const restaurant = ROI_INDUSTRY_PRESETS.restaurant;
    expect(restaurant.visitorTerm).toBe("Daily Dining Guests");
    expect(restaurant.defaultWalkawayRate).toBe(15);
  });
});
