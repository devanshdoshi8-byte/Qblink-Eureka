import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Plus, Trash2 } from "lucide-react";

const empty = { channel: "email", key: "", subject: "", body: "", is_active: true };
const AdminNotifications = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { const { data } = await supabase.from("notification_templates").select("*").order("channel"); setRows(data || []); };
  const create = async () => {
    if (!form.key || !form.body) return toast.error("Key and body required");
    const { error } = await supabase.from("notification_templates").insert(form);
    if (error) toast.error(error.message); else { toast.success("Template saved"); setForm(empty); fetchAll(); }
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("notification_templates").delete().eq("id", id); fetchAll(); };
  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Bell className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Notification Templates</h1>
          <p className="text-sm text-muted-foreground">Email, push, SMS, WhatsApp and in-app message templates.</p></div>
      </div>
      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow self-start flex flex-col gap-3">
          <h2 className="font-bold text-foreground">New template</h2>
          <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="input">
            {["email","push","sms","whatsapp","in_app"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Key (e.g. queue.joined)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="input" />
          <input placeholder="Subject (email only)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
          <textarea placeholder="Body — use {{variables}}" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input" />
          <button onClick={create} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Save template</button>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">All templates ({rows.length})</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No templates yet.</p> : (
            <div className="space-y-3">{rows.map((r) => (
              <div key={r.id} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.channel}</span>
                  <span className="text-sm font-semibold text-foreground">{r.key}</span>
                  <button onClick={() => remove(r.id)} className="ml-auto p-1 rounded-lg text-danger hover:bg-danger-soft"><Trash2 className="w-4 h-4" /></button>
                </div>
                {r.subject && <p className="text-xs font-medium text-foreground">{r.subject}</p>}
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}</div>
          )}
        </div>
      </div>
      <style>{`.input{width:100%;padding:0.5rem 0.75rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));font-size:0.875rem}`}</style>
    </AdminLayout>
  );
};
export default AdminNotifications;