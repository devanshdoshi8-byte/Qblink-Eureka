import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Search, Download, Eye, Pause, Play, Trash2, RotateCcw, X } from "lucide-react";
import BusinessHealthBarChart from "@/components/health/BusinessHealthBarChart";
import HealthFactorDetail from "@/components/health/HealthFactorDetail";
import HealthAIAssistant from "@/components/health/HealthAIAssistant";
import { Activity } from "lucide-react";

interface BizRow {
  id: string;
  name: string;
  category: string;
  ownerId: string;
  status: string;
  queues: number;
  served: number;
  avgWait: number;
  createdAt: string;
  healthScore: number | null;
  healthBand: string | null;
}

const STATUS_CLS: Record<string, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-danger-soft text-danger",
};

const BAND_CLS: Record<string, string> = {
  excellent: "bg-success-soft text-success",
  good: "bg-success-soft text-success",
  attention: "bg-warning-soft text-warning",
  poor: "bg-warning-soft text-warning",
  critical: "bg-danger-soft text-danger",
};

const AdminBusinesses = () => {
  const [rows, setRows] = useState<BizRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<BizRow | null>(null);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel("admin-businesses")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, fetchData)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchData = async () => {
    const { data: bizs } = await supabase.from("businesses").select("id, name, category, owner_id, created_at").order("created_at", { ascending: false });
    if (!bizs) { setRows([]); return; }
    const { data: queues } = await supabase.from("queues").select("id, business_id, status");
    const { data: visitors } = await supabase.from("queue_visitors").select("queue_id, status, joined_at, served_at");

    const real: BizRow[] = bizs.map(b => {
      const bQueues = queues?.filter(q => q.business_id === b.id) || [];
      const qIds = bQueues.map(q => q.id);
      const bVisitors = visitors?.filter(v => qIds.includes(v.queue_id)) || [];
      const served = bVisitors.filter(v => v.status === "served");
      const waitTimes = served.filter(v => v.served_at).map(v => (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000);
      return {
        id: b.id,
        name: b.name,
        category: b.category || "Other",
        ownerId: b.owner_id,
        status: bQueues.some(q => q.status === "active") ? "active" : bQueues.length ? "inactive" : "no-queue",
        queues: bQueues.length,
        served: served.length,
        avgWait: waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0,
        createdAt: b.created_at,
        healthScore: null,
        healthBand: null,
      };
    });
    setRows(real);

    // Fetch health scores in parallel (admin authorized via SECURITY DEFINER)
    const health = await Promise.all(real.map(async (r) => {
      const { data } = await supabase.rpc("get_business_health", { p_business_id: r.id, p_days: 7 });
      const row: any = Array.isArray(data) ? data[0] : data;
      return { id: r.id, score: row?.score != null ? Number(row.score) : null, band: row?.band ?? null };
    }));
    const map = new Map(health.map(h => [h.id, h]));
    setRows(real.map(r => ({ ...r, healthScore: map.get(r.id)?.score ?? null, healthBand: map.get(r.id)?.band ?? null })));
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    const matchFilter = filter === "All" || r.status === filter || r.category === filter;
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const head = ["Business", "Category", "Status", "Queues", "Served", "Avg Wait (min)", "Created"];
    const headFull = [...head, "Health Score", "Health Band"];
    const csv = [headFull, ...filtered.map(r => [r.name, r.category, r.status, r.queues, r.served, r.avgWait, new Date(r.createdAt).toISOString().slice(0, 10), r.healthScore ?? "", r.healthBand ?? ""])]
      .map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `qblink-businesses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const updateAllQueues = async (bizId: string, status: string) => {
    const { error } = await supabase.from("queues").update({ status }).eq("business_id", bizId);
    if (error) toast.error(error.message);
  };

  const action = async (kind: "toggle" | "reset" | "delete", biz: BizRow) => {
    if (kind === "toggle") {
      const newStatus = biz.status === "active" ? "paused" : "active";
      await updateAllQueues(biz.id, newStatus);
      toast.success(`${biz.name}: queues ${newStatus}`);
    } else if (kind === "reset") {
      const { data: qs } = await supabase.from("queues").select("id").eq("business_id", biz.id);
      await Promise.all((qs || []).map(q => supabase.rpc("reset_queue_for_new_day", { p_queue_id: q.id })));
      toast.success(`${biz.name}: queues reset`);
    } else if (kind === "delete") {
      if (!confirm(`Permanently delete ${biz.name}? This removes its queues and history.`)) return;
      const { error } = await supabase.from("businesses").delete().eq("id", biz.id);
      if (error) toast.error(error.message); else toast.success(`${biz.name} deleted`);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Businesses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all businesses on Qblink — {rows.length} total · Live</p>
        </div>
        <button onClick={exportCSV} className="bg-card border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl p-4 card-shadow mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by business or category…"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option>All</option>
          <option>active</option><option>inactive</option><option>no-queue</option>
          <option>Restaurant</option><option>Clinic</option><option>Salon</option><option>Hospital</option><option>Hotel</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl p-5 card-shadow mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-foreground flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Queue Health Across Businesses</h2>
            <p className="text-xs text-muted-foreground">Click a bar to open that business's factor breakdown + AI coach.</p>
          </div>
          <p className="text-xs text-muted-foreground">{rows.filter(r => r.healthScore != null).length} of {rows.length} businesses scored</p>
        </div>
        <BusinessHealthBarChart
          rows={filtered.map(r => ({ id: r.id, name: r.name, score: r.healthScore, band: r.healthBand }))}
          onSelect={(id) => { const r = rows.find(x => x.id === id); if (r) setSelected(r); }}
        />
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Queues</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Served</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Avg Wait</th>
                <th className="px-4 py-3 text-left">Health</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.category}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLS[r.status] || "bg-muted text-muted-foreground"}`}>{r.status}</span></td>
                  <td className="px-4 py-3 hidden sm:table-cell">{r.queues}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{r.served}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{r.avgWait}m</td>
                  <td className="px-4 py-3">
                    {r.healthScore == null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${BAND_CLS[r.healthBand || "good"]}`}>
                        {Math.round(r.healthScore)} · {r.healthBand}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="View" onClick={() => setSelected(r)}><Eye className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title={r.status === "active" ? "Pause queues" : "Activate queues"} onClick={() => action("toggle", r)}>
                        {r.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </IconBtn>
                      <IconBtn title="Reset queues" onClick={() => action("reset", r)}><RotateCcw className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Delete" onClick={() => action("delete", r)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">No businesses match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <Detail biz={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
};

const IconBtn = ({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) => (
  <button title={title} onClick={onClick} className={`p-1.5 rounded-lg transition-colors ${danger ? "hover:bg-danger-soft text-danger" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
    {children}
  </button>
);

const Detail = ({ biz, onClose }: { biz: BizRow; onClose: () => void }) => {
  const [tab, setTab] = useState<"overview" | "health">("overview");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card rounded-2xl max-w-4xl w-full card-shadow my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">{biz.name}</h2>
            <p className="text-xs text-muted-foreground">{biz.category} · Created {new Date(biz.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex border-b border-border px-5">
          <button onClick={() => setTab("overview")} className={`px-3 py-2.5 text-sm font-medium border-b-2 transition ${tab === "overview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>Overview</button>
          <button onClick={() => setTab("health")} className={`px-3 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${tab === "health" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            <Activity className="w-3.5 h-3.5" /> Queue Health & AI
          </button>
        </div>
        <div className="p-5">
          {tab === "overview" ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <Stat label="Queues" value={biz.queues} />
                <Stat label="Total served" value={biz.served} />
                <Stat label="Avg wait" value={`${biz.avgWait}m`} />
                <Stat label="Status" value={biz.status} />
                <Stat label="Health score" value={biz.healthScore == null ? "—" : `${Math.round(biz.healthScore)}/100`} />
                <Stat label="Health band" value={biz.healthBand || "—"} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Owner ID: {biz.ownerId}</p>
            </>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              <HealthFactorDetail businessId={biz.id} />
              <HealthAIAssistant businessId={biz.id} businessName={biz.name} variant="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-muted/40 rounded-xl p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground capitalize">{value}</p>
  </div>
);

export default AdminBusinesses;
