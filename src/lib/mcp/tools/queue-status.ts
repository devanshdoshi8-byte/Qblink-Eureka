import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "get_queue_status",
  title: "Get live queue status",
  description: "Live snapshot of one queue: now serving token, number waiting, average wait so far and estimated wait for a new joiner.",
  inputSchema: { queue_id: z.string().uuid().describe("Queue id from list_queues.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ queue_id }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data: queue, error: qErr } = await supabase
      .from("queues")
      .select("id,name,status,current_token,next_token,estimated_service_time,queue_type")
      .eq("id", queue_id)
      .maybeSingle();
    if (qErr) return fail(qErr.message);
    if (!queue) return fail("Queue not found or not accessible to this user.");

    const { data: visitors, error: vErr } = await supabase
      .from("queue_visitors")
      .select("status,joined_at,served_at")
      .eq("queue_id", queue_id);
    if (vErr) return fail(vErr.message);

    const rows = visitors ?? [];
    const waiting = rows.filter((v) => v.status === "waiting" || v.status === "checked_in").length;
    const served = rows.filter((v) => v.status === "served" && v.served_at);
    const avgServiceMinutes = served.length
      ? Math.round(
          served.reduce(
            (sum, v) => sum + (new Date(v.served_at as string).getTime() - new Date(v.joined_at as string).getTime()) / 60000,
            0,
          ) / served.length,
        )
      : (queue.estimated_service_time ?? 5);

    const snapshot = {
      queue_id: queue.id,
      queue_name: queue.name,
      queue_status: queue.status,
      now_serving: queue.current_token,
      people_waiting: waiting,
      served_today: served.length,
      average_wait_minutes: avgServiceMinutes,
      estimated_wait_for_new_joiner_minutes: waiting * (queue.estimated_service_time ?? 5),
    };
    return { ...text(snapshot), structuredContent: snapshot };
  },
});