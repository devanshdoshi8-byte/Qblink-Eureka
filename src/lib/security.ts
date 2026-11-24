/**
 * Frontend Security Suite for Qblink
 * Implements security patterns per frontend-security-coder standards:
 * - Open redirect prevention & safe URL sanitization
 * - XSS prevention & safe string encoding
 * - Safe external link props (rel="noopener noreferrer")
 * - Clickjacking & frame isolation protection
 * - Client-side form throttling / brute-force protection
 */

/**
 * List of allowed internal route prefixes for navigation redirects.
 * Any redirect target must strictly match one of these prefixes.
 */
const ALLOWED_INTERNAL_PREFIXES = [
  "/",
  "/auth",
  "/dashboard",
  "/customer-dashboard",
  "/admin",
  "/join/",
  "/display/",
  "/pickup",
  "/pitch",
  "/roi",
  "/calculator",
  "/chaos-to-clarity",
  "/industries",
  "/onboarding",
  "/affiliate",
  "/install",
  "/pwa-status",
  "/cache-diagnostics",
];

/**
 * Validates and sanitizes a redirection URL to prevent Open Redirect attacks.
 * Rejects protocol-relative URLs (e.g. `//evil.com`), backslash escapes (e.g. `/\evil.com`),
 * and foreign protocols (e.g. `javascript:`, `data:`).
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  fallback = "/customer-dashboard"
): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Must begin with a single slash, not double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject URLs containing control characters or whitespace
  if (/[\x00-\x1F\x7F\s]/.test(trimmed)) {
    return fallback;
  }

  // Reject colon before the first query or hash, which could indicate a scheme like javascript:
  const pathPart = trimmed.split(/[?#]/)[0];
  if (pathPart.includes(":")) {
    return fallback;
  }

  // Verify that the path begins with one of the allowed internal prefixes
  const isAllowed = ALLOWED_INTERNAL_PREFIXES.some(
    (prefix) => pathPart === prefix || pathPart.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  );

  return isAllowed ? trimmed : fallback;
}

/**
 * Escapes special HTML characters in untrusted strings to prevent XSS injection.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;");
}

/**
 * Validates whether a given URL is safe for external links or redirects.
 * Rejects dangerous URI schemes (javascript:, data:, vbscript:).
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();

  // Relative URLs starting with /
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return true;
  }

  // Absolute URLs must use https or http
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Safe attributes for external anchor tags to prevent reverse-tabnabbing (window.opener attack).
 */
export const safeExternalLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

/**
 * Client-side Clickjacking (UI Redressing) protection.
 * Checks whether the application is loaded inside an unauthorized iframe.
 * If embedded, breaks out of the frame or alerts in production environments.
 */
export function enforceFrameProtection(): void {
  if (typeof window === "undefined") return;

  try {
    // If window.self !== window.top, the window is framed
    if (window.self !== window.top) {
      // Allow embedding during local development if explicitly running inside dev tools or simulators
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isLocalhost) {
        // Break out to top frame in production
        if (window.top) {
          window.top.location.href = window.self.location.href;
        }
      }
    }
  } catch (err) {
    // Cross-origin framing access exception -> unauthorized framing detected
    console.warn("Unauthorized frame boundary detected.");
  }
}

/**
 * Client-side rate-limiter to protect authentication forms from automated rapid submission attacks.
 */
class FormRateLimiter {
  private attempts: number[] = [];
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canAttempt(): boolean {
    const now = Date.now();
    this.attempts = this.attempts.filter((ts) => now - ts < this.windowMs);
    return this.attempts.length < this.maxAttempts;
  }

  recordAttempt(): void {
    this.attempts.push(Date.now());
  }

  remainingTimeSec(): number {
    if (this.attempts.length === 0) return 0;
    const oldest = this.attempts[0];
    const elapsed = Date.now() - oldest;
    return Math.max(1, Math.ceil((this.windowMs - elapsed) / 1000));
  }

  reset(): void {
    this.attempts = [];
  }
}

export const authRateLimiter = new FormRateLimiter(6, 60000);

// Re-export full enterprise security suite
export * from "./securitySuite";
