import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download } from "lucide-react";

const EXPORTS = [
  { key: "businesses", label: "Businesses", desc: "All registered businesses" },
  { key: "customer_profiles", label: "Customers", desc: "Customer accounts" },
  { key: "queues", label: "Queues", desc: "All queue configurations" },
  { key: "queue_visitors", label: "Queue Visitors", desc: "Complete visit history" },
  { key: "queue_sessions", label: "Queue Sessions", desc: "End-of-day rollups" },
  { key: "contact_submissions", label: "Support / Feedback", desc: "All inbound messages" },
  { key: "onboarding_leads", label: "Waitlist & Leads", desc: "Demo form submissions" },
  { key: "business_reviews", label: "Reviews", desc: "Customer reviews" },
  { key: "coupons", label: "Coupons", desc: "Marketing codes" },
  { key: "announcements", label: "Announcements", desc: "Platform announcements" },
];
const AdminExports = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const exportCsv = async (table: string) => {
    setLoading(table);
    const { data, error } = await (supabase.from(table as any) as any).select("*");
    setLoading(null);
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.info("No rows to export");
    const cols = Object.keys(data[0]);
    const csv = [cols.join(","), ...data.map((r: any) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${table}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} rows`);
  };
  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Download className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Export Center</h1>
          <p className="text-sm text-muted-foreground">Download any platform dataset as CSV.</p></div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORTS.map((e) => (
          <div key={e.key} className="bg-card rounded-2xl p-5 card-shadow">
            <p className="font-bold text-foreground">{e.label}</p>
            <p className="text-xs text-muted-foreground mb-4">{e.desc}</p>
            <button onClick={() => exportCsv(e.key)} disabled={loading === e.key} className="w-full gradient-bg text-primary-foreground py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" /> {loading === e.key ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};
export default AdminExports;