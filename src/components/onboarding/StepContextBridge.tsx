import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Stethoscope,
  UtensilsCrossed,
  Scissors,
  FlaskConical,
  Store,
  Building2,
  Users,
  DoorOpen,
  Armchair,
  ClipboardList,
  CalendarCheck,
  ChefHat,
  FileText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import TypingText from "./TypingText";
import { firstNameOf, type OnboardingData } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onNext: () => void;
}

type VenueKey = "clinic" | "restaurant" | "salon" | "diagnostic" | "retail" | "generic";

interface VenueDef {
  key: VenueKey;
  label: string;
  centerIcon: LucideIcon;
  nodes: { label: string; icon: LucideIcon }[];
  customerConcern: string;
  ownerConcern: string;
}

const VENUES: Record<VenueKey, VenueDef> = {
  clinic: {
    key: "clinic",
    label: "Clinic",
    centerIcon: Stethoscope,
    nodes: [
      { label: "Reception", icon: ClipboardList },
      { label: "Patients", icon: Users },
      { label: "Waiting Area", icon: Armchair },
      { label: "Consultation", icon: DoorOpen },
    ],
    customerConcern: "Knowing when your turn will arrive.",
    ownerConcern: "Managing patient flow efficiently.",
  },
  restaurant: {
    key: "restaurant",
    label: "Restaurant",
    centerIcon: UtensilsCrossed,
    nodes: [
      { label: "Tables", icon: Armchair },
      { label: "Customers", icon: Users },
      { label: "Waiting Area", icon: DoorOpen },
      { label: "Staff", icon: ChefHat },
    ],
    customerConcern: "Knowing how long until you're seated.",
    ownerConcern: "Turning tables without losing guests.",
  },
  salon: {
    key: "salon",
    label: "Salon",
    centerIcon: Scissors,
    nodes: [
      { label: "Appointments", icon: CalendarCheck },
      { label: "Customers", icon: Users },
      { label: "Stylists", icon: Sparkles },
      { label: "Waiting Area", icon: Armchair },
    ],
    customerConcern: "Knowing if your slot is on time.",
    ownerConcern: "Keeping stylists booked back-to-back.",
  },
  diagnostic: {
    key: "diagnostic",
    label: "Diagnostic Centre",
    centerIcon: FlaskConical,
    nodes: [
      { label: "Registration", icon: ClipboardList },
      { label: "Patients", icon: Users },
      { label: "Testing Area", icon: FlaskConical },
      { label: "Reports", icon: FileText },
    ],
    customerConcern: "Knowing when your test and report are ready.",
    ownerConcern: "Smoothing handoffs between rooms.",
  },
  retail: {
    key: "retail",
    label: "Retail Store",
    centerIcon: Store,
    nodes: [
      { label: "Entry", icon: DoorOpen },
      { label: "Customers", icon: Users },
      { label: "Counter", icon: ClipboardList },
      { label: "Staff", icon: Sparkles },
    ],
    customerConcern: "Skipping the billing line.",
    ownerConcern: "Balancing footfall with staff on hand.",
  },
  generic: {
    key: "generic",
    label: "Your Space",
    centerIcon: Building2,
    nodes: [
      { label: "Entry", icon: DoorOpen },
      { label: "Visitors", icon: Users },
      { label: "Waiting Area", icon: Armchair },
      { label: "Service Desk", icon: ClipboardList },
    ],
    customerConcern: "Knowing where you stand in line.",
    ownerConcern: "Keeping the flow predictable.",
  },
};

function resolveVenue(tags: string[]): VenueDef {
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("clinic"))) return VENUES.clinic;
  if (t.some((x) => x.includes("restaurant"))) return VENUES.restaurant;
  if (t.some((x) => x.includes("salon"))) return VENUES.salon;
  if (t.some((x) => x.includes("diagnostic"))) return VENUES.diagnostic;
  if (t.some((x) => x.includes("retail"))) return VENUES.retail;
  return VENUES.generic;
}

