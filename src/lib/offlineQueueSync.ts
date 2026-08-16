/**
 * Safe Offline Local-First Queue Sync Engine
 *
 * Implements safe local presentation caching and conflict-resistant
 * offline mutation buffering for the business dashboard.
 */

export interface QueuedOfflineAction {
  id: string;
  action: "call_next" | "serve" | "skip" | "no_show" | "pause" | "resume";
  queueId: string;
  visitorId?: string;
  timestamp: number;
  payload?: any;
}

const STORAGE_KEY_ACTIONS = "qblink:offline_mutations";
const STORAGE_KEY_STATE = "qblink:offline_queue_cache";

export class OfflineQueueSyncEngine {
  private static listeners: Array<(isOnline: boolean) => void> = [];

  static isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  static getQueuedActions(): QueuedOfflineAction[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static queueAction(action: Omit<QueuedOfflineAction, "id" | "timestamp">): QueuedOfflineAction {
    const item: QueuedOfflineAction = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    const current = this.getQueuedActions();
    const next = [...current, item];
    try {
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(next));
    } catch {}
    return item;
  }

  static removeAction(id: string) {
    const current = this.getQueuedActions();
    const next = current.filter((a) => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(next));
    } catch {}
  }

  static cacheQueueState(queueId: string, state: any) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_STATE}:${queueId}`, JSON.stringify({
        state,
        cachedAt: Date.now(),
      }));
    } catch {}
  }

  static getCachedQueueState(queueId: string): any | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_STATE}:${queueId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state || null;
    } catch {
      return null;
    }
  }
}
