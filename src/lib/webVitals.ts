/**
 * Web Vitals measurement + budget enforcement.
 *
 * The recorder is a pure, deterministic implementation of the CLS / LCP / INP
 * aggregation rules so it can be driven from tests (synthetic entries) as well
 * as from a real browser (PerformanceObserver). No UI, no side effects.
 */

export const WEB_VITALS_BUDGETS = {
  /** Cumulative Layout Shift — "good" threshold. */
  CLS: 0.1,
  /** Largest Contentful Paint, ms. */
  LCP: 2500,
  /** Interaction to Next Paint, ms. */
  INP: 200,
} as const;

/**
 * Degraded-network budgets. Applied when the page is waiting on a slow
 * backend, a timed-out read, or a realtime reconnect: paint may legitimately
 * be later, but layout must NOT shift and interactions must stay responsive.
 */
export const DEGRADED_BUDGETS = {
  CLS: 0.02,
  LCP: 4000,
  INP: 200,
} as const;

export type VitalName = keyof typeof WEB_VITALS_BUDGETS;
export type Budgets = Record<VitalName, number>;

export interface ShiftEntry {
  /** Layout shift score for this entry. */
  value: number;
  /** Shifts within 500ms of a user input are excluded from CLS. */
  hadRecentInput?: boolean;
  startTime: number;
}

export interface PaintEntry {
  startTime: number;
}

export interface InteractionEntry {
  startTime: number;
  /** Input delay + processing + presentation, ms. */
  duration: number;
}

export interface VitalsSnapshot {
  CLS: number;
  LCP: number;
  INP: number;
}

export interface BudgetViolation {
  metric: VitalName;
  value: number;
  budget: number;
}

export interface BudgetResult {
  passed: boolean;
  snapshot: VitalsSnapshot;
  violations: BudgetViolation[];
}

/** Session-window gap/cap used by the official CLS definition. */
const SESSION_GAP_MS = 1000;
const SESSION_MAX_MS = 5000;

export class WebVitalsRecorder {
  private shifts: ShiftEntry[] = [];
  private lcp = 0;
  private interactions: number[] = [];

  reset() {
    this.shifts = [];
    this.lcp = 0;
    this.interactions = [];
  }

  addShift(entry: ShiftEntry) {
    if (entry.hadRecentInput) return;
    if (!(entry.value > 0)) return;
    this.shifts.push(entry);
  }

  addPaint(entry: PaintEntry) {
    // LCP is the latest reported candidate, not the largest timestamp seen.
    this.lcp = entry.startTime;
  }

  addInteraction(entry: InteractionEntry) {
    if (!(entry.duration >= 0)) return;
    this.interactions.push(entry.duration);
  }

  /** Largest 1s-gap / 5s-capped session window, per the CLS spec. */
  get CLS(): number {
    const sorted = [...this.shifts].sort((a, b) => a.startTime - b.startTime);
    let worst = 0;
    let current = 0;
    let first = 0;
    let last = 0;
    for (const s of sorted) {
      if (current > 0 && (s.startTime - last > SESSION_GAP_MS || s.startTime - first > SESSION_MAX_MS)) {
        current = 0;
        first = s.startTime;
      }
      if (current === 0) first = s.startTime;
      current += s.value;
      last = s.startTime;
      if (current > worst) worst = current;
    }
    return Number(worst.toFixed(4));
  }

  get LCP(): number {
    return this.lcp;
  }

  /** INP = 98th percentile of interaction latencies (max for short sessions). */
  get INP(): number {
    if (!this.interactions.length) return 0;
    const sorted = [...this.interactions].sort((a, b) => a - b);
    if (sorted.length < 50) return sorted[sorted.length - 1];
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98));
    return sorted[idx];
  }

  snapshot(): VitalsSnapshot {
    return { CLS: this.CLS, LCP: this.LCP, INP: this.INP };
  }

  check(budgets: Budgets = WEB_VITALS_BUDGETS): BudgetResult {
    const snapshot = this.snapshot();
    const violations = (Object.keys(budgets) as VitalName[])
      .filter((m) => snapshot[m] > budgets[m])
      .map((m) => ({ metric: m, value: snapshot[m], budget: budgets[m] }));
    return { passed: violations.length === 0, snapshot, violations };
  }
}

export function formatViolations(result: BudgetResult): string {
  if (result.passed) return "within budget";
  return result.violations.map((v) => `${v.metric} ${v.value} > budget ${v.budget}`).join("; ");
}

type ObserverCallback = (snapshot: VitalsSnapshot) => void;

/**
 * Browser wiring. Feeds the recorder from PerformanceObserver and reports the
 * running snapshot. Safe no-op where the APIs are unavailable (jsdom, SSR).
 */
export function observeWebVitals(onChange: ObserverCallback = () => {}) {
  const recorder = new WebVitalsRecorder();
  if (typeof PerformanceObserver === "undefined") return { recorder, stop: () => {} };

  const observers: PerformanceObserver[] = [];
  const emit = () => onChange(recorder.snapshot());

  const observe = (type: string, handler: (entry: any) => void) => {
    try {
      const po = new PerformanceObserver((list) => {
        list.getEntries().forEach(handler);
        emit();
      });
      po.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(po);
    } catch {
      /* entry type unsupported in this browser */
    }
  };

  observe("layout-shift", (e) =>
    recorder.addShift({ value: e.value, hadRecentInput: e.hadRecentInput, startTime: e.startTime }),
  );
  observe("largest-contentful-paint", (e) => recorder.addPaint({ startTime: e.startTime }));
  observe("event", (e) => recorder.addInteraction({ startTime: e.startTime, duration: e.duration }));

  return {
    recorder,
    stop: () => observers.forEach((o) => o.disconnect()),
  };
}