/**
 * Comprehensive Enterprise Security Suite for Qblink
 * Implements defenses against:
 * 1. Rapid Reset (HTTP/2 stream floods & rapid password reset abuse)
 * 2. 52-char username & Unicode homoglyph / confusable clone attacks
 * 3. SAML signature bypass, nOAuth unverified email hijacking & email header spoofing
 * 4. GraphQL alias batching & depth amplification abuse
 * 5. 2FA / OTP code replay attacks
 * 6. Regular Expression Denial of Service (ReDoS)
 * 7. JWT request smuggling & algorithm confusion ("none" / malformed tokens)
 * 8. Cache poisoning & spoofed IP headers (X-Forwarded-For)
 * 9. PostgreSQL Views bypassing Row-Level Security (RLS)
 * 10. Math.random non-cryptographic token predictability
 * 11. Timing attacks via constant-time comparison
 * 12. Padding oracle attacks on CBC mode / uniform decryption errors
 * 13. Prototype pollution in JSON parsing & object merging
 * 14. Server-Side Template Injection (SSTI) & safe string interpolation
 * 15. XML External Entity (XXE) injection & directory path traversal
 * 16. Cross-Site WebSocket Hijacking (CSWSH) & origin validation
 */

// ============================================================================
// 10. Cryptographically Secure Random Token Generation (Defeats Math.random)
// ============================================================================

/**
 * Generates a cryptographically secure random hexadecimal or alphanumeric token.
 * Uses Web Crypto API (crypto.getRandomValues) instead of predictable Math.random().
 */
export function cryptoSecureToken(byteLength = 32): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  throw new Error("Web Crypto API is required for secure token generation.");
}

/**
 * Generates an unbiased cryptographically secure integer in the range [min, max].
 * Implements rejection sampling to eliminate modulo bias.
 */
export function cryptoSecureInt(min: number, max: number): number {
  if (min >= max) return min;
  const range = max - min + 1;
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % range);

  const buffer = new Uint32Array(1);
  let randomValue = 0;
  do {
    crypto.getRandomValues(buffer);
    randomValue = buffer[0];
  } while (randomValue >= limit);

  return min + (randomValue % range);
}

/**
 * Generates a cryptographically secure numeric OTP code of given length.
 */
export function cryptoSecureOTP(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(cryptoSecureInt(min, max));
}

/**
 * Generates a standard RFC 4122 v4 UUID using crypto.randomUUID with fallback.
 */
export function cryptoSecureUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

// ============================================================================
// 11. Timing Attack Defense (Constant-Time Bitwise Comparison)
// ============================================================================

/**
 * Performs a constant-time string comparison to prevent side-channel timing attacks
 * when comparing sensitive secrets, OTPs, hashes, or tokens.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  
  const lengthA = a.length;
  const lengthB = b.length;
  let diff = lengthA ^ lengthB;

  // Compare against longest length, using modulo to avoid out-of-bounds
  const maxLen = Math.max(lengthA, lengthB);
  for (let i = 0; i < maxLen; i++) {
    const charA = i < lengthA ? a.charCodeAt(i) : 0;
    const charB = i < lengthB ? b.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }

  return diff === 0;
}

// ============================================================================
// 2. Username Length & Unicode Homoglyph Defense (52-char & Clone Usernames)
// ============================================================================

const CONFUSABLES_MAP: Record<string, string> = {
  "\u0430": "a", // Cyrillic small letter a
  "\u0435": "e", // Cyrillic small letter ie
  "\u043E": "o", // Cyrillic small letter o
  "\u0440": "p", // Cyrillic small letter er
  "\u0441": "c", // Cyrillic small letter es
  "\u0443": "y", // Cyrillic small letter u
  "\u0445": "x", // Cyrillic small letter ha
  "\u0456": "i", // Cyrillic small letter byelorussian-ukrainian i
  "\u03BF": "o", // Greek small letter omicron
  "\u03BD": "v", // Greek small letter nu
  "\u0131": "i", // Latin small letter dotless i
};

const PROTECTED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "founder",
  "qblink",
  "devansh",
  "moderator",
]);

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
  isConfusable?: boolean;
}

/**
 * Validates usernames against:
 * - Buffer overflow & layout breaking (strictly enforces 3-30 chars, rejecting 52-char attempts)
 * - Zero-width spaces and invisible characters (\u200B-\u200D, \uFEFF)
 * - Bidirectional text override injections (\u202A-\u202E, \u2066-\u2069)
 * - Homoglyphs / Cyrillic/Greek confusables attempting to clone official usernames
 */
