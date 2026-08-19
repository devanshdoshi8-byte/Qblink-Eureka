import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Clock,
  CheckCircle,
  SkipForward,
  UserPlus,
  Phone,
  Trash2,
  QrCode,
  Monitor,
  BarChart3,
  Pause,
  Play,
  RefreshCw,
  Sunrise,
  Info,
  Printer,
  Layers,
  CalendarCheck,
  Hourglass,
  Volume2,
  VolumeX,
  Keyboard,
  Search,
  Zap,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
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
import { isStaffAudioEnabled, setStaffAudioEnabled, playArrivalChime, playCallNextChime } from "@/lib/audioChime";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  const [showQuickHub, setShowQuickHub] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => isStaffAudioEnabled());

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
  const [callingNext, setCallingNext] = useState(false);

  const quickHubRef = useRef<HTMLDivElement>(null);

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

  const waiting = visitors.filter((v) => v.status === "waiting");
  const called = visitors.filter((v) => v.status === "called");
  const served = visitors.filter((v) => v.status === "served");

  // Track new arrivals for chime
  const prevWaitingCountRef = useRef<number>(waiting.length);
  useEffect(() => {
    if (waiting.length > prevWaitingCountRef.current && prevWaitingCountRef.current !== 0) {
      playArrivalChime();
    }
    prevWaitingCountRef.current = waiting.length;
  }, [waiting.length]);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setStaffAudioEnabled(next);
    if (next) {
      playArrivalChime();
      toast.success("Staff sound chimes enabled");
    } else {
      toast.info("Staff sound chimes muted");
    }
  };

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
    if (error) {
      toast.error(error.message || "Failed to create queue");
      return;
    }
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
    if (error) {
      toast.error(error.message || "Failed to add walk-in");
      return;
    }
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
      if (error) {
        toast.error(error.message || "Call Next failed");
        return;
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        toast.info("No one waiting in line");
      } else {
        hapticSuccess();
        playCallNextChime();
        toast.success(`Calling Token #${row.token_number}`);
      }
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
      if (error) {
        toast.error(error.message || "Could not serve next");
        return;
      }
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) {
        toast.info(`No one waiting for a ${seats}-seat table`);
      } else {
        hapticSuccess();
        playCallNextChime();
        toast.success(`Calling #${row.token_number} (party of ${row.party_size}) for ${row.assigned_table_size}-seat table`);
      }
      refresh();
    } finally {
      setCallingNext(false);
    }
  };

  const markServed = async (id: string, t: number) => {
    await supabase.from("queue_visitors").update({ status: "served", served_at: new Date().toISOString() }).eq("id", id);
    hapticSuccess();
    toast.success(`#${t} marked served`);
    refresh();
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
    refresh();
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
      if (error) {
        toast.error(error.message || "Could not start a new day");
        return;
      }
      const s: any = Array.isArray(data) ? data[0] : data;
      hapticSuccess();
      toast.success(`New day started — ${s?.total_joined ?? 0} visitors archived`);
      setShowReset(false);
      await refresh();
    } finally {
      setResetting(false);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHotkeysModal((v) => !v);
        return;
      }

      if (e.code === "Space" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        callNext();
        return;
      }

      if (e.key === "s" || e.key === "S" || e.key === "Enter") {
        if (called.length > 0) {
          e.preventDefault();
          markServed(called[0].id, called[0].token_number);
        }
        return;
      }

      if (e.key === "k" || e.key === "K") {
        if (called.length > 0) {
          e.preventDefault();
          skipVisitor(called[0].id, called[0].token_number);
        }
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setShowAddWalkin(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [called, selectedQueue]);

  // Click outside to close quick hub
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickHubRef.current && !quickHubRef.current.contains(e.target as Node)) {
        setShowQuickHub(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered waiting list
  const filteredWaiting = waiting.filter((v) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    const matchesToken = String(v.token_number).includes(q.replace("#", ""));
    const matchesName = (v.visitor_name || "").toLowerCase().includes(q);
    const matchesPhone = (v.phone || "").toLowerCase().includes(q);
    return matchesToken || matchesName || matchesPhone;
  });

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Queue Manager</h1>
            {/* Audio chime toggle & hotkeys hint */}
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-full p-1 border border-border/80">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-1.5 rounded-full transition-colors ${
                  audioEnabled
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={audioEnabled ? "Staff Chimes Active (Click to mute)" : "Staff Chimes Muted (Click to enable)"}
                aria-label="Toggle staff audio chimes"
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowHotkeysModal(true)}
                className="px-2 py-1 rounded-full text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                title="Keyboard Shortcuts (Press ?)"
              >
                <Keyboard className="w-3 h-3" />
                <span className="hidden sm:inline">Hotkeys [?]</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your live customer queue with lightning speed</p>
        </div>

        {selectedQueue && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedQueue.status === "active"
                  ? "bg-success-soft text-success"
                  : selectedQueue.status === "paused"
                  ? "bg-warning-soft text-warning"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              ● Queue {selectedQueue.status}
            </span>

            {/* Quick-Launch Hub Dropdown */}
            <div className="relative" ref={quickHubRef}>
              <button
                type="button"
                onClick={() => setShowQuickHub(!showQuickHub)}
                className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-primary" />
                <span>Quick Hub</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showQuickHub ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showQuickHub && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border p-2 shadow-2xl z-50 backdrop-blur-xl"
                  >
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowQuickHub(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Monitor className="w-4 h-4 text-teal-500" />
                      <span>Open TV Kiosk Display</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickHub(false);
                        setShowPrintKit(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 text-primary" />
                      <span>Print Counter QR Kit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickHub(false);
                        setShowDailySummary(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      <span>Daily Performance Summary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickHub(false);
                        setShowHotkeysModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Keyboard className="w-4 h-4 text-amber-500" />
                      <span>Hotkeys Cheat Sheet [?]</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

      <ExecutiveTelemetryBar queue={selectedQueue} visitors={visitors} businessName={businessName} />

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
          const parents = queues.filter((q: any) => !q.parent_queue_id);
          const nodes: any[] = [];
          parents.forEach((q: any) => {
            const stats = getQueueStats(q.id);
            nodes.push(
              <button
                key={q.id}
                onClick={() => setSelectedQueueId(q.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedQueue?.id === q.id
                    ? "gradient-bg text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted card-shadow"
                }`}
              >
                {q.name}
                {q.queue_type === "restaurant" && <span className="ml-1.5 text-xs opacity-70">· share link</span>}
              </button>
            );
            const children = queues
              .filter((c: any) => c.parent_queue_id === q.id)
              .sort((a: any, b: any) => (a.table_size || 0) - (b.table_size || 0));
            children.forEach((c: any) => {
              const cStats = getQueueStats(c.id);
              nodes.push(
                <button
                  key={c.id}
                  onClick={() => setSelectedQueueId(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedQueue?.id === c.id
                      ? "gradient-bg text-primary-foreground border-transparent shadow-sm"
                      : "bg-card text-foreground/80 border-border hover:border-primary/40 card-shadow"
                  }`}
                >
                  {c.table_size}-seat
                  <span className="ml-1.5 opacity-70">· {cStats.waiting} waiting</span>
                </button>
              );
            });
          });
          return nodes;
        })()}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
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
              accent
              tip={{
                title: "Waiting Visitors",
                description: "Customers who have joined the queue and are waiting to be called.",
              }}
            />
            <Stat
              icon={<CheckCircle className="w-4 h-4 text-success" />}
              label="Served Today"
              value={syncedStats.servedToday}
              tip={{
                title: "Served Today",
                description: "Total customers who completed service today.",
              }}
            />
            <Stat
              icon={<Clock className="w-4 h-4 text-warning" />}
              label="Avg Service (min)"
              value={syncedStats.avgService || "—"}
              tip={{
                title: "Average Service Time",
                description: "Average minutes spent serving each customer today.",
              }}
            />
            <Stat
              icon={<Clock className="w-4 h-4 text-warning" />}
              label="Avg Wait (min)"
              value={syncedStats.avgWait || "—"}
              tip={{
                title: "Average Wait",
                description: "Average minutes between joining the queue and being served today.",
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

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={toggleQueueStatus}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                selectedQueue.status === "active"
                  ? "bg-warning-soft text-warning hover:bg-warning-soft"
                  : "bg-success-soft text-success hover:bg-success-soft"
              }`}
            >
              {selectedQueue.status === "active" ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Queue
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Queue
                </>
              )}
            </button>

            {(selectedQueue as any).queue_type === "restaurant" ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Serve table:</span>
                {(((selectedQueue as any).table_config as TableSize[] | null) || []).map((t) => (
                  <button
                    key={t.seats}
                    onClick={() => serveTable(t.seats)}
                    disabled={callingNext}
                    className="gradient-bg text-primary-foreground px-5 py-3 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t.seats}-seat
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={callNext}
                disabled={callingNext}
                className="gradient-bg text-primary-foreground px-6 py-3 rounded-xl text-base font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-60"
              >
                <Phone className="w-4 h-4" />
                <span>Call Next</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white">
                  Space
                </kbd>
              </button>
            )}

            <button
              onClick={() => setShowAddWalkin(true)}
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Walk-in</span>
              <kbd className="hidden sm:inline-block px-1 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
                A
              </kbd>
            </button>

            <button
              onClick={() => setShowQR(true)}
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>

            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" /> Public TV
            </a>

            <button
              onClick={() => setShowPrintKit(true)}
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-primary" /> Print QR Kit
            </button>

            <button
              onClick={() => setShowDailySummary(true)}
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Daily Summary
            </button>

            <button
              onClick={() => setShowServiceConfig(true)}
              className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-amber-500" /> Services
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowReset(true)}
                className="bg-warning-soft text-warning hover:bg-warning-soft px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Sunrise className="w-4 h-4" /> Start New Day
              </button>
              <button
                type="button"
                onClick={() => setShowResetInfo((v) => !v)}
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

            <button
              onClick={stopQueue}
              className="bg-danger-soft text-danger hover:bg-danger-soft px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Stop Queue
            </button>
          </div>

          {/* Now Serving Hero Block */}
          {called.length > 0 && (
            <div className="gradient-bg rounded-2xl p-6 mb-6 text-primary-foreground shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-widest opacity-85 font-semibold">Now Serving At Counter</p>
                <span className="text-[10px] font-mono opacity-80">Press [Enter] or [S] to Serve</span>
              </div>
              {called.map((v) => (
                <div key={v.id} className="flex items-center justify-between flex-wrap gap-3 mt-2">
                  <div>
                    <p className="text-4xl font-black">
                      Token <AnimatedNumber value={v.token_number} prefix="#" invertHighlight />
                    </p>
                    <p className="text-sm opacity-90 mt-0.5">
                      {v.visitor_name || "Guest"}
                      {v.phone ? ` · ${v.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => skipVisitor(v.id, v.token_number)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Skip customer [K]"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Skip [K]
                    </button>
                    <button
                      onClick={() => markServed(v.id, v.token_number)}
                      className="bg-white text-primary hover:bg-white/90 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Mark Served [Enter]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Waiting list with Instant Filter Search */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-foreground">Waiting List</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {waiting.length} waiting
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search / Filter box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter token or name…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44 sm:w-56"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter("")}
                      className="text-[10px] font-mono text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowAddWalkin(true)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Token
                </button>
              </div>
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
            ) : filteredWaiting.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                No waiting customer matches "{searchFilter}"
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredWaiting.map((v) => (
                  <div key={v.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black font-mono text-sm flex items-center justify-center">
                        #{v.token_number}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{v.visitor_name || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.phone || "Walk-in"}
                          {v.party_size ? ` · Party of ${v.party_size}` : ""}
                          {` · Joined ${new Date(v.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => skipVisitor(v.id, v.token_number)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Skip"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeVisitor(v.id, v.token_number)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-card rounded-2xl p-8 card-shadow text-center">
          <p className="text-muted-foreground mb-4">You haven't created any queues yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="gradient-bg text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Create Your First Queue
          </button>
        </div>
      )}

      {/* Hotkeys Cheat Sheet Modal */}
      {showHotkeysModal && (
        <Modal onClose={() => setShowHotkeysModal(false)} title="⚡ Front-Desk Keyboard Shortcuts">
          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              Designed for high-speed receptionists and service desks. Control queues without touching your mouse:
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="font-medium text-foreground">Call Next Waiting Token</span>
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-primary shadow-sm">
                  Space or N
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="font-medium text-foreground">Mark Called Token Served</span>
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
                  Enter or S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="font-medium text-foreground">Skip Called Token</span>
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-amber-600 dark:text-amber-400 shadow-sm">
                  K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="font-medium text-foreground">Open Add Walk-In Modal</span>
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-foreground shadow-sm">
                  A
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="font-medium text-foreground">Toggle This Shortcuts Modal</span>
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-foreground shadow-sm">
                  ?
                </kbd>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowHotkeysModal(false)}
            className="w-full gradient-bg text-primary-foreground py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity mt-2"
          >
            Got It
          </button>
        </Modal>
      )}

      {/* Existing Create Queue Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create New Queue">
          <input
            type="text"
            placeholder="Queue name (e.g., General Consultation, Counter 1)"
            value={newQueue.name}
            onChange={(e) => setNewQueue({ ...newQueue, name: e.target.value })}
            className="input"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Est. service time (min):</label>
            <input
              type="number"
              min={1}
              max={120}
              value={newQueue.estimated_service_time}
              onChange={(e) => setNewQueue({ ...newQueue, estimated_service_time: parseInt(e.target.value) || 5 })}
              className="input w-24"
            />
          </div>
          <input
            type="text"
            placeholder="Note for customers (optional)"
            value={newQueue.note}
            onChange={(e) => setNewQueue({ ...newQueue, note: e.target.value })}
            className="input"
          />
          <div className="flex gap-3">
            <button
              onClick={createQueue}
              className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* QR Code Modal */}
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
          <button
            onClick={() => {
              hapticCopy();
              navigator.clipboard.writeText(joinUrl);
              toast.success("Link copied!");
            }}
            className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Copy Link
          </button>
        </Modal>
      )}

      {/* Add Walk-in Modal */}
      {showAddWalkin && (
        <Modal onClose={() => setShowAddWalkin(false)} title="Add Walk-in Customer">
          <input
            type="text"
            placeholder="Name (optional)"
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            className="input"
            autoFocus
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={walkinPhone}
            onChange={(e) => setWalkinPhone(e.target.value)}
            className="input"
          />
          <div className="flex gap-3">
            <button
              onClick={addWalkin}
              className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Add to Queue
            </button>
            <button
              onClick={() => setShowAddWalkin(false)}
              className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Start New Day Modal */}
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
            <button
              onClick={startNewDay}
              disabled={resetting}
              className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {resetting ? "Starting…" : "Yes, Start New Day"}
            </button>
            <button
              onClick={() => setShowReset(false)}
              disabled={resetting}
              className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Print QR Kit Modal */}
      {showPrintKit && selectedQueue && (
        <PrintReadyQRKit
          queueId={selectedQueue.id}
          queueName={selectedQueue.name}
          businessName={businessName}
          onClose={() => setShowPrintKit(false)}
        />
      )}

      {/* Daily Performance Summary Modal */}
      {showDailySummary && (
        <DailyPerformanceSummary
          businessId={businessId}
          businessName={businessName}
          visitors={visitors as any}
          onClose={() => setShowDailySummary(false)}
        />
      )}

      {/* Services Management Modal */}
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
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {children}
    </div>
  </div>
);

export default Dashboard;
