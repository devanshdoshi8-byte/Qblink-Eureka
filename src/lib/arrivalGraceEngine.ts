/**
 * Arrival Grace Period Engine
 *
 * Implements fairness-first arrival grace management for remote customers who
 * are 1-2 minutes away when their turn arrives.
 *
 * States:
 * - 'none': standard waiting state
 * - 'requested': customer tapped "I'm 2 mins away"
 * - 'active': grace timer actively counting down
 * - 'expired': grace time elapsed without check-in
 * - 'completed': customer arrived and was served
 * - 'cancelled': customer left or operator overrode
 */

export type GraceStatus = "none" | "requested" | "active" | "expired" | "completed" | "cancelled";

export interface GraceState {
  status: GraceStatus;
  requestedAt?: number;
  expiresAt?: number;
  durationMinutes: number;
}

export function calculateGraceExpiry(durationMinutes: number = 2, fromTimestamp: number = Date.now()): number {
  const boundedMinutes = Math.max(1, Math.min(5, durationMinutes));
  return fromTimestamp + boundedMinutes * 60 * 1000;
}

export function getRemainingGraceSeconds(expiresAt?: number | null): number {
  if (!expiresAt || typeof expiresAt !== "number") return 0;
  const remainingMs = expiresAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function formatGraceCountdown(remainingSeconds: number): string {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function canRequestGrace({
  aheadCount,
  myStatus,
  currentGraceStatus,
}: {
  aheadCount: number;
  myStatus: string;
  currentGraceStatus?: GraceStatus;
}): boolean {
  if (currentGraceStatus && currentGraceStatus !== "none") {
    return false; // Already requested or used
  }
  // Available when customer is Position 1 (ahead === 0) or has just been called
  return aheadCount === 0 || myStatus === "called";
}