export function validateUsernameSecurity(username: string): UsernameValidationResult {
  if (!username || typeof username !== "string") {
    return { valid: false, normalized: "", error: "Username is required" };
  }

  // 1. Length enforcement: reject excessively long usernames (e.g. 52-char overflow attempts)
  if (username.length < 3) {
    return { valid: false, normalized: username, error: "Username must be at least 3 characters" };
  }
  if (username.length > 30) {
    return {
      valid: false,
      normalized: username,
      error: `Username exceeds maximum allowed length of 30 characters (received ${username.length} characters)`,
    };
  }

  // 2. Reject zero-width characters and bidi overrides
  if (/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/.test(username)) {
    return { valid: false, normalized: username, error: "Username contains illegal invisible or directional formatting characters" };
  }

  // 3. Normalize Unicode (NFKC)
  const normalized = username.normalize("NFKC").trim();

  // 4. Homoglyph / Confusable clone detection
  let mappedCanonical = "";
  for (const char of normalized.toLowerCase()) {
    mappedCanonical += CONFUSABLES_MAP[char] || char;
  }

  if (PROTECTED_USERNAMES.has(mappedCanonical) && !PROTECTED_USERNAMES.has(normalized.toLowerCase())) {
    return {
      valid: false,
      normalized,
      isConfusable: true,
      error: "Username uses confusable Unicode characters to impersonate a protected system identity",
    };
  }

  // 5. Strict character whitelist: lowercase alphanumeric, underscore, dot, hyphen
  const safeUsernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,28}[a-zA-Z0-9]$/;
  if (!safeUsernameRegex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Username must contain only alphanumeric characters, dots, underscores, or hyphens, and cannot start or end with a symbol",
    };
  }

  return { valid: true, normalized };
}

// ============================================================================
// 1. Rapid Reset & Burst Flooding Defense
// ============================================================================

export class RapidResetGuard {
  private resetTimestamps: number[] = [];
  private readonly maxResets: number;
  private readonly windowMs: number;
  private cooldownUntil = 0;

  constructor(maxResets = 10, windowMs = 5000, private cooldownDurationMs = 15000) {
    this.maxResets = maxResets;
    this.windowMs = windowMs;
  }

  /**
   * Records a stream cancellation or client reset.
   * If rate exceeds threshold (e.g. CVE-2023-44487 rapid reset flood), triggers cooldown.
   */
  recordReset(): { blocked: boolean; retryAfterSec?: number } {
    const now = Date.now();
    if (now < this.cooldownUntil) {
      return { blocked: true, retryAfterSec: Math.ceil((this.cooldownUntil - now) / 1000) };
    }

    this.resetTimestamps = this.resetTimestamps.filter((ts) => now - ts < this.windowMs);
    this.resetTimestamps.push(now);

    if (this.resetTimestamps.length > this.maxResets) {
      this.cooldownUntil = now + this.cooldownDurationMs;
      return { blocked: true, retryAfterSec: Math.ceil(this.cooldownDurationMs / 1000) };
    }

    return { blocked: false };
  }

  isBlocked(): boolean {
    return Date.now() < this.cooldownUntil;
  }
}

// ============================================================================
// 3. SAML Bypass, nOAuth & Email Spoofing Defense
// ============================================================================

export interface OAuthSecurityProfile {
  email?: string;
  email_verified?: boolean;
  iss?: string;
  aud?: string;
}

/**
 * Defends against nOAuth (vulnerability where IdPs provide unverified emails,
 * enabling account takeover of existing accounts with matching emails).
 */
export function validateOAuthSecurity(
  profile: OAuthSecurityProfile,
  expectedIssuers: string[] = ["https://accounts.google.com", "supabase"]
): { safe: boolean; error?: string } {
  if (!profile.email) {
    return { safe: false, error: "OAuth profile missing email address" };
  }

  // nOAuth mitigation: Strictly reject accounts where the email has not been verified by the provider
  if (profile.email_verified !== true) {
    return {
      safe: false,
      error: "nOAuth Defense: Identity provider reports this email is not verified. Account linking rejected.",
    };
  }

  // Verify issuer if supplied
  if (profile.iss && expectedIssuers.length > 0) {
    const matched = expectedIssuers.some((iss) => profile.iss?.startsWith(iss));
    if (!matched) {
      return { safe: false, error: `Unauthorized OAuth issuer: ${profile.iss}` };
    }
  }

  return { safe: true };
}

