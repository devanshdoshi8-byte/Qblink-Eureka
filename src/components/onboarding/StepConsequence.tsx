import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  RefreshCw,
  HelpCircle,
  Flame,
  DoorOpen,
  Hourglass,
  Frown,
  XCircle,
  MessageSquare,
  Users,
  Workflow,
  AlertCircle,
  Smartphone,
  Star,
  Sparkles,
} from "lucide-react";
import TypingText from "./TypingText";
import {
  firstNameOf,
  resolveFrustration,
  type FrustrationKey,
  type OnboardingData,
  type OnboardingRole,
} from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

type SubPage = "chain" | "impact" | "reflect" | "transition";
const PAGE_ORDER: SubPage[] = ["chain", "impact", "reflect", "transition"];

type IconType = typeof Clock;

interface ChainStep {
  icon: IconType;
  label: string;
  tone?: "neutral" | "warn" | "bad";
}

const CHAINS: Record<FrustrationKey, { title: string; steps: ChainStep[] }> = {
  not_knowing: {
    title: "When you can't see what's happening…",
    steps: [
      { icon: Hourglass, label: "Waiting" },
      { icon: RefreshCw, label: "Checking position" },
      { icon: RefreshCw, label: "Checking again", tone: "warn" },
      { icon: HelpCircle, label: "Uncertainty grows", tone: "warn" },
      { icon: Flame, label: "Frustration grows", tone: "bad" },
    ],
  },
  leaving_early: {
    title: "When the wait runs long…",
    steps: [
      { icon: Users, label: "Join the queue" },
      { icon: Hourglass, label: "Wait" },
      { icon: Frown, label: "Patience runs out", tone: "warn" },
      { icon: DoorOpen, label: "Walk out", tone: "bad" },
      { icon: XCircle, label: "Visit wasted", tone: "bad" },
    ],
  },
  constant_updates: {
    title: "When everyone needs an update…",
    steps: [
      { icon: MessageSquare, label: "Customer asks" },
      { icon: Users, label: "Staff interrupted", tone: "warn" },
      { icon: Workflow, label: "Workflow slows", tone: "warn" },
      { icon: Hourglass, label: "More waiting" },
      { icon: MessageSquare, label: "More questions", tone: "bad" },
    ],
  },
  complaints: {
    title: "When the wait gets too long…",
    steps: [
      { icon: Hourglass, label: "Long wait" },
      { icon: Frown, label: "Frustration", tone: "warn" },
      { icon: AlertCircle, label: "Complaint", tone: "bad" },
      { icon: Star, label: "Negative experience", tone: "bad" },
    ],
  },
};

interface ImpactCard {
  icon: IconType;
  emoji: string;
  title: string;
  blurb: string;
}

const IMPACTS: Record<OnboardingRole, ImpactCard[]> = {
  customer: [
    { icon: Clock, emoji: "⏰", title: "Lost Time", blurb: "Minutes you'll never get back, every single visit." },
    { icon: Flame, emoji: "😤", title: "Frustration", blurb: "Small annoyances quietly become bad memories." },
    { icon: Smartphone, emoji: "📱", title: "Constant Checking", blurb: "Refreshing, glancing, asking — over and over." },
    { icon: DoorOpen, emoji: "🚶", title: "Leaving Early", blurb: "Sometimes the easiest fix is to just walk away." },
  ],
  business_owner: [
    { icon: MessageSquare, emoji: "📢", title: "Staff Interruptions", blurb: "Every question pulls your team off real work." },
    { icon: AlertCircle, emoji: "😠", title: "Complaints", blurb: "One bad wait can outweigh ten great experiences." },
    { icon: DoorOpen, emoji: "🚶", title: "Customer Drop-Off", blurb: "Silent walk-outs you'll never even notice." },
    { icon: Star, emoji: "⭐", title: "Negative Reviews", blurb: "Future customers read what today's customers felt." },
  ],
};

const FREQ_OPTIONS: Record<OnboardingRole, string[]> = {
  customer: ["Rarely", "Sometimes", "Often", "Almost Every Time"],
  business_owner: ["Rarely", "Weekly", "Daily", "Several Times Per Day"],
};

const REFLECTION_LINES: Record<OnboardingRole, Record<string, string>> = {
  customer: {
    Rarely: "Even rare frustration shapes how you remember a place.",
    Sometimes: "Small frustrations become habits faster than most people realize.",
    Often: "When it happens often, the brand stops being the experience — the wait does.",
    "Almost Every Time": "What you've described isn't bad luck. It's a pattern.",
  },
  business_owner: {
    Rarely: "Even rare moments shape what customers tell their friends.",
    Weekly: "Weekly friction quietly compounds into monthly churn.",
    Daily: "Many businesses underestimate how much waiting affects customer experience.",
    "Several Times Per Day": "When it happens that often, it stops being noise — it becomes the experience.",
  },
};

const toneClasses = {
  neutral: "bg-primary/10 text-primary",
  warn: "bg-warning-soft text-warning",
  bad: "bg-danger-soft text-danger",
} as const;

