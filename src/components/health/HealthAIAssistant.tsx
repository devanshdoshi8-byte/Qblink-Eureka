import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Brain, Send, Loader2, Sparkles, Mail, Phone, History, Plus, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QBLINK_PHONE, QBLINK_PHONE_TEL, QBLINK_EMAIL_PRIMARY, QBLINK_EMAIL_SECONDARY } from "@/lib/contact";
import { formatDistanceToNow } from "date-fns";

type Msg = { role: "user" | "assistant"; content: string };
interface SessionRow { id: string; title: string; last_message_at: string }

const SUGGESTED_PROMPTS = [
  "What's the single biggest issue hurting my score?",
  "How do I reduce abandonment this week?",
  "Benchmark me against businesses in my category",
  "Build me a 7-day improvement plan",
  "Why are my customers waiting so long?",
  "How should I price/staff for peak hours?",
];

const CONTACT_FALLBACK = `You can also reach the Qblink team at **${QBLINK_PHONE}**, **${QBLINK_EMAIL_PRIMARY}** or **${QBLINK_EMAIL_SECONDARY}**.`;

interface Props {
  businessId: string;
  businessName?: string;
  variant?: "inline" | "compact";
}

export default function HealthAIAssistant({ businessId, businessName, variant = "inline" }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!businessId || !user) return;
    setMessages([]);
    setInitialized(false);
    setSessionId(null);
    loadSessions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, user?.id]);

  const loadSessions = async (autoResume = false) => {
    if (!user) return;
    const { data } = await supabase
      .from("health_ai_sessions")
      .select("id,title,last_message_at")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("last_message_at", { ascending: false })
      .limit(30);
    const rows = (data || []) as SessionRow[];
    setSessions(rows);
    if (autoResume && rows.length > 0) await openSession(rows[0].id);
  };

  const openSession = async (id: string) => {
    setSessionId(id);
    setShowHistory(false);
    const { data } = await supabase
      .from("health_ai_messages")
      .select("role,content")
      .eq("session_id", id)
      .order("created_at", { ascending: true });
    const msgs = ((data || []) as { role: string; content: string }[])
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    setMessages(msgs);
    setInitialized(msgs.length > 0);
  };

  const ensureSession = async (firstUserText?: string): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (!user) return null;
    const title = firstUserText ? firstUserText.slice(0, 60) : `Health review · ${new Date().toLocaleDateString()}`;
    const { data, error } = await supabase
      .from("health_ai_sessions")
      .insert({ business_id: businessId, user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) return null;
    setSessionId(data.id);
    loadSessions();
    return data.id;
  };

  const persistMessage = async (sid: string, role: "user" | "assistant", content: string) => {
    await supabase.from("health_ai_messages").insert({ session_id: sid, role, content });
    await supabase.from("health_ai_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", sid);
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInitialized(false);
    setShowHistory(false);
  };

  const deleteSession = async (id: string) => {
    await supabase.from("health_ai_sessions").delete().eq("id", id);
    if (sessionId === id) startNewChat();
    loadSessions();
  };

  const stream = async (convo: Msg[], isInit = false, sid?: string) => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/queue-health-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: convo, businessId, mode: isInit ? "init" : "chat" }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Connection failed" }));
        const msg = `⚠️ ${err.error || "Something went wrong"}. ${CONTACT_FALLBACK}`;
        setMessages(m => [...m, { role: "assistant", content: msg }]);
        if (sid) await persistMessage(sid, "assistant", msg);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", acc = "", started = false, done = false;

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
              if (!started) {
                started = true;
                setMessages(m => [...m, { role: "assistant", content: acc }]);
              } else {
                setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: acc } : msg));
              }
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (sid && acc) await persistMessage(sid, "assistant", acc);
    } catch {
      const msg = `⚠️ Network error. ${CONTACT_FALLBACK}`;
      setMessages(m => [...m, { role: "assistant", content: msg }]);
      if (sid) await persistMessage(sid, "assistant", msg);
    } finally {
      setLoading(false);
    }
  };

  const initialize = async () => {
    setInitialized(true);
    const sid = await ensureSession("Proactive Queue Health diagnosis");
    await stream([], true, sid || undefined);
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    if (!initialized) setInitialized(true);
    const sid = await ensureSession(text);
    if (sid) await persistMessage(sid, "user", text);
    await stream(next, false, sid || undefined);
  };

  return (
    <div className="bg-card rounded-2xl card-shadow overflow-hidden flex flex-col" style={{ minHeight: variant === "compact" ? 420 : 560 }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gradient-bg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">Qblink Health Coach</h3>
            <p className="text-[11px] text-white/80">AI ops specialist for {businessName || "your queue"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(s => !s)} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition relative" title="Chat history">
            <History className="w-4 h-4" />
            {sessions.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-white text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{sessions.length}</span>
            )}
          </button>
          <button onClick={startNewChat} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition" title="New conversation" aria-label="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="border-b border-border bg-muted/30 max-h-56 overflow-y-auto">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Past conversations</p>
            <button onClick={startNewChat} className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 pb-3">No past conversations yet for this business.</p>
          ) : (
            <ul className="pb-2">
              {sessions.map(s => (
                <li key={s.id} className={`group px-4 py-2 flex items-center justify-between gap-2 hover:bg-muted ${sessionId === s.id ? "bg-muted" : ""}`}>
                  <button onClick={() => openSession(s.id)} className="flex items-start gap-2 flex-1 min-w-0 text-left">
                    <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(s.last_message_at), { addSuffix: true })}</p>
                    </div>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-1" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
        {!initialized && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold text-foreground">Get a personalised health diagnosis</h4>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
              Your dedicated AI analyst will look at your live data and tell you exactly what to fix first.
            </p>
            <button onClick={initialize} disabled={loading} className="gradient-bg text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2">
              <Brain className="w-4 h-4" /> Analyse my Queue Health
            </button>
            {sessions.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-3">
                or <button onClick={() => setShowHistory(true)} className="text-primary font-semibold hover:underline">resume a past conversation</button>
              </p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "gradient-bg text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Coach is analysing your data…</span>
            </div>
          </div>
        )}
      </div>

      {initialized && messages.length > 0 && !loading && (
        <div className="px-3 pb-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 px-1">Suggested follow-ups</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.slice(0, 4).map(p => (
              <button key={p} onClick={() => send(p)} className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-foreground border border-border transition">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); send(input); }} className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about improving your queue…" disabled={loading} className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button type="submit" disabled={loading || !input.trim()} className="gradient-bg text-white rounded-xl px-3 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        <a href={`mailto:${QBLINK_EMAIL_PRIMARY}`} className="flex items-center gap-1 hover:text-primary"><Mail className="w-3 h-3" /> {QBLINK_EMAIL_PRIMARY}</a>
        <a href={`mailto:${QBLINK_EMAIL_SECONDARY}`} className="flex items-center gap-1 hover:text-primary"><Mail className="w-3 h-3" /> {QBLINK_EMAIL_SECONDARY}</a>
        <a href={`tel:${QBLINK_PHONE_TEL}`} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3 h-3" /> {QBLINK_PHONE}</a>
      </div>
    </div>
  );
}