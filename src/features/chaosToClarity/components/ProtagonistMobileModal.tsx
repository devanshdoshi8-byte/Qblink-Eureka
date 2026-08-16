import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, CheckCircle2, Clock, Sparkles, AlertCircle, Bell, ArrowRight } from "lucide-react";
import { IndustryConfig, StoryStepNumber } from "../types";

interface ProtagonistMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  industryConfig: IndustryConfig;
  storyStep: StoryStepNumber;
  isAfter: boolean;
}

export const ProtagonistMobileModal: React.FC<ProtagonistMobileModalProps> = ({
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
          className="relative w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-slate-700 text-white shadow-2xl overflow-hidden p-6"
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
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Customer Mobile Digital Pass</h3>
          </div>

          {/* iPhone Frame Representation */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{industryConfig.locationName}</span>
              <span className="text-emerald-400 font-bold">● Live Sync</span>
            </div>

            {/* Token Highlight */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Digital Token
              </span>
              <div className="font-mono font-black text-3xl text-white">
                {isAfter ? "#A-27" : "Paper Slip #18"}
              </div>
              <span className="text-[11px] text-slate-400">Anya (You)</span>
            </div>

            {/* Live Progress Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Queue Position</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {isAfter ? "3 people ahead" : "Unknown (Standing in line)"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Estimated Wait</span>
                <span className="font-mono text-white font-bold">
                  {isAfter ? "~9 mins" : "30-45 mins (Uncertain)"}
                </span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: isAfter ? "75%" : "20%" }}
                />
              </div>
            </div>

            {/* Notification Dropper */}
            {isAfter && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2">
                <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Alert Ready:</strong> Your phone will vibrate 2 minutes before your turn. You can relax at the terrace cafe!
                </p>
              </div>
            )}
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
