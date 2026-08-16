import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import {
  DEGRADED_BUDGETS,
  WEB_VITALS_BUDGETS,
  WebVitalsRecorder,
  formatViolations,
} from "@/lib/webVitals";
import { layoutShiftScore, measureLayout } from "./utils/layoutShift";

/* ------------------------------------------------------------------ */
/* Controllable fake backend (same shape as queueIntelResilience)      */
/* ------------------------------------------------------------------ */

type Handler = (payload: unknown) => void;

const state = {
  hang: false,
  latency: 0,
  activity: [] as any[],
  pulse: null as any,
  visitors: [] as any[],
  handlers: [] as Handler[],
};

const resolveLater = <T,>(value: T) =>
  new Promise<T>((resolve) => {
    if (state.hang) return;
    if (state.latency === 0) resolve(value);
    else setTimeout(() => resolve(value), state.latency);
  });

const reply = (data: unknown) => resolveLater({ data, error: null });

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: () => reply(null),
      then: (res: any, rej: any) =>
        reply(table === "queue_visitors_public" ? state.visitors : []).then(res, rej),
    };
    return builder;
  };
  const channel = () => {
    const ch: any = {
      on: (_e: string, _c: unknown, h: Handler) => {
        state.handlers.push(h);
        return ch;
      },
      subscribe: () => ch,
    };
    return ch;
  };
  return {
    supabase: {
      rpc: (name: string) => {
        if (name === "get_public_queue_activity") return reply(state.activity);
        if (name === "get_public_queue_pulse") return reply(state.pulse ? [state.pulse] : []);
        return reply([]);
      },
      from,
      channel,
      removeChannel: () => {},
    },
  };
});

import { useCustomerQueueIntel } from "@/hooks/useCustomerQueueIntel";
import QueueTimeline from "@/components/queue/QueueTimeline";
import LiveActivityFeed from "@/components/queue/LiveActivityFeed";
import BusinessHighlightsCard from "@/components/queue/BusinessHighlightsCard";

const reset = () => {
  state.hang = false;
  state.latency = 0;
  state.activity = [];
  state.pulse = null;
  state.visitors = [];
  state.handlers = [];
};

beforeEach(reset);
afterEach(() => vi.useRealTimers());

const ARGS = { queueId: "q1", businessId: "b1", userId: null };

const seedBackend = () => {
  const now = new Date().toISOString();
  state.activity = [
    { id: "e1", action: "called", token_number: 7, actor: null, created_at: now },
    { id: "e2", action: "joined", token_number: 8, actor: null, created_at: now },
  ];
  state.pulse = {
    waiting: 3,
    joined_today: 21,
    served_today: 18,
    avg_wait_minutes: 7,
    avg_service_minutes: 4,
    reliability_pct: 96,
  };
  state.visitors = [
    { token_number: 6, status: "served", called_at: now },
    { token_number: 7, status: "called", called_at: now },
    { token_number: 8, status: "waiting", called_at: null },
  ];
};

/** The customer queue intel surface, exactly as JoinQueue composes it. */
const IntelSurface = ({ intel }: { intel: ReturnType<typeof useCustomerQueueIntel> }) => (
  <div>
    <BusinessHighlightsCard
      loading={!intel.ready}
      rating={intel.highlights?.rating ?? undefined}
      totalReviews={intel.highlights?.total_reviews ?? undefined}
      pulse={intel.pulse}
    />
    <QueueTimeline loading={!intel.ready} tokens={intel.tokens} myToken={8} nowServing={7} />
    <LiveActivityFeed loading={!intel.ready} events={intel.activity} />
  </div>
);

/* ------------------------------------------------------------------ */
/* 1. Recorder maths                                                   */
/* ------------------------------------------------------------------ */

