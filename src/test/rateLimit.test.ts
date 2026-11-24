import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimiter, getRateLimitMessage } from "../lib/rateLimit";

describe("Persistent Rate Limiter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("permits actions within the maximum attempt threshold", () => {
    const res1 = rateLimiter.check("auth:signin", "test@example.com");
    expect(res1.allowed).toBe(true);
    expect(res1.attemptsCount).toBe(0);

    rateLimiter.record("auth:signin", "test@example.com");
    const res2 = rateLimiter.check("auth:signin", "test@example.com");
    expect(res2.allowed).toBe(true);
    expect(res2.attemptsCount).toBe(1);
  });

  it("blocks actions exceeding the maximum attempt threshold", () => {
    const max = 5;
    for (let i = 0; i < max; i++) {
      expect(rateLimiter.check("auth:signin", "target@example.com").allowed).toBe(true);
      rateLimiter.record("auth:signin", "target@example.com");
    }

    const blocked = rateLimiter.check("auth:signin", "target@example.com");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remainingSec).toBeGreaterThan(0);
    expect(blocked.remainingSec).toBeLessThanOrEqual(60);
  });

  it("isolates counters between different identifiers", () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.record("auth:signin", "victim1@example.com");
    }
    expect(rateLimiter.check("auth:signin", "victim1@example.com").allowed).toBe(false);
    expect(rateLimiter.check("auth:signin", "innocent@example.com").allowed).toBe(true);
  });

  it("resets counter when requested", () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.record("auth:signin", "reset@example.com");
    }
    expect(rateLimiter.check("auth:signin", "reset@example.com").allowed).toBe(false);

    rateLimiter.reset("auth:signin", "reset@example.com");
    expect(rateLimiter.check("auth:signin", "reset@example.com").allowed).toBe(true);
  });

  it("expires old timestamps outside the window", () => {
    const now = Date.now();
    vi.setSystemTime(now);

    // Record 3 attempts for queue join
    rateLimiter.record("queue:join", "queue-1");
    rateLimiter.record("queue:join", "queue-1");
    rateLimiter.record("queue:join", "queue-1");
    expect(rateLimiter.check("queue:join", "queue-1").allowed).toBe(false);

    // Advance time beyond windowMs (60 seconds)
    vi.setSystemTime(now + 65 * 1000);
    expect(rateLimiter.check("queue:join", "queue-1").allowed).toBe(true);

    vi.useRealTimers();
  });

  it("formats human-readable rate limit messages", () => {
    const secMsg = getRateLimitMessage("auth:signin", 30);
    expect(secMsg).toContain("30 seconds");

    const minMsg = getRateLimitMessage("auth:signup", 180);
    expect(minMsg).toContain("3 minutes");
  });
});
