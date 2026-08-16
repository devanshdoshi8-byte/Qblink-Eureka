import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowRight } from "lucide-react";

interface Props { businessId: string }

const bandStyles: Record<string, { label: string; color: string; ring: string }> = {
  excellent: { label: "Excellent", color: "text-success bg-success-soft", ring: "stroke-success" },
  good:      { label: "Good",      color: "text-success bg-success-soft", ring: "stroke-success" },
  attention: { label: "Needs Attention", color: "text-warning bg-warning-soft", ring: "stroke-warning" },
  poor:      { label: "Poor",      color: "text-warning bg-warning-soft", ring: "stroke-warning" },
  critical:  { label: "Critical",  color: "text-danger bg-danger-soft",      ring: "stroke-danger" },
};

const HealthScoreCard = ({ businessId }: Props) => {
  const [score, setScore] = useState<number | null>(null);
  const [band, setBand] = useState<string>("good");
  const [yesterday, setYesterday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.rpc("get_business_health", { p_business_id: businessId, p_days: 7 });
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!active) return;
      if (row?.score != null) {
        setScore(Number(row.score));
        setBand(row.band);
      }
      const { data: hist } = await supabase
        .from("queue_health_daily")
        .select("score, day")
        .eq("business_id", businessId)
        .is("queue_id", null)
        .order("day", { ascending: false })
        .limit(2);
      if (hist && hist.length >= 2 && active) setYesterday(Number(hist[1].score));
      // Lazy snapshot (fire-and-forget)
      supabase.rpc("snapshot_queue_health", { p_business_id: businessId }).then(() => {});
      setLoading(false);
    })();
    return () => { active = false; };
  }, [businessId]);

  const style = bandStyles[band] || bandStyles.good;
  const delta = score != null && yesterday != null ? Math.round((score - yesterday) * 10) / 10 : null;
  const circumference = 2 * Math.PI * 36;
  const pct = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Link to="/dashboard/queue-health" className="block bg-card rounded-2xl p-5 card-shadow hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue Health</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="h-20 animate-pulse bg-muted/50 rounded" />
      ) : score == null ? (
        <div className="py-3 text-sm text-muted-foreground">More queue data needed to compute a score.</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="36" className="stroke-muted" strokeWidth="6" fill="none" />
              <circle cx="40" cy="40" r="36" className={style.ring} strokeWidth="6" fill="none"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
              {Math.round(score)}
            </div>
          </div>
          <div className="min-w-0">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${style.color}`}>{style.label}</span>
            <p className="text-xs text-muted-foreground mt-1.5">
              {delta == null ? "First snapshot today" : delta === 0 ? "Same as yesterday" : delta > 0 ? `▲ ${delta} vs yesterday` : `▼ ${Math.abs(delta)} vs yesterday`}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
};

export default HealthScoreCard;