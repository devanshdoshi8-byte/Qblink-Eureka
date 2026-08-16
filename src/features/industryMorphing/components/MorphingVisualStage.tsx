import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from "lucide-react";
import { IndustryMorphConfig } from "../types";
import { MorphCustomerCard } from "./MorphingCustomerCard";
import { MorphBusinessCard } from "./MorphingBusinessCard";

interface MorphingVisualStageProps {
  industry: IndustryMorphConfig;
}

export const MorphingVisualStage: React.FC<MorphingVisualStageProps> = ({ industry }) => {
  const [mobilePerspective, setMobilePerspective] = useState<"all" | "customer" | "business">("all");

  return (
    <div className="relative w-full rounded-3xl bg-card border border-border/80 p-6 sm:p-10 shadow-2xl overflow-hidden">
      {/* Background Architectural Ambient Image & Gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <picture>
          <source srcSet={industry.heroImage.webp1200} media="(min-width: 1024px)" type="image/webp" />
          <source srcSet={industry.heroImage.webp800} media="(min-width: 640px)" type="image/webp" />
          <source srcSet={industry.heroImage.webp480} type="image/webp" />
          <img
            src={industry.heroImage.jpg}
            alt={industry.locationName}
            className="w-full h-full object-cover object-center opacity-10 dark:opacity-15 filter blur-xs scale-105 transition-all duration-700"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/70" />
      </div>

      {/* Header Context Banner */}
      <div className="relative z-10 pb-6 mb-6 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{industry.icon}</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              {industry.locationName}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
            {industry.tagline}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            {industry.description}
          </p>
        </div>

        {/* Mobile Perspective Tab Switcher */}
        <div className="md:hidden flex items-center p-1 rounded-xl bg-muted/60 border border-border self-start">
          <button
            onClick={() => setMobilePerspective("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mobilePerspective === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setMobilePerspective("customer")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mobilePerspective === "customer" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setMobilePerspective("business")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mobilePerspective === "business" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Business
          </button>
        </div>
      </div>

      {/* Problem vs Fix Quick Bar */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
            ⚠️ The Old Way (Friction & Chaos)
          </span>
          <p className="font-medium leading-relaxed">{industry.frictionProblem}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            ✨ The Qblink Way (Visible Controlled Flow)
          </span>
          <p className="font-medium leading-relaxed">{industry.qblinkFix}</p>
        </div>
      </div>

      {/* Morphing Dual-Device Visual Presentation with Controlled 400ms Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={industry.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
        >
          {/* Customer Perspective */}
          {(mobilePerspective === "all" || mobilePerspective === "customer") && (
            <div className="w-full">
              <MorphCustomerCard industry={industry} />
            </div>
          )}

          {/* Business Perspective */}
          {(mobilePerspective === "all" || mobilePerspective === "business") && (
            <div className="w-full">
              <MorphBusinessCard industry={industry} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
