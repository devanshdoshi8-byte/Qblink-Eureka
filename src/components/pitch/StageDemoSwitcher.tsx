import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Sparkles,
  Layers,
  DollarSign,
  Tv,
  RotateCcw,
  Minimize2,
  Maximize2,
  Presentation,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";

const STAGE_SCENES = [
  { id: "pitch", label: "Dual Simulator", path: "/pitch", icon: Play, key: "1" },
  { id: "chaos", label: "Chaos to Clarity", path: "/chaos-to-clarity", icon: Sparkles, key: "2" },
  { id: "industries", label: "Industries", path: "/industries", icon: Layers, key: "3" },
  { id: "roi", label: "ROI Estimator", path: "/roi", icon: DollarSign, key: "4" },
  { id: "tv", label: "TV Display", path: "/display/demo", icon: Tv, key: "5" },
];

/**
 * StageDemoSwitcher — Floating Stage Command Toolbar for National Pitch Competitions.
 * Allows a presenter to seamlessly pivot between live product simulators with 1 click
 * or keyboard hotkeys (1-5) and trigger instant stage resets.
 */
export const StageDemoSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Only render on demo / pitch routes
  const isDemoRoute =
    location.pathname.startsWith("/pitch") ||
    location.pathname.startsWith("/chaos-to-clarity") ||
    location.pathname.startsWith("/industries") ||
    location.pathname.startsWith("/roi") ||
    location.pathname.startsWith("/display/demo");

  // Global hotkeys (1-5 to switch scenes, R to reset)
  useEffect(() => {
    if (!isDemoRoute) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const matched = STAGE_SCENES.find((s) => s.key === e.key);
      if (matched && location.pathname !== matched.path) {
        e.preventDefault();
        hapticSuccess();
        navigate(matched.path);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDemoRoute, location.pathname, navigate]);

  if (!isDemoRoute) return null;

  const handleResetStage = () => {
    setResetting(true);
    hapticSuccess();
    try {
      // Clear simulation overrides
      sessionStorage.removeItem("qblink:pitch_sim_state");
      localStorage.removeItem("qblink:demo_state");
      window.dispatchEvent(new CustomEvent("qblink:reset_pitch_demo"));
    } catch {}

    toast.success("Stage Demo State Reset!", {
      description: "Pruned synthetic traffic. Ready for the next judge or pitch run.",
    });

    setTimeout(() => {
      setResetting(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none print:hidden">
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-xl border border-primary/30 shadow-xl text-primary text-xs font-semibold hover:bg-card transition-all"
            title="Expand Pitch Presenter Toolbar"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Stage Mode</span>
            <Maximize2 className="w-3 h-3 opacity-70" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/90 dark:bg-[hsl(215_50%_12%/0.92)] backdrop-blur-2xl border border-primary/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]"
          >
            {/* Stage Mode Label */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold border-r border-border/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pitch Hub</span>
            </div>

            {/* Scene Buttons */}
            <div className="flex items-center gap-1">
              {STAGE_SCENES.map((scene) => {
                const Icon = scene.icon;
                const active = location.pathname === scene.path;
                return (
                  <Link
                    key={scene.id}
                    to={scene.path}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "gradient-bg text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{scene.label}</span>
                    <kbd
                      className={`hidden lg:inline-block text-[9px] font-mono px-1 py-0.2 rounded border ${
                        active
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      {scene.key}
                    </kbd>
                  </Link>
                );
              })}
            </div>

            <div className="h-4 w-px bg-border/80 mx-0.5" />

            {/* Instant Reset Demo Button */}
            <button
              type="button"
              onClick={handleResetStage}
              disabled={resetting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Reset live demo data to pristine initial state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Collapse Toggle */}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Minimize Toolbar"
              aria-label="Minimize Toolbar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default StageDemoSwitcher;
