/**
 * Canonical PUBLIC origin for anything a customer will ever open
 * (QR codes, shared join links, kiosk display links, pickup links).
 *
 * Never use window.location.origin for these: inside the Lovable editor /
 * preview the origin is a private `id-preview--*.lovable.app` host which is
 * behind Lovable authentication. A customer scanning that QR would be asked
 * to sign in to Lovable — which must never happen.
 */
export const PUBLIC_SITE_URL = "https://qblink-real.lovable.app";

const PRIVATE_HOST_PATTERNS = [
  "id-preview--",
  "lovableproject.com",
  "lovable.dev",
  "localhost",
  "127.0.0.1",
];

/** Origin that is guaranteed to be reachable by a customer with no account. */
export function getPublicOrigin(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (typeof window === "undefined") return PUBLIC_SITE_URL;
  const host = window.location.hostname;
  const isPrivate = PRIVATE_HOST_PATTERNS.some((p) => host.includes(p));
  return isPrivate ? PUBLIC_SITE_URL : window.location.origin;
}

/** Build a public customer URL, e.g. publicUrl(`/join/${id}`). */
export function publicUrl(path: string): string {
  return `${getPublicOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
