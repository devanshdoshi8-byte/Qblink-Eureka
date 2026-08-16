import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBusinesses from "./tools/list-businesses";
import listQueues from "./tools/list-queues";
import queueStatus from "./tools/queue-status";
import listWaitingVisitors from "./tools/list-waiting-visitors";
import businessSummary from "./tools/business-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "qblink-mcp",
  title: "Qblink",
  version: "0.1.0",
  instructions:
    "Tools for Qblink, a customer flow intelligence platform for walk-in businesses. Start with `list_businesses` to find the signed-in owner's businesses, then `list_queues` for their counters, `get_queue_status` for a live snapshot, `list_waiting_visitors` for who is in line, and `get_business_today_summary` for today's flow totals. All tools are read-only and scoped to the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBusinesses, listQueues, queueStatus, listWaitingVisitors, businessSummary],
});