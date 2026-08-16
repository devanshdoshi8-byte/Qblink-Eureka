/**
 * One-Click Print-Ready QR Kit Generator
 *
 * Provides high-DPI vector and canvas layout renderers for physical venue signage.
 * Supports:
 * - A4 Entrance Door Poster ("Avoid the Line • Scan & Wait Comfortably")
 * - A5 Counter Standee / Table Tent ("Take a Number • Track Live from Phone")
 * - Square Table / Window Sticker ("Live Queue • Scan to Join")
 */

import { publicUrl } from "./publicUrl";

export type QRKitTemplate = "a4_poster" | "a5_standee" | "square_sticker";

export interface QRKitOptions {
  queueId: string;
  queueName: string;
  businessName: string;
  businessCategory?: string;
  template: QRKitTemplate;
  accentColor?: string;
}

export function getPublicQueueUrl(queueId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join/${queueId}`;
  }
  return publicUrl(`/join/${queueId}`);
}

export function getTemplateCopy(template: QRKitTemplate, businessName: string, queueName: string) {
  switch (template) {
    case "a4_poster":
      return {
        badge: "DIGITAL QUEUE ACCESS",
        headline: "Skip the Physical Line",
        subhead: "Scan this QR code with your phone camera to join the queue remotely and wait wherever you feel comfortable.",
        step1: "1. Scan QR with Camera",
        step2: "2. Track position live on your phone",
        step3: "3. Walk in when your turn is called",
        footer: "No app download required • 100% Web-Native • Powered by Qblink",
      };
    case "a5_standee":
      return {
        badge: "OFFICIAL QUEUE ENTRY",
        headline: "Take Your Digital Ticket",
        subhead: "Scan to grab a live ticket. Watch your wait time tick down in real time.",
        step1: "Scan QR",
        step2: "Watch Live Wait",
        step3: "Approach Counter",
        footer: "Powered by Qblink • Zero Hardware Needed",
      };
    case "square_sticker":
    default:
      return {
        badge: "SCAN & JOIN",
        headline: "Live Queue",
        subhead: "Scan with your phone to take your spot.",
        step1: "Scan",
        step2: "Track",
        step3: "Serve",
        footer: "Qblink Digital Queue",
      };
  }
}
