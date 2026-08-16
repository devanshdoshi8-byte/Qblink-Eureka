import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  mode: "customer" | "business" | "queue_companion";
  businessId?: string;
  suggestions?: string[];
  queueContext?: {
    user_position?: number;
    estimated_wait_time?: number;
    now_serving?: number | null;
    user_token?: number | null;
    business_name?: string;
    location?: string;
  };
}

type SuggestionGroup = { label: string; items: string[] };

// ===========================================================================
// Intent-ranking system for dynamic follow-up chips.
// Each intent has weighted keywords, mode affinity, and a small set of
// natural follow-up prompts. We score intents against the last user message
// (and a fainter signal from the assistant reply), then surface the top
// prompts from the winning intents — excluding anything the user just asked.
// ===========================================================================

type Mode = "customer" | "business" | "queue_companion";

type Intent = {
  id: string;
  modes: Mode[];
  // keyword -> weight. Multi-word phrases supported.
  keywords: Record<string, number>;
  prompts: string[];
  // baseline score so a relevant evergreen intent can still appear when
  // nothing else matches strongly.
  base?: number;
};

const INTENTS: Intent[] = [
  // -------------------- Customer intents --------------------
  {
    id: "remote_join",
    modes: ["customer"],
    keywords: { "remote": 3, "from home": 3, "without going": 3, "online": 2, "app": 1, "join": 2, "book": 2, "ahead": 2 },
    prompts: [
      "Can I join a queue without going there?",
      "How do I get notified when it's almost my turn?",
      "Can I reserve my spot from home?",
    ],
  },
  {
    id: "time_saved",
    modes: ["customer"],
    keywords: { "save": 3, "time": 2, "wait": 2, "long": 1, "minutes": 1, "hours": 1, "fast": 1, "quick": 1 },
    prompts: [
      "How much time can Qblink really save me?",
      "Which places nearby have the shortest wait?",
      "How accurate is the estimated wait time?",
    ],
  },
  {
    id: "find_place",
    modes: ["customer"],
    keywords: { "clinic": 3, "salon": 3, "restaurant": 3, "cafe": 3, "shop": 2, "place": 2, "nearby": 3, "find": 2, "where": 1 },
    prompts: [
      "Which clinic is free right now?",
      "Find a cafe with the shortest wait",
      "Shortest wait nearby?",
    ],
  },
  {
    id: "what_is_qblink",
    modes: ["customer", "business"],
    keywords: { "qblink": 2, "what is": 3, "how does": 3, "work": 1, "platform": 2, "explain": 2 },
    prompts: [
      "What is Qblink and how does it work?",
      "Is Qblink safe and trustworthy?",
      "How is Qblink different from token machines?",
    ],
  },
  {
    id: "onboarding_customer",
    modes: ["customer"],
    keywords: { "start": 2, "begin": 2, "sign up": 3, "signup": 3, "onboard": 3, "new": 1, "first time": 3 },
    prompts: [
      "How do I get started as a customer?",
      "How do I onboard a business I visit often?",
      "Do I need to create an account?",
    ],
    base: 0.3,
  },
  {
    id: "referrals_customer",
    modes: ["customer"],
    keywords: { "refer": 3, "recommend": 3, "share": 2, "friend": 2, "tell": 1, "spread": 2 },
    prompts: [
      "How can I recommend Qblink to a business?",
      "Can I refer a friend who hates waiting?",
      "How do I share feedback with the founder?",
    ],
  },
  {
    id: "founder_contact",
    modes: ["customer", "business", "queue_companion"],
    keywords: { "founder": 3, "contact": 2, "team": 2, "support": 2, "help": 1, "feedback": 3, "talk": 1 },
    prompts: [
      "How do I contact the founder?",
      "Can I share feedback?",
      "Who is behind Qblink?",
    ],
  },

  // -------------------- Business intents --------------------
  {
    id: "peak_hours",
    modes: ["business"],
    keywords: { "peak": 3, "busy": 3, "hours": 2, "load": 2, "today": 1, "rush": 2 },
    prompts: [
      "What are my peak hours?",
      "How can I reduce wait time during rush?",
      "Any unusual delays today?",
    ],
  },
  {
    id: "grow_business",
    modes: ["business"],
    keywords: { "grow": 3, "more customers": 3, "marketing": 2, "retention": 2, "loyalty": 2, "analytics": 2 },
    prompts: [
      "How does Qblink help me grow?",
      "What analytics do I get?",
      "How do I refer another business?",
    ],
  },
  {
    id: "onboard_staff",
    modes: ["business"],
    keywords: { "staff": 3, "team": 2, "onboard": 3, "train": 3, "setup": 2, "install": 2 },
    prompts: [
      "How do I onboard my staff?",
      "What setup do I need to start?",
      "Do I need any hardware?",
    ],
  },

  // -------------------- Queue companion intents --------------------
  {
    id: "leave_return",
    modes: ["queue_companion"],
    keywords: { "leave": 3, "come back": 3, "return": 3, "far": 2, "step out": 3, "go": 1 },
    prompts: [
      "How early should I return?",
      "Will I miss my turn if I leave now?",
      "What can I do nearby in this time?",
    ],
  },
  {
    id: "wait_pace",
    modes: ["queue_companion"],
    keywords: { "wait": 2, "long": 2, "minutes": 2, "moving": 3, "fast": 2, "slow": 2, "how long": 3 },
    prompts: [
      "Is the queue moving fast right now?",
      "How long do I actually have?",
      "When should I come back?",
    ],
  },
  {
    id: "miss_turn",
    modes: ["queue_companion"],
    keywords: { "late": 3, "miss": 3, "skip": 2, "rejoin": 3, "missed": 3 },
    prompts: [
      "What if I am late?",
      "Can I rejoin if I miss my turn?",
      "How early should I return?",
    ],
  },
  {
    id: "recommend_place",
    modes: ["queue_companion"],
    keywords: { "good": 1, "place": 2, "recommend": 3, "share": 2, "friend": 2 },
    prompts: [
      "Can I recommend this place to a friend?",
      "How do I share feedback about this experience?",
    ],
    base: 0.2,
  },
];

