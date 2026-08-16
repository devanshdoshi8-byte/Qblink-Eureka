import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Search, Download, Clock, CheckCircle, Phone, SkipForward } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";

interface Token {
  id: string;
  token_number: number;
  visitor_name: string | null;
  phone: string | null;
  status: string;
  joined_at: string;
  served_at: string | null;
  queue_id: string;
}

const FILTERS = ["All", "waiting", "called", "served", "skipped"] as const;

const Tokens = () => (
  <BusinessLayout>{(business) => <TokensContent businessId={business.id} />}</BusinessLayout>
);

const TokensContent = ({ businessId }: { businessId: string }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokens();
    const channel = supabase
      .channel(`tokens-${businessId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, fetchTokens)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  const fetchTokens = async () => {
    const { data: queues } = await supabase.from("queues").select("id").eq("business_id", businessId);
    const ids = queues?.map(q => q.id) || [];
    let data: any[] = [];
    if (ids.length > 0) {
      const res = await supabase.from("queue_visitors").select("*").in("queue_id", ids).order("joined_at", { ascending: false });
      data = res.data || [];
    }
    setTokens(data);
    setLoading(false);
  };

  const filtered = tokens.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.visitor_name?.toLowerCase().includes(q) || t.phone?.includes(q) || String(t.token_number).includes(q);
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const rows = [["Token", "Customer", "Phone", "Joined", "Served", "Status"]];
    filtered.forEach(t => rows.push([
      String(t.token_number), t.visitor_name || "Guest", t.phone || "",
      format(new Date(t.joined_at), "yyyy-MM-dd HH:mm"),
      t.served_at ? format(new Date(t.served_at), "yyyy-MM-dd HH:mm") : "",
      t.status,
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `qblink-tokens-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const todayCount = tokens.filter(t => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(t.joined_at) >= today;
  }).length;

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: any; label: string }> = {
      waiting: { cls: "bg-warning-soft text-warning", icon: Clock, label: "Waiting" },
      called: { cls: "bg-info-soft text-info", icon: Phone, label: "Called" },
      served: { cls: "bg-success-soft text-success", icon: CheckCircle, label: "Served" },
      skipped: { cls: "bg-warning-soft text-warning", icon: SkipForward, label: "Skipped" },
      removed: { cls: "bg-danger-soft text-danger", icon: SkipForward, label: "Removed" },
    };
    const s = map[status] || { cls: "bg-muted text-muted-foreground", icon: Clock, label: status };
    const Icon = s.icon;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}><Icon className="w-3 h-3" />{s.label}</span>;
  };

  const getWait = (t: Token) => {
    if (t.served_at) {
      return `${Math.round((new Date(t.served_at).getTime() - new Date(t.joined_at).getTime()) / 60000)}m`;
    }
    if (t.status === "waiting") {
      return `~${Math.round((Date.now() - new Date(t.joined_at).getTime()) / 60000)}m`;
    }
    return "—";
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tokens</h1>
          <p className="text-sm text-muted-foreground mt-1">All tokens issued today — {todayCount} total</p>
        </div>
        <button onClick={exportCSV} className="bg-card border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl p-4 card-shadow mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              compact
              icon={Search}
              title="No tokens yet"
              description={search || filter !== "All"
                ? "No tokens match this search or filter right now."
                : "Tokens appear here the moment your first customer joins a queue today."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Token</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Served</th>
                  <th className="px-4 py-3 text-left">Wait</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs">#{t.token_number}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.visitor_name || "Guest"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(t.joined_at), "HH:mm")}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.served_at ? format(new Date(t.served_at), "HH:mm") : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getWait(t)}</td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tokens;
