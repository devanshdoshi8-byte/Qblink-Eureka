import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "list_waiting_visitors",
  title: "List waiting visitors",
  description: "List the people currently in a queue, in join order, with token number, status, party size and how long they have waited.",
  inputSchema: {
    queue_id: z.string().uuid().describe("Queue id from list_queues."),
    limit: z.number().int().min(1).max(100).nullable().describe("Max rows to return. Defaults to 25."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ queue_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("queue_visitors")
      .select("token_number,visitor_name,status,party_size,assigned_table_size,joined_at,called_at")
      .eq("queue_id", queue_id)
      .in("status", ["waiting", "checked_in", "called", "serving"])
      .order("token_number", { ascending: true })
      .limit(limit ?? 25);
    if (error) return fail(error.message);
    const now = Date.now();
    const rows = (data ?? []).map((v) => ({
      ...v,
      waiting_minutes: Math.round((now - new Date(v.joined_at as string).getTime()) / 60000),
    }));
    return { ...text(rows), structuredContent: { visitors: rows } };
  },
});