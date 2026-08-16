import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Clock, AlertTriangle, Info, Users } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ForecastRow {
  hour: number;
  day_of_week: number;
  avg_joins: number;
  avg_wait_minutes: number;
  no_show_rate: number;
  sample_count: number;
  total_sample: number;
  distinct_days: number;
  confidence: number;
}

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fmtHour = (h: number) => {
  const am = h < 12;
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}${am ? "am" : "pm"}`;
};

const levelOf = (joins: number, peak: number): "Low" | "Medium" | "High" => {
  if (peak <= 0) return "Low";
  const r = joins / peak;
  if (r >= 0.66) return "High";
  if (r >= 0.33) return "Medium";
  return "Low";
};

interface Props {
  queueId: string;
  audience: "business" | "customer";
}

const QueueForecast = ({ queueId, audience }: Props) => {
  const [rows, setRows] = useState<ForecastRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("get_queue_forecast", { p_queue_id: queueId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("forecast error", error);
          setRows([]);
        } else {
          setRows((data as ForecastRow[]) || []);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queueId]);

  const summary = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const totalSample = rows[0]?.total_sample ?? 0;
    const days = rows[0]?.distinct_days ?? 0;
    const confidence = rows[0]?.confidence ?? 0;
    const dow = rows[0]?.day_of_week ?? new Date().getDay();
    const peak = rows.reduce((m, r) => Math.max(m, Number(r.avg_joins) || 0), 0);
    const sorted = [...rows].sort((a, b) => Number(b.avg_joins) - Number(a.avg_joins));
    const peakHours = sorted.filter((r) => Number(r.avg_joins) > 0 && Number(r.avg_joins) >= peak * 0.7).slice(0, 3);
    const quiet = [...rows]
      .filter((r) => r.hour >= 8 && r.hour <= 21)
      .sort((a, b) => Number(a.avg_joins) - Number(b.avg_joins))
      .slice(0, 2);
    const predictedVolume = rows.reduce((s, r) => s + (Number(r.avg_joins) || 0), 0);
    const avgWait =
      rows.filter((r) => Number(r.avg_wait_minutes) > 0).reduce((s, r) => s + Number(r.avg_wait_minutes), 0) /
      Math.max(1, rows.filter((r) => Number(r.avg_wait_minutes) > 0).length);
    const avgNoShow =
      rows.reduce((s, r) => s + Number(r.no_show_rate || 0), 0) / Math.max(1, rows.length);
    return { totalSample, days, confidence, dow, peak, peakHours, quiet, predictedVolume, avgWait, avgNoShow };
  }, [rows]);

  const chartData = useMemo(() => {
    if (!rows) return [];
    const peak = summary?.peak ?? 0;
    const nowHour = new Date().getHours();
    return rows.map((r) => ({
      hour: r.hour,
      label: fmtHour(r.hour),
      historical: Number(r.avg_joins),
      predicted: Number(r.avg_joins) * (1 + (Number(r.confidence) - 0.5) * 0.2),
      isPast: r.hour < nowHour,
      level: levelOf(Number(r.avg_joins), peak),
    }));
  }, [rows, summary]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const insufficient = !summary || summary.totalSample < 5 || summary.days < 2 || summary.peak <= 0;

  if (insufficient) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Queue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          More queue data is needed to generate forecasts. Forecasts unlock after a few days of activity.
        </CardContent>
      </Card>
    );
  }

  const dowName = DOW_NAMES[summary.dow];
  const confidencePct = Math.round(summary.confidence * 100);
  const topPeak = summary.peakHours[0];
  const peakRange =
    summary.peakHours.length > 0
      ? `${fmtHour(Math.min(...summary.peakHours.map((r) => r.hour)))}–${fmtHour(
          Math.max(...summary.peakHours.map((r) => r.hour)) + 1,
        )}`
      : "—";
  const quietRange = summary.quiet.length > 0 ? summary.quiet.map((r) => fmtHour(r.hour)).join(", ") : "—";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Queue Forecast
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {dowName} · {confidencePct}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {audience === "business" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Rush hours" value={peakRange} />
            <Stat
              icon={<Users className="h-3.5 w-3.5" />}
              label="Predicted volume"
              value={`${Math.round(summary.predictedVolume)}`}
              hint="today"
            />
            <Stat
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Avg wait"
              value={`${summary.avgWait > 0 ? summary.avgWait.toFixed(1) : "—"} min`}
            />
            <Stat
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="No-show rate"
              value={`${Math.round(summary.avgNoShow * 100)}%`}
            />
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              High traffic expected {peakRange !== "—" ? `around ${peakRange}` : "later today"}.
            </p>
            <p className="text-muted-foreground mt-1">
              Best time to visit: <span className="font-medium text-foreground">{quietRange}</span>. Expected crowd
              level right now:{" "}
              <span className="font-medium text-foreground">
                {levelOf(chartData.find((c) => c.hour === new Date().getHours())?.historical ?? 0, summary.peak)}
              </span>
              .
            </p>
          </div>
        )}

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="qf-hist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="qf-pred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number, name: string) => [Math.round(v * 10) / 10, name === "historical" ? "Historical" : "Predicted"]}
                labelFormatter={(l) => `Hour ${l}`}
              />
              <Area type="monotone" dataKey="historical" stroke="hsl(var(--primary))" fill="url(#qf-hist)" strokeWidth={2} />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeDasharray="4 3"
                fill="url(#qf-pred)"
                strokeWidth={1.5}
              />
              <ReferenceLine x={fmtHour(new Date().getHours())} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {audience === "business" && topPeak && (
          <div className="flex gap-2 text-xs text-muted-foreground rounded-md border border-border/60 p-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <p>
              Expected rush around <span className="font-medium text-foreground">{fmtHour(topPeak.hour)}</span> because
              this queue historically receives the most visitors at that hour on{" "}
              <span className="font-medium text-foreground">{dowName}s</span> ({Math.round(Number(topPeak.avg_joins))}{" "}
              joins/hr avg over {summary.days} similar day{summary.days === 1 ? "" : "s"}). Based on{" "}
              {summary.totalSample} historical joins, average wait{" "}
              {summary.avgWait > 0 ? `${summary.avgWait.toFixed(1)} min` : "—"}, no-show rate{" "}
              {Math.round(summary.avgNoShow * 100)}%.
            </p>
          </div>
        )}

        {audience === "customer" && (
          <p className="text-[11px] text-muted-foreground">
            Forecast based on the last {summary.days} {dowName}
            {summary.days === 1 ? "" : "s"} of queue activity.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Stat = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-md border border-border/60 p-2">
    <div className="flex items-center gap-1 text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-1 font-semibold text-foreground text-sm">
      {value} {hint && <span className="text-[10px] text-muted-foreground font-normal">{hint}</span>}
    </div>
  </div>
);

export default QueueForecast;