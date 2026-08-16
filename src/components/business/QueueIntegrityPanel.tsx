import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, RotateCcw, CheckCircle2, XCircle, Clock, UserX, Activity, Save, ChevronDown, ChevronUp } from "lucide-react";

type Settings = {
  arrival_window_minutes: number;
  auto_expire_minutes: number;
  join_cooldown_minutes: number;
  duplicate_protection: boolean;
};

type Visitor = {
  id: string;
  token_number: number;
  visitor_name: string | null;
  phone: string | null;
  status: string;
  called_at: string | null;
  joined_at: string;
};

type LogRow = {
  id: string;
  action: string;
  actor: string;
  token_number: number | null;
  visitor_name: string | null;
  metadata: any;
  created_at: string;
};

const ARRIVAL_OPTIONS = [5, 10, 15, 20];
const EXPIRE_OPTIONS = [10, 20, 30, 45, 60];

const ACTION_STYLES: Record<string, { color: string; label: string; icon: any }> = {
  joined:      { color: "text-info bg-info-soft",    label: "Joined",      icon: CheckCircle2 },
  checked_in:  { color: "text-primary bg-primary",    label: "Checked In",  icon: CheckCircle2 },
  called:      { color: "text-info bg-info-soft",label: "Called",      icon: Activity },
  serving:     { color: "text-primary bg-primary",label: "Serving",     icon: Activity },
  completed:   { color: "text-success bg-success-soft",  label: "Completed",   icon: CheckCircle2 },
  skipped:     { color: "text-warning bg-warning-soft",label: "Skipped",     icon: UserX },
  recalled:    { color: "text-primary bg-primary/10",  label: "Recalled",    icon: RotateCcw },
  no_show:     { color: "text-danger bg-danger-soft",      label: "No Show",     icon: XCircle },
  cancelled:   { color: "text-muted-foreground bg-muted", label: "Cancelled",   icon: XCircle },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const QueueIntegrityPanel = ({ queueId }: { queueId: string }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [skipped, setSkipped] = useState<Visitor[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [expanded, setExpanded] = useState(true);

  const loadAll = useCallback(async () => {
    const [{ data: q }, { data: sk }, { data: lg }] = await Promise.all([
      supabase
        .from("queues")
        .select("arrival_window_minutes,auto_expire_minutes,join_cooldown_minutes,duplicate_protection")
        .eq("id", queueId)
        .maybeSingle() as any,
      supabase
        .from("queue_visitors")
        .select("id,token_number,visitor_name,phone,status,called_at,joined_at")
        .eq("queue_id", queueId)
        .in("status", ["skipped", "no_show"])
        .order("joined_at", { ascending: false })
        .limit(20) as any,
      (supabase as any)
        .from("queue_activity_log")
        .select("id,action,actor,token_number,visitor_name,metadata,created_at")
        .eq("queue_id", queueId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (q) setSettings(q as Settings);
    setSkipped((sk as Visitor[]) || []);
    setLog((lg as LogRow[]) || []);
  }, [queueId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto integrity sweep every 30s (no-show past arrival window, expire waiting).
  useEffect(() => {
    let cancelled = false;
    const sweep = async () => {
      const { error } = await (supabase as any).rpc("run_queue_integrity_sweep", { p_queue_id: queueId });
      if (!cancelled && !error) loadAll();
    };
    sweep();
    const t = setInterval(sweep, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [queueId, loadAll]);

  // Realtime updates for the log
  useEffect(() => {
    const ch = (supabase as any)
      .channel(`qal-${queueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "queue_activity_log", filter: `queue_id=eq.${queueId}` },
        () => loadAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queueId, loadAll]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("queues").update(settings as any).eq("id", queueId);
    setSaving(false);
    if (error) return toast.error("Could not save settings");
    toast.success("Integrity settings saved");
  };

  const recall = async (v: Visitor) => {
    const { error } = await (supabase as any).rpc("recall_visitor", { p_visitor_id: v.id });
    if (error) return toast.error(error.message || "Recall failed");
    toast.success(`#${v.token_number} moved back to Waiting`);
    loadAll();
  };

  return (
    <section
      aria-label="Queue integrity"
      className="mt-6 bg-card rounded-2xl card-shadow overflow-hidden border border-border"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Queue Integrity</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
            reduces fake joins & no-shows
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Settings */}
          {settings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingSelect
                label="Arrival window"
                hint="Auto no-show if not checked in after being called"
                icon={<Clock className="w-3.5 h-3.5" />}
                value={settings.arrival_window_minutes}
                options={ARRIVAL_OPTIONS}
                onChange={(n) => setSettings({ ...settings, arrival_window_minutes: n })}
                unit="min"
              />
              <SettingSelect
                label="Auto expire"
                hint="Auto remove a waiting visitor after this time"
                icon={<XCircle className="w-3.5 h-3.5" />}
                value={settings.auto_expire_minutes}
                options={EXPIRE_OPTIONS}
                onChange={(n) => setSettings({ ...settings, auto_expire_minutes: n })}
                unit="min"
              />
              <div>
                <label htmlFor="cooldown-input" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Join cooldown
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cooldown-input"
                    type="number"
                    min={0}
                    max={240}
                    value={settings.join_cooldown_minutes}
                    onChange={(e) =>
                      setSettings({ ...settings, join_cooldown_minutes: Math.max(0, Math.min(240, Number(e.target.value) || 0)) })
                    }
                    className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                  <span className="text-xs text-muted-foreground">min between rejoins (same phone)</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5" /> Duplicate protection
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.duplicate_protection}
                  onClick={() => setSettings({ ...settings, duplicate_protection: !settings.duplicate_protection })}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    settings.duplicate_protection
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${settings.duplicate_protection ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {settings.duplicate_protection ? "On — same phone blocked" : "Off"}
                </button>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-bg text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving…" : "Save settings"}
                </button>
              </div>
            </div>
          )}

          {/* Skipped / No-show list */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Skipped &amp; No-show — recall to bring back
            </h3>
            {skipped.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No skipped customers.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {skipped.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        #{v.token_number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {v.visitor_name || "Guest"}
                          <span className={`ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            v.status === "no_show" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                          }`}>
                            {v.status === "no_show" ? "No Show" : "Skipped"}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {v.phone ? `${v.phone} · ` : ""}Joined {fmtTime(v.joined_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => recall(v)}
                      aria-label={`Recall token ${v.token_number}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Recall
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity log */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Activity log
            </h3>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No activity yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {log.map((l) => {
                  const s = ACTION_STYLES[l.action] || { color: "text-muted-foreground bg-muted", label: l.action, icon: Activity };
                  const Icon = s.icon;
                  return (
                    <li key={l.id} className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold ${s.color}`}>
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                      <span className="text-foreground font-medium">
                        {l.token_number !== null ? `#${l.token_number}` : ""}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {l.visitor_name || ""}
                        {l.actor === "system" ? " · auto" : l.actor === "business" ? " · staff" : ""}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{fmtTime(l.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const SettingSelect = ({
  label, hint, icon, value, options, onChange, unit,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  value: number;
  options: number[];
  onChange: (n: number) => void;
  unit: string;
}) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
      {icon} {label}
    </label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            value === n
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {n} {unit}
        </button>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
  </div>
);

export default QueueIntegrityPanel;