import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { SkeletonTable } from "@/components/skeletons/DashboardSkeletons";
import {
  ArrowUp, ArrowDown, Star, Sparkles, Megaphone, MessageSquare,
  Search, EyeOff, Eye, Trash2, Loader2, Compass,
} from "lucide-react";

interface BizRow {
  id: string;
  name: string;
  category: string | null;
  is_recommended: boolean | null;
  is_featured: boolean | null;
  is_sponsored: boolean | null;
  display_rank: number | null;
  rating: number | null;
  total_reviews: number | null;
}

interface ReviewRow {
  id: string;
  business_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
}

const AdminDiscovery = () => {
  const [tab, setTab] = useState<"ranking" | "reviews">("ranking");
  const [rows, setRows] = useState<BizRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("admin-discovery")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_reviews" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchAll = async () => {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, category, is_recommended, rating, total_reviews, " +
        // @ts-ignore — new columns
        "is_featured, is_sponsored, display_rank")
      .order("display_rank" as any, { ascending: false })
      .order("created_at", { ascending: false });
    setRows((biz as any) || []);
    const { data: revs } = await (supabase as any)
      .from("business_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    setReviews((revs as any) || []);
    setLoading(false);
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q);
  });

  const updateBiz = async (id: string, patch: Partial<BizRow>) => {
    setSavingId(id);
    const { error } = await supabase.from("businesses").update(patch as any).eq("id", id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const sorted = [...filtered];
    const target = sorted[idx + dir];
    const current = sorted[idx];
    if (!target || !current) return;
    const a = current.display_rank ?? 0;
    const b = target.display_rank ?? 0;
    // ensure different ranks; if equal, bump current up/down
    let newCurrent = b;
    let newTarget = a;
    if (a === b) {
      newCurrent = a + (dir === -1 ? 1 : -1);
      newTarget = a;
    }
    await Promise.all([
      supabase.from("businesses").update({ display_rank: newCurrent } as any).eq("id", current.id),
      supabase.from("businesses").update({ display_rank: newTarget } as any).eq("id", target.id),
    ]);
    fetchAll();
  };

  const setRank = async (id: string, value: number) => {
    await updateBiz(id, { display_rank: value });
    // re-sort
    setRows(prev => [...prev].sort((x, y) => (y.display_rank ?? 0) - (x.display_rank ?? 0)));
  };

  const toggleHidden = async (r: ReviewRow) => {
    const { error } = await (supabase as any).from("business_reviews")
      .update({ is_hidden: !r.is_hidden }).eq("id", r.id);
    if (error) toast.error(error.message); else toast.success(r.is_hidden ? "Review visible" : "Review hidden");
  };

  const deleteReview = async (r: ReviewRow) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await (supabase as any).from("business_reviews").delete().eq("id", r.id);
    if (error) toast.error(error.message); else toast.success("Review deleted");
  };

  const bizName = (id: string) => rows.find(r => r.id === id)?.name || "Unknown";

  return (
    <AdminLayout>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" /> Discovery Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rank, feature, sponsor and recommend businesses across the customer discovery page. Moderate reviews.
          </p>
        </div>
      </div>

      <div className="inline-flex bg-card border border-border rounded-xl p-1 mb-4">
        {(["ranking", "reviews"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "ranking" ? "Ranking & Promotion" : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={6} headers={["#", "Business", "Category", "Sponsored", "Featured", "Recommended", "Rank", "Reorder"]} />
      ) : tab === "ranking" ? (
        <>
          <div className="bg-card rounded-2xl p-4 card-shadow mb-4 relative">
            <Search className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search businesses…"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left w-12">#</th>
                    <th className="px-3 py-3 text-left">Business</th>
                    <th className="px-3 py-3 text-left hidden md:table-cell">Category</th>
                    <th className="px-3 py-3 text-center">Sponsored</th>
                    <th className="px-3 py-3 text-center">Featured</th>
                    <th className="px-3 py-3 text-center">Recommended</th>
                    <th className="px-3 py-3 text-center">Rank</th>
                    <th className="px-3 py-3 text-right">Reorder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {r.name}
                          {savingId === r.id && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.is_sponsored && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary font-medium flex items-center gap-1"><Megaphone className="w-2.5 h-2.5" />Sponsored</span>}
                          {r.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info-soft text-info font-medium flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />Featured</span>}
                          {r.is_recommended && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning-soft text-warning font-medium flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" />Top Pick</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{r.category || "—"}</td>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={!!r.is_sponsored} onChange={e => updateBiz(r.id, { is_sponsored: e.target.checked })} className="w-4 h-4 accent-primary cursor-pointer" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={!!r.is_featured} onChange={e => updateBiz(r.id, { is_featured: e.target.checked })} className="w-4 h-4 accent-primary cursor-pointer" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={!!r.is_recommended} onChange={e => updateBiz(r.id, { is_recommended: e.target.checked })} className="w-4 h-4 accent-primary cursor-pointer" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          value={r.display_rank ?? 0}
                          onChange={e => setRank(r.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move up">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => move(idx, 1)} disabled={idx === filtered.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move down">
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No businesses found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Discovery order on the customer dashboard: <b>Sponsored</b> → <b>Featured</b> → <b>Recommended</b> → highest <b>Rank</b> → newest. Toggles save instantly.
          </p>
        </>
      ) : (
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={MessageSquare}
                title="No customer reviews yet"
                description="Every star rating and comment from real customers will land here so you can moderate, hide spam, or feature the best ones."
                tip="The first reviews usually arrive within a week of going live — encourage visitors to rate after they're served."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map(r => (
                <li key={r.id} className={`p-4 flex items-start gap-3 ${r.is_hidden ? "opacity-60" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{bizName(r.business_id)}</span>
                      <span className="flex items-center gap-0.5 text-warning text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                        ))}
                      </span>
                      {r.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Hidden</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{r.reviewer_name || "Anonymous"}</p>
                    {r.comment && <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => toggleHidden(r)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title={r.is_hidden ? "Show" : "Hide"}>
                      {r.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteReview(r)} className="p-2 rounded-lg hover:bg-danger-soft text-danger" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDiscovery;