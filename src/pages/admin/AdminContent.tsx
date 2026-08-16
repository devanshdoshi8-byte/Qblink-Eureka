import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Save, Plus, Trash2 } from "lucide-react";

const DEFAULT_KEYS = [
  { key: "homepage.hero", label: "Homepage Hero", fields: ["badge", "headline", "subtitle", "primary_cta", "secondary_cta"] },
  { key: "homepage.features", label: "Feature Cards (list)", fields: [] },
  { key: "homepage.faq", label: "FAQ (list)", fields: [] },
  { key: "about", label: "About Section", fields: ["title", "body"] },
  { key: "footer", label: "Footer", fields: ["tagline", "email", "twitter", "linkedin"] },
  { key: "contact", label: "Contact", fields: ["email", "phone", "address"] },
  { key: "founder", label: "Founder Info", fields: ["name", "role", "bio", "email"] },
  { key: "legal.privacy", label: "Privacy Policy", fields: ["body"] },
  { key: "legal.terms", label: "Terms of Service", fields: ["body"] },
  { key: "legal.help", label: "Help Center", fields: ["body"] },
];

const AdminContent = () => {
  const [activeKey, setActiveKey] = useState(DEFAULT_KEYS[0].key);
  const [rows, setRows] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_content").select("*");
    const map: Record<string, any> = {};
    (data || []).forEach((r: any) => (map[r.key] = r.value));
    setRows(map);
    setLoading(false);
  };

  const save = async (key: string, value: any) => {
    const { error } = await supabase.from("site_content").upsert({ key, value });
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setRows((r) => ({ ...r, [key]: value })); }
  };

  const active = DEFAULT_KEYS.find((k) => k.key === activeKey)!;
  const value = rows[activeKey] ?? {};
  const isList = active.fields.length === 0;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Content Manager</h1>
          <p className="text-sm text-muted-foreground">Edit every piece of public copy without touching code.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-[240px,1fr] gap-6">
        <div className="bg-card rounded-2xl p-3 card-shadow self-start">
          {DEFAULT_KEYS.map((k) => (
            <button key={k.key} onClick={() => setActiveKey(k.key)} className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${activeKey === k.key ? "gradient-bg text-primary-foreground font-semibold" : "hover:bg-muted text-foreground"}`}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-foreground mb-4">{active.label}</h2>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : isList ? (
            <ListEditor value={Array.isArray(value) ? value : []} onSave={(v) => save(activeKey, v)} />
          ) : (
            <ObjectEditor fields={active.fields} value={value} onSave={(v) => save(activeKey, v)} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const ObjectEditor = ({ fields, value, onSave }: { fields: string[]; value: any; onSave: (v: any) => void }) => {
  const [local, setLocal] = useState<Record<string, string>>({});
  useEffect(() => { setLocal(Object.fromEntries(fields.map((f) => [f, value?.[f] ?? ""]))); }, [value, fields.join(",")]);
  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => (
        <div key={f}>
          <label className="text-xs font-medium text-foreground uppercase tracking-wide mb-1.5 block">{f.replace(/_/g, " ")}</label>
          {(f === "body" || f === "bio" || f === "subtitle") ? (
            <textarea value={local[f] || ""} onChange={(e) => setLocal({ ...local, [f]: e.target.value })} rows={5} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          ) : (
            <input value={local[f] || ""} onChange={(e) => setLocal({ ...local, [f]: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          )}
        </div>
      ))}
      <button onClick={() => onSave(local)} className="gradient-bg text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 self-start"><Save className="w-4 h-4" /> Save changes</button>
    </div>
  );
};

const ListEditor = ({ value, onSave }: { value: any[]; onSave: (v: any[]) => void }) => {
  const [items, setItems] = useState<any[]>(value);
  useEffect(() => setItems(value), [value]);
  const update = (i: number, k: string, v: string) => setItems(items.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const add = () => setItems([...items, { title: "", body: "" }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i} className="bg-muted/30 rounded-xl p-3 flex flex-col gap-2">
          <input value={it.title || ""} onChange={(e) => update(i, "title", e.target.value)} placeholder="Title / Question" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium" />
          <textarea value={it.body || ""} onChange={(e) => update(i, "body", e.target.value)} placeholder="Body / Answer" rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" />
          <button onClick={() => remove(i)} className="self-end text-xs text-danger hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={add} className="bg-card border border-border px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add item</button>
        <button onClick={() => onSave(items)} className="gradient-bg text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save list</button>
      </div>
    </div>
  );
};

export default AdminContent;