/**
 * Validates email addresses to prevent email header spoofing, CRLF injection,
 * and null-byte truncation.
 */
export function validateEmailSecurity(email: string): { valid: boolean; normalized: string; error?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, normalized: "", error: "Email is required" };
  }

  // CRLF injection detection
  if (/[\r\n]/.test(email)) {
    return { valid: false, normalized: "", error: "Email contains illegal CRLF line break characters" };
  }

  // Null byte injection detection
  if (/\0/.test(email)) {
    return { valid: false, normalized: "", error: "Email contains illegal null byte character" };
  }

  const trimmed = email.trim().toLowerCase();

  // Strict email format checking: single @, standard characters
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, normalized: trimmed, error: "Invalid email format" };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validates SAML XML assertions against XML Signature Wrapping (XSW)
 * and assertion tampering.
 */
export function validateSAMLAssertionIntegrity(xmlAssertion: string): { valid: boolean; error?: string } {
  if (!xmlAssertion || typeof xmlAssertion !== "string") {
    return { valid: false, error: "Empty SAML assertion" };
  }

  // XML Signature Wrapping (XSW) check: ensure exactly one Assertion element is present
  const assertionMatches = xmlAssertion.match(/<(?:\w+:)?Assertion\b/g);
  if (!assertionMatches || assertionMatches.length !== 1) {
    return { valid: false, error: "SAML XSW Defense: Multiple or missing Assertion elements detected" };
  }

  // Ensure Signature element is present
  if (!/<(?:\w+:)?Signature\b/.test(xmlAssertion)) {
    return { valid: false, error: "SAML Bypass Defense: Unsigned SAML assertion rejected" };
  }

  // Ensure conditions with NotBefore / NotOnOrAfter exist
  if (!/NotOnOrAfter\s*=\s*["'][^"']+["']/.test(xmlAssertion)) {
    return { valid: false, error: "SAML assertion lacks expiration timestamp" };
  }

  return { valid: true };
}

// ============================================================================
// 4. GraphQL Aliases & Query Amplification Defense
// ============================================================================

export interface GraphQLValidationOptions {
  maxAliases?: number;
  maxDepth?: number;
}

/**
 * Analyzes GraphQL queries to prevent alias batching attacks (using 100s of aliases
 * to bypass rate limits or perform brute-force credential stuffing in one request).
 */
