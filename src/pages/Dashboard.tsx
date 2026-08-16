import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, Clock, CheckCircle, SkipForward, UserPlus, Phone, Trash2, QrCode, Monitor, BarChart3, Pause, Play, RefreshCw, Sunrise, Info, Printer, Layers, CalendarCheck, Hourglass } from "lucide-react";
import { publicUrl } from "@/lib/publicUrl";
import { QRCodeSVG } from "qrcode.react";
import BusinessLayout from "@/components/business/BusinessLayout";
import AIInsights from "@/components/AIInsights";
import BusinessBenchmark from "@/components/business/BusinessBenchmark";
import QueueForecast from "@/components/QueueForecast";
import HealthScoreCard from "@/components/health/HealthScoreCard";
import QueueHealthAlerts from "@/components/QueueHealthAlerts";
import QueueIntegrityPanel from "@/components/business/QueueIntegrityPanel";
import { useQueueSync } from "@/hooks/useQueueSync";
import RestaurantTableConfig, { TableSize, COMMON_PARTY_SIZES, PartySizeMode } from "@/components/business/RestaurantTableConfig";
import EmptyState from "@/components/EmptyState";
import InfoHint from "@/components/InfoHint";
import { hapticCopy, hapticRefresh, hapticSuccess } from "@/lib/haptics";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PrintReadyQRKit } from "@/components/business/PrintReadyQRKit";
import { DailyPerformanceSummary } from "@/components/business/DailyPerformanceSummary";
import { ServiceManagementModal } from "@/components/business/ServiceManagementModal";
import { OfflineStatusBar } from "@/components/business/OfflineStatusBar";
import { ExecutiveTelemetryBar } from "@/components/business/ExecutiveTelemetryBar";

interface Queue {
  id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  note: string | null;
  current_token: number | null;
  next_token: number | null;
}

interface Visitor {
  id: string;
  token_number: number;
  visitor_name: string | null;
  phone: string | null;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  party_size?: number | null;
  assigned_table_size?: number | null;
}

const Dashboard = () => {
  return (
    <BusinessLayout>
      {(business) => <QueueManager businessId={business.id} businessName={business.name} />}
    </BusinessLayout>
  );
};

