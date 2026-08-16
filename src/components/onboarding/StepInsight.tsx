import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  UsersRound,
  Clock,
  Annoyed,
  Repeat,
  UserMinus,
  ListPlus,
  Gauge,
  Utensils,
  Stethoscope,
  Scissors,
  Microscope,
  Landmark,
  Store,
  Briefcase,
  HelpCircle,
  Hourglass,
  Eye,
  EyeOff,
  RefreshCw,
  Smile,
  Frown,
  MessageSquare,
  Users,
  Workflow,
  AlertCircle,
  Star,
  DoorOpen,
  Sparkles,
  ListChecks,
  Waves,
} from "lucide-react";
import TypingText from "./TypingText";
import CommunityVoices from "./CommunityVoices";
import { firstNameOf, type OnboardingData, type OnboardingRole } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

type SubPage = "validation" | "discovery" | "reveal" | "ending";
const PAGE_ORDER: SubPage[] = ["validation", "discovery", "reveal", "ending"];

type IconType = typeof Utensils;

interface Persona {
  icon: IconType;
  label: string;
  tint: string;
}

const CUSTOMER_PERSONAS: Persona[] = [
  { icon: Utensils, label: "At a restaurant", tint: "bg-danger-soft text-danger" },
  { icon: Stethoscope, label: "At a clinic", tint: "bg-info-soft text-info" },
  { icon: Scissors, label: "At a salon", tint: "bg-primary text-primary" },
  { icon: Microscope, label: "At a diagnostic centre", tint: "bg-success-soft text-success" },
  { icon: Landmark, label: "At a bank", tint: "bg-warning-soft text-warning" },
];

const BUSINESS_PERSONAS: Persona[] = [
  { icon: Utensils, label: "Restaurant owners", tint: "bg-danger-soft text-danger" },
  { icon: Stethoscope, label: "Clinic managers", tint: "bg-info-soft text-info" },
  { icon: Scissors, label: "Salon owners", tint: "bg-primary text-primary" },
  { icon: Store, label: "Retail operators", tint: "bg-warning-soft text-warning" },
  { icon: Briefcase, label: "Diagnostic managers", tint: "bg-success-soft text-success" },
];

/* ─────────────────────────────────────────────────────────────────────────
   Shared shells
   ──────────────────────────────────────────────────────────────────── */

const PageShell = ({ children, k }: { children: React.ReactNode; k: string }) => (
  <motion.section
    key={k}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    {children}
  </motion.section>
);

