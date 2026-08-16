import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Plus, Trash2 } from "lucide-react";

const empty = { code: "", description: "", discount_type: "percent", discount_value: 10, max_redemptions: 100, applies_to: "all", expires_at: "", is_active: true };

const AdminMarketing = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };

  const create = async () => {
    if (!form.code) return toast.error("Code required");
    const payload = { ...form, code: form.code.toUpperCase().trim(), expires_at: form.expires_at || null, max_redemptions: form.max_redemptions || null };
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Coupon created"); setForm(empty); fetchAll(); }
  };
  const toggle = async (id: string, is_active: boolean) => { await supabase.from("coupons").update({ is_active: !is_active }).eq("id", id); fetchAll(); };
  const remove = async (id: string) => { if (!confirm("Delete coupon?")) return; await supabase.from("coupons").delete().eq("id", id); fetchAll(); };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Tag className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Marketing & Coupons</h1>
        <p className="text-sm text-muted-foreground">Promotional codes, referral campaigns, invite incentives.</p></div>
      </div>
      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow self-start">
          <h2 className="font-bold text-foreground mb-4">New coupon</h2>
          <div className="flex flex-col gap-3">
            <Input label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
            <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Type" value={form.discount_type} options={["percent", "fixed", "free_trial"]} onChange={(v) => setForm({ ...form, discount_type: v })} />
              <Input type="number" label="Value" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: Number(v) || 0 })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" label="Max redemptions" value={form.max_redemptions} onChange={(v) => setForm({ ...form, max_redemptions: Number(v) || 0 })} />
              <Select label="Applies to" value={form.applies_to} options={["all", "business", "customer"]} onChange={(v) => setForm({ ...form, applies_to: v })} />
            </div>
            <Input type="datetime-local" label="Expires" value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} />
            <button onClick={create} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Create coupon</button>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">All coupons ({rows.length})</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No coupons yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">Code</th><th>Discount</th><th>Used</th><th>Status</th><th></th></tr></thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-2 font-mono font-bold text-foreground">{r.code}</td>
                      <td>{r.discount_type === "percent" ? `${r.discount_value}%` : r.discount_type === "fixed" ? `₹${r.discount_value}` : "Trial"}</td>
                      <td>{r.redemptions_count}{r.max_redemptions ? `/${r.max_redemptions}` : ""}</td>
                      <td><span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{r.is_active ? "Active" : "Paused"}</span></td>
                      <td className="text-right space-x-1">
                        <button onClick={() => toggle(r.id, r.is_active)} className="text-xs px-2 py-1 rounded-lg bg-muted">{r.is_active ? "Pause" : "Activate"}</button>
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default AdminMarketing;