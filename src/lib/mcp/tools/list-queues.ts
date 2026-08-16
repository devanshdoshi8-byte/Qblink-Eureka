import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "list_queues",
  title: "List queues for a business",
  description: "List the queues (counters) of a business owned by the signed-in user, including type, status and seating configuration.",
  inputSchema: {
    business_id: z.string().uuid().describe("Business id from list_businesses."),
    include_internal: z
      .boolean()
      .nullable()
      .describe("Include internal table-size child queues. Defaults to false (counters only)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ business_id, include_internal }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    let query = supabaseForUser(ctx)
      .from("queues")
      .select("id,name,status,queue_type,seating_policy,current_token,next_token,estimated_service_time,parent_queue_id,table_size")
      .eq("business_id", business_id)
      .order("created_at", { ascending: true });
    if (!include_internal) query = query.is("parent_queue_id", null);
    const { data, error } = await query;
    if (error) return fail(error.message);
    return { ...text(data ?? []), structuredContent: { queues: data ?? [] } };
  },
});