import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Controllable fake backend                                           */
/* ------------------------------------------------------------------ */

type Handler = (payload: unknown) => void;

const state = {
  rpcCalls: [] as string[],
  /** When true, every read hangs forever (simulates a request timeout). */
  hang: false,
  /** When true, every read resolves with an error (simulates a failed read). */
  fail: false,
  /** Artificial latency in ms (simulates a slow network). */
  latency: 0,
  activity: [] as any[],
  pulse: null as any,
  visitors: [] as any[],
  handlers: [] as Handler[],
  removed: 0,
};

const resolveLater = <T,>(value: T) =>
  new Promise<T>((resolve) => {
    if (state.hang) return; // never settles
    if (state.latency === 0) resolve(value);
    else setTimeout(() => resolve(value), state.latency);
  });

const reply = (data: unknown) =>
  state.fail ? resolveLater({ data: null, error: { message: "network error" } }) : resolveLater({ data, error: null });

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
      on: (_evt: string, _cfg: unknown, handler: Handler) => {
        state.handlers.push(handler);
        return ch;
      },
      subscribe: () => ch,
    };
    return ch;
  };

  return {
    supabase: {
      rpc: (name: string) => {
        state.rpcCalls.push(name);
        if (name === "get_public_queue_activity") return reply(state.activity);
        if (name === "get_public_queue_pulse") return reply(state.pulse ? [state.pulse] : []);
        return reply([]);
      },
      from,
      channel,
      removeChannel: () => {
        state.removed += 1;
      },
    },
  };
});

import { useCustomerQueueIntel } from "@/hooks/useCustomerQueueIntel";

const reset = () => {
  state.rpcCalls = [];
  state.hang = false;
  state.fail = false;
  state.latency = 0;
  state.activity = [];
  state.pulse = null;
  state.visitors = [];
  state.handlers = [];
  state.removed = 0;
};

beforeEach(reset);
afterEach(() => vi.useRealTimers());

const args = { queueId: "q1", businessId: "b1", userId: null };

describe("useCustomerQueueIntel resilience", () => {
  it("stays in the loading state on a slow network, then exposes real data", async () => {
    vi.useFakeTimers();
    state.latency = 2000;
    state.activity = [{ id: "e1", action: "called", token_number: 7, actor: null, created_at: new Date().toISOString() }];
    state.pulse = { waiting: 2, joined_today: 9, served_today: 7, avg_wait_minutes: 6, avg_service_minutes: 3, reliability_pct: 98 };
    state.visitors = [{ token_number: 7, status: "called", called_at: new Date().toISOString() }];

    const { result } = renderHook(() => useCustomerQueueIntel(args));

    // Skeletons must still be on screen: no data, not ready, no zero-filled pulse.
    expect(result.current.ready).toBe(false);
    expect(result.current.activity).toEqual([]);
    expect(result.current.pulse).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.activity).toHaveLength(1);
    expect(result.current.pulse?.served_today).toBe(7);
    expect(result.current.tokens).toEqual([{ token: 7, status: "called" }]);
  });

  it("never leaves the loading state when a request times out (no fake data)", async () => {
    vi.useFakeTimers();
    state.hang = true;

    const { result } = renderHook(() => useCustomerQueueIntel(args));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.activity).toEqual([]);
    expect(result.current.pulse).toBeNull();
    expect(result.current.tokens).toEqual([]);
  });

  it("falls back to a genuine empty state (not zeros) when reads fail", async () => {
    state.fail = true;
    const { result } = renderHook(() => useCustomerQueueIntel(args));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.activity).toEqual([]);
    expect(result.current.pulse).toBeNull();
    expect(result.current.highlights).toBeNull();
  });

  it("refetches when a realtime signal arrives after reconnect, throttled to one burst", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCustomerQueueIntel(args));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.ready).toBe(true);

    const initial = state.rpcCalls.length;
    expect(state.handlers.length).toBeGreaterThan(0);

    // A burst of signals (typical of a realtime reconnect replay).
    await act(async () => {
      state.handlers.forEach((h) => h({}));
      state.handlers.forEach((h) => h({}));
      await vi.advanceTimersByTimeAsync(1600);
    });

    const afterBurst = state.rpcCalls.length;
    expect(afterBurst).toBeGreaterThan(initial); // it did refresh
    expect(afterBurst - initial).toBeLessThanOrEqual(4); // but coalesced, not one call per signal

    // Data survives the reconnect — nothing is reset back to a loading state.
    expect(result.current.ready).toBe(true);
  });

  it("tears down its realtime channel on unmount", async () => {
    const { unmount, result } = renderHook(() => useCustomerQueueIntel(args));
    await waitFor(() => expect(result.current.ready).toBe(true));
    unmount();
    expect(state.removed).toBeGreaterThan(0);
  });
});