const ContinueBtn = ({ onClick, label = "Continue" }: { onClick: () => void; label?: string }) => (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={onClick}
      className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
    >
      {label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </button>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   Page 1 — Validation (people)
   ──────────────────────────────────────────────────────────────────── */

const ValidationPage = ({
  name,
  personas,
  intro,
  outro,
  onNext,
}: {
  name: string;
  personas: Persona[];
  intro: string;
  outro: string;
  onNext: () => void;
}) => (
  <PageShell k="validation">
    <div className="text-center mb-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-3">
        <TypingText text={`${name}, you're not alone in this.`} speed={26} />
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="text-sm text-muted-foreground"
      >
        {intro}
      </motion.p>
    </div>

    <div className="relative mb-6">
      <ul className="grid grid-cols-2 gap-3" role="list">
        {personas.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.li
              key={p.label}
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.8 + i * 0.18, duration: 0.45, ease: "easeOut" }}
              className={`rounded-2xl border border-border bg-card card-shadow p-4 flex flex-col items-center text-center gap-2 ${
                i === personas.length - 1 && personas.length % 2 === 1 ? "col-span-2" : ""
              }`}
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${p.tint}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-foreground">{p.label}</span>
            </motion.li>
          );
        })}
      </ul>

      {/* Connective pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 + personas.length * 0.18 + 0.2, duration: 0.5 }}
        className="flex justify-center mt-5"
        aria-hidden="true"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <Waves className="w-4 h-4" /> Same feeling, different places
        </span>
      </motion.div>
    </div>

    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8 + personas.length * 0.18 + 0.6, duration: 0.4 }}
      className="text-center text-base text-foreground font-medium mb-8 px-2"
    >
      {outro}
    </motion.p>

    <ContinueBtn onClick={onNext} label="That's me" />
  </PageShell>
);

/* ─────────────────────────────────────────────────────────────────────────
   Customer Page 2 — Discovery (two cards)
   ──────────────────────────────────────────────────────────────────── */

const CustomerDiscovery = ({ onNext }: { onNext: () => void }) => {
  const [picked, setPicked] = useState<"wait" | "unknown" | null>(null);

  return (
    <PageShell k="discovery-c">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
          What feels worse?
        </h2>
        <p className="text-sm text-muted-foreground">Trust your gut. There's no wrong answer.</p>
      </div>

      <div className="grid gap-3 mb-6">
        {([
          {
            id: "wait",
            title: "Waiting 20 minutes",
            sub: "You know the line. You watch it move.",
            visual: (
              <div className="flex items-center gap-1 mt-3" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="h-2 flex-1 rounded-full bg-primary/40 origin-left"
                  />
                ))}
              </div>
            ),
            icon: Hourglass,
          },
          {
            id: "unknown",
            title: "Waiting 20 minutes without knowing why",
            sub: "Same time. No information. No idea what's next.",
            visual: (
              <div className="flex items-center justify-center gap-2 mt-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                    className="w-7 h-7 rounded-full bg-danger-soft text-danger flex items-center justify-center text-sm font-bold"
                  >
                    ?
                  </motion.span>
                ))}
              </div>
            ),
            icon: HelpCircle,
          },
        ] as const).map((c, i) => {
          const selected = picked === c.id;
          const Icon = c.icon;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setPicked(c.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              aria-pressed={selected}
              className={`text-left rounded-2xl border p-5 transition-all duration-300 ${
                selected
                  ? "border-primary bg-primary/5 elevated-shadow scale-[1.01]"
                  : "border-border bg-card card-shadow hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="font-bold text-foreground leading-tight">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                  {c.visual}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6 px-2"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">A pattern.</p>
            <p className="text-base text-foreground font-medium leading-relaxed">
              The amount of waiting matters.
              <br />
              <span className="text-muted-foreground">But uncertainty often feels worse.</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={{ opacity: picked ? 1 : 0.4 }}>
        <button
          type="button"
          onClick={onNext}
          disabled={!picked}
          className="mx-auto block gradient-bg text-primary-foreground px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow disabled:pointer-events-none"
        >
          Continue
        </button>
      </motion.div>
    </PageShell>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Customer Page 3 — Visual comparison
   ──────────────────────────────────────────────────────────────────── */

const CustomerComparison = ({ onNext }: { onNext: () => void }) => (
  <PageShell k="reveal-c">
    <div className="text-center mb-6">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
        Two kinds of waiting.
      </h2>
      <p className="text-sm text-muted-foreground">Same minutes. Very different feelings.</p>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-6">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-success/30 bg-success-soft/60 p-4 flex flex-col items-center text-center gap-3"
      >
        <span className="w-11 h-11 rounded-xl bg-success-soft text-success flex items-center justify-center">
          <Eye className="w-5 h-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-bold text-success uppercase tracking-wider">Visible</p>
        <div className="w-full">
          <div className="text-[10px] text-success font-semibold mb-1">You're #3</div>
          <div className="h-1.5 rounded-full bg-success-soft overflow-hidden">
            <motion.div
              initial={{ width: "10%" }}
              animate={{ width: "70%" }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="h-full bg-success"
            />
          </div>
        </div>
        <Smile className="w-6 h-6 text-success" aria-hidden="true" />
        <p className="text-[11px] text-muted-foreground leading-snug">Calm. In control.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-danger/30 bg-danger-soft/60 p-4 flex flex-col items-center text-center gap-3"
      >
        <span className="w-11 h-11 rounded-xl bg-danger-soft text-danger flex items-center justify-center">
          <EyeOff className="w-5 h-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-bold text-danger uppercase tracking-wider">Invisible</p>
        <div className="flex items-center gap-1">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-4 h-4 text-danger" aria-hidden="true" />
          </motion.span>
          <span className="text-[10px] font-semibold text-danger">Checking…</span>
        </div>
        <Frown className="w-6 h-6 text-danger" aria-hidden="true" />
        <p className="text-[11px] text-muted-foreground leading-snug">Anxious. Unsure.</p>
      </motion.div>
    </div>

    <CommunityVoices audience="customer" className="mb-6" />

    <ContinueBtn onClick={onNext} />
  </PageShell>
);

/* ─────────────────────────────────────────────────────────────────────────
   Business Page 2 — Discovery (chain reaction)
   ──────────────────────────────────────────────────────────────────── */

const CHAIN: { icon: IconType; label: string; tone: "neutral" | "warn" | "bad" }[] = [
  { icon: Hourglass, label: "Customer waits", tone: "neutral" },
  { icon: MessageSquare, label: "Customer asks for update", tone: "neutral" },
  { icon: Users, label: "Staff interrupted", tone: "warn" },
  { icon: Workflow, label: "Workflow slows", tone: "warn" },
  { icon: Hourglass, label: "More waiting", tone: "bad" },
  { icon: MessageSquare, label: "More questions", tone: "bad" },
];

const toneClasses = {
  neutral: "bg-primary/10 text-primary",
  warn: "bg-warning-soft text-warning",
  bad: "bg-danger-soft text-danger",
} as const;

const BusinessDiscovery = ({ name, onNext }: { name: string; onNext: () => void }) => (
  <ImpactSplit name={name} onNext={onNext} />
);

/* ─────────────────────────────────────────────────────────────────────────
   Impact split — two sides, one problem (replaces old chain duplicate)
   ──────────────────────────────────────────────────────────────────── */

const CUSTOMER_IMPACT: { icon: IconType; label: string }[] = [
  { icon: Compass, label: "Uncertainty" },
  { icon: UsersRound, label: "Crowded waiting areas" },
  { icon: Clock, label: "Lost time" },
  { icon: Annoyed, label: "Frustration" },
];

const BUSINESS_IMPACT: { icon: IconType; label: string }[] = [
  { icon: Repeat, label: "Repeated questions" },
  { icon: UserMinus, label: "Interrupted staff" },
  { icon: ListPlus, label: "Longer queues" },
  { icon: Gauge, label: "Lower efficiency" },
];

const ImpactColumn = ({
  title,
  items,
  side,
  accent,
  startDelay,
  merged,
}: {
  title: string;
  items: { icon: IconType; label: string }[];
  side: "left" | "right";
  accent: { tint: string; dot: string; border: string };
  startDelay: number;
  merged: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
    animate={{
      opacity: merged ? 0.25 : 1,
      x: merged ? (side === "left" ? 8 : -8) : 0,
      scale: merged ? 0.97 : 1,
    }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="flex-1 min-w-0"
  >
    <div className="text-center mb-2.5">
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${accent.dot}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" /> {title}
      </span>
    </div>
    <div className="flex flex-col gap-2">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: startDelay + i * 0.25, duration: 0.35, ease: "easeOut" }}
            className={`rounded-xl border ${accent.border} ${accent.tint} px-2.5 py-2.5 flex flex-col items-center text-center gap-1.5`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-foreground leading-tight">{it.label}</span>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

const ImpactSplit = ({ name, onNext }: { name: string; onNext: () => void }) => {
  const customerStart = 0.45;
  const businessStart = 0.55;
  // Both columns reveal 4 items in parallel; merge after the last appears.
  const allRevealedAt = Math.max(customerStart, businessStart) + (CUSTOMER_IMPACT.length - 1) * 0.25 + 0.35;
  const [merged, setMerged] = useState(false);

  return (
    <PageShell k="impact-split">
      <div className="text-center mb-5 px-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
          {name ? `${name}, this doesn't just waste time.` : `This doesn't just waste time.`}
        </h2>
        <p className="text-sm text-muted-foreground">It affects everyone involved.</p>
      </div>

      <div className="relative mb-5">
        {/* Animated dividing line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: merged ? 0 : 1, opacity: merged ? 0 : 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          aria-hidden="true"
          className="absolute left-1/2 top-6 bottom-2 w-px -translate-x-1/2 origin-top bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"
        />

        <div className="flex items-start gap-2.5">
          <ImpactColumn
            title="Customer"
            items={CUSTOMER_IMPACT}
            side="left"
            accent={{
              tint: "bg-info-soft/70",
              border: "border-info/30",
              dot: "text-info",
            }}
            startDelay={customerStart}
            merged={merged}
          />
          <ImpactColumn
            title="Business"
            items={BUSINESS_IMPACT}
            side="right"
            accent={{
              tint: "bg-warning-soft/70",
              border: "border-warning/30",
              dot: "text-warning",
            }}
            startDelay={businessStart}
            merged={merged}
          />
        </div>

        {/* Reveal trigger for merge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: allRevealedAt + 0.2, duration: 0.01 }}
          onAnimationComplete={() => setMerged(true)}
        />

        {/* Merge overlay */}
        <AnimatePresence>
          {merged && (
            <motion.div
              key="merge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-2xl px-5 py-4 elevated-shadow text-center max-w-[280px]">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1.5">The truth</p>
                <p className="text-base font-extrabold text-foreground leading-snug">
                  One queue problem.
                  <br />
                  <span className="text-primary">Two sides affected.</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: merged ? 1 : 0.35, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ContinueBtn onClick={onNext} />
      </motion.div>
    </PageShell>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Business Page 3 — Realization (queue vs what it creates)
   ──────────────────────────────────────────────────────────────────── */

const BUSINESS_RIPPLES = [
  { icon: AlertCircle, label: "Complaints", tint: "bg-danger-soft text-danger" },
  { icon: Users, label: "Staff interruptions", tint: "bg-warning-soft text-warning" },
  { icon: Frown, label: "Customer frustration", tint: "bg-warning-soft text-warning" },
  { icon: DoorOpen, label: "Walk-outs", tint: "bg-primary text-primary" },
  { icon: Star, label: "Negative reviews", tint: "bg-warning-soft text-warning" },
];

const BusinessRealization = ({ onNext }: { onNext: () => void }) => {
  const [picked, setPicked] = useState<"queue" | "ripples" | null>(null);

  return (
    <PageShell k="reveal-b">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
          Where's the real challenge?
        </h2>
        <p className="text-sm text-muted-foreground">Tap whichever feels closer to your day.</p>
      </div>

      <div className="grid gap-3 mb-6">
        <motion.button
          type="button"
          onClick={() => setPicked("queue")}
          aria-pressed={picked === "queue"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`text-left rounded-2xl border p-5 transition-all ${
            picked === "queue"
              ? "border-primary bg-primary/5 elevated-shadow scale-[1.01]"
              : "border-border bg-card card-shadow hover:border-primary/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ListChecks className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-foreground leading-tight">The queue itself</p>
              <p className="text-xs text-muted-foreground mt-0.5">The line of people waiting.</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setPicked("ripples")}
          aria-pressed={picked === "ripples"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className={`text-left rounded-2xl border p-5 transition-all ${
            picked === "ripples"
              ? "border-primary bg-primary/5 elevated-shadow scale-[1.01]"
              : "border-border bg-card card-shadow hover:border-primary/40"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-danger-soft text-danger flex items-center justify-center">
              <Waves className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-foreground leading-tight">Everything the queue creates</p>
              <p className="text-xs text-muted-foreground mt-0.5">The ripples it sends through your day.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-1">
            {BUSINESS_RIPPLES.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.span
                  key={r.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.tint}`}
                >
                  <Icon className="w-3 h-3" aria-hidden="true" /> {r.label}
                </motion.span>
              );
            })}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6 px-2"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">A pattern.</p>
            <p className="text-base text-foreground font-medium leading-relaxed">
              Many businesses discover that the queue isn't the biggest challenge.
              <br />
              <span className="text-muted-foreground">It's what the queue creates.</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <CommunityVoices audience="business_owner" className="mb-6" />

      <motion.div animate={{ opacity: picked ? 1 : 0.4 }}>
        <button
          type="button"
          onClick={onNext}
          disabled={!picked}
          className="mx-auto block gradient-bg text-primary-foreground px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow disabled:pointer-events-none"
        >
          Continue
        </button>
      </motion.div>
    </PageShell>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Page 4 — Ending (curiosity hook)
   ──────────────────────────────────────────────────────────────────── */

const EndingPage = ({ headline, onNext }: { headline: string; onNext: () => void }) => (
  <PageShell k="ending">
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
        className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 elevated-shadow"
      >
        <Sparkles className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
      </motion.div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-4">
        <TypingText text={headline} speed={30} />
      </h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.5 }}
        className="text-muted-foreground mb-8 px-2"
      >
        Hold that thought.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.7, duration: 0.4 }}
      >
        <ContinueBtn onClick={onNext} />
      </motion.div>
    </div>
  </PageShell>
);