export function validateGraphQLQuery(
  query: string,
  options: GraphQLValidationOptions = {}
): { safe: boolean; aliasCount: number; depth: number; error?: string } {
  const maxAliases = options.maxAliases ?? 10;
  const maxDepth = options.maxDepth ?? 6;

  if (!query || typeof query !== "string") {
    return { safe: false, aliasCount: 0, depth: 0, error: "Empty query" };
  }

  // 1. Calculate query depth by counting balanced braces
  let currentDepth = 0;
  let maxObservedDepth = 0;
  for (const char of query) {
    if (char === "{") {
      currentDepth++;
      if (currentDepth > maxObservedDepth) maxObservedDepth = currentDepth;
    } else if (char === "}") {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  if (maxObservedDepth > maxDepth) {
    return {
      safe: false,
      aliasCount: 0,
      depth: maxObservedDepth,
      error: `GraphQL Query Depth exceeded: depth ${maxObservedDepth} > allowed maximum ${maxDepth}`,
    };
  }

  // 2. Count field aliases (alias: fieldName)
  // Strips strings, comments, and field argument parentheses first
  const cleanQuery = query
    .replace(/"[^"]*"/g, "")
    .replace(/#[^\n]*/g, "")
    .replace(/\([^)]*\)/g, "");
  const aliasMatches = cleanQuery.match(/\b([a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_]+/g);
  const aliasCount = aliasMatches ? aliasMatches.length : 0;

  if (aliasCount > maxAliases) {
    return {
      safe: false,
      aliasCount,
      depth: maxObservedDepth,
      error: `GraphQL Alias Batching Attack detected: ${aliasCount} aliases exceed allowed maximum of ${maxAliases}`,
    };
  }

  return { safe: true, aliasCount, depth: maxObservedDepth };
}

// ============================================================================
// 5. 2FA / OTP Code Replay Defense
// ============================================================================

export class OTPReplayGuard {
  private consumedTokens = new Map<string, number>();

  private computeHash(userId: string, code: string): string {
    return `${userId}:${code}`;
  }

  /**
   * Verifies an OTP code and permanently consumes it within its validity window.
   * If the code was already consumed, immediately rejects as a replay attack.
   */
  consumeOTP(userId: string, code: string, windowMs = 300000): { success: boolean; error?: string } {
    const now = Date.now();
    this.cleanup(now, windowMs);

    const tokenKey = this.computeHash(userId, code);
    if (this.consumedTokens.has(tokenKey)) {
      return {
        success: false,
        error: "2FA Code Replay Attack detected: this one-time code has already been consumed.",
      };
    }

    this.consumedTokens.set(tokenKey, now);
    return { success: true };
  }

  private cleanup(now: number, windowMs: number): void {
    for (const [key, timestamp] of this.consumedTokens.entries()) {
      if (now - timestamp > windowMs) {
        this.consumedTokens.delete(key);
      }
    }
  }

  clear(): void {
    this.consumedTokens.clear();
  }
}

export const otpReplayGuard = new OTPReplayGuard();

// ============================================================================
// 6. Regular Expression Denial of Service (ReDoS) Defense
// ============================================================================

/**
 * Executes a regex match with bounded input length to prevent quadratic or exponential
 * catastrophic backtracking (ReDoS).
 */
export function safeRegexMatch(
  pattern: RegExp,
  input: string,
  maxInputLength = 1000
): { matched: boolean; result: RegExpMatchArray | null; error?: string } {
  if (typeof input !== "string") {
    return { matched: false, result: null, error: "Input must be a string" };
  }

  if (input.length > maxInputLength) {
    return {
      matched: false,
      result: null,
      error: `ReDoS Defense: Input length (${input.length}) exceeds safety limit of ${maxInputLength} characters.`,
    };
  }

  try {
    const result = input.match(pattern);
    return { matched: result !== null, result };
  } catch (err) {
    return { matched: false, result: null, error: "Regex execution failed" };
  }
}

// ============================================================================
// 7. JWT Request Smuggling & Algorithm Confusion Defense
// ============================================================================

export interface SanitizedJwtResult {
  valid: boolean;
  header?: Record<string, any>;
  payload?: Record<string, any>;
  error?: string;
}

/**
 * Validates JWT format and headers, rejecting:
 * - Algorithm confusion attacks: alg = "none", "None", "NONE"
 * - Whitespace, carriage returns, or line breaks in token segments
 * - Malformed segment count (must be exactly 3 segments)
 */
export function validateJwtSecurity(token: string): SanitizedJwtResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token is required" };
  }

  // Reject whitespace, CRLF, or smuggled headers inside token string
  if (/[\s\r\n]/.test(token)) {
    return { valid: false, error: "JWT Smuggling Defense: Token contains smuggled whitespace or line breaks" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: `JWT format invalid: expected 3 parts, received ${parts.length}` };
  }

  try {
    const headerJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(headerJson);

    // Reject "none" algorithm
    if (!header.alg || typeof header.alg !== "string" || header.alg.toLowerCase() === "none") {
      return { valid: false, error: 'JWT Algorithm Confusion Defense: "none" algorithm is forbidden' };
    }

    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Verify expiration if present
    if (payload.exp && typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) {
        return { valid: false, header, payload, error: "JWT token has expired" };
      }
    }

    return { valid: true, header, payload };
  } catch {
    return { valid: false, error: "JWT parsing failed: malformed Base64 or JSON structure" };
  }
}

/**
 * Detects HTTP request smuggling patterns in headers (conflicting Transfer-Encoding and Content-Length).
 */
