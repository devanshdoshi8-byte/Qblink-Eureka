/**
 * Illustrative Business ROI Calculator Engine
 * 
 * Provides pure, deterministic mathematical models for estimating 
 * illustrative revenue exposure from physical queue drop-offs and walkaways.
 * 
 * GUARANTEE: Zero database mutations. Zero fabricated product metrics.
 * Every output is an explicit scenario estimation based on user inputs.
 */

export type IndustryPresetKey = "clinic" | "restaurant" | "salon" | "diagnostic" | "retail" | "custom";
export type CurrencyCode = "INR" | "USD";

export interface IndustryPreset {
  id: IndustryPresetKey;
  label: string;
  visitorTerm: string;
  valueTerm: string;
  defaultDailyVisitors: number;
  defaultAvgValue: number;
  defaultWalkawayRate: number; // percentage (e.g. 10 = 10%)
  defaultTargetRate: number; // percentage (e.g. 5 = 5%)
  defaultOperatingDays: number;
}

export const ROI_INDUSTRY_PRESETS: Record<IndustryPresetKey, IndustryPreset> = {
  clinic: {
    id: "clinic",
    label: "🏥 Clinic & OPD",
    visitorTerm: "Daily Patients",
    valueTerm: "Avg. Patient Fee / Ticket",
    defaultDailyVisitors: 80,
    defaultAvgValue: 600,
    defaultWalkawayRate: 12,
    defaultTargetRate: 6,
    defaultOperatingDays: 26,
  },
  restaurant: {
    id: "restaurant",
    label: "☕ Dining & F&B",
    visitorTerm: "Daily Dining Guests",
    valueTerm: "Avg. Bill per Guest",
    defaultDailyVisitors: 150,
    defaultAvgValue: 450,
    defaultWalkawayRate: 15,
    defaultTargetRate: 7,
    defaultOperatingDays: 28,
  },
  salon: {
    id: "salon",
    label: "💇 Salon & Spa",
    visitorTerm: "Daily Salon Visitors",
    valueTerm: "Avg. Service Value",
    defaultDailyVisitors: 45,
    defaultAvgValue: 850,
    defaultWalkawayRate: 10,
    defaultTargetRate: 4,
    defaultOperatingDays: 26,
  },
  diagnostic: {
    id: "diagnostic",
    label: "🔬 Diagnostic Lab",
    visitorTerm: "Daily Lab Patients",
    valueTerm: "Avg. Test Booking Value",
    defaultDailyVisitors: 100,
    defaultAvgValue: 1200,
    defaultWalkawayRate: 8,
    defaultTargetRate: 3,
    defaultOperatingDays: 26,
  },
  retail: {
    id: "retail",
    label: "🛍️ Retail Store",
    visitorTerm: "Daily Store Walk-ins",
    valueTerm: "Avg. Basket Transaction",
    defaultDailyVisitors: 200,
    defaultAvgValue: 350,
    defaultWalkawayRate: 14,
    defaultTargetRate: 6,
    defaultOperatingDays: 30,
  },
  custom: {
    id: "custom",
    label: "🏢 Custom Business",
    visitorTerm: "Daily Walk-in Visitors",
    valueTerm: "Avg. Customer Value",
    defaultDailyVisitors: 120,
    defaultAvgValue: 500,
    defaultWalkawayRate: 10,
    defaultTargetRate: 5,
    defaultOperatingDays: 26,
  },
};

export interface RoiCalculatorInputs {
  dailyVisitors: number;
  avgCustomerValue: number;
  currentWalkawayRate: number; // in percent (e.g. 10 for 10%)
  targetWalkawayRate: number; // in percent (e.g. 5 for 5%)
  operatingDaysPerMonth: number;
  currency: CurrencyCode;
}

export interface RoiCalculatorOutputs {
  // Baseline Exposure
  dailyLostCustomers: number;
  monthlyLostCustomers: number;
  annualLostCustomers: number;
  dailyRevenueExposure: number;
  monthlyRevenueExposure: number;
  annualRevenueExposure: number;

  // Scenario Improvement
  rateReductionPercent: number;
  monthlyCustomersRetained: number;
  annualCustomersRetained: number;
  monthlyOpportunityAddressed: number;
  annualOpportunityAddressed: number;