/* ─────────────────────────────────────────────────────────────────────────
   Step root
   ──────────────────────────────────────────────────────────────────── */

const StepInsight = ({ data, onNext }: Props) => {
  const [pageIdx, setPageIdx] = useState(0);
  const page = PAGE_ORDER[pageIdx];
  const advance = () => {
    if (pageIdx >= PAGE_ORDER.length - 1) onNext();
    else setPageIdx((i) => i + 1);
  };

  const name = firstNameOf(data.fullName) || "Friend";
  const role: OnboardingRole = data.role ?? "customer";
  const isBusiness = role === "business_owner";

  const personas = isBusiness ? BUSINESS_PERSONAS : CUSTOMER_PERSONAS;
  const intro = isBusiness ? "Different businesses." : "Different places.";
  const outro = isBusiness
    ? "Very similar challenges. You're not the only one dealing with this."
    : "Very similar frustrations. You're not the only one.";
  const endingHeadline = isBusiness
    ? "What if customer flow felt different?"
    : "What if waiting felt different?";

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {page === "validation" && (
          <ValidationPage
            key="v"
            name={name}
            personas={personas}
            intro={intro}
            outro={outro}
            onNext={advance}
          />
        )}
        {page === "discovery" && (
          isBusiness ? <BusinessDiscovery key="d-b" name={name} onNext={advance} /> : <CustomerDiscovery key="d-c" onNext={advance} />
        )}
        {page === "reveal" && (
          isBusiness ? <BusinessRealization key="r-b" onNext={advance} /> : <CustomerComparison key="r-c" onNext={advance} />
        )}
        {page === "ending" && <EndingPage key="e" headline={endingHeadline} onNext={advance} />}
      </AnimatePresence>
    </div>
  );
};

export default StepInsight;