const StepConsequence = ({ data, onChange, onNext }: Props) => {
  const [pageIdx, setPageIdx] = useState(0);
  const page = PAGE_ORDER[pageIdx];
  const advance = () => setPageIdx((i) => Math.min(i + 1, PAGE_ORDER.length - 1));

  const name = firstNameOf(data.fullName) || "Friend";
  const role: OnboardingRole = data.role ?? "customer";
  const frustration = useMemo(() => resolveFrustration(data), [data]);
  const chain = CHAINS[frustration];
  const impacts = IMPACTS[role];
  const freqOptions = FREQ_OPTIONS[role];

  const [expanded, setExpanded] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<string | null>(
    (data.responses?.consequence_frequency as string | undefined) ?? null,
  );

  const selectFrequency = (v: string) => {
    setFrequency(v);
    onChange({
      responses: { ...(data.responses ?? {}), consequence_frequency: v },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* ───────────────────────── PAGE 1 — Chain reaction ───────────────────────── */}
        {page === "chain" && (
          <motion.section
            key="chain"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
              <TypingText text={`${name}, let's see what usually happens next.`} speed={26} />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="text-sm text-muted-foreground mb-8"
            >
              {chain.title}
            </motion.p>

            <div className="flex flex-col items-center gap-2 mb-10">
              {chain.steps.map((s, i) => {
                const Icon = s.icon;
                const tone = toneClasses[s.tone ?? "neutral"];
                return (
                  <div key={i} className="flex flex-col items-center w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 1.6 + i * 0.45, duration: 0.4, ease: "easeOut" }}
                      className="w-full max-w-[280px] flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 card-shadow"
                    >
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="font-semibold text-sm text-foreground text-left">{s.label}</span>
                    </motion.div>
                    {i < chain.steps.length - 1 && (
                      <motion.span
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: 1.6 + i * 0.45 + 0.3, duration: 0.3 }}
                        className="block w-0.5 h-5 bg-gradient-to-b from-primary/60 to-primary/10 origin-top my-1"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <motion.button
              type="button"
              onClick={advance}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + chain.steps.length * 0.45, duration: 0.4 }}
              className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
            >
              I've felt this <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </motion.section>
        )}

        {/* ───────────────────────── PAGE 2 — Hidden impact ───────────────────────── */}
        {page === "impact" && (
          <motion.section
            key="impact"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
                The hidden ripples.
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap a card to see what's really going on underneath.
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-3 mb-8" role="list">
              {impacts.map((c, i) => {
                const open = expanded === i;
                return (
                  <motion.li
                    key={c.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.4, ease: "easeOut" }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : i)}
                      aria-expanded={open}
                      className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
                        open
                          ? "border-primary bg-primary/5 elevated-shadow scale-[1.02]"
                          : "border-border bg-card card-shadow hover:border-primary/40"
                      }`}
                    >
                      <div className="text-2xl mb-2" aria-hidden="true">
                        {c.emoji}
                      </div>
                      <p className="font-bold text-sm text-foreground leading-tight">{c.title}</p>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                          >
                            {c.blurb}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={advance}
                className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
              >
                Keep going <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.section>
        )}

        {/* ───────────────────────── PAGE 3 — Reflection ───────────────────────── */}
        {page === "reflect" && (
          <motion.section
            key="reflect"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
              {role === "business_owner"
                ? `${name}, how often does this play out?`
                : `${name}, how often does this happen to you?`}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">No right answer — just be honest with yourself.</p>

            <div className="grid gap-3 mb-6" role="radiogroup" aria-label="How often">
              {freqOptions.map((opt, i) => {
                const selected = frequency === opt;
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35 }}
                    onClick={() => selectFrequency(opt)}
                    className={`w-full text-left rounded-2xl border px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                      selected
                        ? "border-primary bg-primary/5 elevated-shadow"
                        : "border-border bg-card card-shadow hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{opt}</span>
                      <span
                        className={`w-5 h-5 rounded-full border-2 transition-colors ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {frequency && (
                <motion.div
                  key={frequency}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6"
                >
                  <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Interesting.</p>
                  <p className="text-base text-foreground font-medium leading-relaxed px-2">
                    {REFLECTION_LINES[role][frequency]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={advance}
              disabled={!frequency}
              initial={false}
              animate={{ opacity: frequency ? 1 : 0.4 }}
              className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow disabled:pointer-events-none"
            >
              Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </motion.section>
        )}

        {/* ───────────────────────── PAGE 4 — Curiosity transition ───────────────────────── */}
        {page === "transition" && (
          <motion.section
            key="transition"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
              className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 elevated-shadow"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-4">
              <TypingText text="What if the real problem isn't waiting itself?" speed={28} />
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.5 }}
              className="text-muted-foreground mb-8 px-2"
            >
              Let's look deeper.
            </motion.p>

            <motion.button
              type="button"
              onClick={onNext}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.4 }}
              className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
            >
              Show me <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepConsequence;