import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "get_business_today_summary",
  title: "Today's flow summary",
  description: "Aggregate today's customer flow for a business: visitors joined, served, no-shows, cancelled, currently waiting and busiest hour.",
  inputSchema: { business_id: z.string().uuid().describe("Business id from list_businesses.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ business_id }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data: queues, error: qErr } = await supabase.from("queues").select("id,name").eq("business_id", business_id);
    if (qErr) return fail(qErr.message);
    const ids = (queues ?? []).map((q) => q.id);
    if (ids.length === 0) return fail("No queues found for this business, or it is not accessible to this user.");

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("queue_visitors")
      .select("status,joined_at,served_at")
      .in("queue_id", ids)
      .gte("joined_at", since.toISOString());
    if (error) return fail(error.message);

    const rows = data ?? [];
    const byHour = new Map<number, number>();
    for (const r of rows) {
      const h = new Date(r.joined_at as string).getHours();
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    const busiest = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
    const count = (s: string) => rows.filter((r) => r.status === s).length;

    const summary = {
      business_id,
      queues: queues?.length ?? 0,
      joined_today: rows.length,
      currently_waiting: count("waiting") + count("checked_in"),
      served: count("served"),
      no_shows: count("no_show"),
      cancelled: count("cancelled"),
      busiest_hour: busiest ? `${String(busiest[0]).padStart(2, "0")}:00` : null,
      busiest_hour_joins: busiest ? busiest[1] : 0,
    };
    return { ...text(summary), structuredContent: summary };
  },
});