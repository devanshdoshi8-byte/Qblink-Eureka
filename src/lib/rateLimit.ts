/**
 * Persistent Sliding-Window Rate Limiter
 * Provides client-side defense against brute-force, spam submissions, and resource exhaustion.
 * Stores attempt timestamps in localStorage so page reloads cannot bypass cooldowns.
 */

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  label?: string;
}

/** Pre-configured limits for critical user actions across Qblink */
export const RATE_LIMIT_CONFIGS = {
  // Auth actions
  "auth:signin": { maxAttempts: 5, windowMs: 60 * 1000, label: "Sign-in" },
  "auth:signup": { maxAttempts: 4, windowMs: 10 * 60 * 1000, label: "Account creation" },
  "auth:forgot-password": { maxAttempts: 3, windowMs: 5 * 60 * 1000, label: "Password reset OTP" },
  "auth:otp-resend": { maxAttempts: 3, windowMs: 3 * 60 * 1000, label: "Code resend" },

  // Queue actions
  "queue:join": { maxAttempts: 3, windowMs: 60 * 1000, label: "Queue join" },
  "queue:call-next": { maxAttempts: 2, windowMs: 3 * 1000, label: "Call next customer" },
  "queue:manual-walkin": { maxAttempts: 8, windowMs: 30 * 1000, label: "Walk-in registration" },

  // AI & Analytics
  "ai:query": { maxAttempts: 10, windowMs: 60 * 1000, label: "AI assistant" },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIGS;

class PersistentRateLimiter {
  private memoryFallback = new Map<string, number[]>();

  private getStorageKey(action: string, identifier?: string): string {
    const suffix = identifier ? `:${identifier.toLowerCase().trim()}` : "";
    return `qblink:ratelimit:${action}${suffix}`;
  }

  private readTimestamps(key: string): number[] {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return this.memoryFallback.get(key) || [];
      }
      const raw = localStorage.getItem(key);
      if (!raw) return this.memoryFallback.get(key) || [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.memoryFallback.get(key) || [];
    }
  }

  private writeTimestamps(key: string, timestamps: number[]): void {
    this.memoryFallback.set(key, timestamps);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (timestamps.length === 0) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(timestamps));
        }
      }
    } catch {
      // Memory fallback handles failures silently
    }
  }

  /**
   * Checks whether an action can currently be performed without exceeding limits.
   */
  check(
    action: RateLimitAction,
    identifier?: string,
    customConfig?: RateLimitConfig
  ): { allowed: boolean; remainingSec: number; attemptsCount: number; maxAttempts: number } {
    const config = customConfig || RATE_LIMIT_CONFIGS[action] || { maxAttempts: 5, windowMs: 60000 };
    const key = this.getStorageKey(action, identifier);
    const now = Date.now();

    // Prune expired timestamps
    const raw = this.readTimestamps(key);
    const active = raw.filter((ts) => now - ts < config.windowMs);

    // Sync pruned state
    if (active.length !== raw.length) {
      this.writeTimestamps(key, active);
    }

    const allowed = active.length < config.maxAttempts;
    let remainingSec = 0;

    if (!allowed && active.length > 0) {
      const oldest = active[0];
      const elapsed = now - oldest;
      remainingSec = Math.max(1, Math.ceil((config.windowMs - elapsed) / 1000));
    }

    return {
      allowed,
      remainingSec,
      attemptsCount: active.length,
      maxAttempts: config.maxAttempts,
    };
  }

  /**
   * Records a new attempt for the given action and identifier.
   */
  record(
    action: RateLimitAction,
    identifier?: string,
    customConfig?: RateLimitConfig
  ): void {
    const config = customConfig || RATE_LIMIT_CONFIGS[action] || { maxAttempts: 5, windowMs: 60000 };
    const key = this.getStorageKey(action, identifier);
    const now = Date.now();

    const raw = this.readTimestamps(key);
    const active = raw.filter((ts) => now - ts < config.windowMs);
    active.push(now);

    this.writeTimestamps(key, active);
  }

  /**
   * Resets the rate limit counter for an action (e.g., upon successful authentication).
   */
  reset(action: RateLimitAction, identifier?: string): void {
    const key = this.getStorageKey(action, identifier);
    this.writeTimestamps(key, []);
  }

  /**
   * Completely clears all recorded rate limit state (useful for test isolation).
   */
  clearAll(): void {
    this.memoryFallback.clear();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.clear();
      }
    } catch {}
  }
}

export const rateLimiter = new PersistentRateLimiter();

/**
 * Helper to get a human-friendly error message when rate limited.
 */
export function getRateLimitMessage(
  action: RateLimitAction,
  remainingSec: number
): string {
  const config = RATE_LIMIT_CONFIGS[action];
  const label = config?.label || "This action";
  if (remainingSec <= 60) {
    return `Too many ${label.toLowerCase()} attempts. Please wait ${remainingSec} seconds.`;
  }
  const minutes = Math.ceil(remainingSec / 60);
  return `Too many ${label.toLowerCase()} attempts. Please wait ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}
