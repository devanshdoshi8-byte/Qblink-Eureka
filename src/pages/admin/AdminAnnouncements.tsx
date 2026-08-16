import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2 } from "lucide-react";

const empty = { title: "", body: "", scope: "platform", display_type: "banner", severity: "info", cta_label: "", cta_url: "", is_active: true, starts_at: "", ends_at: "" };

const AdminAnnouncements = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };

  const save = async () => {
    if (!form.title) return toast.error("Title required");
    const payload = { ...form, starts_at: form.starts_at || null, ends_at: form.ends_at || null };
    const { error } = await supabase.from("announcements").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Announcement created"); setForm(empty); fetchAll(); }
  };
  const toggle = async (id: string, is_active: boolean) => { await supabase.from("announcements").update({ is_active: !is_active }).eq("id", id); fetchAll(); };
  const remove = async (id: string) => { if (!confirm("Delete announcement?")) return; await supabase.from("announcements").delete().eq("id", id); fetchAll(); };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Megaphone className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">Banners, popups, toasts and maintenance messages.</p></div>
      </div>
      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow self-start">
          <h2 className="font-bold text-foreground mb-4">New announcement</h2>
          <div className="flex flex-col gap-3">
            <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <div><label className="text-xs uppercase font-bold text-muted-foreground mb-1.5 block">Body</label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="input" /></div>
            <Select label="Scope" value={form.scope} options={["platform", "business", "customer"]} onChange={(v) => setForm({ ...form, scope: v })} />
            <Select label="Type" value={form.display_type} options={["banner", "popup", "toast", "maintenance"]} onChange={(v) => setForm({ ...form, display_type: v })} />
            <Select label="Severity" value={form.severity} options={["info", "success", "warning", "critical"]} onChange={(v) => setForm({ ...form, severity: v })} />
            <Input label="CTA label (optional)" value={form.cta_label} onChange={(v) => setForm({ ...form, cta_label: v })} />
            <Input label="CTA URL (optional)" value={form.cta_url} onChange={(v) => setForm({ ...form, cta_url: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Starts" type="datetime-local" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} />
              <Input label="Ends" type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} />
            </div>
            <button onClick={save} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Create</button>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">All announcements</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : (
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${r.severity === "critical" ? "bg-danger-soft text-danger" : r.severity === "warning" ? "bg-warning-soft text-warning" : "bg-primary/10 text-primary"}`}>{r.display_type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Scope: {r.scope} · {r.is_active ? "Active" : "Paused"}</p>
                  </div>
                  <button onClick={() => toggle(r.id, r.is_active)} className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/70">{r.is_active ? "Pause" : "Activate"}</button>
                  <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`.input{width:100%;padding:0.5rem 0.75rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));font-size:0.875rem}`}</style>
    </AdminLayout>
  );
};

const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div><label className="text-xs uppercase font-bold text-muted-foreground mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" /></div>
);
const Select = ({ label, value, options, onChange }: any) => (
  <div><label className="text-xs uppercase font-bold text-muted-foreground mb-1.5 block">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">{options.map((o: string) => <option key={o} value={o}>{o}</option>)}</select></div>
);

export default AdminAnnouncements;