const QueueManager = ({ businessId, businessName }: { businessId: string; businessName: string }) => {
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAddWalkin, setShowAddWalkin] = useState(false);
  const [newQueue, setNewQueue] = useState<{
    name: string;
    estimated_service_time: number;
    note: string;
    queue_type: "standard" | "appointment" | "restaurant";
    config_mode: "single" | "counters" | "seating" | "departments";
    table_config: TableSize[];
    seating_policy: "strict" | "flexible";
    party_sizes: number[];
    party_size_mode: PartySizeMode;
  }>({
    name: "",
    estimated_service_time: 5,
    note: "",
    queue_type: "standard",
    config_mode: "single",
    table_config: [
      { seats: 2, count: 1 },
      { seats: 4, count: 1 },
      { seats: 6, count: 1 },
      { seats: 8, count: 1 },
    ],
    seating_policy: "strict",
    party_sizes: [...COMMON_PARTY_SIZES],
    party_size_mode: "common",
  });
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinParty, setWalkinParty] = useState<number>(2);
  const [showReset, setShowReset] = useState(false);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPrintKit, setShowPrintKit] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const {
    queues,
    getDetailVisitors,
    getQueueStats,
    refresh,
    refreshing,
    lastRefreshAt,
    realtimeStatus,
    lastRealtimeEventAt,
    consistencyWarnings,
  } = useQueueSync({ businessId, includeDetails: true, source: "business-dashboard" });

  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0] || null;
  const visitors: Visitor[] = getDetailVisitors(selectedQueue?.id);
  const syncedStats = getQueueStats(selectedQueue?.id);
  const showDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("qdebug") === "1";

  const handleRefresh = async () => {
    if (refreshing) return;
    hapticRefresh();
    await refresh();
  };

  const createQueue = async () => {
    if (!newQueue.name.trim()) return;
    const isRestaurant = newQueue.queue_type === "restaurant";
    if (isRestaurant && newQueue.table_config.length === 0) {
      toast.error("Add at least one table size");
      return;
    }
    const insertPayload: any = {
      business_id: businessId,
      name: newQueue.name,
      estimated_service_time: newQueue.estimated_service_time,
      note: newQueue.note || null,
      queue_type: newQueue.queue_type,
    };
    if (isRestaurant) {
      insertPayload.table_config = newQueue.table_config;
      insertPayload.seating_policy = newQueue.seating_policy;
      insertPayload.party_sizes = newQueue.party_sizes.length
        ? newQueue.party_sizes
        : [...COMMON_PARTY_SIZES];
      insertPayload.party_size_mode = newQueue.party_size_mode;
    }
    const { data, error } = await supabase.from("queues").insert(insertPayload).select().single();
    if (error) { toast.error("Failed to create queue"); return; }
    toast.success("Queue created!");
    setShowCreate(false);
    setNewQueue({
      name: "",
      estimated_service_time: 5,
      note: "",
      queue_type: "standard",
      config_mode: "single",
      table_config: [
        { seats: 2, count: 1 },
        { seats: 4, count: 1 },
        { seats: 6, count: 1 },
        { seats: 8, count: 1 },
      ],
      seating_policy: "strict",
      party_sizes: [...COMMON_PARTY_SIZES],
      party_size_mode: "common",
    });
    if (data) {
      setSelectedQueueId(data.id);
      await refresh();
    }
  };

  const [callingNext, setCallingNext] = useState(false);

  const addWalkin = async () => {
    if (!selectedQueue) return;
    const isRestaurant = (selectedQueue as any).queue_type === "restaurant";
    const rpcArgs: any = {
      p_queue_id: selectedQueue.id,
      p_visitor_name: walkinName || "Walk-in",
      p_phone: walkinPhone || null,
    };
    if (isRestaurant) rpcArgs.p_party_size = walkinParty;
    const { data, error } = await supabase.rpc("join_queue", rpcArgs);
    if (error) { toast.error(error.message || "Failed to add walk-in"); return; }
    const row = Array.isArray(data) ? data[0] : data;
    hapticSuccess();
    toast.success(`Token #${row?.token_number ?? ""} added`);
    setShowAddWalkin(false);
    setWalkinName("");
    setWalkinPhone("");
    setWalkinParty(2);
    refresh();
  };

  const callNext = async () => {
    if (!selectedQueue || callingNext) return;
    setCallingNext(true);
    try {
      const { data, error } = await supabase.rpc("call_next", { p_queue_id: selectedQueue.id });
      if (error) { toast.error(error.message || "Call Next failed"); return; }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) { toast.info("No one waiting"); }
      else { hapticSuccess(); toast.success(`Calling #${row.token_number}`); }
      refresh();
    } finally {
      setCallingNext(false);
    }
  };

  const serveTable = async (seats: number) => {
    if (!selectedQueue || callingNext) return;
    setCallingNext(true);
    try {
      const { data, error } = await supabase.rpc("serve_restaurant_next" as any, {
        p_queue_id: selectedQueue.id,
        p_table_size: seats,
      });
      if (error) { toast.error(error.message || "Could not serve next"); return; }
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) { toast.info(`No one waiting for a ${seats}-seat table`); }
      else { hapticSuccess(); toast.success(`Calling #${row.token_number} (party of ${row.party_size}) for ${row.assigned_table_size}-seat table`); }
      refresh();
    } finally {
      setCallingNext(false);
    }
  };

  const markServed = async (id: string, t: number) => {
    await supabase.from("queue_visitors").update({ status: "served", served_at: new Date().toISOString() }).eq("id", id);
    hapticSuccess();
    toast.success(`#${t} served`);
  };
  const skipVisitor = async (id: string, t: number) => {
    const { error } = await (supabase as any).rpc("skip_visitor", { p_visitor_id: id });
    if (error) return toast.error(error.message || "Skip failed");
    toast.info(`#${t} skipped`);
    refresh();
  };
  const markNoShow = async (id: string, t: number) => {
    const { error } = await (supabase as any).rpc("mark_no_show", { p_visitor_id: id });
    if (error) return toast.error(error.message || "Could not mark no-show");
    toast.info(`#${t} marked no-show`);
    refresh();
  };
  const removeVisitor = async (id: string, t: number) => {
    await supabase.from("queue_visitors").update({ status: "removed" }).eq("id", id);
    toast.info(`#${t} removed`);
  };

  const toggleQueueStatus = async () => {
    if (!selectedQueue) return;
    const newStatus = selectedQueue.status === "active" ? "paused" : "active";
    await supabase.from("queues").update({ status: newStatus }).eq("id", selectedQueue.id);
    toast.success(`Queue ${newStatus}`);
    refresh();
  };

  const stopQueue = async () => {
    if (!selectedQueue) return;
    await supabase.from("queues").update({ status: "closed" }).eq("id", selectedQueue.id);
    toast.info("Queue stopped");
    refresh();
  };

  const startNewDay = async () => {
    if (!selectedQueue || resetting) return;
    setResetting(true);
    try {
      const { data, error } = await supabase.rpc("reset_queue_for_new_day", { p_queue_id: selectedQueue.id });
      if (error) { toast.error(error.message || "Could not start a new day"); return; }
      const s: any = Array.isArray(data) ? data[0] : data;
      hapticSuccess();
      toast.success(`New day started — ${s?.total_joined ?? 0} visitors archived`);
      setShowReset(false);
      await refresh();
    } finally {
      setResetting(false);
    }
  };

  const waiting = visitors.filter(v => v.status === "waiting");
  const called = visitors.filter(v => v.status === "called");
  const served = visitors.filter(v => v.status === "served");
  const joinUrl = selectedQueue
    ? ((selectedQueue as any).parent_queue_id && (selectedQueue as any).table_size
        ? publicUrl(`/join/${(selectedQueue as any).parent_queue_id}?size=${(selectedQueue as any).table_size}`)
        : publicUrl(`/join/${selectedQueue.id}`))
    : "";
  const displayUrl = selectedQueue ? publicUrl(`/display/${selectedQueue.id}`) : "";

  return (
    <div>
      <div className="mb-4">
        <OfflineStatusBar onSyncPending={handleRefresh} />
      </div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Queue Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your live customer queue</p>
        </div>
        {selectedQueue && (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              selectedQueue.status === "active" ? "bg-success-soft text-success" :
              selectedQueue.status === "paused" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"
            }`}>
              ● Queue {selectedQueue.status}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <QueueHealthAlerts businessId={businessId} />
          </div>
        )}
      </div>

      <ExecutiveTelemetryBar
        queue={selectedQueue}
        visitors={visitors}
        businessName={businessName}
      />

      {showDebug && selectedQueue && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">Queue sync debug</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <span>Active queue: {selectedQueue.id}</span>
            <span>Selected queue: {selectedQueue.name}</span>
            <span>Waiting: {syncedStats.waiting}</span>
            <span>Called: {syncedStats.called}</span>
            <span>Realtime: {realtimeStatus}</span>
            <span>Last refresh: {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : "—"}</span>
            <span>Last event: {lastRealtimeEventAt ? new Date(lastRealtimeEventAt).toLocaleTimeString() : "—"}</span>
            <span>Warnings: {consistencyWarnings.length || "none"}</span>
          </div>
        </div>
      )}

      {/* Queue tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(() => {
          // Show parent queues, then group child (per-table-size) queues under them.
          const parents = queues.filter((q: any) => !q.parent_queue_id);
          const nodes: any[] = [];
          parents.forEach((q: any) => {
            const stats = getQueueStats(q.id);
            nodes.push(
              <button key={q.id} onClick={() => setSelectedQueueId(q.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedQueue?.id === q.id ? "gradient-bg text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted card-shadow"
                }`}>
                {q.name}
                {q.queue_type === "restaurant" && (
                  <span className="ml-1.5 text-xs opacity-70">· share link</span>
                )}
              </button>
            );
            const children = queues
              .filter((c: any) => c.parent_queue_id === q.id)
              .sort((a: any, b: any) => (a.table_size || 0) - (b.table_size || 0));
            children.forEach((c: any) => {
              const cStats = getQueueStats(c.id);
              nodes.push(
                <button key={c.id} onClick={() => setSelectedQueueId(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedQueue?.id === c.id
                      ? "gradient-bg text-primary-foreground border-transparent"
                      : "bg-card text-foreground/80 border-border hover:border-primary/40 card-shadow"
                  }`}>
                  {c.table_size}-seat
                  <span className="ml-1.5 opacity-70">· {cStats.waiting} waiting</span>
                </button>
              );
            });
          });
          return nodes;
        })()}
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> New Queue
        </button>
      </div>

      {selectedQueue ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
           <Stat
             icon={<Users className="w-4 h-4" />}
             label="Waiting"
             value={syncedStats.waiting}
             tip={{
               title: "Waiting",
               description: "People currently in line for this queue — not yet called.",
               example: "If 8 customers have joined and none called, this shows 8.",
             }}
           />
           <Stat
             icon={<Phone className="w-4 h-4 text-primary" />}
             label="Currently Serving"
             value={selectedQueue.current_token ? `#${selectedQueue.current_token}` : "—"}
             accent
             tip={{
               title: "Currently Serving",
               description: "The token number you're attending to right now.",
               example: "Shows #12 when token 12 has been called and not yet served.",
             }}
           />
           <Stat
             icon={<CheckCircle className="w-4 h-4 text-success" />}
             label="Served Today"
             value={syncedStats.served}
             tip={{
               title: "Served Today",
               description: "Total customers marked as served since midnight.",
             }}
           />
           <Stat
             icon={<Clock className="w-4 h-4 text-warning" />}
             label="Avg Wait (min)"
             value={syncedStats.avgWait || "—"}
             tip={{
               title: "Average Wait",
               description: "Average minutes between joining the queue and being served today.",
               example: "An 8-minute average means most guests wait about 8 minutes.",
             }}
           />
          </div>

          <div className="mb-6">
            <HealthScoreCard businessId={businessId} />
          </div>

          <div className="mb-6">
            <AIInsights insight="queue" mode="business" businessId={businessId} />
          </div>

          <div className="mb-6">
            <BusinessBenchmark businessId={businessId} />
          </div>

          <div className="mb-6">
            <QueueForecast queueId={selectedQueue.id} audience="business" />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={toggleQueueStatus} className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
              selectedQueue.status === "active" ? "bg-warning-soft text-warning hover:bg-warning-soft" : "bg-success-soft text-success hover:bg-success-soft"
            }`}>
              {selectedQueue.status === "active" ? <><Pause className="w-4 h-4" /> Pause Queue</> : <><Play className="w-4 h-4" /> Resume Queue</>}
            </button>
            {(selectedQueue as any).queue_type === "restaurant" ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Serve table:</span>
                {(((selectedQueue as any).table_config as TableSize[] | null) || []).map((t) => (
                  <button
                    key={t.seats}
                    onClick={() => serveTable(t.seats)}
                    disabled={callingNext}
                    className="gradient-bg text-primary-foreground px-5 py-3 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t.seats}-seat
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={callNext} className="gradient-bg text-primary-foreground px-5 py-3 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <Phone className="w-4 h-4" /> Call Next
              </button>
            )}
            <button onClick={stopQueue} className="bg-danger-soft text-danger hover:bg-danger-soft px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Stop Queue
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowReset(true)} className="bg-warning-soft text-warning hover:bg-warning-soft px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Sunrise className="w-4 h-4" /> Start New Day
              </button>
              <button
                type="button"
                onClick={() => setShowResetInfo(v => !v)}
                onBlur={() => setTimeout(() => setShowResetInfo(false), 150)}
                title="What does this do?"
                aria-label="About Start New Day"
                className="relative w-8 h-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
              >
                <Info className="w-4 h-4" />
                {showResetInfo && (
                  <div className="absolute z-30 top-10 right-0 w-72 text-left bg-card border border-border rounded-xl p-3 card-shadow text-xs text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground mb-1">Start a fresh business day</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Today's queue is closed and saved to history.</li>
                      <li>A new session begins with token #1.</li>
                      <li>Anyone still waiting is marked as a no-show.</li>
                      <li>All past data stays available in Analytics & History.</li>
                    </ul>
                  </div>
                )}
              </button>
            </div>
            <button onClick={() => setShowAddWalkin(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Walk-in
            </button>
            <button onClick={() => setShowQR(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <QrCode className="w-4 h-4" /> QR Code
            </button>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Public Display
            </a>
            <button onClick={() => setShowPrintKit(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" /> Print QR Kit
            </button>
            <button onClick={() => setShowDailySummary(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Daily Summary
            </button>
            <button onClick={() => setShowServiceConfig(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" /> Services
            </button>
          </div>

          {/* Now Serving */}
          {called.length > 0 && (
            <div className="gradient-bg rounded-2xl p-6 mb-6 text-primary-foreground">
              <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Now Serving</p>
              {called.map(v => (
                <div key={v.id} className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-3xl font-extrabold">
                      Token <AnimatedNumber value={v.token_number} prefix="#" invertHighlight />
                    </p>
                    <p className="text-sm opacity-90">{v.visitor_name || "Guest"}{v.phone ? ` · ${v.phone}` : ""}</p>
                  </div>
                  <button onClick={() => markServed(v.id, v.token_number)} className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Mark Served
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Waiting list */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Waiting List</h2>
              <button onClick={() => setShowAddWalkin(true)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Token
              </button>
            </div>
            {waiting.length === 0 ? (
              <div className="px-6 py-6">
                <EmptyState
                  compact
                  icon={Users}
                  title="No one waiting yet"
                  description="Your first customer will unlock live operational insights — wait times, service pace and queue health all populate automatically."
                  tip="Share or display your queue's QR code at the entrance so walk-ins can join in one tap."
                />
              </div>
            ) : (selectedQueue as any).queue_type === "restaurant" ? (
              <div className="divide-y divide-border">
                {(() => {
                  const groups = new Map<number, Visitor[]>();
                  waiting.forEach((v) => {
                    const size = (v as any).assigned_table_size ?? 0;
                    const arr = groups.get(size) || [];
                    arr.push(v);
                    groups.set(size, arr);
                  });
                  const sortedSizes = Array.from(groups.keys()).sort((a, b) => a - b);
                  return sortedSizes.map((size) => (
                    <div key={size}>
                      <div className="px-6 py-2 bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {size > 0 ? `${size} Seats` : "Unassigned"} · {groups.get(size)!.length} waiting
                      </div>
                      {groups.get(size)!.map((v) => {
                        const pos = waiting.indexOf(v);
                        const eta = (pos + 1) * (selectedQueue.estimated_service_time || 5);
                        return (
                          <div key={v.id} className="px-6 py-4 flex items-center justify-between border-t border-border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">#{v.token_number}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {v.visitor_name || "Guest"}
                                  {(v as any).party_size ? <span className="ml-2 text-xs text-muted-foreground">party of {(v as any).party_size}</span> : null}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {v.phone ? `${v.phone} · ` : ""}Joined {new Date(v.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground hidden sm:block">~{eta}m</span>
                              <button onClick={() => skipVisitor(v.id, v.token_number)} className="px-2.5 py-1.5 rounded-lg bg-warning-soft text-warning text-xs font-medium hover:bg-warning-soft transition-colors">
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeVisitor(v.id, v.token_number)} className="px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-medium hover:bg-danger-soft transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {waiting.map(v => {
                  const pos = waiting.indexOf(v);
                  const eta = (pos + 1) * (selectedQueue.estimated_service_time || 5);
                  return (
                    <div key={v.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">#{v.token_number}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{v.visitor_name || "Guest"}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.phone ? `${v.phone} · ` : ""}Joined {new Date(v.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:block">~{eta}m</span>
                        <button onClick={() => skipVisitor(v.id, v.token_number)} className="px-2.5 py-1.5 rounded-lg bg-warning-soft text-warning text-xs font-medium hover:bg-warning-soft transition-colors">
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeVisitor(v.id, v.token_number)} className="px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-medium hover:bg-danger-soft transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedQueue && <QueueIntegrityPanel queueId={selectedQueue.id} />}
        </>
      ) : (
        <div className="py-10 bg-card rounded-2xl card-shadow">
          <EmptyState
            icon={Users}
            title="No queues yet"
            description="Spin up your first queue so walk-in customers can join from their phone — no hardware, no paper tokens."
            cta={{ label: "Create your first queue", onClick: () => setShowCreate(true) }}
            tip="Print or display your queue's QR code at the entrance — customers join in one tap."
          />
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create New Queue">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Queue Configuration</label>
            <p className="text-xs text-muted-foreground mb-3">Pick the setup that best matches how you serve customers.</p>
            <div role="radiogroup" aria-label="Queue configuration" className="grid grid-cols-1 gap-2">
              {([
                {
                  k: "single",
                  label: "Single Queue",
                  example: "One shared line — e.g. a barber shop or a small clinic with one counter.",
                },
                {
                  k: "counters",
                  label: "Multiple Counters",
                  example: "Several parallel counters serving the same line — e.g. a bank, post office, or DMV.",
                },
                {
                  k: "seating",
                  label: "Seating Based",
                  example: "Customers grouped by party size — e.g. restaurants and cafés seating 2 / 4 / 6 / 8+.",
                },
                {
                  k: "departments",
                  label: "Department Based",
                  example: "Different services in one place — e.g. hospital OPD, salon (haircut / spa / nails).",
                },
              ] as const).map((opt) => {
                const selected = newQueue.config_mode === opt.k;
                return (
                  <button
                    key={opt.k}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      const isSeating = opt.k === "seating";
                      setNewQueue({
                        ...newQueue,
                        config_mode: opt.k,
                        queue_type: isSeating ? "restaurant" : "standard",
                        table_config: isSeating && newQueue.table_config.length === 0
                          ? [
                              { seats: 2, count: 1 },
                              { seats: 4, count: 1 },
                              { seats: 6, count: 1 },
                              { seats: 8, count: 1 },
                            ]
                          : newQueue.table_config,
                      });
                    }}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{opt.example}</p>
                  </button>
                );
              })}
            </div>
            {(newQueue.config_mode === "counters" || newQueue.config_mode === "departments") && (
              <p className="mt-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
                Tip: create one queue per {newQueue.config_mode === "counters" ? "counter" : "department"} — customers see them all and pick where to join.
              </p>
            )}
          </div>
          <input type="text" placeholder="Queue name (e.g., Main Counter)" value={newQueue.name} onChange={e => setNewQueue({ ...newQueue, name: e.target.value })} className="input" />
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Est. service time (minutes)</label>
            <input type="number" min={1} max={120} value={newQueue.estimated_service_time} onChange={e => setNewQueue({ ...newQueue, estimated_service_time: parseInt(e.target.value) || 5 })} className="input" />
          </div>
          <textarea placeholder="Note (optional)" rows={2} value={newQueue.note} onChange={e => setNewQueue({ ...newQueue, note: e.target.value })} className="input resize-none" />
          {newQueue.queue_type === "restaurant" && (
            <RestaurantTableConfig
              tables={newQueue.table_config}
              onChange={(table_config) => setNewQueue({ ...newQueue, table_config })}
              policy={newQueue.seating_policy}
              onPolicyChange={(seating_policy) => setNewQueue({ ...newQueue, seating_policy })}
              partySizes={newQueue.party_sizes}
              onPartySizesChange={(party_sizes) => setNewQueue({ ...newQueue, party_sizes })}
              partySizeMode={newQueue.party_size_mode}
              onPartySizeModeChange={(party_size_mode) => setNewQueue({ ...newQueue, party_size_mode })}
            />
          )}
          <div className="flex gap-3">
            <button onClick={createQueue} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showQR && selectedQueue && (
        <Modal onClose={() => setShowQR(false)} title="Scan to Join Queue">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-foreground">{businessName}</h3>
            <p className="text-sm text-muted-foreground">{selectedQueue.name}</p>
          </div>
          <div className="bg-white p-4 rounded-xl inline-block mx-auto">
            <QRCodeSVG value={joinUrl} size={200} />
          </div>
          <p className="text-xs text-muted-foreground break-all text-center">{joinUrl}</p>
          <button onClick={() => { hapticCopy(); navigator.clipboard.writeText(joinUrl); toast.success("Link copied!"); }} className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Copy Link
          </button>
        </Modal>
      )}

      {showAddWalkin && (
        <Modal onClose={() => setShowAddWalkin(false)} title="Add Walk-in Customer">
          <input type="text" placeholder="Name (optional)" value={walkinName} onChange={e => setWalkinName(e.target.value)} className="input" />
          <input type="tel" placeholder="Phone (optional)" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} className="input" />
          {selectedQueue && (selectedQueue as any).queue_type === "restaurant" && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Party size *</label>
              <div className="flex flex-wrap gap-2">
                {(((selectedQueue as any).party_sizes as number[] | null) || COMMON_PARTY_SIZES).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWalkinParty(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      walkinParty === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n === 10 ? "10+" : n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                We'll auto-assign the smallest table that fits.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={addWalkin} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Add to Queue</button>
            <button onClick={() => setShowAddWalkin(false)} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showReset && selectedQueue && (
        <Modal onClose={() => !resetting && setShowReset(false)} title="Start a New Day?">
          <div className="flex items-start gap-3 -mt-1">
            <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center shrink-0">
              <Sunrise className="w-5 h-5" />
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              You're about to close today's queue for <span className="font-semibold text-foreground">{selectedQueue.name}</span> and begin a fresh session.
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1.5">
            <p>✓ Today's data is safely archived for analytics & reports</p>
            <p>✓ Tokens reset to #1 for the new day</p>
            <p>✓ Customers still waiting will be marked as no-show</p>
            <p>✓ History remains accessible from the History page</p>
          </div>
          <div className="flex gap-3">
            <button onClick={startNewDay} disabled={resetting} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {resetting ? "Starting…" : "Yes, Start New Day"}
            </button>
            <button onClick={() => setShowReset(false)} disabled={resetting} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showPrintKit && selectedQueue && (
        <PrintReadyQRKit
          queueId={selectedQueue.id}
          queueName={selectedQueue.name}
          businessName={businessName}
          onClose={() => setShowPrintKit(false)}
        />
      )}

      {showDailySummary && (
        <DailyPerformanceSummary
          businessId={businessId}
          businessName={businessName}
          visitors={visitors as any}
          onClose={() => setShowDailySummary(false)}
        />
      )}

      {showServiceConfig && selectedQueue && (
        <ServiceManagementModal
          initialServices={((selectedQueue as any)?.settings?.services as any) || []}
          onSave={async (newServices) => {
            const existingSettings = (selectedQueue as any)?.settings || {};
            const updatedSettings = { ...existingSettings, services: newServices };
            const { error } = await supabase
              .from("queues")
              .update({ settings: updatedSettings } as any)
              .eq("id", selectedQueue.id);
            if (error) throw error;
            handleRefresh();
          }}
          onClose={() => setShowServiceConfig(false)}
        />
      )}

      <style>{`.input{width:100%;padding:0.75rem 1rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-size:0.875rem}.input:focus{outline:none;box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}`}</style>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
  accent,
  hint,
  tip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
  hint?: React.ReactNode;
  tip?: { title?: string; description: string; example?: string };
}) => (
  <div className="bg-card rounded-2xl p-5 card-shadow flex flex-col gap-2">
    <div className="flex items-center gap-1.5 text-muted-foreground/80 text-xs font-medium uppercase tracking-wide">
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
      {tip && <InfoHint {...tip} ariaLabel={`About ${label}`} />}
    </div>
    <p
      className={`text-3xl md:text-[2rem] leading-none font-extrabold tabular-nums tracking-tight ${
        accent ? "text-primary" : "text-foreground"
      }`}
    >
      {value}
    </p>
    {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
  </div>
);

const Modal = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto overscroll-contain"
    style={{ WebkitOverflowScrolling: "touch" }}
    onClick={onClose}
  >
    <div
      className="bg-card rounded-2xl p-6 w-full max-w-md card-shadow flex flex-col gap-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
      onClick={e => e.stopPropagation()}
    >
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {children}
    </div>
  </div>
);

export default Dashboard;