  // Formatting helpers
  currencySymbol: string;
}

/**
 * Validates and sanitizes raw input numbers to prevent NaN, Infinity, or negative values.
 */
export function sanitizeRoiInputs(inputs: Partial<RoiCalculatorInputs>): RoiCalculatorInputs {
  const dailyVisitors = Math.max(0, Math.min(50000, Number(inputs.dailyVisitors) || 0));
  const avgCustomerValue = Math.max(0, Math.min(1000000, Number(inputs.avgCustomerValue) || 0));
  const currentWalkawayRate = Math.max(0, Math.min(100, Number(inputs.currentWalkawayRate) || 0));
  const targetWalkawayRate = Math.max(0, Math.min(currentWalkawayRate, Number(inputs.targetWalkawayRate) || 0));
  const operatingDaysPerMonth = Math.max(1, Math.min(31, Math.round(Number(inputs.operatingDaysPerMonth) || 26)));
  const currency = inputs.currency === "USD" ? "USD" : "INR";

  return {
    dailyVisitors,
    avgCustomerValue,
    currentWalkawayRate,
    targetWalkawayRate,
    operatingDaysPerMonth,
    currency,
  };
}

/**
 * Computes illustrative revenue exposure and scenario opportunities.
 */
export function calculateBusinessRoi(rawInputs: Partial<RoiCalculatorInputs>): RoiCalculatorOutputs {
  const inputs = sanitizeRoiInputs(rawInputs);

  const rateReductionPercent = Math.max(0, Math.round((inputs.currentWalkawayRate - inputs.targetWalkawayRate) * 10) / 10);
  const currentRateDecimal = inputs.currentWalkawayRate / 100;
  const rateReductionDecimal = rateReductionPercent / 100;

  // Baseline Exposure from Assumed Walkaways
  const dailyLostCustomers = Math.round(inputs.dailyVisitors * currentRateDecimal);
  const monthlyLostCustomers = Math.round(dailyLostCustomers * inputs.operatingDaysPerMonth);
  const annualLostCustomers = Math.round(monthlyLostCustomers * 12);

  const dailyRevenueExposure = Math.round(inputs.dailyVisitors * inputs.avgCustomerValue * currentRateDecimal);
  const monthlyRevenueExposure = Math.round(dailyRevenueExposure * inputs.operatingDaysPerMonth);
  const annualRevenueExposure = Math.round(monthlyRevenueExposure * 12);

  // Scenario Improvement
  const monthlyCustomersRetained = Math.round(inputs.dailyVisitors * rateReductionDecimal * inputs.operatingDaysPerMonth);
  const annualCustomersRetained = Math.round(monthlyCustomersRetained * 12);

  const monthlyOpportunityAddressed = Math.round(inputs.dailyVisitors * inputs.avgCustomerValue * rateReductionDecimal * inputs.operatingDaysPerMonth);
  const annualOpportunityAddressed = Math.round(monthlyOpportunityAddressed * 12);

  const currencySymbol = inputs.currency === "USD" ? "$" : "₹";

  return {
    dailyLostCustomers,
    monthlyLostCustomers,
    annualLostCustomers,
    dailyRevenueExposure,
    monthlyRevenueExposure,
    annualRevenueExposure,

    rateReductionPercent,
    monthlyCustomersRetained,
    annualCustomersRetained,
    monthlyOpportunityAddressed,
    annualOpportunityAddressed,

    currencySymbol,
  };
}

/**
 * Formats currency values cleanly with localized abbreviations (e.g. ₹1.87 Lakh / $24.5K)
 */
export function formatCurrencyOutput(amount: number, currency: CurrencyCode): string {
  if (isNaN(amount) || !isFinite(amount)) return currency === "USD" ? "$0" : "₹0";

  const symbol = currency === "USD" ? "$" : "₹";
  const absAmount = Math.abs(amount);

  if (currency === "INR") {
    if (absAmount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (absAmount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(2)} Lakh`;
    }
    return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
  }

  // USD Formatting
  if (absAmount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(2)}M`;
  }
  if (absAmount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}
