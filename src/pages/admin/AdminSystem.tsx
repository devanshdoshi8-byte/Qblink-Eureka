import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

const GROUPS = [
  { key: "branding", label: "Branding", fields: ["platform_name", "primary_color", "logo_url", "contact_email"] },
  { key: "queue_defaults", label: "Queue Defaults", fields: ["default_service_time", "max_queue_size", "auto_refresh_seconds"] },
  { key: "session", label: "Session", fields: ["timeout_minutes"] },
  { key: "providers", label: "OTP / Email Providers", fields: ["otp_provider", "email_provider", "sms_provider", "whatsapp_provider"] },
  { key: "wait_calc", label: "Waiting Time Calc", fields: ["formula", "buffer_minutes"] },
];
const AdminSystem = () => {
  const [rows, setRows] = useState<Record<string, any>>({});
  useEffect(() => { (async () => { const { data } = await supabase.from("system_settings").select("*"); const m: any = {}; (data || []).forEach((r: any) => m[r.key] = r.value); setRows(m); })(); }, []);
  const save = async (key: string, value: any) => {
    const { error } = await supabase.from("system_settings").upsert({ key, value });
    if (error) toast.error(error.message); else { toast.success("Saved"); setRows((r) => ({ ...r, [key]: value })); }
  };
  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Settings className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground">Branding, providers, defaults — applied across the platform.</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {GROUPS.map((g) => <Group key={g.key} group={g} value={rows[g.key] || {}} onSave={(v) => save(g.key, v)} />)}
      </div>
    </AdminLayout>
  );
};
const Group = ({ group, value, onSave }: any) => {
  const [local, setLocal] = useState<Record<string, string>>({});
  useEffect(() => { setLocal(Object.fromEntries(group.fields.map((f: string) => [f, value?.[f] ?? ""]))); }, [value, group.key]);
  return (
    <div className="bg-card rounded-2xl p-6 card-shadow">
      <h2 className="font-bold text-foreground mb-4">{group.label}</h2>
      <div className="flex flex-col gap-3">
        {group.fields.map((f: string) => (
          <div key={f}>
            <label className="text-xs uppercase font-bold text-muted-foreground mb-1.5 block">{f.replace(/_/g, " ")}</label>
            <input value={local[f] || ""} onChange={(e) => setLocal({ ...local, [f]: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          </div>
        ))}
        <button onClick={() => onSave(local)} className="gradient-bg text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold self-start flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
      </div>
    </div>
  );
};
export default AdminSystem;