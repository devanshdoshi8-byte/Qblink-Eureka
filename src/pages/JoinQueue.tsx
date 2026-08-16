import { getOpenState } from "@/lib/operatingHours";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Users, CheckCircle, Loader2, Activity, RefreshCw, UserCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import AIAssistant from "@/components/AIAssistant";
import TrustPrivacyCard from "@/components/TrustPrivacyCard";
import FounderContact from "@/components/FounderContact";
import PrefillNotice from "@/components/PrefillNotice";
import SEO from "@/components/SEO";
import LiveWaitingExperience from "@/components/LiveWaitingExperience";
import BusinessStatusBanner from "@/components/BusinessStatusBanner";
import DynamicWelcomeHeader from "@/components/queue/DynamicWelcomeHeader";
import BusinessHighlightsCard from "@/components/queue/BusinessHighlightsCard";
import LiveActivityFeed from "@/components/queue/LiveActivityFeed";
import QueueTimeline from "@/components/queue/QueueTimeline";
import ContextualTips from "@/components/queue/ContextualTips";
import { useCustomerQueueIntel } from "@/hooks/useCustomerQueueIntel";
import { useRollingWaitEstimate } from "@/hooks/useRollingWaitEstimate";
import { notificationService } from "@/lib/notifications/notificationService";
import { GraceStatus, calculateGraceExpiry, canRequestGrace } from "@/lib/arrivalGraceEngine";
import { getServicesForQueue, ServiceDefinition } from "@/lib/serviceDefinitions";
import { WaitAndExplore } from "@/components/customer/WaitAndExplore";
import QueueForecast from "@/components/QueueForecast";
import SaveBusinessButton from "@/components/SaveBusinessButton";
import SuccessCelebration from "@/components/SuccessCelebration";
import { hapticJoin, hapticRefresh, hapticSuccess } from "@/lib/haptics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { logEngagement } from "@/lib/receptionImpact";

interface QueueInfo {
  id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  current_token: number | null;
  next_token: number | null;
  note: string | null;
  queue_type?: string | null;
  table_config?: any;
  party_sizes?: number[] | null;
  party_size_mode?: string | null;
  business_id?: string | null;
  parent_queue_id?: string | null;
  table_size?: number | null;
  seating_policy?: string | null;
}

interface BusinessFlags {
  remote_joining_enabled: boolean;
  show_live_queue_info: boolean;
}

