import { describe, it, expect, beforeEach } from "vitest";

/**
 * End-to-end style test for the restaurant parent-child queue architecture.
 *
 * These tests exercise the *same isolation contract* that the Postgres
 * RPCs (`join_restaurant_queue`, `call_next`, `get_queue_forecast`) uphold,
 * using an in-memory simulator so the guarantee is verifiable without a
 * live database. If the model changes, these tests will need to change too.
 *
 * Guarantees under test:
 *  - Each configured table size gets its own child queue.
 *  - Joining with a party size routes into the correct child queue.
 *  - Now Serving, People Ahead, Waiting Count and Forecast for a given
 *    child queue are computed only from that child's visitors — never
 *    mixed with siblings.
 */

type Status = "waiting" | "called" | "served";

interface Visitor {
  id: string;
  queueId: string;
  token: number;
  status: Status;
  joinedAt: number;
  calledAt?: number;
  servedAt?: number;
  phone?: string;
}

interface ChildQueue {
  id: string;
  parentId: string;
  tableSize: number;
  currentToken: number;
  nextToken: number;
}

interface ParentQueue {
  id: string;
  type: "restaurant";
  tableConfig: Array<{ seats: number; count: number }>;
  estimatedServiceTime: number;
}

let visitors: Visitor[];
let children: ChildQueue[];
let parent: ParentQueue;
let vid = 0;

const syncChildren = () => {
  const active = parent.tableConfig
    .filter((t) => t.count > 0)
    .map((t) => t.seats);
  for (const seats of active) {
    if (!children.find((c) => c.tableSize === seats)) {
      children.push({
        id: `child-${seats}`,
        parentId: parent.id,
        tableSize: seats,
        currentToken: 0,
        nextToken: 1,
      });
    }
  }
};

const joinRestaurant = (tableSize: number, phone?: string) => {
  const configured = parent.tableConfig.some(
    (t) => t.seats === tableSize && t.count > 0
  );
  if (!configured) throw new Error("table size not available");
  syncChildren();
  const child = children.find((c) => c.tableSize === tableSize)!;
  const token = child.nextToken;
  child.nextToken += 1;
  const visitor: Visitor = {
    id: `v${++vid}`,
    queueId: child.id,
    token,
    status: "waiting",
    joinedAt: Date.now(),
    phone,
  };
  visitors.push(visitor);
  return { visitorId: visitor.id, token, childQueueId: child.id };
};

const callNext = (childQueueId: string) => {
  // Auto-complete any prior called visitor for this child only.
  visitors
    .filter((v) => v.queueId === childQueueId && v.status === "called")
    .forEach((v) => {
      v.status = "served";
      v.servedAt = Date.now();
    });
  const next = visitors
    .filter((v) => v.queueId === childQueueId && v.status === "waiting")
    .sort((a, b) => a.token - b.token)[0];
  if (!next) return null;
  next.status = "called";
  next.calledAt = Date.now();
  const child = children.find((c) => c.id === childQueueId)!;
  child.currentToken = next.token;
  return next;
};

const statsFor = (childQueueId: string) => {
  const child = children.find((c) => c.id === childQueueId)!;
  const mine = visitors.filter((v) => v.queueId === childQueueId);
  const waiting = mine.filter((v) => v.status === "waiting");
  return {
    nowServing: child.currentToken || null,
    peopleAhead: waiting.length,
    waitingCount: waiting.length,
    estimatedWaitMinutes: waiting.length * parent.estimatedServiceTime,
  };
};

// Ahead-of-a-specific-visitor: independent per child queue.
const aheadOf = (visitorId: string) => {
  const me = visitors.find((v) => v.id === visitorId)!;
  return visitors.filter(
    (v) =>
      v.queueId === me.queueId &&
      v.status === "waiting" &&
      v.token < me.token
  ).length;
};

// Toy forecast: joins-per-hour bucket, scoped strictly to one child queue.
const forecast = (childQueueId: string) => {
  const mine = visitors.filter((v) => v.queueId === childQueueId);
  const buckets: Record<number, number> = {};
  for (const v of mine) {
    const h = new Date(v.joinedAt).getHours();
    buckets[h] = (buckets[h] || 0) + 1;
  }
  return buckets;
};

