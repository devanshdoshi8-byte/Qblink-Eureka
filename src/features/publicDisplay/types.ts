/**
 * Type definitions for the Scan & Go Public Queue TV/Kiosk Display.
 * 
 * 100% public-safe. Zero customer PII (no names, phones, or private metrics).
 */

export type DisplayConnectionStatus = "live" | "reconnecting" | "offline";
export type DisplayTheme = "dark" | "light";

export interface PublicDisplayState {
  queueId: string;
  queueName: string;
  businessName: string;
  status: "active" | "paused" | "closed";
  queueType: "standard" | "restaurant" | "appointment";
  counterLabel: string | null;
  currentToken: number | null;
  nextTokens: number[];
  waitingCount: number;
  connectionStatus: DisplayConnectionStatus;
  lastUpdatedAt: string;
  estimatedWaitMinutes: number | null;
}
