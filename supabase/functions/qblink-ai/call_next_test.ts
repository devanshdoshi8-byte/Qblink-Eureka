// Integration tests for the atomic `call_next` RPC.
// Verifies that concurrent invocations and rapid double-clicks each advance
// the queue exactly once, with no skips, duplicates, or lost updates.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function setupQueue(visitorCount: number) {
  const db = admin();
  // Create a real auth user — businesses.owner_id has an FK to auth.users.
  const email = `qa+${crypto.randomUUID()}@qblink.test`;
  const { data: userRes, error: userErr } = await db.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (userErr) throw userErr;
  const ownerId = userRes.user!.id;

  const { data: biz, error: bizErr } = await db
    .from("businesses")
    .insert({ name: `test-${Date.now()}`, owner_id: ownerId })
    .select()
    .single();
  if (bizErr) throw bizErr;

  const { data: queue, error: qErr } = await db
    .from("queues")
    .insert({ business_id: biz.id, name: "test-queue", status: "active", next_token: 1, current_token: 0 })
    .select()
    .single();
  if (qErr) throw qErr;

  const rows = Array.from({ length: visitorCount }, (_, i) => ({
    queue_id: queue.id,
    token_number: i + 1,
    visitor_name: `v${i + 1}`,
    status: "waiting",
  }));
  const { error: vErr } = await db.from("queue_visitors").insert(rows);
  if (vErr) throw vErr;

  await db.from("queues").update({ next_token: visitorCount + 1 }).eq("id", queue.id);

  return { db, queueId: queue.id, businessId: biz.id, ownerId };
}

async function cleanup(businessId: string, ownerId: string) {
  const db = admin();
  // Cascade cleanup (no FKs, do it manually)
  const { data: queues } = await db.from("queues").select("id").eq("business_id", businessId);
  for (const q of queues || []) {
    await db.from("queue_visitors").delete().eq("queue_id", q.id);
  }
  await db.from("queues").delete().eq("business_id", businessId);
  await db.from("businesses").delete().eq("id", businessId);
  await db.auth.admin.deleteUser(ownerId).catch(() => {});
}

Deno.test("call_next: 5 concurrent calls advance queue exactly 5 times, in order, no duplicates", async () => {
  const { db, queueId, businessId, ownerId } = await setupQueue(8);
  try {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => db.rpc("call_next", { p_queue_id: queueId })),
    );

    const calledTokens = results
      .map((r) => (Array.isArray(r.data) ? r.data[0]?.token_number : null))
      .filter((t): t is number => typeof t === "number")
      .sort((a, b) => a - b);

    // Each concurrent call must have produced a unique token; sequential 1..5
    assertEquals(calledTokens, [1, 2, 3, 4, 5], "tokens advanced must be 1..5 with no skips/dupes");

    // DB state: exactly 1 'called' (the last one), 4 'served' (auto-finalized
    // by subsequent call_next calls), 3 still 'waiting'.
    const { data: visitors } = await db
      .from("queue_visitors")
      .select("token_number,status")
      .eq("queue_id", queueId)
      .order("token_number");

    const byStatus = (s: string) => visitors!.filter((v) => v.status === s).map((v) => v.token_number);
    assertEquals(byStatus("waiting"), [6, 7, 8]);
    assertEquals(byStatus("called").length + byStatus("served").length, 5);
    // The most recently called token is #5
    assertEquals(byStatus("called"), [5]);

    const { data: queue } = await db.from("queues").select("current_token").eq("id", queueId).single();
    assertEquals(queue!.current_token, 5);
  } finally {
    await cleanup(businessId, ownerId);
  }
});

Deno.test("call_next: rapid double-click only advances queue once per distinct call", async () => {
  const { db, queueId, businessId, ownerId } = await setupQueue(3);
  try {
    // Simulate a double-click: two RPCs fired with no await between.
    const [a, b] = await Promise.all([
      db.rpc("call_next", { p_queue_id: queueId }),
      db.rpc("call_next", { p_queue_id: queueId }),
    ]);

    const tokens = [a, b]
      .map((r) => (Array.isArray(r.data) ? r.data[0]?.token_number : null))
      .filter((t): t is number => typeof t === "number")
      .sort((x, y) => x - y);

    // Two distinct tokens, never the same one twice.
    assertEquals(tokens, [1, 2], "double-click must not call the same token twice");

    const { data: visitors } = await db
      .from("queue_visitors")
      .select("token_number,status")
      .eq("queue_id", queueId)
      .order("token_number");

    // #1 was auto-served when #2 was called; #2 is currently 'called'; #3 still waiting.
    assertEquals(visitors!.find((v) => v.token_number === 1)!.status, "served");
    assertEquals(visitors!.find((v) => v.token_number === 2)!.status, "called");
    assertEquals(visitors!.find((v) => v.token_number === 3)!.status, "waiting");
  } finally {
    await cleanup(businessId, ownerId);
  }
});

Deno.test("call_next: empty queue returns no row and clears current_token", async () => {
  const { db, queueId, businessId, ownerId } = await setupQueue(1);
  try {
    // Drain the one visitor, then call again on an empty queue.
    await db.rpc("call_next", { p_queue_id: queueId });
    // Mark the called visitor served so call_next has truly nothing left.
    await db.from("queue_visitors").update({ status: "served" }).eq("queue_id", queueId);

    const { data, error } = await db.rpc("call_next", { p_queue_id: queueId });
    assertEquals(error, null);
    assertEquals((data as unknown[])?.length ?? 0, 0);

    const { data: queue } = await db.from("queues").select("current_token").eq("id", queueId).single();
    assertEquals(queue!.current_token, 0);
  } finally {
    await cleanup(businessId, ownerId);
  }
});