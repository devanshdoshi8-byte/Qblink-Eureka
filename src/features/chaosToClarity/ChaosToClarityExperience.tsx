import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RotateCcw,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Smartphone,
  Laptop,
  Play,
  Layers,
} from "lucide-react";
import {
  SimpleQueueState,
  createInitialSimpleState,
  callNextInSimpleQueue,
} from "./engine/simpleSimulationEngine";
import { ClinicIllustration } from "./components/ClinicIllustration";
import { toast } from "sonner";

interface ChaosToClarityExperienceProps {
  className?: string;
}

export const ChaosToClarityExperience: React.FC<ChaosToClarityExperienceProps> = ({
  className = "",
}) => {
  const [queueState, setQueueState] = useState<SimpleQueueState>(() =>
    createInitialSimpleState()
  );

  // Interaction 1 -> 2: Scan & Transform
  const handleScanQR = () => {
    setQueueState((prev) => ({ ...prev, step: 2 }));
    toast.success("✨ QR Scanned in mobile browser: Pocket ticket #A-26 issued!");
  };

  // Interaction 2 -> 3: Advance Live Queue
  const handleCallNext = () => {
    setQueueState((prev) => {
      const updated = callNextInSimpleQueue(prev);
      return { ...updated, step: 3 };
    });
    toast.info("Counter called next patient — Queue updated live!");
  };

  // Reset
  const handleReset = () => {
    setQueueState(createInitialSimpleState());
    toast.success("Simulation reset to initial waiting room problem");
  };

  return (
    <section id="chaos-to-clarity" className={`w-full max-w-6xl mx-auto ${className}`}>
      <div className="space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Product Simulation</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            See What Changes When Waiting Becomes Visible
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl mx-auto">
            Experience the 10-second transformation from physical waiting room uncertainty into calm, synchronized digital customer flow.
          </p>
        </div>

        {/* 3-Step Interactive Story Stepper */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => setQueueState((prev) => ({ ...prev, step: 1 }))}
            className={`p-3 rounded-2xl border text-center transition-all ${
              queueState.step === 1
                ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-mono block">STEP 1</span>
            <span className="text-xs font-bold truncate">1. The Problem</span>
          </button>

          <button
            onClick={handleScanQR}
            className={`p-3 rounded-2xl border text-center transition-all ${
              queueState.step === 2
                ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 border-primary"
                : queueState.step > 2
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-mono block">STEP 2</span>
            <span className="text-xs font-bold truncate">2. Scan & Transform</span>
          </button>

          <button
            onClick={handleCallNext}
            className={`p-3 rounded-2xl border text-center transition-all ${
              queueState.step === 3
                ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-[10px] font-mono block">STEP 3</span>
            <span className="text-xs font-bold truncate">3. Live Pocket Flow</span>
          </button>
        </div>

        {/* The Clean Visual Story Canvas */}
        <ClinicIllustration
          queueState={queueState}
          onScanQR={handleScanQR}
          onCallNext={handleCallNext}
        />

        {/* Bottom Interactive Controls & Pitch Simulator CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-2 border border-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Story</span>
            </button>
            <span className="text-xs text-muted-foreground hidden md:inline">
              100% In-Memory Simulation • Zero Setup Required
            </span>
          </div>

          <Link
            to="/pitch"
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-95 transition-all text-center"
          >
            <span>Now Try Dual-Device Pitch Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ChaosToClarityExperience;
