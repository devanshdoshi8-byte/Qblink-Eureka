import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Mail, Bug, Lightbulb, Briefcase, Star, Calendar, HelpCircle } from "lucide-react";

const TABS = [
  { key: "all", label: "All", icon: MessageSquare },
  { key: "general", label: "General", icon: Mail },
  { key: "bug", label: "Bugs", icon: Bug },
  { key: "feedback", label: "Feedback", icon: Star },
  { key: "feature_request", label: "Feature ideas", icon: Lightbulb },
  { key: "investor", label: "Investors", icon: Briefcase },
  { key: "partnership", label: "Partners", icon: Briefcase },
  { key: "demo", label: "Demos", icon: Calendar },
  { key: "support", label: "Support", icon: HelpCircle },
];

const AdminSupport = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState("all");

  useEffect(() => { fetchAll(); }, [tab]);
  const fetchAll = async () => {
    let q = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    if (tab !== "all") q = q.eq("category", tab);
    const { data } = await q;
    setRows(data || []);
  };

  const setCategory = async (id: string, category: string) => {
    await supabase.from("contact_submissions").update({ category }).eq("id", id);
    fetchAll();
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><MessageSquare className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Support Center</h1>
        <p className="text-sm text-muted-foreground">Unified inbox: bugs, feedback, feature ideas, demo requests and more.</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap ${tab === t.key ? "gradient-bg text-primary-foreground font-semibold" : "bg-card text-foreground hover:bg-muted"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No submissions in this category.</p> :
          rows.map((r) => (
            <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{r.name || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">· {r.email}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.category}</span>
                </div>
                {r.subject && <p className="text-sm font-medium text-foreground mb-1">{r.subject}</p>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}{r.source ? ` · via ${r.source}` : ""}</p>
              </div>
              <select value={r.category} onChange={(e) => setCategory(r.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-lg bg-background border border-border">
                {TABS.filter((t) => t.key !== "all").map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          ))}
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;