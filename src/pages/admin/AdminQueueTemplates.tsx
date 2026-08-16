import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutTemplate, Plus, Trash2 } from "lucide-react";

const empty = { name: "", description: "", queue_type: "standard", estimated_service_time: 5, seating_policy: "", category: "" };

const AdminQueueTemplates = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const { data } = await supabase.from("queue_templates").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };

  const create = async () => {
    if (!form.name) return toast.error("Name required");
    const { error } = await supabase.from("queue_templates").insert(form);
    if (error) toast.error(error.message); else { toast.success("Template created"); setForm(empty); fetchAll(); }
  };
  const remove = async (id: string) => { if (!confirm("Delete template?")) return; await supabase.from("queue_templates").delete().eq("id", id); fetchAll(); };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><LayoutTemplate className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Queue Templates</h1>
        <p className="text-sm text-muted-foreground">Reusable presets that businesses can apply to new queues.</p></div>
      </div>
      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow self-start">
          <h2 className="font-bold text-foreground mb-4">New template</h2>
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Type" value={form.queue_type} options={["standard", "restaurant", "pickup", "service"]} onChange={(v) => setForm({ ...form, queue_type: v })} />
              <Input type="number" label="Service min" value={form.estimated_service_time} onChange={(v) => setForm({ ...form, estimated_service_time: Number(v) || 5 })} />
            </div>
            <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Select label="Seating policy" value={form.seating_policy || ""} options={["", "strict", "flexible"]} onChange={(v) => setForm({ ...form, seating_policy: v })} />
            <button onClick={create} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Create template</button>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">All templates ({rows.length})</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No templates yet.</p> : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.queue_type} · {r.estimated_service_time}min · {r.category || "—"}</p>
                  </div>
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">{options.map((o: string) => <option key={o} value={o}>{o || "—"}</option>)}</select></div>
);
export default AdminQueueTemplates;