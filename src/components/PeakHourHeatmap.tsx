import { useMemo } from "react";
import InfoHint from "@/components/InfoHint";

interface VisitorRow {
  joined_at: string;
  status: string;
  served_at?: string | null;
}

interface Props {
  visitors: VisitorRow[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8 → 20

/**
 * Lightweight peak-hour heatmap driven by real queue_visitors data.
 * No external chart lib — pure CSS grid. Mobile-friendly.
 */
const PeakHourHeatmap = ({ visitors }: Props) => {
  const { grid, max, busiestDay, busiestHour, avgWait } = useMemo(() => {
    const g: number[][] = DAYS.map(() => HOURS.map(() => 0));
    const dayTotals = DAYS.map(() => 0);
    const hourTotals = HOURS.map(() => 0);
    const waits: number[] = [];
    visitors.forEach((v) => {
      const d = new Date(v.joined_at);
      const dow = d.getDay();
      const h = d.getHours();
      const hi = HOURS.indexOf(h);
      if (hi >= 0) {
        g[dow][hi]++;
        dayTotals[dow]++;
        hourTotals[hi]++;
      }
      if (v.status === "served" && v.served_at) {
        const w = (new Date(v.served_at).getTime() - d.getTime()) / 60000;
        if (w > 0 && w < 600) waits.push(w);
      }
    });
    const max = Math.max(1, ...g.flat());
    const bdIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const bhIdx = hourTotals.indexOf(Math.max(...hourTotals));
    const avg = waits.length
      ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length)
      : 0;
    return {
      grid: g,
      max,
      busiestDay: DAYS[bdIdx] ?? "—",
      busiestHour: bhIdx >= 0 ? `${HOURS[bhIdx]}:00` : "—",
      avgWait: avg,
    };
  }, [visitors]);

  const empty = visitors.length === 0;

  return (
    <div className="bg-card rounded-2xl p-5 card-shadow">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-foreground">Peak hours</h3>
            <InfoHint
              title="Peak hours heatmap"
              description="Each cell shows how many people joined a queue on that weekday and hour — darker means busier."
              example="If Friday 19:00 is darkest, plan extra staff for Friday evenings."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Day × hour visitor density {empty ? "(no data yet)" : ""}
          </p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
            Busiest: {busiestDay} {busiestHour}
          </span>
          <span className="px-2 py-1 rounded-lg bg-muted text-foreground font-semibold">
            Avg wait: {avgWait}m
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div
            className="grid gap-1 text-[10px] text-muted-foreground"
            style={{ gridTemplateColumns: `36px repeat(${HOURS.length}, minmax(20px, 1fr))` }}
          >
            <div />
            {HOURS.map((h) => (
              <div key={h} className="text-center">{h}</div>
            ))}
            {DAYS.map((d, di) => (
              <Row key={d} day={d} cells={grid[di]} max={max} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Quieter</span>
        <div className="flex gap-1">
          {[0.1, 0.25, 0.45, 0.7, 1].map((o) => (
            <span
              key={o}
              className="h-2.5 w-4 rounded-sm"
              style={{ background: `hsl(var(--primary) / ${o})` }}
            />
          ))}
        </div>
        <span>Busier</span>
      </div>
    </div>
  );
};

const Row = ({ day, cells, max }: { day: string; cells: number[]; max: number }) => (
  <>
    <div className="text-xs font-semibold text-foreground self-center">{day}</div>
    {cells.map((v, i) => {
      const intensity = v === 0 ? 0 : 0.12 + (v / max) * 0.88;
      return (
        <div
          key={i}
          title={`${day} ${8 + i}:00 — ${v} visitor${v === 1 ? "" : "s"}`}
          className="aspect-square rounded-sm border border-border/40 transition-colors"
          style={{ background: `hsl(var(--primary) / ${intensity})` }}
        />
      );
    })}
  </>
);

export default PeakHourHeatmap;