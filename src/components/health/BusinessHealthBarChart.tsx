import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface Row { name: string; score: number | null; band: string | null; id: string; }

const COLOR: Record<string, string> = {
  excellent: "hsl(142 76% 36%)",
  good: "hsl(142 71% 45%)",
  attention: "hsl(48 96% 53%)",
  poor: "hsl(25 95% 53%)",
  critical: "hsl(0 84% 60%)",
};

export default function BusinessHealthBarChart({ rows, onSelect }: { rows: Row[]; onSelect?: (id: string) => void }) {
  const data = rows
    .filter(r => r.score != null)
    .map(r => ({ name: r.name.length > 18 ? r.name.slice(0, 17) + "…" : r.name, score: Math.round(r.score!), band: r.band || "good", id: r.id }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">No health data yet. Businesses need ≥10 served visitors in the last 7 days.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground flex-wrap">
        {Object.entries(COLOR).map(([band, color]) => (
          <div key={band} className="flex items-center gap-1.5 capitalize">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} /> {band}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={130} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 12 }}
            formatter={(v: any, _n, p: any) => [`${v}/100 · ${p.payload.band}`, "Health"]}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} onClick={(d: any) => onSelect?.(d.id)} cursor={onSelect ? "pointer" : undefined}>
            {data.map((d, i) => <Cell key={i} fill={COLOR[d.band] || COLOR.good} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}