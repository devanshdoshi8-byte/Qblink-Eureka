import { defineTool } from "@lovable.dev/mcp-js";
import { fail, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "list_businesses",
  title: "List my businesses",
  description: "List the Qblink businesses owned by the signed-in user, with id, name, category and live-visibility settings.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("businesses")
      .select("id,name,category,address,discovery_enabled,remote_joining_enabled,show_live_queue_info,created_at")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return { ...text(data ?? []), structuredContent: { businesses: data ?? [] } };
  },
});