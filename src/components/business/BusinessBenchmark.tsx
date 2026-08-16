import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gauge, TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";

interface Benchmark {
  category: string;
  business_avg_seconds: number;
  category_avg_seconds: number;
  business_sample: number;
  category_sample: number;
  peer_business_count: number;
  faster_percent: number | null;
  direction: "faster" | "slower" | null;
}

const fmtSec = (s: number) => {
  if (!s || s <= 0) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const m = s / 60;
  return `${m < 10 ? m.toFixed(1) : Math.round(m)} min`;
};

export default function BusinessBenchmark({ businessId }: { businessId: string }) {
  const [data, setData] = useState<Benchmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await (supabase as any).rpc("get_business_benchmark", { p_business_id: businessId });
    if (error) { setError(error.message); setLoading(false); return; }
    const row = Array.isArray(data) ? data[0] : data;
    setData(row || null);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [businessId]);

  const faster = data?.direction === "faster";
  const hasComparison = data && data.faster_percent !== null && data.peer_business_count > 0 && data.business_sample >= 3;

  return (
    <div className={`rounded-2xl border p-4 ${faster ? "border-success/30 bg-success-soft/40" : data?.direction === "slower" ? "border-warning/30 bg-warning-soft/40" : "border-primary/20 bg-primary/5"}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
          <Gauge className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground flex-1">Business Benchmarking</p>
        <button onClick={load} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg disabled:opacity-50" aria-label="Refresh benchmark">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {!error && loading && !data && (
        <div className="space-y-2">
          <div className="h-3 rounded bg-muted animate-pulse" />
          <div className="h-3 rounded bg-muted animate-pulse w-3/5" />
        </div>
      )}

      {!error && data && (
        <>
          {hasComparison ? (
            <div className="flex items-start gap-3">
              {faster
                ? <TrendingUp className="w-5 h-5 text-success shrink-0 mt-0.5" />
                : <TrendingDown className="w-5 h-5 text-warning shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  You serve customers{" "}
                  <span className={`font-bold ${faster ? "text-success" : "text-warning"}`}>
                    {data.faster_percent}% {data.direction}
                  </span>{" "}
                  than similar {data.category.toLowerCase()} businesses on Qblink.
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your avg service: <span className="font-semibold text-foreground">{fmtSec(data.business_avg_seconds)}</span>
                  {" · "}Category avg: <span className="font-semibold text-foreground">{fmtSec(data.category_avg_seconds)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Based on {data.business_sample} of your served visitors vs {data.category_sample} across {data.peer_business_count} peer {data.peer_business_count === 1 ? "business" : "businesses"} (last 60 days).
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.business_sample < 3
                ? `Serve a few more customers to unlock benchmarking against other ${data.category.toLowerCase()} businesses. (${data.business_sample}/3 so far)`
                : data.peer_business_count === 0
                  ? `You're the first ${data.category.toLowerCase()} business on Qblink — your numbers will become the benchmark as others join.`
                  : "Not enough peer data yet to benchmark."}
            </p>
          )}
        </>
      )}
    </div>
  );
}