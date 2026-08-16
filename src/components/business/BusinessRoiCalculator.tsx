import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  TrendingDown,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  Info,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  IndustryPresetKey,
  CurrencyCode,
  ROI_INDUSTRY_PRESETS,
  calculateBusinessRoi,
  formatCurrencyOutput,
  RoiCalculatorInputs,
} from "@/lib/roiCalculatorEngine";
import { hapticCopy, hapticSuccess } from "@/lib/haptics";
import { toast } from "sonner";

interface BusinessRoiCalculatorProps {
  initialIndustry?: IndustryPresetKey;
  className?: string;
}

export const BusinessRoiCalculator: React.FC<BusinessRoiCalculatorProps> = ({
  initialIndustry = "clinic",
  className = "",
}) => {
  const [industry, setIndustry] = useState<IndustryPresetKey>(initialIndustry);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  const preset = ROI_INDUSTRY_PRESETS[industry];

  const [dailyVisitors, setDailyVisitors] = useState<number>(preset.defaultDailyVisitors);
  const [avgCustomerValue, setAvgCustomerValue] = useState<number>(preset.defaultAvgValue);
  const [currentWalkawayRate, setCurrentWalkawayRate] = useState<number>(preset.defaultWalkawayRate);
  const [targetWalkawayRate, setTargetWalkawayRate] = useState<number>(preset.defaultTargetRate);
  const [operatingDays, setOperatingDays] = useState<number>(preset.defaultOperatingDays);
  const [showFormula, setShowFormula] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleIndustryChange = (newKey: IndustryPresetKey) => {
    setIndustry(newKey);
    const p = ROI_INDUSTRY_PRESETS[newKey];
    setDailyVisitors(p.defaultDailyVisitors);
    setAvgCustomerValue(p.defaultAvgValue);
    setCurrentWalkawayRate(p.defaultWalkawayRate);
    setTargetWalkawayRate(p.defaultTargetRate);
    setOperatingDays(p.defaultOperatingDays);
  };

  const handleReset = () => {
    const p = ROI_INDUSTRY_PRESETS[industry];
    setDailyVisitors(p.defaultDailyVisitors);
    setAvgCustomerValue(p.defaultAvgValue);
    setCurrentWalkawayRate(p.defaultWalkawayRate);
    setTargetWalkawayRate(p.defaultTargetRate);
    setOperatingDays(p.defaultOperatingDays);
    toast.success("Assumptions reset to industry defaults");
  };

  const outputs = calculateBusinessRoi({
    dailyVisitors,
    avgCustomerValue,
    currentWalkawayRate,
    targetWalkawayRate,
    operatingDaysPerMonth: operatingDays,
    currency,
  });

  const handleCopySummary = () => {
    const summaryText = `[Qblink Illustrative ROI Scenario]
Industry: ${preset.label}
Daily ${preset.visitorTerm}: ${dailyVisitors}
Avg. Ticket: ${currency === "USD" ? "$" : "₹"}${avgCustomerValue}
Assumed Walkaway Rate: ${currentWalkawayRate}%
Operating Days: ${operatingDays} days/mo
---
Illustrative Annual Revenue Exposure: ${formatCurrencyOutput(outputs.annualRevenueExposure, currency)}
Illustrative Monthly Revenue Exposure: ${formatCurrencyOutput(outputs.monthlyRevenueExposure, currency)}
Estimated Monthly Lost ${preset.visitorTerm}: ${outputs.monthlyLostCustomers}
---
Scenario Target (${targetWalkawayRate}% Walkaway):
Potential Annual Opportunity Addressed: ${formatCurrencyOutput(outputs.annualOpportunityAddressed, currency)}
Potential Monthly Retained ${preset.visitorTerm}: ${outputs.monthlyCustomersRetained}
(Note: Scenario estimate based on user assumptions. Not a measured Qblink result.)`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    hapticCopy();
    toast.success("Scenario summary copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section id="roi-calculator" className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Container Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 card-shadow overflow-hidden">
        {/* Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Economic Scenario Estimator</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How Much Is Waiting Costing Your Business?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Waiting creates an opportunity cost when walk-in customers leave before being served.
            Adjust the assumptions below to estimate the potential value of improving customer flow.
          </p>
        </div>

        {/* Industry & Currency Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-border/60">
          {/* Industry Preset Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {(Object.keys(ROI_INDUSTRY_PRESETS) as IndustryPresetKey[]).map((key) => {
              const item = ROI_INDUSTRY_PRESETS[key];
              const isSelected = industry === key;
              return (
                <button
                  key={key}
                  onClick={() => handleIndustryChange(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs text-muted-foreground font-semibold">Currency:</span>
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
              {(["INR", "USD"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currency === curr ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {curr === "INR" ? "₹ INR" : "$ USD"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid: Inputs (Left) vs Outputs (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Assumption Controls (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                1. Your Business Assumptions
              </h3>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
            </div>

            {/* Input 1: Daily Visitors */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="daily-visitors-input" className="text-foreground">{preset.visitorTerm}</label>
                <div className="flex items-center gap-1">
                  <input
                    id="daily-visitors-input"
                    type="number"
                    min="1"
                    max="5000"
                    value={dailyVisitors || ""}
                    onChange={(e) => setDailyVisitors(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-2.5 py-1 text-right font-mono font-bold text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-muted-foreground text-xs">/ day</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                aria-label={preset.visitorTerm}
                value={dailyVisitors}
                onChange={(e) => setDailyVisitors(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10</span>
                <span>250</span>
                <span>500+</span>
              </div>
            </div>

            {/* Input 2: Average Customer Value */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="avg-value-input" className="text-foreground">{preset.valueTerm}</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground font-mono">{outputs.currencySymbol}</span>
                  <input
                    id="avg-value-input"
                    type="number"
                    min="1"
                    max="50000"
                    value={avgCustomerValue || ""}
                    onChange={(e) => setAvgCustomerValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-2.5 py-1 text-right font-mono font-bold text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                aria-label={preset.valueTerm}
                value={avgCustomerValue}
                onChange={(e) => setAvgCustomerValue(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{outputs.currencySymbol}50</span>
                <span>{outputs.currencySymbol}1,500</span>
                <span>{outputs.currencySymbol}3,000+</span>
              </div>
            </div>

            {/* Input 3: Assumed Walkaway Rate Slider */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="walkaway-slider" className="text-foreground">Estimated Queue Walkaway Rate</label>
                <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {currentWalkawayRate}%
                </span>
              </div>
              <input
                id="walkaway-slider"
                type="range"
                min="1"
                max="35"
                step="1"
                aria-label="Estimated Queue Walkaway Rate"
                value={currentWalkawayRate}
                onChange={(e) => setCurrentWalkawayRate(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">
                Estimated % of customers who walk away or abandon when seeing a congested physical queue.
              </p>
            </div>

            {/* Input 4: Target Scenario Walkaway Rate */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="target-slider" className="text-foreground">Scenario Target Walkaway Rate</label>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {targetWalkawayRate}%
                </span>
              </div>
              <input
                id="target-slider"
                type="range"
                min="0"
                max={Math.max(1, currentWalkawayRate)}
                step="1"
                aria-label="Scenario Target Walkaway Rate"
                value={targetWalkawayRate}
                onChange={(e) => setTargetWalkawayRate(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">
                Target walkaway rate under an improved digital flow scenario (Reduction: -{outputs.rateReductionPercent}%).
              </p>
            </div>

            {/* Input 5: Operating Days */}
            <div className="flex items-center justify-between text-xs font-semibold px-1">
              <label htmlFor="operating-days-select" className="text-muted-foreground">Operating Days per Month</label>
              <select
                id="operating-days-select"
                aria-label="Operating Days per Month"
                value={operatingDays}
                onChange={(e) => setOperatingDays(parseInt(e.target.value))}
                className="px-3 py-1 rounded-lg bg-muted/60 border border-border text-foreground font-mono font-bold text-xs"
              >
                <option value={22}>22 days (Mon–Fri)</option>
                <option value={26}>26 days (6 days/wk)</option>
                <option value={28}>28 days</option>
                <option value={30}>30 days (Full month)</option>
              </select>
            </div>
          </div>

          {/* Right Column: Illustrative Scenario Outputs (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              2. Illustrative Scenario Results
            </h3>

            {/* Hero Output Card: Assumed Revenue Exposure */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-primary/30 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Illustrative Annual Revenue Exposure
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    Assumed Cost
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Estimated revenue tied to the assumed {currentWalkawayRate}% walkaway rate
                </p>

                <div className="my-2">
                  <motion.span
                    key={outputs.annualRevenueExposure}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-mono font-black text-3xl sm:text-5xl text-white tracking-tight block"
                  >
                    {formatCurrencyOutput(outputs.annualRevenueExposure, currency)}
                  </motion.span>
                  <span className="text-xs text-slate-400 mt-1 block">per year (based on your inputs)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-5 mt-5 border-t border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Monthly Exposure</span>
                  <span className="font-mono font-bold text-lg text-white">
                    {formatCurrencyOutput(outputs.monthlyRevenueExposure, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Monthly Lost {preset.visitorTerm}</span>
                  <span className="font-mono font-bold text-lg text-white">
                    ~{outputs.monthlyLostCustomers} guests
                  </span>
                </div>
              </div>
            </div>

            {/* Target Scenario Opportunity Box */}
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-foreground space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Scenario Improvement ({currentWalkawayRate}% → {targetWalkawayRate}%)
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  -{outputs.rateReductionPercent}% Walkaway
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Potential Annual Opportunity</span>
                  <span className="font-mono font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyOutput(outputs.annualOpportunityAddressed, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Potential Retained Guests</span>
                  <span className="font-mono font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                    +{outputs.monthlyCustomersRetained} / mo
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Illustrative opportunity if queue visibility helps retain {outputs.rateReductionPercent}% more walk-in guests.
              </p>
            </div>

            {/* Explicit Disclaimer Callout */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Illustrative Scenario Only:</strong> This calculator converts user-entered assumptions into mathematical projections. It does not represent measured Qblink commercial results, guaranteed revenue recovery, or past pilot metrics.
              </p>
            </div>

            {/* Actions: Copy Summary & CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleCopySummary}
                className="flex-1 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Scenario Summary" : "Copy Scenario Digest"}</span>
              </button>

              <Link
                to="/auth"
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all text-center"
              >
                <span>Start Free Pilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Expandable "How Is This Calculated?" Disclosure */}
        <div className="mt-10 pt-6 border-t border-border/60">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary" />
              How is this calculated? View mathematical formula
            </span>
            {showFormula ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showFormula && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-xs text-muted-foreground space-y-3 pt-4"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 font-mono text-[11px] space-y-2">
                  <p className="text-foreground font-bold">1. Daily Revenue Exposure:</p>
                  <p className="pl-4 text-primary">
                    = Daily {preset.visitorTerm} ({dailyVisitors}) × Avg. Ticket ({outputs.currencySymbol}{avgCustomerValue}) × Assumed Walkaway ({currentWalkawayRate}%)
                    <br />
                    = {outputs.currencySymbol}{(dailyVisitors * avgCustomerValue * (currentWalkawayRate / 100)).toLocaleString()} / day
                  </p>

                  <p className="text-foreground font-bold pt-1">2. Annual Revenue Exposure:</p>
                  <p className="pl-4 text-primary">
                    = Daily Exposure ({outputs.currencySymbol}{(dailyVisitors * avgCustomerValue * (currentWalkawayRate / 100)).toLocaleString()}) × Operating Days ({operatingDays}) × 12 months
                    <br />
                    = {outputs.currencySymbol}{outputs.annualRevenueExposure.toLocaleString()} / year
                  </p>

                  <p className="text-foreground font-bold pt-1">3. Scenario Opportunity Addressed ({currentWalkawayRate}% → {targetWalkawayRate}%):</p>
                  <p className="pl-4 text-emerald-600 dark:text-emerald-400">
                    = Daily {preset.visitorTerm} ({dailyVisitors}) × Avg. Ticket ({outputs.currencySymbol}{avgCustomerValue}) × Rate Reduction ({outputs.rateReductionPercent}%) × Operating Days ({operatingDays}) × 12 months
                    <br />
                    = {outputs.currencySymbol}{outputs.annualOpportunityAddressed.toLocaleString()} / year
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default BusinessRoiCalculator;