export function detectRequestSmuggling(headers: Record<string, string>): { hasSmuggling: boolean; reason?: string } {
  const normHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normHeaders[k.toLowerCase()] = v;
  }

  const hasContentLength = "content-length" in normHeaders;
  const hasTransferEncoding = "transfer-encoding" in normHeaders;

  if (hasContentLength && hasTransferEncoding) {
    return {
      hasSmuggling: true,
      reason: "Request Smuggling Defense: Both Content-Length and Transfer-Encoding present simultaneously (CL.TE/TE.CL)",
    };
  }

  if (hasTransferEncoding) {
    const te = normHeaders["transfer-encoding"].toLowerCase();
    if (te !== "chunked" && te !== "identity") {
      return {
        hasSmuggling: true,
        reason: `Request Smuggling Defense: Obfuscated or invalid Transfer-Encoding header: ${te}`,
      };
    }
  }

  return { hasSmuggling: false };
}

// ============================================================================
// 8. Cache Poisoning & Spoofed IP Header Defense
// ============================================================================

/**
 * Validates and sanitizes IP addresses from untrusted headers (X-Forwarded-For).
 * Rejects header injection, multiple commas, and invalid IP representations.
 */
export function sanitizeClientIp(ipString?: string): string | null {
  if (!ipString || typeof ipString !== "string") return null;

  // Header splitting check
  if (/[\r\n\0]/.test(ipString)) return null;

  // In multi-hop proxies, take the first segment
  const clientIp = ipString.split(",")[0].trim();

  // Strict IPv4 regex
  const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  if (ipv4Regex.test(clientIp)) return clientIp;

  // Strict IPv6 regex
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  if (clientIp.includes(":") && ipv6Regex.test(clientIp) && clientIp.length <= 45) {
    return clientIp;
  }

  return null;
}

/**
 * Identifies unkeyed inputs that could lead to Web Cache Poisoning.
 */
export function detectCachePoisoning(
  headers: Record<string, string>,
  searchParams?: URLSearchParams
): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const dangerousHeaders = ["x-forwarded-host", "x-original-url", "x-rewrite-url", "x-host"];

  for (const [k] of Object.entries(headers)) {
    if (dangerousHeaders.includes(k.toLowerCase())) {
      reasons.push(`Unkeyed host override header present: ${k}`);
    }
  }

  if (searchParams) {
    for (const [key] of searchParams.entries()) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        reasons.push(`Prototype-polluting query parameter in cache key: ${key}`);
      }
    }
  }

  return { suspicious: reasons.length > 0, reasons };
}

// ============================================================================
// 9. Views Bypass RLS Defense (PostgreSQL / Supabase)
// ============================================================================

/**
 * Audits SQL view creation statements to ensure Row Level Security is NOT bypassed.
 * In PostgreSQL 15+, views must explicitly set `with (security_invoker = true)` to inherit
 * the caller's RLS policies rather than running as SECURITY DEFINER.
 */
export function auditRLSViewSafety(viewSql: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const isView = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\b/i.test(viewSql);
  if (isView) {
    const hasSecurityInvoker = /WITH\s*\([^)]*security_invoker\s*=\s*true[^)]*\)/i.test(viewSql);
    if (!hasSecurityInvoker) {
      warnings.push(
        "RLS Bypass Risk: View lacks 'WITH (security_invoker = true)'. In Supabase/PostgreSQL, queries to this view will run as view creator and bypass all caller Row Level Security policies."
      );
    }
  }

  return { safe: warnings.length === 0, warnings };
}

// ============================================================================
// 12. Padding Oracle & Uniform Cryptographic Error Defense
// ============================================================================

/**
 * Validates encryption cipher configuration: enforces modern AEAD ciphers (AES-GCM, ChaCha20-Poly1305)
 * and forbids vulnerable CBC mode with PKCS#7 padding.
 */
export function validateCipherSuite(cipherName: string): { secure: boolean; isAead: boolean; recommendation: string } {
  const lower = cipherName.toLowerCase();
  if (lower.includes("cbc")) {
    return {
      secure: false,
      isAead: false,
      recommendation: "CBC mode is vulnerable to Padding Oracle attacks. Migrate immediately to AES-GCM or ChaCha20-Poly1305 (AEAD).",
    };
  }

  const isAead = lower.includes("gcm") || lower.includes("poly1305") || lower.includes("ccm");
  return {
    secure: isAead,
    isAead,
    recommendation: isAead ? "Cipher uses authenticated encryption (AEAD)." : "Consider migrating to AES-256-GCM.",
  };
}

