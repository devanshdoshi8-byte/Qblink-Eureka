import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Heart,
  Briefcase,
  Coffee,
  ShoppingBag,
  Users,
  Activity,
  Bell,
  Sparkles,
  Stethoscope,
  Utensils,
  Scissors,
  Microscope,
  MessageCircleQuestion,
  Smile,
  Eye,
  Zap,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Brain,
  CheckCircle2,
  Network,
} from "lucide-react";
import customerDashboard from "@/assets/customer-dashboard.png.asset.json";
import { firstNameOf, type OnboardingData } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

type SubId =
  | "c1" | "c2" | "c3" | "c4" | "c5"
  | "b1" | "b2" | "b3" | "b4" | "b5";

const CUSTOMER_FLOW: SubId[] = ["c1", "c2", "c3", "c4", "c5"];
const BUSINESS_FLOW: SubId[] = ["b1", "b2", "b3", "b4", "b5"];

/* ------------------------------------------------------------------ */
/*  Shared shell                                                      */
/* ------------------------------------------------------------------ */

const Shell = ({
  eyebrow,
  title,
  children,
  cta = "Continue",
  onCta,
  ctaDisabled,
  ctaIcon,
  step,
  total,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  cta?: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaIcon?: React.ReactNode;
  step: number;
  total: number;
}) => (
  <div className="w-full max-w-md mx-auto">
    <div className="flex items-center justify-center gap-1.5 mb-5" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all ${
            i === step - 1 ? "w-7 bg-primary" : i < step - 1 ? "w-3 bg-primary/40" : "w-3 bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
    {eyebrow && (
      <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-primary text-center mb-2">
        {eyebrow}
      </p>
    )}
    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center leading-tight mb-6">
      {title}
    </h1>
    <div className="mb-7">{children}</div>
    <button
      type="button"
      onClick={onCta}
      disabled={ctaDisabled}
      className="w-full inline-flex items-center justify-center gap-2 gradient-bg text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] transition-all elevated-shadow disabled:opacity-50 disabled:hover:scale-100"
    >
      {cta}
      {ctaIcon ?? <ArrowRight className="w-4 h-4" aria-hidden="true" />}
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  CUSTOMER POV                                                      */
/* ------------------------------------------------------------------ */

const PEOPLE = [
  { token: "#3", icon: GraduationCap, label: "Student", tint: "bg-info-soft text-info" },
  { token: "#7", icon: Heart, label: "Parent", tint: "bg-danger-soft text-danger" },
  { token: "#11", icon: Stethoscope, label: "Patient", tint: "bg-success-soft text-success" },
  { token: "#18", icon: Briefcase, label: "Worker", tint: "bg-primary text-primary" },
];

const CustomerScreen1 = ({ onNext, name }: { onNext: () => void; name: string }) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <Shell
      eyebrow={name ? `${name}, look closer` : "Look closer"}
      title="Your time matters"
      onCta={onNext}
      step={1}
      total={5}
    >
      <div className="grid grid-cols-2 gap-3">
        {PEOPLE.map((p, i) => (
          <motion.div
            key={p.token}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl border border-border bg-card p-4 card-shadow overflow-hidden h-28"
          >
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.div
                  key="token"
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-3xl font-extrabold text-muted-foreground/70">{p.token}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="person"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                >
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center ${p.tint}`}>
                    <p.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.token}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center mt-5 leading-relaxed">
        Behind every queue position is a real person.
        <br />
        <span className="text-foreground font-semibold">Every minute matters.</span>
      </p>
    </Shell>
  );
};

const TIME_CHOICES = [
  { id: "study", label: "Study", icon: GraduationCap, scene: "Studying while your queue updates quietly." },
  { id: "family", label: "Family", icon: Heart, scene: "Time with the people who matter, uninterrupted." },
  { id: "work", label: "Work", icon: Briefcase, scene: "Tasks done while your spot keeps moving." },
  { id: "relax", label: "Relax", icon: Coffee, scene: "A slower breath while the line works in the background." },
  { id: "errands", label: "Errands", icon: ShoppingBag, scene: "Wrap up the day's list — the queue handles itself." },
];

const CustomerScreen2 = ({ onNext, data, onChange }: { onNext: () => void; data: OnboardingData; onChange: Props["onChange"] }) => {
  const saved = (data.responses?.timeChoice as string) ?? "";
  const [pick, setPick] = useState(saved);
  const choice = TIME_CHOICES.find((c) => c.id === pick);
  return (
    <Shell
      title="What would you do with your time?"
      onCta={() => {
        onChange({ responses: { ...data.responses, timeChoice: pick } });
        onNext();
      }}
      ctaDisabled={!pick}
      step={2}
      total={5}
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TIME_CHOICES.map((c) => {
          const selected = pick === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setPick(c.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                selected
                  ? "border-primary bg-primary/10 scale-[1.03]"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <c.icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              <span className={`text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{c.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {choice && (
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <p className="text-sm text-foreground font-medium leading-relaxed">{choice.scene}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-primary font-semibold">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
              Queue moving in the background
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Instead of waiting physically, life continues.
      </p>
    </Shell>
  );
};

const CustomerScreen3 = ({ onNext }: { onNext: () => void }) => {
  const POSITIONS = [18, 14, 9, 4];
  const WAITS = [80, 60, 35, 15];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= POSITIONS.length - 1) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 1300);
    return () => clearTimeout(t);
  }, [idx]);
  const close = idx === POSITIONS.length - 1;
  return (
    <Shell title="Your queue is moving" onCta={onNext} step={3} total={5}>
      <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Your position</span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            LIVE
          </span>
        </div>
        <div className="flex items-end justify-between mb-5">
          <AnimatePresence mode="wait">
            <motion.span
              key={POSITIONS[idx]}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="text-5xl font-extrabold text-foreground tabular-nums"
            >
              #{POSITIONS[idx]}
            </motion.span>
          </AnimatePresence>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Est. wait</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={WAITS[idx]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold text-foreground"
              >
                {WAITS[idx]}m
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 gradient-bg rounded-full"
            initial={false}
            animate={{ width: `${((POSITIONS[0] - POSITIONS[idx]) / POSITIONS[0]) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <AnimatePresence>
          {close && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5"
            >
              <motion.span
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 0.8 }}
                className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center"
              >
                <Bell className="w-4 h-4 text-primary" aria-hidden="true" />
              </motion.span>
              <p className="text-sm font-semibold text-foreground">Your turn is approaching.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
};

const REVEAL_STEPS = [
  { id: "queue", icon: Users, label: "Live queue card", desc: "Your token and the one being served, side by side." },
  { id: "wait", icon: Activity, label: "Wait-time card", desc: "Real-time minutes ahead, updated as the line moves." },
  { id: "referral", icon: Sparkles, label: "Referral & rewards", desc: "Save time for friends. Earn perks for sharing." },
  { id: "extras", icon: Bell, label: "Smart alerts & favorites", desc: "Arrive on time. Skip the standing." },
];

const CustomerScreen4 = ({ onNext }: { onNext: () => void }) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= REVEAL_STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 950);
    return () => clearTimeout(t);
  }, [step]);
  const done = step >= REVEAL_STEPS.length;
  return (
    <Shell
      eyebrow="Already real"
      title="The experience you've been building toward"
      onCta={onNext}
      step={4}
      total={5}
    >
      <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
        <div className="space-y-2">
          {REVEAL_STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={i < step ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -6 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-card/80 backdrop-blur p-2.5"
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  i < step ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{s.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="relative w-[120px] h-[240px] rounded-[18px] border-[3px] border-foreground/80 bg-background overflow-hidden shadow-xl">
          <motion.img
            src={customerDashboard.url}
            alt="Qblink customer dashboard"
            className="absolute inset-0 w-full h-full object-cover object-top"
            initial={{ opacity: 0.15, filter: "blur(8px)" }}
            animate={
              done
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0.15 + step * 0.18, filter: `blur(${Math.max(0, 8 - step * 2)}px)` }
            }
            transition={{ duration: 0.6 }}
          />
          {!done && (
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/40 pointer-events-none" />
          )}
        </div>
      </div>
      <p className="text-sm text-center text-muted-foreground mt-5">
        This is not a concept. <span className="text-foreground font-semibold">It already exists.</span>
      </p>
    </Shell>
  );
};

const NETWORK_CATS = [
  { icon: Stethoscope, label: "Clinics", tint: "text-success bg-success-soft" },
  { icon: Utensils, label: "Restaurants", tint: "text-danger bg-danger-soft" },
  { icon: Scissors, label: "Salons", tint: "text-primary bg-primary" },
  { icon: Microscope, label: "Diagnostics", tint: "text-info bg-info-soft" },
];

const NetworkOrbit = ({ cta }: { cta: React.ReactNode }) => (
  <div className="relative h-72 w-full mx-auto" aria-hidden="true">
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-primary/20"
      animate={{ rotate: 360 }}
      transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-primary/30"
      animate={{ rotate: -360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full gradient-bg flex items-center justify-center elevated-shadow">
      {cta}
    </div>
    {NETWORK_CATS.map((c, i) => {
      const angle = (i / NETWORK_CATS.length) * 2 * Math.PI - Math.PI / 2;
      const r = 96;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      return (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0.6, x: x - 22, y: y - 22 }}
          animate={{ opacity: 1, scale: 1, x: x - 22, y: y - 22 }}
          transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 180, damping: 16 }}
          className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1"
        >
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.tint} shadow-sm`}>
            <c.icon className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-semibold text-foreground whitespace-nowrap px-1.5 py-0.5 rounded-md bg-background/80">
            {c.label}
          </span>
        </motion.div>
      );
    })}
  </div>
);

const CustomerScreen5 = ({ onNext }: { onNext: () => void }) => (
  <Shell
    eyebrow="Be early"
    title="Help shape the future of waiting"
    onCta={onNext}
    cta="Join Early Access"
    ctaIcon={<Sparkles className="w-4 h-4" />}
    step={5}
    total={5}
  >
    <NetworkOrbit cta={<Sparkles className="w-5 h-5 text-primary-foreground" />} />
    <p className="text-sm text-center text-muted-foreground mt-3 leading-relaxed">
      A better waiting experience starts with early users.
    </p>
  </Shell>
);

/* ------------------------------------------------------------------ */
/*  BUSINESS POV                                                      */
/* ------------------------------------------------------------------ */

const STRESS_QUESTIONS = [
  "When is my turn?",
  "How much longer?",
  "How many people ahead?",
  "Did you skip me?",
  "Can I leave and come back?",
];

const BusinessScreen1 = ({ onNext }: { onNext: () => void }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= STRESS_QUESTIONS.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), 750);
    return () => clearTimeout(t);
  }, [count]);
  const stress = Math.min(100, (count / STRESS_QUESTIONS.length) * 100);
  return (
    <Shell title="Every queue tells a story" onCta={onNext} step={1} total={5}>
      <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
            Reception
          </span>
          <span className="text-[11px] font-semibold" style={{ color: `hsl(${10 + (1 - stress / 100) * 60}, 80%, 45%)` }}>
            Stress {Math.round(stress)}%
          </span>
        </div>
        <div className="space-y-2 min-h-[180px]">
          <AnimatePresence>
            {STRESS_QUESTIONS.slice(0, count).map((q, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-sm"
              >
                <MessageCircleQuestion className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <span className="text-foreground">"{q}"</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-warning to-danger"
            initial={false}
            animate={{ width: `${stress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-5 leading-relaxed">
        Most queue problems aren't caused by customers.
        <br />
        <span className="text-foreground font-semibold">They're caused by uncertainty.</span>
      </p>
    </Shell>
  );
};

const BusinessScreen2 = ({ onNext }: { onNext: () => void }) => {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <Shell title="Imagine a calmer operation" onCta={onNext} step={2} total={5}>
      <div className="relative rounded-2xl border border-border bg-card p-5 card-shadow overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-[11px] uppercase tracking-widest font-semibold">
          <span className={flipped ? "text-muted-foreground" : "text-danger"}>Before</span>
          <span className={flipped ? "text-primary" : "text-muted-foreground"}>After</span>
        </div>
        <div className="relative h-44">
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="before"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid grid-cols-6 gap-1.5 content-center"
              >
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -2, 0, 2, 0] }}
                    transition={{ duration: 0.6 + (i % 5) * 0.1, repeat: Infinity }}
                    className="w-6 h-6 rounded-full bg-danger-soft border border-danger/30 mx-auto"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="mt-4 text-xs font-semibold text-primary hover:underline mx-auto block"
        >
          Replay transition
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Less</p>
          <p className="text-sm font-bold text-foreground">Chaos</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
          <p className="text-xs text-primary">More</p>
          <p className="text-sm font-bold text-primary">Clarity</p>
        </div>
      </div>
    </Shell>
  );
};

const BIZ_PRIORITIES = [
  { id: "experience", label: "Better Customer Experience", icon: Smile, result: "Calmer customers. Higher repeat rate." },
  { id: "staff", label: "Less Staff Overload", icon: Users, result: "Staff stop answering 'how long?' all day." },
  { id: "crowd", label: "Reduced Crowding", icon: Activity, result: "Reception breathes. Walk-outs drop." },
  { id: "visibility", label: "More Visibility", icon: Eye, result: "Live view of every visitor, every minute." },
  { id: "speed", label: "Faster Operations", icon: Zap, result: "Smoother handoffs. Shorter average wait." },
];

const BusinessScreen3 = ({ onNext, data, onChange }: { onNext: () => void; data: OnboardingData; onChange: Props["onChange"] }) => {
  const saved = (data.responses?.bizPriority as string) ?? "";
  const [pick, setPick] = useState(saved);
  const choice = BIZ_PRIORITIES.find((c) => c.id === pick);
  return (
    <Shell
      title="What matters most to you?"
      onCta={() => {
        onChange({ responses: { ...data.responses, bizPriority: pick } });
        onNext();
      }}
      ctaDisabled={!pick}
      step={3}
      total={5}
    >
      <div className="space-y-2 mb-4">
        {BIZ_PRIORITIES.map((p) => {
          const selected = pick === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPick(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <p.icon className="w-4 h-4" />
              </span>
              <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {choice && (
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <p className="text-sm font-medium text-foreground">{choice.result}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
};

const VISION_NODES = [
  { icon: BarChart3, label: "Queue Data", desc: "Every visit, captured." },
  { icon: Lightbulb, label: "Insights", desc: "Patterns surface automatically." },
  { icon: TrendingUp, label: "Forecasting", desc: "Anticipate peaks before they hit." },
  { icon: Brain, label: "AI Recommendations", desc: "Smarter decisions, daily." },
];

const BusinessScreen4 = ({ onNext }: { onNext: () => void }) => {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (visible >= VISION_NODES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <Shell
      eyebrow="The bigger picture"
      title="Beyond digital tokens"
      onCta={onNext}
      step={4}
      total={5}
    >
      <div className="space-y-2">
        {VISION_NODES.map((n, i) => (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, y: 10 }}
            animate={i < visible ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 6 }}
            className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 card-shadow"
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                i < visible ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <n.icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            {i < VISION_NODES.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: i < visible - 1 ? 1 : 0 }}
                className="absolute left-[26px] -bottom-2 w-px h-2 bg-primary/40"
                aria-hidden="true"
              />
            )}
          </motion.div>
        ))}
      </div>
    </Shell>
  );
};

const BusinessScreen5 = ({ onNext }: { onNext: () => void }) => (
  <Shell
    eyebrow="A growing network"
    title="The future of customer flow"
    onCta={onNext}
    cta="Request Early Access"
    ctaIcon={<Sparkles className="w-4 h-4" />}
    step={5}
    total={5}
  >
    <NetworkOrbit cta={<Network className="w-5 h-5 text-primary-foreground" />} />
    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
      <div className="rounded-xl bg-card border border-border p-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Customers</p>
        <p className="text-xs font-bold text-foreground mt-0.5">Save time</p>
      </div>
      <div className="rounded-xl bg-card border border-border p-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Businesses</p>
        <p className="text-xs font-bold text-foreground mt-0.5">Gain clarity</p>
      </div>
      <div className="rounded-xl bg-primary/10 border border-primary/30 p-2">
        <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Everyone</p>
        <p className="text-xs font-bold text-primary mt-0.5">Benefits</p>
      </div>
    </div>
  </Shell>
);

/* ------------------------------------------------------------------ */
/*  Step container                                                    */
/* ------------------------------------------------------------------ */

const StepDesire = ({ data, onChange, onNext }: Props) => {
  const isBusiness = data.role === "business_owner";
  const flow = isBusiness ? BUSINESS_FLOW : CUSTOMER_FLOW;
  const [idx, setIdx] = useState(0);
  const sub = flow[idx];
  const advance = () => {
    if (idx >= flow.length - 1) onNext();
    else setIdx((i) => i + 1);
  };
  const name = firstNameOf(data.fullName);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sub}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
      >
        {sub === "c1" && <CustomerScreen1 onNext={advance} name={name} />}
        {sub === "c2" && <CustomerScreen2 onNext={advance} data={data} onChange={onChange} />}
        {sub === "c3" && <CustomerScreen3 onNext={advance} />}
        {sub === "c4" && <CustomerScreen4 onNext={advance} />}
        {sub === "c5" && <CustomerScreen5 onNext={advance} />}
        {sub === "b1" && <BusinessScreen1 onNext={advance} />}
        {sub === "b2" && <BusinessScreen2 onNext={advance} />}
        {sub === "b3" && <BusinessScreen3 onNext={advance} data={data} onChange={onChange} />}
        {sub === "b4" && <BusinessScreen4 onNext={advance} />}
        {sub === "b5" && <BusinessScreen5 onNext={advance} />}
      </motion.div>
    </AnimatePresence>
  );
};

export default StepDesire;