describe("WebVitalsRecorder", () => {
  it("aggregates CLS with the 1s-gap / 5s-cap session window", () => {
    const r = new WebVitalsRecorder();
    r.addShift({ value: 0.03, startTime: 100 });
    r.addShift({ value: 0.04, startTime: 500 });
    r.addShift({ value: 0.05, startTime: 3000 }); // new session after >1s gap
    expect(r.CLS).toBe(0.07);
  });

  it("ignores shifts that follow user input", () => {
    const r = new WebVitalsRecorder();
    r.addShift({ value: 0.5, startTime: 200, hadRecentInput: true });
    expect(r.CLS).toBe(0);
  });

  it("reports LCP as the latest candidate and INP as the worst interaction", () => {
    const r = new WebVitalsRecorder();
    r.addPaint({ startTime: 900 });
    r.addPaint({ startTime: 1800 });
    r.addInteraction({ startTime: 2000, duration: 40 });
    r.addInteraction({ startTime: 2400, duration: 130 });
    expect(r.LCP).toBe(1800);
    expect(r.INP).toBe(130);
  });

  it("fails the budget and names every breached metric", () => {
    const r = new WebVitalsRecorder();
    r.addShift({ value: 0.4, startTime: 100 });
    r.addPaint({ startTime: 6000 });
    r.addInteraction({ startTime: 6100, duration: 500 });
    const result = r.check(WEB_VITALS_BUDGETS);
    expect(result.passed).toBe(false);
    expect(result.violations.map((v) => v.metric).sort()).toEqual(["CLS", "INP", "LCP"]);
    expect(formatViolations(result)).toMatch(/CLS 0.4 > budget 0.1/);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Budgets under degraded backend conditions                        */
/* ------------------------------------------------------------------ */

describe("Web Vitals budgets under slow network / timeout / reconnect", () => {
  it("slow network: skeleton -> data stays inside the degraded CLS/LCP budget", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    state.latency = 2500;
    seedBackend();

    const recorder = new WebVitalsRecorder();
    const { result } = renderHook(() => useCustomerQueueIntel(ARGS));
    const view = render(<IntelSurface intel={result.current} />);

    // First contentful frame: skeleton shell is painted immediately.
    recorder.addPaint({ startTime: Date.now() - start });
    let previous = measureLayout(view.container);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });
    view.rerender(<IntelSurface intel={result.current} />);
    expect(result.current.ready).toBe(true);

    const next = measureLayout(view.container);
    recorder.addShift({ value: layoutShiftScore(previous, next), startTime: Date.now() - start });
    recorder.addPaint({ startTime: Date.now() - start });
    previous = next;

    const check = recorder.check(DEGRADED_BUDGETS);
    expect(check.passed, formatViolations(check)).toBe(true);
  });

  it("timeout: the page never shifts while the read hangs", async () => {
    vi.useFakeTimers();
    state.hang = true;

    const recorder = new WebVitalsRecorder();
    const { result } = renderHook(() => useCustomerQueueIntel(ARGS));
    const view = render(<IntelSurface intel={result.current} />);
    const before = measureLayout(view.container);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    view.rerender(<IntelSurface intel={result.current} />);

    const after = measureLayout(view.container);
    recorder.addShift({ value: layoutShiftScore(before, after), startTime: 30_000 });

    expect(result.current.ready).toBe(false);
    expect(recorder.CLS).toBe(0);
    expect(recorder.check(DEGRADED_BUDGETS).passed).toBe(true);
  });

  it("realtime reconnect: a burst of signals produces no cumulative shift", async () => {
    vi.useFakeTimers();
    seedBackend();

    const recorder = new WebVitalsRecorder();
    const { result } = renderHook(() => useCustomerQueueIntel(ARGS));
    const view = render(<IntelSurface intel={result.current} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    view.rerender(<IntelSurface intel={result.current} />);
    expect(result.current.ready).toBe(true);

    let previous = measureLayout(view.container);
    for (let i = 0; i < 3; i += 1) {
      await act(async () => {
        state.handlers.forEach((h) => h({}));
        await vi.advanceTimersByTimeAsync(1600);
      });
      view.rerender(<IntelSurface intel={result.current} />);
      const next = measureLayout(view.container);
      recorder.addShift({ value: layoutShiftScore(previous, next), startTime: 2000 + i * 1600 });
      previous = next;
    }

    const check = recorder.check(DEGRADED_BUDGETS);
    expect(check.passed, formatViolations(check)).toBe(true);
    expect(check.snapshot.CLS).toBe(0);
  });

  it("interaction during a reconnect stays inside the INP budget", async () => {
    vi.useRealTimers();
    seedBackend();

    const recorder = new WebVitalsRecorder();
    const { result } = renderHook(() => useCustomerQueueIntel(ARGS));
    const view = render(<IntelSurface intel={result.current} />);

    // Re-render triggered by a reconnect replay, measured as an interaction.
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      await act(async () => {
        state.handlers.forEach((h) => h({}));
        view.rerender(<IntelSurface intel={result.current} />);
      });
      recorder.addInteraction({ startTime: t0, duration: performance.now() - t0 });
    }

    const check = recorder.check(DEGRADED_BUDGETS);
    expect(check.passed, formatViolations(check)).toBe(true);
  });
});
