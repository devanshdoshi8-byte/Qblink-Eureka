import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2 } from "lucide-react";

const empty = { audience: "all", category: "", question: "", answer: "", priority: 0, is_active: true };
const AdminAIKnowledge = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { const { data } = await supabase.from("ai_knowledge").select("*").order("priority", { ascending: false }); setRows(data || []); };
  const create = async () => {
    if (!form.question || !form.answer) return toast.error("Question and answer required");
    const { error } = await supabase.from("ai_knowledge").insert(form);
    if (error) toast.error(error.message); else { toast.success("Added"); setForm(empty); fetchAll(); }
  };
  const remove = async (id: string) => { if (!confirm("Delete entry?")) return; await supabase.from("ai_knowledge").delete().eq("id", id); fetchAll(); };
  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><Sparkles className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">Train the Qblink AI assistant with FAQs, prompts and support content.</p></div>
      </div>
      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow self-start flex flex-col gap-3">
          <h2 className="font-bold text-foreground">New entry</h2>
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="input">
            {["all","customer","business","founder","admin"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
          <input placeholder="Question / trigger" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input" />
          <textarea placeholder="Answer / response" rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="input" />
          <input type="number" placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })} className="input" />
          <button onClick={create} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">All entries ({rows.length})</h2>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No entries yet.</p> : (
            <div className="space-y-3">{rows.map((r) => (
              <div key={r.id} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.audience}</span>
                  {r.category && <span className="text-[10px] text-muted-foreground">{r.category}</span>}
                  <button onClick={() => remove(r.id)} className="ml-auto p-1 rounded-lg text-danger hover:bg-danger-soft"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm font-semibold text-foreground">{r.question}</p>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.answer}</p>
              </div>
            ))}</div>
          )}
        </div>
      </div>
      <style>{`.input{width:100%;padding:0.5rem 0.75rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));font-size:0.875rem}`}</style>
    </AdminLayout>
  );
};
export default AdminAIKnowledge;