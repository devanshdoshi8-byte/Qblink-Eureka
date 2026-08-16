import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Laptop, Users, CheckCircle2, Play, Pause, ArrowRight, ShieldCheck } from "lucide-react";
import { IndustryConfig, StoryStepNumber } from "../types";

interface StaffTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  industryConfig: IndustryConfig;
  storyStep: StoryStepNumber;
  isAfter: boolean;
}

export const StaffTerminalModal: React.FC<StaffTerminalModalProps> = ({
  isOpen,
  onClose,
  industryConfig,
  storyStep,
  isAfter,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-slate-700 text-white shadow-2xl overflow-hidden p-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Laptop className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm text-white">
              {industryConfig.staffTitle} Dispatch Console (Desktop)
            </h3>
          </div>

          {/* Terminal Desktop Mockup */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">NOW SERVING</span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  {isAfter ? "A-24" : "Manual 18"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">IN LINE</span>
                <span className="font-mono font-black text-xl text-white">
                  {isAfter ? "12 Guests" : "18 (Crowded)"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">FLOW VELOCITY</span>
                <span className="font-mono font-black text-xl text-primary">
                  {isAfter ? "3.2m / turn" : "Unknown"}
                </span>
              </div>
            </div>

            {/* Manifest List */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                Next In Line Manifest
              </span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-mono font-bold text-white">A-25 • Rohit V.</span>
                <span className="text-[10px] text-slate-400">In Waiting Lobby</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-mono font-bold text-white">A-26 • Priya K.</span>
                <span className="text-[10px] text-slate-400">Terrace Cafe</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <span className="font-mono font-bold text-emerald-300">A-27 • Anya (Protagonist)</span>
                <span className="text-[10px] text-emerald-400 font-bold">Remote Wait (3m away)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Reception interruption rate:</span>
              <span className="font-bold text-emerald-400">{isAfter ? "0 interruptions / hr" : "35 questions / hr"}</span>
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 transition-opacity"
            >
              Back to 360° Scene
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