const JoinQueue = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/customer-dashboard");
  };

  const requiredFieldsIncomplete = () => {
    if (joined || !queue) return false;
    const isRestaurant = (queue as any).queue_type === "restaurant";
    if (isRestaurant) {
      const sizes = deriveJoinPartySizes(queue);
      if (!sizes.length || !sizes.includes(partySize)) return true;
    }
    if (!hasCustomerProfile) {
      return !visitorName.trim() || !phone.trim();
    }
    return false;
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qblink:switchedQueue");
      if (!raw) return;
      const { queueId: qid, queueName } = JSON.parse(raw);
      if (qid === queueId) {
        toast.success(`You're now in ${queueName}`, {
          description: "Confirm your details to grab your token.",
        });
      }
      sessionStorage.removeItem("qblink:switchedQueue");
    } catch {}
  }, [queueId]);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasCustomerProfile, setHasCustomerProfile] = useState(false);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [joined, setJoined] = useState(false);
  const [myToken, setMyToken] = useState<number | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState<string>("waiting");
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [waitingCount, setWaitingCount] = useState(0);
  const [aheadCount, setAheadCount] = useState<number | null>(null);
  const [initialAhead, setInitialAhead] = useState<number | null>(null);
  const [nowServingToken, setNowServingToken] = useState<number | null>(null);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const prevStatusRef = useRef<string>("waiting");
  const [partySize, setPartySize] = useState<number>(2);
  // The queue we actively track live state against. For restaurants this
  // swaps to the child (table-size) queue after joining, so "Now Serving",
  // "Ahead of You" etc. reflect the correct sub-queue.
  const [activeQueueId, setActiveQueueId] = useState<string | undefined>(queueId);
  useEffect(() => { setActiveQueueId(queueId); }, [queueId]);
  const [searchParams] = useSearchParams();
  const [bizFlags, setBizFlags] = useState<BusinessFlags>({
    remote_joining_enabled: true,
    show_live_queue_info: true,
  });
  const [bizAddress, setBizAddress] = useState<string | null>(null);
  const [bizHours, setBizHours] = useState<unknown>(null);
  const openState = getOpenState(bizHours);

  // Parse QR/link query params for frictionless prefill
  const urlName = searchParams.get("name") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlAutoJoin = searchParams.get("autojoin") === "1";
  const urlSize = (() => {
    const raw = searchParams.get("size");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const sizeLocked = urlSize !== null;

  // UUID check — demo queues use slugs like "demo-aroma" and can't hit the DB
  const isUuid = (v: string | undefined) =>
    !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const isDemo = !isUuid(queueId);

  // Shared read-only intel layer (one fetch + one realtime channel for all
  // the presentation enhancements below). Never used for queue calculations.
  const intel = useCustomerQueueIntel({
    queueId: activeQueueId ?? queueId ?? null,
    businessId: (queue as any)?.business_id ?? null,
    userId: user?.id ?? null,
    enabled: !isDemo,
  });

  // Feature F: Multi-Service definitions for queue
  const configuredServices = useMemo(() => {
    return getServicesForQueue((queue as any)?.settings || (queue as any)?.table_config);
  }, [queue]);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);

  // Feature E: Rolling Service Velocity Adaptive Estimation
  const rolling = useRollingWaitEstimate({
    queueId: activeQueueId ?? queueId ?? null,
    aheadCount: aheadCount ?? waitingCount,
    historicalServiceTime: selectedService?.estimatedDurationMinutes || queue?.estimated_service_time || 5,
    enabled: !isDemo,
  });

  // Feature A: "I'm 2 Minutes Away" Arrival Grace State
  const [graceStatus, setGraceStatus] = useState<GraceStatus>("none");
  const [graceExpiresAt, setGraceExpiresAt] = useState<number | null>(null);

  const handleRequestGrace = async () => {
    const ahead = aheadCount ?? waitingCount;
    if (!canRequestGrace({ aheadCount: ahead, myStatus, currentGraceStatus: graceStatus })) {
      return;
    }
    const expiry = calculateGraceExpiry(2);
    setGraceStatus("active");
    setGraceExpiresAt(expiry);
    hapticSuccess();
    toast.success("Arrival grace period activated (2 min)", {
      description: "Staff has been notified. Please proceed to the counter.",
    });
    if (myVisitorId && !isDemo) {
      try {
        await (supabase as any).rpc("log_queue_activity", {
          p_queue_id: activeQueueId ?? queueId!,
          p_visitor_id: myVisitorId,
          p_action: "arrival_grace_requested",
          p_meta: { expires_at: new Date(expiry).toISOString(), duration_minutes: 2 },
        });
      } catch {}
    }
  };

  // Feature B: Multi-stage proactive milestone notifications
  useEffect(() => {
    if (joined && myVisitorId && myToken) {
      const ahead = aheadCount ?? waitingCount;
      notificationService.evaluateQueueMilestone({
        visitorId: myVisitorId,
        tokenNumber: myToken,
        aheadCount: ahead,
        myStatus,
        businessName: queue?.name || "Qblink",
        queueName: queue?.name || "Queue",
        waitMinutes: rolling.estimatedMinutes > 0 ? rolling.estimatedMinutes : ahead * (queue?.estimated_service_time || 5),
        phone,
      });
    }
  }, [joined, myVisitorId, myToken, aheadCount, waitingCount, myStatus, queue?.name, rolling.estimatedMinutes, phone]);

  useEffect(() => {
    if (queueId) {
      fetchQueue();
      fetchWaitingCount();
    }
  }, [queueId]);

  // Prefill from previous session so the user never has to re-enter
  useEffect(() => {
    try {
      if (localStorage.getItem("qb_prefill_optout") === "1") return;
      const n = localStorage.getItem("qb_visitor_name");
      const p = localStorage.getItem("qb_visitor_phone");
      if (n) setVisitorName(n);
      if (p) setPhone(p);
      if (n || p) setPrefilled(true);
    } catch {}
  }, []);

  // Override with URL query params (highest priority — from QR / shared links)
  useEffect(() => {
    if (urlName) { setVisitorName(urlName); setPrefilled(true); }
    if (urlPhone) { setPhone(urlPhone); setPrefilled(true); }
  }, [urlName, urlPhone]);

  // If the share link locks a table size (e.g. per-child QR), pre-select it.
  useEffect(() => {
    if (urlSize) setPartySize(urlSize);
  }, [urlSize]);

  // If a customer is logged in, auto-fill from their profile and skip the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setProfileLoaded(true); return; }
      const { data } = await supabase
        .from("customer_profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      // Always treat logged-in users as having a profile. Fall back to signup
      // metadata (full_name / phone) or email when the profile row is missing,
      // and lazily create the row so it persists for next time.
      const meta: any = user.user_metadata || {};
      const emailLocal = user.email ? user.email.split("@")[0].toLowerCase() : "";
      const looksAuto = (n?: string | null) =>
        !!n && !!emailLocal && n.trim().toLowerCase() === emailLocal;
      const profileName = (data?.full_name as string) || "";
      const metaName: string = meta.full_name || meta.name || "";
      // Pick the best real name. Ignore any name that's just the email prefix
      // (those were autogenerated by older code, not entered by the user).
      let realName = "";
      if (profileName && !looksAuto(profileName)) realName = profileName;
      else if (metaName && !looksAuto(metaName)) realName = metaName;
      const fallbackPhone: string =
        (data?.phone as string) ||
        meta.phone ||
        (user as any).phone ||
        "";
      setPhone(fallbackPhone);
      if (realName) {
        setVisitorName(realName);
        setHasCustomerProfile(true);
        setPrefilled(false);
        // If profile is stale (autogenerated or missing), correct it.
        if (profileName !== realName) {
          supabase
            .from("customer_profiles")
            .upsert(
              { user_id: user.id, full_name: realName, phone: fallbackPhone || null },
              { onConflict: "user_id" }
            )
            .then(() => {});
        }
      } else {
        // No real name on file — ask the user to enter it.
        setVisitorName("");
        setHasCustomerProfile(false);
        setPrefilled(false);
      }
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!activeQueueId || isDemo) return;
    const channel = supabase
      .channel(`join-${activeQueueId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${activeQueueId}` }, () => {
        fetchLiveQueueState(myToken, myVisitorId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "queues", filter: `id=eq.${activeQueueId}` }, () => {
        fetchLiveQueueState(myToken, myVisitorId);
      })
      .subscribe();
    // Polling fallback in case realtime drops
    const poll = setInterval(() => {
      fetchLiveQueueState(myToken, myVisitorId);
    }, joined ? 5000 : 10000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [activeQueueId, myVisitorId, myToken, joined]);

  const refreshNow = () => {
    hapticRefresh();
    toast.success("Refreshed");
    const bizId = (queue as any)?.business_id;
    if (!isDemo) logEngagement(bizId, queueId, "refresh", myVisitorId);
    if (isDemo) {
      fetchQueue();
      fetchWaitingCount();
      return;
    }
    fetchQueue();
    fetchWaitingCount();
    if (myVisitorId) fetchLiveQueueState(myToken, myVisitorId);
  };

  // Play a short beep using Web Audio API (no asset needed)
  const playBeep = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.02);
      };
      beep(880, 0, 0.18);
      beep(1175, 0.22, 0.18);
      beep(1568, 0.44, 0.28);
      setTimeout(() => ctx.close(), 1200);
    } catch {}
  };

  // Trigger when status flips to "called"
  const triggerYourTurn = () => {
    setCelebrate(true);
    playBeep();
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]);
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🎉 It's your turn!", {
          body: `${queue?.name ?? "Queue"} is calling token #${myToken}. Please proceed to the counter.`,
          icon: logo,
        });
      } catch {}
    }
    setTimeout(() => setCelebrate(false), 6000);
  };

  // Ask for notification permission once joined
  useEffect(() => {
    if (joined && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [joined]);

  // Gentle success celebration when the user first joins the queue.
  useEffect(() => {
    if (!joined) return;
    setShowJoinSuccess(true);
    const t = setTimeout(() => setShowJoinSuccess(false), 2800);
    return () => clearTimeout(t);
  }, [joined]);

  // Watch myStatus transitions
  useEffect(() => {
    if (prevStatusRef.current !== "called" && myStatus === "called") {
      triggerYourTurn();
    }
    prevStatusRef.current = myStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStatus]);

  const fetchQueue = async () => {
    if (isDemo) {
      const { DEMO_BUSINESSES } = await import("@/lib/demoData");
      const match = DEMO_BUSINESSES.find(b => b.id === queueId);
      setQueue({
        id: queueId!,
        name: match?.name || "Aroma Café & Bakery",
        status: match?.status || "active",
        estimated_service_time: match?.est_time || 6,
        current_token: 2,
        next_token: (match?.waiting || 5) + 3,
        note: match?.description || "Demo queue",
      });
      setNowServingToken(2);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("queues").select("*").eq("id", queueId!).maybeSingle();
    if (error || !data) {
      // No silent demo fallback: a real link that fails must surface the real state.
      if (error) console.error("Qblink: queue load failed", error.message);
      setQueue(null);
      setNowServingToken(null);
      setLoading(false);
      return;
    }
    setQueue(data);
    setNowServingToken(typeof data.current_token === "number" && data.current_token > 0 ? data.current_token : null);
    setLoading(false);
    if ((data as any)?.business_id) {
      logEngagement((data as any).business_id, data.id, "page_view", null, 60000);
      const { data: biz } = await supabase
        .from("businesses")
        .select("remote_joining_enabled, show_live_queue_info, address, operating_hours")
        .eq("id", (data as any).business_id)
        .maybeSingle();
      if (biz) {
        setBizFlags({
          remote_joining_enabled: (biz as any).remote_joining_enabled ?? true,
          show_live_queue_info: (biz as any).show_live_queue_info ?? true,
        });
        setBizAddress((biz as any).address ?? null);
        setBizHours((biz as any).operating_hours ?? null);
      }
    }
  };

  const fetchWaitingCount = async () => {
    if (isDemo) {
      const { DEMO_BUSINESSES } = await import("@/lib/demoData");
      const match = DEMO_BUSINESSES.find(b => b.id === queueId);
      setWaitingCount(match?.waiting ?? 5);
      return;
    }
    const { count, error } = await supabase
      .from("queue_visitors_public" as any)
      .select("*", { count: "exact", head: true })
      .eq("queue_id", activeQueueId ?? queueId!)
      .eq("status", "waiting");
    // Real queue: trust the live count even when it's 0. Never substitute demo numbers.
    if (error) console.error("Qblink: waiting count failed", error.message);
    setWaitingCount(typeof count === "number" ? count : 0);
  };

  const fetchMyStatus = async () => {
    if (!myVisitorId) return;
    const { data } = await (supabase as any).from("queue_visitors_public").select("status, token_number").eq("id", myVisitorId).maybeSingle();
    if (data) {
      setMyStatus(data.status as string);
      if (data.status === "called") toast.info("🔔 It's your turn! Please proceed.");
    }
  };

  const fetchLiveQueueState = async (
    tokenOverride = myToken,
    visitorIdOverride = myVisitorId,
    qidOverride?: string,
  ) => {
    const qid = qidOverride ?? activeQueueId;
    if (!qid || isDemo) {
      await fetchQueue();
      await fetchWaitingCount();
      return;
    }

    const [{ data: queueData }, { data: visitorRows }] = await Promise.all([
      supabase.from("queues").select("*").eq("id", qid).maybeSingle(),
      (supabase as any)
        .from("queue_visitors_public")
        .select("id,queue_id,token_number,status,joined_at,called_at")
        .eq("queue_id", qid)
        .order("token_number", { ascending: true }),
    ]);

    if (queueData) {
      // For restaurant children keep the customer-facing name friendly.
      setQueue((prev) => ({ ...(prev as QueueInfo), ...(queueData as QueueInfo) }));
    }
    if ((queueData as any)?.business_id && visitorIdOverride) {
      logEngagement((queueData as any).business_id, qid, "status_check", visitorIdOverride, 30000);
    }

    const rows = (visitorRows || []) as Array<{
      id: string;
      token_number: number | null;
      status: string | null;
      called_at: string | null;
    }>;
    const waitingRows = rows.filter((v) => v.status === "waiting" && typeof v.token_number === "number");
    const firstWaitingToken = waitingRows[0]?.token_number ?? null;
    const calledToken = rows
      .filter((v) => (v.status === "called" || v.status === "serving") && typeof v.token_number === "number")
      .sort((a, b) => new Date(b.called_at || 0).getTime() - new Date(a.called_at || 0).getTime())[0]?.token_number ?? null;
    const queueCurrent = typeof queueData?.current_token === "number" && queueData.current_token > 0 ? queueData.current_token : null;
    const inferredCounterToken = typeof firstWaitingToken === "number" ? firstWaitingToken : null;
    const servingToken = queueCurrent ?? calledToken ?? inferredCounterToken;

    setNowServingToken(servingToken ?? null);
    setWaitingCount(waitingRows.length);

    const mine = visitorIdOverride ? rows.find((v) => v.id === visitorIdOverride) : null;
    if (mine?.status) setMyStatus(mine.status);
    const token = tokenOverride ?? mine?.token_number ?? null;
    if (typeof token === "number") {
      const ahead = mine?.status && mine.status !== "waiting"
        ? 0
        : waitingRows.filter((v) => {
          const n = v.token_number as number;
          return n < token && (!servingToken || n > servingToken);
        }).length;
      setAheadCount(ahead);
      setInitialAhead((prev) => (prev == null || prev < ahead ? ahead : prev));
    }
  };

  // Single source of truth for "people ahead": count waiting visitors with smaller token
  const fetchAhead = async () => {
    if (!myToken || isDemo) return;
    const { count } = await (supabase as any)
      .from("queue_visitors_public")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", activeQueueId ?? queueId!)
      .eq("status", "waiting")
      .lt("token_number", myToken);
    setAheadCount(count ?? 0);
  };

  const handleJoin = async () => {
    setJoinError(null);
    if (!queue) return;
    const clearRememberedQueue = () => {
      const bizId = (queue as any)?.business_id;
      if (!bizId) return;
      try {
        const raw = localStorage.getItem("qblink:selectedQueueByBiz");
        if (!raw) return;
        const map = JSON.parse(raw);
        if (map && map[bizId]) {
          delete map[bizId];
          localStorage.setItem("qblink:selectedQueueByBiz", JSON.stringify(map));
        }
      } catch {}
    };
    const isRestaurant = (queue as any).queue_type === "restaurant";
    if (isRestaurant) {
      if (!partySize || partySize < 1) {
        setJoinError("Please enter your party size.");
        return;
      }
      const sizes = ((queue.table_config as any[]) || [])
        .map((t) => Number(t?.seats) || 0)
        .filter((n) => n > 0);
      const maxSeats = sizes.length ? Math.max(...sizes) : 0;
      if (maxSeats > 0 && partySize > maxSeats) {
        setJoinError(`Sorry, we don't have a table that fits ${partySize} guests. The largest table seats ${maxSeats}.`);
        return;
      }
    }
    // Logged-in customers: use their account details, no form required.
    // Guest joiners (QR scan): require name + phone.
    if (!hasCustomerProfile) {
      if (!visitorName.trim() || !phone.trim()) {
        setJoinError("Please enter both your name and phone number to get a token.");
        return;
      }
    } else if (!visitorName.trim()) {
      // Extreme fallback — should never happen since we always set a name.
      setVisitorName("Customer");
    }
    try {
      if (localStorage.getItem("qb_prefill_optout") !== "1") {
        localStorage.setItem("qb_visitor_name", visitorName.trim());
        localStorage.setItem("qb_visitor_phone", phone.trim());
      }
    } catch {}
    setJoining(true);

    const tokenNum = queue.next_token || 1;

    // Demo / non-UUID queues: simulate a successful join without hitting the DB
    if (isDemo) {
      setMyToken(tokenNum);
      setMyVisitorId(`demo-${Date.now()}`);
      setAheadCount(waitingCount);
      setInitialAhead(waitingCount);
      setJoinedAt(Date.now());
      setJoined(true);
      setJoining(false);
      hapticJoin();
      clearRememberedQueue();
      return;
    }

    const rpcArgs: any = {
      p_queue_id: queue.id,
      p_visitor_name: (visitorName.trim() || "Customer").slice(0, 100),
      p_phone: phone.trim().slice(0, 20) || null,
    };
    let data: any = null;
    let error: any = null;
    if (isRestaurant) {
      const res = await supabase.rpc("join_restaurant_queue" as any, {
        p_parent_queue_id: queue.id,
        p_table_size: partySize,
        p_visitor_name: rpcArgs.p_visitor_name,
        p_phone: rpcArgs.p_phone,
      });
      data = res.data; error = res.error;
    } else {
      const res = await supabase.rpc("join_queue", rpcArgs);
      data = res.data; error = res.error;
    }

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      const raw = (error?.message || "").toLowerCase();
      let msg = "We couldn't add you to this queue. Please try again.";
      if (raw.includes("not active") || raw.includes("paused")) msg = "This queue is paused right now. Please try again shortly.";
      else if (raw.includes("not found")) msg = "This queue link is no longer valid. Ask the business for a new one.";
      else if (raw.includes("network") || raw.includes("fetch")) msg = "Network issue. Check your connection and try again.";
      else if (raw.includes("too long")) msg = "Your name or phone number is too long. Please shorten and retry.";
      else if (raw.includes("no suitable table") || raw.includes("not available right now")) msg = `Sorry, no ${partySize}-person tables are available right now.`;
      else if (raw.includes("select a table size") || raw.includes("party size required")) msg = "Please pick your table size.";
      else if (raw.includes("already in this queue")) msg = "You're already in this queue.";
      else if (raw.includes("wait a moment") || raw.includes("wait before rejoining")) msg = "Please wait a moment before rejoining this queue.";
      setJoinError(msg);
      toast.error(msg);
      setJoining(false);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setMyToken(row.token_number);
    setMyVisitorId(row.id);
    // Restaurant joins land in a child queue — follow it for live updates.
    if (isRestaurant && row.child_queue_id) {
      setActiveQueueId(row.child_queue_id);
    }
    setJoined(true);
    setJoining(false);
    setJoinedAt(Date.now());
    hapticJoin();
    clearRememberedQueue();
    // Persist the real name/phone for logged-in users so we never fall back
    // to the email prefix again.
    if (user) {
      supabase
        .from("customer_profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: visitorName.trim().slice(0, 100),
            phone: phone.trim().slice(0, 20) || null,
          },
          { onConflict: "user_id" }
        )
        .then(() => {});
      // Bump favorite "last used" so this business floats to the top of My Favorites.
      const bizId = (queue as any)?.business_id;
      if (bizId) {
        (supabase as any)
          .from("customer_favorites")
          .update({ last_used_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("business_id", bizId)
          .then(() => {});
      }
    }
    // Fetch authoritative queue state after join
    setTimeout(() => {
      fetchLiveQueueState(
        row.token_number,
        row.id,
        isRestaurant && row.child_queue_id ? row.child_queue_id : undefined,
      );
    }, 100);
  };

  // ====== SINGLE SOURCE OF TRUTH — derived state ======
  // All user-facing numbers come from this one function. No other place computes them.
  const derived = () => {
    const serviceTime = selectedService?.estimatedDurationMinutes || queue?.estimated_service_time || 5;
    const ahead = aheadCount ?? waitingCount;
    const waitMinutes = rolling.estimatedMinutes > 0 ? rolling.estimatedMinutes : ahead * serviceTime;
    return {
      ahead,
      waitMinutes,
      liveStatus: ahead === 0 ? "You're next" : "Moving",
      confidence: rolling.confidenceScore,
      effectiveVelocity: rolling.effectiveVelocity,
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!queue) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <img src={logo} alt="Qblink" className="h-12 w-12 rounded-lg object-contain mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Queue not found</h1>
        <p className="text-muted-foreground text-sm">This queue may have been closed or the link is invalid.</p>
      </div>
    </div>
  );

  if (queue.status !== "active" && !joined) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <img src={logo} alt="Qblink" className="h-12 w-12 rounded-lg object-contain mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">
          {queue.status === "closed" ? "Queue Closed" : "Queue Paused"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {queue.status === "closed"
            ? "This queue has been closed for now. Please check back later."
            : "This queue is currently not accepting new entries. Keep this page open — it updates live."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <SEO
        title={`Join ${queue.name} — Qblink`}
        description={`Join the live queue for ${queue.name}. Track your spot and wait time from your phone.`}
        path={`/join/${queueId}`}
      />
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-primary/20 backdrop-blur-sm animate-in fade-in duration-300" />
          {/* Floating emoji confetti */}
          {Array.from({ length: 24 }).map((_, i) => {
            const emojis = ["🎉", "✨", "🎊", "🔔", "⭐", "🥳", "💫"];
            const e = emojis[i % emojis.length];
            const left = (i * 4.2) % 100;
            const delay = (i % 8) * 0.12;
            const dur = 2.4 + (i % 5) * 0.4;
            return (
              <span
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${left}%`,
                  top: "-10%",
                  animation: `qb-fall ${dur}s ease-in ${delay}s forwards`,
                }}
              >
                {e}
              </span>
            );
          })}
          <div className="relative bg-card rounded-3xl px-8 py-10 card-shadow text-center max-w-xs mx-4 animate-in zoom-in-50 duration-500">
            <div className="text-6xl mb-3 animate-bounce">🔔</div>
            <h2 className="text-2xl font-extrabold text-primary mb-1">It's Your Turn!</h2>
            <p className="text-sm text-muted-foreground mb-3">Please proceed to the counter</p>
            <p className="text-4xl font-extrabold text-foreground">#{myToken}</p>
          </div>
          <style>{`
            @keyframes qb-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              if (requiredFieldsIncomplete()) {
                setShowBackConfirm(true);
              } else {
                goBack();
              }
            }}
            aria-label="Go back"
            className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border shadow-sm px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        </div>

        <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave without joining?</AlertDialogTitle>
              <AlertDialogDescription>
                Your required details are incomplete. If you go back now, you'll lose your spot in this queue and your information won't be saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowBackConfirm(false)}>Stay and complete</AlertDialogCancel>
              <AlertDialogAction onClick={goBack}>Go back</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="text-center mb-6">
          <img src={logo} alt="Qblink" className="h-10 w-10 rounded-lg object-contain mx-auto mb-3" />
          <DynamicWelcomeHeader
            name={visitorName}
            ahead={joined ? derived().ahead : null}
            joined={joined}
            visitCount={intel.visitCount}
            className="mb-3"
          />
          <h1 className="text-lg font-bold text-foreground">{queue.name}</h1>
          {queue.note && <p className="text-xs text-muted-foreground mt-1">{queue.note}</p>}
          {openState.status !== "unknown" && (
            <div className="mt-2 flex justify-center">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                openState.status === "open"
                  ? "bg-success/10 text-success"
                  : openState.status === "holiday"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
              }`}>
                {openState.status === "open" ? "● " : ""}{openState.label}
              </span>
            </div>
          )}
          {!isDemo && (queue as any).business_id && (
            <div className="mt-3 flex justify-center">
              <SaveBusinessButton
                businessId={(queue as any).business_id}
                businessName={queue.name}
              />
            </div>
          )}
        </div>

        <BusinessStatusBanner
          queueId={activeQueueId ?? queueId ?? null}
          queueStatus={queue.status}
          expectedServiceMinutes={queue.estimated_service_time || 5}
          callTimes={intel.callTimes}
          waiting={intel.pulse?.waiting ?? waitingCount}
          hasData={intel.ready}
          className="mb-4"
        />

        {bizFlags.show_live_queue_info && (
          <BusinessHighlightsCard
            rating={intel.highlights?.rating}
            totalReviews={intel.highlights?.total_reviews}
            pulse={intel.pulse}
            loading={!intel.ready}
            className="mb-4"
          />
        )}

        {!joined ? (
          <div className="bg-card rounded-2xl p-6 card-shadow">
            {bizFlags.show_live_queue_info ? (
              <div className="flex justify-between mb-6">
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1"><Users className="w-3.5 h-3.5" /> In queue</div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{waitingCount}</p>
                </div>
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1"><Clock className="w-3.5 h-3.5" /> Est. wait</div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{waitingCount * (queue.estimated_service_time || 5)}m</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 p-3 mb-6 text-center text-xs text-muted-foreground">
                Queue status available upon arrival.
              </div>
            )}

            {openState.status === "closed" || openState.status === "holiday" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-center">
                  <p className="text-sm font-semibold text-warning">
                    {openState.status === "holiday" ? "Closed for holiday" : "Currently closed"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{openState.detail}</p>
                </div>
                <a
                  href={bizAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}` : "#"}
                  target={bizAddress ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => { if (!bizAddress) e.preventDefault(); }}
                  className="w-full inline-flex items-center justify-center bg-card border border-primary/40 text-primary py-3.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Visit Business
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  You can join the queue once this business reopens.
                </p>
              </div>
            ) : !bizFlags.remote_joining_enabled ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                  Remote joining is currently unavailable.
                </div>
                <a
                  href={bizAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}` : "#"}
                  target={bizAddress ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => { if (!bizAddress) e.preventDefault(); }}
                  className="w-full inline-flex items-center justify-center bg-card border border-primary/40 text-primary py-3.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Visit Business
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  Please visit in person to join the queue.
                </p>
              </div>
            ) : hasCustomerProfile ? (
              <>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-5 flex items-center gap-2.5">
                  <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Joining as</p>
                    <p className="text-sm font-semibold text-foreground truncate">{visitorName}</p>
                  </div>
                </div>
                {joinError && (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-4 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium leading-snug">{joinError}</p>
                  </div>
                )}
                {(queue as any).queue_type === "restaurant" && (
                  <PartySizeField
                    value={partySize}
                    onChange={setPartySize}
                    options={deriveJoinPartySizes(queue)}
                    locked={sizeLocked}
                  />
                )}
                <button onClick={handleJoin} disabled={joining || !profileLoaded}
                  className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
                  {joining ? "Joining..." : "Join Queue"}
                </button>
              </>
            ) : (
              <>
                {user && profileLoaded && (
                  <div className="rounded-xl border border-warning/50 bg-warning-soft p-3 mb-4 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-warning font-semibold leading-snug">No customer profile found on your account.</p>
                      <p className="text-xs text-warning/80 leading-snug mt-0.5">Enter your details below — we'll save them for next time.</p>
                    </div>
                  </div>
                )}
                <div className="bg-muted/50 border border-border rounded-xl p-3 mb-5">
                  <p className="text-xs font-semibold text-foreground tracking-wide mb-1.5">How it works</p>
                  <ol className="text-xs text-foreground/80 space-y-1 list-decimal list-inside">
                    <li>Enter your name and phone to get a token.</li>
                    <li>Track your live position — no need to stay in line.</li>
                    <li>You'll be alerted when it's your turn.</li>
                  </ol>
                </div>
                <div className="space-y-3 mb-4">
                  <PrefillNotice
                    visible={prefilled}
                    onClear={() => { setVisitorName(""); setPhone(""); setPrefilled(false); }}
                    onUpdate={(n, p) => { setVisitorName(n); setPhone(p); setPrefilled(true); }}
                  />
                  <input type="text" required placeholder="Your name *" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                  <input type="tel" required placeholder="Phone *" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                </div>
                {joinError && (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-3 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium leading-snug">{joinError}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Have an account?{" "}
                  <Link to={`/auth/signin?next=/join/${queueId}`} className="text-primary font-semibold hover:underline">Sign in</Link> to skip this.
                  <br />
                  New here?{" "}
                  <Link to={`/auth/customer?next=/join/${queueId}`} className="text-primary font-semibold hover:underline">Create account</Link>
                </p>
                {(queue as any).queue_type === "restaurant" && (
                  <PartySizeField
                    value={partySize}
                    onChange={setPartySize}
                    options={deriveJoinPartySizes(queue)}
                    locked={sizeLocked}
                  />
                )}
                <button onClick={handleJoin} disabled={joining}
                  className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {joining ? "Joining..." : "Join Queue"}
                </button>
              </>
            )}
          </div>
        ) : null}

        {!joined && (activeQueueId || queueId) && bizFlags.show_live_queue_info && (
          <div className="mt-4">
            <QueueForecast queueId={(activeQueueId ?? queueId)!} audience="customer" />
          </div>
        )}

        {joined && (
          <div className="bg-card rounded-2xl p-6 card-shadow text-center">
            <SuccessCelebration token={myToken} visible={showJoinSuccess} />
            {myStatus === "called" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-success mb-2">It's Your Turn!</h2>
                <p className="text-5xl font-extrabold text-foreground mb-2">#{myToken}</p>
                <p className="text-sm text-muted-foreground">Please proceed to the counter.</p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!myVisitorId) return;
                    const { error } = await (supabase as any).rpc("check_in_visitor", { p_visitor_id: myVisitorId });
                    if (error) return toast.error(error.message || "Check-in failed");
                    toast.success("Checked in — the counter has been notified");
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold hover:opacity-90"
                  aria-label="Confirm arrival and check in"
                >
                  <CheckCircle className="w-4 h-4" /> I've arrived — Check in
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Please check in soon to avoid being marked as a no-show.
                </p>
              </>
            ) : myStatus === "served" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">You've Been Served</h2>
                <p className="text-sm text-muted-foreground">Thank you for visiting!</p>
              </>
            ) : myStatus === "skipped" ? (
              <>
                <h2 className="text-xl font-bold text-warning mb-2">Skipped</h2>
                <p className="text-sm text-muted-foreground">You were skipped. Please check with the counter.</p>
              </>
            ) : (
              <>
                {(() => {
                  const d = derived();
                  return (
                    <>
                      <LiveWaitingExperience
                        ahead={d.ahead}
                        waitMinutes={d.waitMinutes}
                        liveStatus={d.liveStatus}
                        myToken={myToken}
                        nowServing={nowServingToken}
                        serviceTime={queue.estimated_service_time || 5}
                        onRefresh={refreshNow}
                        initialAhead={initialAhead ?? undefined}
                        joinedAt={joinedAt ?? undefined}
                        graceStatus={graceStatus}
                        graceExpiresAt={graceExpiresAt}
                        onRequestGrace={handleRequestGrace}
                        velocityConfidence={d.confidence}
                        effectiveVelocity={d.effectiveVelocity}
                      />
                      <WaitAndExplore
                        estimatedWaitMinutes={d.waitMinutes}
                        businessAddress={bizAddress}
                      />
                      <QueueTimeline
                        tokens={intel.tokens}
                        myToken={myToken}
                        nowServing={nowServingToken}
                        loading={!intel.ready}
                        className="mt-4"
                      />
                      <LiveActivityFeed events={intel.activity} loading={!intel.ready} className="mt-4" />
                      <div className="mt-4 bg-info-soft border border-info/30 rounded-xl p-3 text-left">
                        <p className="text-xs text-info">
                          💡 Tip: Please arrive at least <span className="font-semibold">10 minutes before</span> your estimated turn time.
                        </p>
                      </div>
                      <ContextualTips
                        pulse={intel.pulse}
                        ahead={d.ahead}
                        waitMinutes={d.waitMinutes}
                        serviceTime={queue.estimated_service_time || 5}
                        callTimes={intel.callTimes}
                        className="mb-4"
                      />
                      <TrustPrivacyCard />
                      <div className="hidden sm:block">
                        <AIAssistant
                          mode="queue_companion"
                          queueContext={{
                            user_position: d.ahead,
                            estimated_wait_time: d.waitMinutes,
                            now_serving: nowServingToken,
                            user_token: myToken,
                            business_name: queue.name,
                          }}
                        />
                      </div>
                      <div className="mt-6">
                        <FounderContact />
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <a href="/" className="text-primary hover:underline">Qblink</a>
        </p>
      </div>
    </div>
  );
};

export default JoinQueue;

const DEFAULT_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 8, 10];
const FLEXIBLE_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7];

// What party sizes should the customer see when joining a restaurant?
//  - Flexible (default): every-day party sizes (1..7+). The system auto-routes
//    them to the smallest available table that fits.
//  - Strict: only sizes the restaurant explicitly seats.
const deriveJoinPartySizes = (queue: any): number[] => {
  const policy = (queue?.seating_policy as string) || "flexible";
  const tables = (queue?.table_config as Array<{ seats: number; count: number }> | null) || [];
  const fromTables = Array.from(
    new Set(
      tables
        .filter((t) => (t?.count ?? 0) > 0 && (t?.seats ?? 0) > 0)
        .map((t) => Number(t.seats)),
    ),
  ).sort((a, b) => a - b);
  if (policy === "strict") {
    if (fromTables.length) return fromTables;
    const configured = (queue?.party_sizes as number[] | null) || [];
    return configured.length ? configured : DEFAULT_PARTY_SIZES;
  }
  // Flexible mode: show simple everyday party sizes regardless of internal seats.
  return FLEXIBLE_PARTY_SIZES;
};

const PartySizeField = ({
  value,
  onChange,
  options,
  locked,
}: {
  value: number;
  onChange: (n: number) => void;
  options?: number[] | null;
  locked?: boolean;
}) => {
  const sizes = (options && options.length ? options : DEFAULT_PARTY_SIZES)
    .slice()
    .sort((a, b) => a - b);
  // Ensure current value is one of the configured chips; default to smallest.
  useEffect(() => {
    if (locked) return;
    if (!sizes.includes(value)) onChange(sizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes.join(","), locked]);

  if (locked) {
    return (
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Party size</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">
          Joining for {value} {value === 1 ? "person" : "people"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          We'll seat you at the best-fit table.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="text-sm font-semibold text-foreground mb-2 block">
        How many people are joining today? <span className="text-destructive">*</span>
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Just tell us your party size — we'll match you with the right table.
      </p>
      <div
        role="radiogroup"
        aria-label="Party size"
        className="flex flex-wrap gap-2"
      >
        {sizes.map((n) => {
          const active = value === n;
          const isMax = n === Math.max(...sizes);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={`min-w-[52px] px-4 py-3 rounded-xl text-base font-semibold border transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground/80 hover:text-foreground hover:border-primary/40"
              }`}
            >
              {isMax && n >= 7 ? `${n}+` : n}
            </button>
          );
        })}
      </div>
    </div>
  );
};
