import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Calendar, Users, CheckCircle, Clock, TrendingUp, AlertCircle, History as HistoryIcon } from "lucide-react";
import { format } from "date-fns";
import EmptyState from "@/components/EmptyState";

interface Session {
  id: string;
  queue_id: string;
  session_date: string;
  started_at: string;
  ended_at: string;
  total_joined: number;
  total_served: number;
  total_skipped: number;
  total_removed: number;
  total_no_show: number;
  avg_wait_minutes: number;
  peak_hour: number | null;
}

const QueueHistory = () => (
  <BusinessLayout>{(b) => <HistoryContent businessId={b.id} />}</BusinessLayout>
);

const HistoryContent = ({ businessId }: { businessId: string }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [queues, setQueues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: ss }] = await Promise.all([
        supabase.from("queues").select("id, name").eq("business_id", businessId),
        supabase.from("queue_sessions").select("*").eq("business_id", businessId).order("ended_at", { ascending: false }).limit(180),
      ]);
      setQueues(Object.fromEntries((qs || []).map(q => [q.id, q.name])));
      setSessions((ss as Session[]) || []);
      setLoading(false);
    })();
  }, [businessId]);

  const totals = sessions.reduce((a, s) => ({
    joined: a.joined + s.total_joined,
    served: a.served + s.total_served,
    noShow: a.noShow + s.total_no_show,
    waitSum: a.waitSum + s.avg_wait_minutes * (s.total_served || 0),
    waitN: a.waitN + (s.total_served || 0),
  }), { joined: 0, served: 0, noShow: 0, waitSum: 0, waitN: 0 });

  const avgWait = totals.waitN ? Math.round(totals.waitSum / totals.waitN) : 0;
  const noShowRate = totals.joined ? Math.round((totals.noShow / totals.joined) * 100) : 0;

  // Busiest day across history
  const dayTotals: Record<string, number> = {};
  sessions.forEach(s => {
    const d = format(new Date(s.session_date), "EEE");
    dayTotals[d] = (dayTotals[d] || 0) + s.total_joined;
  });
  const busiestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-primary" /> Queue History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Past business days, archived sessions and trends.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card icon={<Calendar className="w-5 h-5 text-primary" />} value={sessions.length} label="Days recorded" />
        <Card icon={<Users className="w-5 h-5 text-primary" />} value={totals.joined} label="Total visitors" />
        <Card icon={<Clock className="w-5 h-5 text-warning" />} value={`${avgWait}m`} label="Avg wait (all time)" />
        <Card icon={<AlertCircle className="w-5 h-5 text-danger" />} value={`${noShowRate}%`} label="No-show rate" />
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Daily Sessions</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Busiest day: <strong className="text-foreground">{busiestDay}</strong>
          </span>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon={HistoryIcon}
              title="No daily sessions archived yet"
              description="Every time you close a day, the full session — joined, served, skipped, average wait — gets snapshotted here for later review."
              cta={{ label: "Go to queue manager", to: "/dashboard" }}
              tip="Tap “Start New Day” on the queue manager at closing time to archive today and reset counters for tomorrow."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Queue</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                  <th className="px-4 py-3 text-right">Served</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Skipped</th>
                  <th className="px-4 py-3 text-right">No-show</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Avg wait</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Peak hour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{format(new Date(s.session_date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{queues[s.queue_id] || "—"}</td>
                    <td className="px-4 py-3 text-right">{s.total_joined}</td>
                    <td className="px-4 py-3 text-right text-success font-medium flex items-center justify-end gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> {s.total_served}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-warning">{s.total_skipped}</td>
                    <td className="px-4 py-3 text-right text-danger">{s.total_no_show}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">{Math.round(Number(s.avg_wait_minutes))}m</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">{s.peak_hour != null ? `${s.peak_hour}:00` : "—"}</td>
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

const Card = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="bg-card rounded-2xl p-5 card-shadow">
    <div className="mb-2">{icon}</div>
    <p className="text-3xl font-bold text-foreground mb-0.5">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default QueueHistory;