const StepContextBridge = ({ data, onNext }: Props) => {
  const name = firstNameOf(data.fullName) || "there";
  const isBusiness = data.role === "business_owner";
  const venue = useMemo(() => resolveVenue(data.tags), [data.tags]);
  const CenterIcon = venue.centerIcon;

  const metrics = isBusiness
    ? [
        { label: "Staff interruptions", level: 30, tone: "warn" as const },
        { label: "Customer satisfaction", level: 55, tone: "ok" as const },
        { label: "Operational efficiency", level: 45, tone: "ok" as const },
      ]
    : [
        { label: "Time visibility", level: 25, tone: "warn" as const },
        { label: "Queue certainty", level: 35, tone: "warn" as const },
        { label: "Waiting experience", level: 40, tone: "ok" as const },
      ];

  // Orbit positions (4 nodes around a center) — mobile-safe radius
  const RADIUS = 96;
  const positions = venue.nodes.map((_, i) => {
    const angle = (i / venue.nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS };
  });

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-2">
        <TypingText text={`${name}, let's start with your world.`} speed={28} />
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="text-muted-foreground mb-8"
      >
        Every waiting experience is different. Here's the one we'll focus on.
      </motion.p>

      {/* Living infographic */}
      <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80 mb-6 overflow-hidden">
        {/* Soft glow */}
        <motion.div
          aria-hidden
          className="absolute inset-6 rounded-full bg-primary/10 blur-2xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbit rings */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 rounded-full border border-primary/15"
            style={{
              width: RADIUS * 2 + i * 28,
              height: RADIUS * 2 + i * 28,
              x: -(RADIUS + i * 14),
              y: -(RADIUS + i * 14),
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* Connection lines (SVG) — uses a centered viewBox so coords map cleanly */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="-120 -120 240 240"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {positions.map((p, i) => {
            // positions are in px relative to RADIUS=96; normalize to viewBox units
            const scale = 100 / RADIUS;
            const x2 = p.x * scale;
            const y2 = p.y * scale;
            return (
              <motion.line
                key={i}
                x1={0}
                y1={0}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.25}
                strokeWidth={0.8}
                strokeDasharray="3 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }}
              />
            );
          })}
        </svg>

        {/* Center node */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 18 }}
            className="relative w-24 h-24 rounded-3xl gradient-bg elevated-shadow flex flex-col items-center justify-center text-primary-foreground"
          >
            <CenterIcon className="w-7 h-7 mb-1" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-wide uppercase px-2 text-center leading-tight">
              {venue.label}
            </span>
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-3xl border-2 border-primary/40"
            animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        </div>

        {/* Orbiting nodes */}
        {venue.nodes.map((n, i) => {
          const { x, y } = positions[i];
          const Icon = n.icon;
          return (
            <motion.div
              key={n.label}
              initial={{ opacity: 0, scale: 0.4, x: x - 30, y: y - 30 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: x - 30,
                y: y - 30,
              }}
              transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 180, damping: 16 }}
              className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1"
            >
              <motion.div
                className="w-[60px] h-[60px] rounded-2xl bg-card border border-border card-shadow flex items-center justify-center"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              >
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </motion.div>
              <span className="text-[10px] font-semibold text-foreground/80 whitespace-nowrap">
                {n.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Context card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="rounded-2xl border border-border bg-card card-shadow p-5 text-left mb-5"
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              You are a
            </p>
            <p className="text-sm font-bold text-foreground">
              {isBusiness ? "Business Owner" : "Customer"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Location
            </p>
            <p className="text-sm font-bold text-foreground">{venue.label}</p>
          </div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
            Most likely concern
          </p>
          <p className="text-sm text-foreground leading-snug">
            {isBusiness ? venue.ownerConcern : venue.customerConcern}
          </p>
        </div>
      </motion.div>

      {/* Animated metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.4 }}
        className="space-y-2.5 mb-8"
      >
        {metrics.map((m, i) => (
          <div key={m.label} className="text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground/80">{m.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Today
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  m.tone === "warn" ? "bg-warning" : "bg-primary/70"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${m.level}%` }}
                transition={{ delay: 1.4 + i * 0.15, duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.4 }}
        className="text-sm text-muted-foreground mb-4"
      >
        Let's see what usually happens next.
      </motion.p>

      <button
        type="button"
        onClick={onNext}
        className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
      >
        Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default StepContextBridge;