beforeEach(() => {
  visitors = [];
  children = [];
  vid = 0;
  parent = {
    id: "parent-1",
    type: "restaurant",
    estimatedServiceTime: 5,
    tableConfig: [
      { seats: 2, count: 4 },
      { seats: 4, count: 3 },
      { seats: 6, count: 2 },
    ],
  };
  syncChildren();
});

describe("Restaurant parent-child queue isolation (E2E behavior contract)", () => {
  it("provisions one child queue per configured table size", () => {
    expect(children.map((c) => c.tableSize).sort()).toEqual([2, 4, 6]);
  });

  it("routes joins into the child queue that matches the party size", () => {
    const a = joinRestaurant(2);
    const b = joinRestaurant(4);
    const c = joinRestaurant(6);
    expect(a.childQueueId).toBe("child-2");
    expect(b.childQueueId).toBe("child-4");
    expect(c.childQueueId).toBe("child-6");
  });

  it("rejects joins for unconfigured table sizes", () => {
    expect(() => joinRestaurant(8)).toThrow(/not available/);
  });

  it("keeps token numbering independent per child queue", () => {
    const first2 = joinRestaurant(2).token;
    const second2 = joinRestaurant(2).token;
    const first4 = joinRestaurant(4).token;
    expect(first2).toBe(1);
    expect(second2).toBe(2);
    // Sibling queue starts its own token sequence at 1.
    expect(first4).toBe(1);
  });

  it("isolates Now Serving across sibling child queues", () => {
    joinRestaurant(2); // t1 in child-2
    joinRestaurant(2); // t2 in child-2
    joinRestaurant(4); // t1 in child-4

    callNext("child-2");

    expect(statsFor("child-2").nowServing).toBe(1);
    // The 4-seat queue was never called — must stay unaffected.
    expect(statsFor("child-4").nowServing).toBeNull();
    expect(statsFor("child-6").nowServing).toBeNull();
  });

  it("isolates People Ahead per child queue and per visitor", () => {
    const a2 = joinRestaurant(2);
    joinRestaurant(2);
    joinRestaurant(2);
    joinRestaurant(4);
    joinRestaurant(4);
    joinRestaurant(6);

    // Visitor 1 in the 2-seat queue has nobody ahead — siblings don't count.
    expect(aheadOf(a2.visitorId)).toBe(0);

    // Waiting counts must be strictly per child.
    expect(statsFor("child-2").peopleAhead).toBe(3);
    expect(statsFor("child-4").peopleAhead).toBe(2);
    expect(statsFor("child-6").peopleAhead).toBe(1);
  });

  it("isolates Estimated Wait per child queue", () => {
    joinRestaurant(2);
    joinRestaurant(2);
    joinRestaurant(4);

    // 2 waiting * 5min service = 10 min for the 2-seat line.
    expect(statsFor("child-2").estimatedWaitMinutes).toBe(10);
    // 4-seat line has only its own visitor.
    expect(statsFor("child-4").estimatedWaitMinutes).toBe(5);
    // 6-seat line has none.
    expect(statsFor("child-6").estimatedWaitMinutes).toBe(0);
  });

  it("keeps Queue Forecast buckets scoped to a single child queue", () => {
    joinRestaurant(2);
    joinRestaurant(2);
    joinRestaurant(4);
    joinRestaurant(6);

    const f2 = forecast("child-2");
    const f4 = forecast("child-4");
    const f6 = forecast("child-6");

    const total = (b: Record<number, number>) =>
      Object.values(b).reduce((a, n) => a + n, 0);

    expect(total(f2)).toBe(2);
    expect(total(f4)).toBe(1);
    expect(total(f6)).toBe(1);
  });

  it("advancing one child queue never mutates siblings' waiting counts", () => {
    joinRestaurant(2);
    joinRestaurant(2);
    joinRestaurant(4);
    joinRestaurant(4);

    const before4 = statsFor("child-4").waitingCount;
    callNext("child-2");
    callNext("child-2");
    const after4 = statsFor("child-4").waitingCount;

    expect(after4).toBe(before4);
  });
});