function scoreText(text: string, keywords: Record<string, number>): number {
  let s = 0;
  for (const [kw, w] of Object.entries(keywords)) {
    if (text.includes(kw)) s += w;
  }
  return s;
}

// Did the user already ask something close to this prompt? Naive token overlap.
function alreadyAsked(prompt: string, lastUser: string): boolean {
  if (!lastUser) return false;
  const a = new Set(prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const b = new Set(lastUser.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (a.size === 0) return false;
  let overlap = 0;
  a.forEach((t) => { if (b.has(t)) overlap++; });
  return overlap / a.size >= 0.6;
}

function rankFollowUps(mode: Mode, lastUser: string, lastAssistant: string): SuggestionGroup | null {
  const u = lastUser.toLowerCase();
  const a = lastAssistant.toLowerCase();
  if (!u && !a) return null;

  const ranked = INTENTS
    .filter((i) => i.modes.includes(mode))
    .map((i) => {
      const userScore = scoreText(u, i.keywords);
      const assistantScore = scoreText(a, i.keywords) * 0.4; // fainter signal
      const score = userScore + assistantScore + (i.base ?? 0);
      return { intent: i, score, userScore };
    })
    .filter((r) => r.score > 0)
    // Demote the intent the user just asked about so we surface NEXT steps.
    .map((r) => ({ ...r, score: r.userScore >= 3 ? r.score * 0.35 : r.score }))
    .sort((x, y) => y.score - x.score);

  if (ranked.length === 0) return null;

  const seen = new Set<string>();
  const items: string[] = [];
  for (const r of ranked) {
    for (const p of r.intent.prompts) {
      if (items.length >= 4) break;
      if (seen.has(p)) continue;
      if (alreadyAsked(p, lastUser)) continue;
      seen.add(p);
      items.push(p);
    }
    if (items.length >= 4) break;
  }

  if (items.length === 0) return null;
  return { label: "You might also ask", items };
}

const GROUPED_SUGGESTIONS: Record<"customer" | "business" | "queue_companion", SuggestionGroup[]> = {
  customer: [
    { label: "Find a place", items: [
      "Which clinic is free now?",
      "Find a cafe with fast pickup",
      "Shortest wait nearby?",
    ]},
    { label: "About Qblink", items: [
      "What is Qblink and how does it work?",
      "How much waiting time can Qblink save me?",
      "Is Qblink safe and trustworthy?",
    ]},
    { label: "Support & referrals", items: [
      "How can I recommend Qblink to a business?",
      "How do I contact the founder?",
      "Can I share feedback?",
    ]},
  ],
  business: [
    { label: "Operations", items: [
      "Summarize today's queue load",
      "What are my peak hours?",
      "How can I reduce wait time?",
      "Any unusual delays?",
    ]},
    { label: "Grow with Qblink", items: [
      "How does Qblink help my clinic / restaurant?",
      "What analytics do I get?",
      "How do I refer another business?",
    ]},
  ],
  queue_companion: [
    { label: "Your wait", items: [
      "How long do I actually have?",
      "Is the queue moving fast right now?",
      "When should I come back?",
    ]},
    { label: "Plan & move", items: [
      "Can I leave and come back?",
      "What can I do nearby in this time?",
      "What should I do while waiting?",
    ]},
    { label: "Don't miss your turn", items: [
      "Will I miss my turn if I leave now?",
      "How early should I return?",
      "What if I am late?",
    ]},
  ],
};

export default function AIAssistant({ mode, businessId, suggestions, queueContext }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const groups: SuggestionGroup[] = suggestions
    ? [{ label: "Suggested", items: suggestions }]
    : GROUPED_SUGGESTIONS[mode];

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const dynamicGroup =
    !suggestions && messages.length > 0 && !loading
      ? rankFollowUps(mode, lastUser, lastAssistant)
      : null;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qblink-ai`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: next, mode, businessId, queueContext }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err.error || "Something went wrong"}` }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let assistantStarted = false;
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              if (!assistantStarted) {
                assistantStarted = true;
                setMessages((m) => [...m, { role: "assistant", content: acc }]);
              } else {
                setMessages((m) => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: acc } : msg));
              }
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Network error. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 gradient-bg text-primary-foreground rounded-full p-4 shadow-lg flex items-center gap-2"
        aria-label="Open AI assistant"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: open ? 0.9 : [1, 1.04, 1],
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: open
            ? { duration: 0.2 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold pr-1">
          {mode === "queue_companion" ? "Queue Companion" : "Ask Qblink AI"}
        </span>
      </motion.button>

      <AnimatePresence>
      {open && (
        <motion.div
          key="ai-panel"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[380px] sm:h-[560px] bg-card sm:rounded-2xl elevated-shadow flex flex-col border border-border"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">
                  {mode === "queue_companion" ? "Queue Companion" : "Qblink AI"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {mode === "customer"
                    ? "Find places, beat the wait"
                    : mode === "business"
                    ? "Operational assistant"
                    : "Helping you through the wait"}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Hi! How can I help?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "customer"
                    ? "Ask about places, Qblink, or how to share feedback."
                    : mode === "business"
                    ? "Ask about queue load, growth, or Qblink itself."
                    : "Ask about your wait, when to leave, or what to do nearby."}
                </p>
              </motion.div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "gradient-bg text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {m.role === "assistant"
                    ? <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    : m.content}
                </div>
              </motion.div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 block"
                      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {(messages.length === 0 || dynamicGroup) && (
            <div className="px-3 pb-2 max-h-[40%] overflow-y-auto space-y-2">
              {(messages.length === 0 ? groups : [dynamicGroup!]).map((g) => (
                <motion.div
                  key={g.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 px-1">{g.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-foreground border border-border transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-border flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "customer"
                  ? "Ask about a place or wait time…"
                  : mode === "business"
                  ? "Ask about your operations…"
                  : "Ask about your wait…"
              }
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="gradient-bg text-primary-foreground rounded-xl px-3 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}