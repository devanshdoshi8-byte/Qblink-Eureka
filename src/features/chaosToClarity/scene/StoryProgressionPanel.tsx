import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Laptop,
  Smartphone,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
} from "lucide-react";
import {
  ChaosToClarityState,
  IndustryConfig,
  StoryStep,
  IndustryKey,
} from "../types";
import { STORY_STEPS, INDUSTRY_CONFIGS } from "../engine/simulationState";

interface StoryProgressionPanelProps {
  state: ChaosToClarityState;
  industryConfig: IndustryConfig;
  currentStep: StoryStep;
  onSetStep: (stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
  onSetIndustry: (ind: IndustryKey) => void;
  onSetMode: (mode: "guided" | "explore" | "judge") => void;
  onFastForward: (minutes: 0 | 5 | 10 | 20) => void;
  onReset: () => void;
  onTransform: () => void;
  onToggleTour: () => void;
}

export const StoryProgressionPanel: React.FC<StoryProgressionPanelProps> = ({
  state,
  industryConfig,
  currentStep,
  onSetStep,
  onSetIndustry,
  onSetMode,
  onFastForward,
  onReset,
  onTransform,
  onToggleTour,
}) => {
  const isAfter = state.phase === "after";

  return (
    <div className="w-full bg-card rounded-3xl border border-border p-5 sm:p-7 card-shadow space-y-6">
      {/* Top Strip: Industry & Simulation Mode Switchers */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-5 border-b border-border/60">
        {/* Industry Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          {(Object.keys(INDUSTRY_CONFIGS) as IndustryKey[]).map((key) => {
            const ind = INDUSTRY_CONFIGS[key];
            const isSelected = state.industry === key;
            return (
              <button
                key={key}
                onClick={() => onSetIndustry(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* Mode Switcher: Guided vs Explore vs Judge */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
            {(["guided", "explore", "judge"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onSetMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  state.mode === m
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "guided" ? "🎬 Guided Story" : m === "explore" ? "🧭 Free Explore" : "⚖️ Judge Mode"}
              </button>
            ))}
          </div>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Progression Timeline (01 to 07) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Story Journey
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetStep(Math.max(1, currentStep.number - 1) as any)}
              disabled={currentStep.number === 1}
              className="p-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-foreground">
              Step {currentStep.number} of 7
            </span>
            <button
              onClick={() => onSetStep(Math.min(7, currentStep.number + 1) as any)}
              disabled={currentStep.number === 7}
              className="p-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 7 Step Indicators */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {STORY_STEPS.map((step) => {
            const isActive = currentStep.number === step.number;
            const isCompleted = currentStep.number > step.number;
            return (
              <button
                key={step.number}
                onClick={() => onSetStep(step.number)}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-extrabold shadow-sm ring-2 ring-primary/40"
                    : isCompleted
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-[10px] font-mono block font-bold">0{step.number}</span>
                <span className="text-[9px] truncate w-full hidden sm:block">
                  {step.tagline.split("•")[1] || step.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Story Card (Before vs After Narrative) */}
      <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">
              {currentStep.tagline}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              {currentStep.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTour}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                state.isPlayingTour
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                  : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{state.isPlayingTour ? "Autoplay Running…" : "Play 45s Tour"}</span>
            </button>
          </div>
        </div>

        {/* Narrative Description Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs leading-relaxed">
          {/* The Old Problem */}
          <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-foreground space-y-1">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
              Without Qblink (The Friction)
            </span>
            <p className="text-muted-foreground">{currentStep.beforeDescription}</p>
          </div>

          {/* The Qblink Solution */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-foreground space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              With Qblink (The Transformation)
            </span>
            <p className="text-muted-foreground">{currentStep.afterDescription}</p>
          </div>
        </div>

        {/* Human Context Footnote */}
        <div className="p-3 rounded-xl bg-card border border-border text-[11px] text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong>Human Context:</strong> {currentStep.humanContext}
          </p>
        </div>
      </div>

      {/* Fast-Forward Simulation Slider & Live Pitch Link CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Fast-forward Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-primary" /> Fast Forward:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
            {([0, 5, 10, 20] as const).map((mins) => (
              <button
                key={mins}
                onClick={() => onFastForward(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  state.fastForwardMinutes === mins
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mins === 0 ? "Now" : `+${mins}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Link to Pitch Simulator */}
        <Link
          to="/pitch"
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:opacity-95 transition-all text-center"
        >
          <span>Now Try Dual-Device Pitch Simulator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