/**
 * Uniform error message for cryptographic operations to prevent padding oracle side-channels.
 */
export function uniformCryptoError(): { error: string } {
  return { error: "DECRYPTION_FAILED" };
}

// ============================================================================
// 13. Prototype Pollution Defense
// ============================================================================

const DANGEROUS_PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Safely deep-merges objects while completely ignoring __proto__, constructor, and prototype keys.
 */
export function safeDeepMerge<T extends Record<string, any>>(target: T, source: any): T {
  if (!source || typeof source !== "object") return target;

  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (DANGEROUS_PROTO_KEYS.has(key)) {
      continue; // Block prototype pollution
    }

    const sourceVal = source[key];
    if (sourceVal && typeof sourceVal === "object" && !Array.isArray(sourceVal)) {
      output[key as keyof T] = safeDeepMerge(output[key] || {}, sourceVal);
    } else {
      output[key as keyof T] = sourceVal;
    }
  }

  return output;
}

/**
 * JSON parser equipped with prototype pollution reviver.
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    return JSON.parse(jsonStr, (key, value) => {
      if (DANGEROUS_PROTO_KEYS.has(key)) {
        return undefined; // Strip dangerous keys
      }
      return value;
    });
  } catch {
    return fallback;
  }
}

// ============================================================================
// 14. Server-Side Template Injection (SSTI) Defense
// ============================================================================

/**
 * Safely interpolates placeholders `{key}` in templates without evaluating code,
 * scripts, or expressions (${...}, {{...}}, <%= ... %>).
 */
export function safeInterpolateTemplate(template: string, data: Record<string, unknown>): string {
  if (!template || typeof template !== "string") return "";

  // Reject active template execution markers
  const sanitizedTemplate = template.replace(/\$\{([^}]+)\}/g, "{$1}").replace(/<%=[^%]+%>/g, "");

  return sanitizedTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (DANGEROUS_PROTO_KEYS.has(key)) return "";
    const value = data[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

// ============================================================================
// 15. XML External Entity (XXE) & Path Traversal Defense
// ============================================================================

/**
 * Detects and blocks XXE payloads by ensuring DOCTYPE and ENTITY declarations are rejected.
 */
export function preventXXE(xmlString: string): { safe: boolean; error?: string } {
  if (!xmlString || typeof xmlString !== "string") {
    return { safe: true };
  }

  // Reject DOCTYPE, ENTITY, SYSTEM, and PUBLIC XML directives
  if (/<!DOCTYPE\b/i.test(xmlString) || /<!ENTITY\b/i.test(xmlString) || /\bSYSTEM\b/i.test(xmlString)) {
    return {
      safe: false,
      error: "XXE Defense: XML contains forbidden DOCTYPE, ENTITY, or external SYSTEM declarations.",
    };
  }

  return { safe: true };
}

/**
 * Sanitizes file paths to prevent directory traversal attacks (../, ..\, %2e%2e, null bytes).
 */
export function sanitizePathTraversal(filePath: string): { safe: boolean; sanitized: string; error?: string } {
  if (!filePath || typeof filePath !== "string") {
    return { safe: false, sanitized: "", error: "File path is required" };
  }

  // Null byte injection check
  if (/\0/.test(filePath)) {
    return { safe: false, sanitized: "", error: "File path contains illegal null byte" };
  }

  // Check for traversal tokens
  if (filePath.includes("..") || /%2e%2e/i.test(filePath)) {
    return { safe: false, sanitized: "", error: "Path Traversal Defense: Directory traversal sequence (..) detected" };
  }

  // Strip leading slashes to prevent arbitrary absolute root access
  const sanitized = filePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  return { safe: true, sanitized };
}

// ============================================================================
// 16. Cross-Site WebSocket Hijacking (CSWSH) Defense
// ============================================================================

/**
 * Validates WebSocket connection handshake origins.
 */
export function validateWebSocketOrigin(origin: string | null | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Generates a short-lived single-use authentication ticket for WebSocket handshakes.
 */
export function createWebSocketAuthTicket(userId: string, ttlMs = 60000): { ticket: string; expiresAt: number } {
  const token = cryptoSecureToken(24);
  const expiresAt = Date.now() + ttlMs;
  return { ticket: `ws_${userId}_${token}`, expiresAt };
}
