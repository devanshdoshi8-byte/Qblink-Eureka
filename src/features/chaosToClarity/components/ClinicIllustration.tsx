import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  QrCode,
  User,
  Users,
  Sparkles,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { SimpleQueueState } from "../engine/simpleSimulationEngine";

interface ClinicIllustrationProps {
  queueState: SimpleQueueState;
  onScanQR: () => void;
  onCallNext: () => void;
}

export const ClinicIllustration: React.FC<ClinicIllustrationProps> = ({
  queueState,
  onScanQR,
  onCallNext,
}) => {
  const isTransformed = queueState.step >= 2;
  const isLive = queueState.step === 3;

  return (
    <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden text-white">
      {/* Background Architectural Glow & Mood Transition */}
      <motion.div
        animate={{
          background: isTransformed
            ? "radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15), transparent 70%)"
            : "radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.12), transparent 70%)",
        }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Header Status Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTransformed ? "bg-emerald-400 animate-pulse" : "bg-red-500 animate-ping"
              }`}
            />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {isTransformed ? "Metro Care Clinic • Digital Flow Active" : "Metro Care Clinic • Physical Waiting Room"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {queueState.step === 1 && "1. The Waiting Room Problem"}
            {queueState.step === 2 && "2. The 3-Second QR Scan"}
            {queueState.step === 3 && (queueState.isCalled ? "3. Perfect Just-in-Time Arrival!" : "3. Live Remote Waiting in Action")}
          </h3>
        </div>

        {/* State Badge */}
        <div className="self-end sm:self-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isTransformed
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-red-500/20 text-red-300 border-red-500/40"
            }`}
          >
            {isTransformed ? "✨ THE QBLINK WAY" : "⚠️ THE OLD WAY"}
          </span>
        </div>
      </div>

      {/* Main Split Visual Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Front Desk & Reception Area (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                  👩‍💼
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Reception Desk</h4>
                  <span className="text-[10px] text-slate-400">Frontline Counter Staff</span>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> 1:30 PM
              </span>
            </div>

            {/* Receptionist Dialogue Bubble */}
            <div className="mt-3.5">
              <AnimatePresence mode="wait">
                {!isTransformed ? (
                  <motion.div
                    key="chaos-speech"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200"
                  >
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                      Constant Interruptions:
                    </span>
                    <p className="mt-0.5 leading-relaxed font-medium">
                      "Doctor is delayed with emergency... maybe 30 to 45 minutes? Please sit and wait for your name."
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="calm-speech"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200"
                  >
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Digital Terminal Active:
                    </span>
                    <p className="mt-0.5 leading-relaxed font-medium">
                      Now Serving <strong className="font-mono text-white">#A-{queueState.nowServing}</strong>. Zero repetitive questions. Queue moves automatically.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Counter Terminal Manifest */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Now Serving</span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  {isTransformed ? `#A-${queueState.nowServing}` : "Paper #18"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">In Line</span>
                <span className="font-mono font-black text-xl text-white">
                  {isTransformed ? `${queueState.peopleAhead} Ahead` : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive QR Standee Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border-2 border-primary/40 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Qblink QR Standee</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Scan with any phone camera. No app download.
                </p>
              </div>
            </div>

            {!isTransformed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onScanQR}
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-extrabold text-xs shadow-lg shadow-primary/30 flex items-center gap-1.5 shrink-0"
              >
                <span>SCAN TO JOIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Right Side: Customer Experience & Lounge vs Outdoor Cafe (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Protagonist Anya Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-lg">
                  👩‍💻
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Anya (Patient Protagonist)</h4>
                  <span className="text-[10px] text-slate-400">
                    {isTransformed ? "Relaxing at Terrace Cafe ☕" : "Trapped in Crowded Waiting Room"}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isTransformed ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {isTransformed ? "In Total Control" : "Anxious & Blind"}
              </span>
            </div>

            {/* Anya's Context Bubble */}
            <div className="mt-3.5">
              <AnimatePresence mode="wait">
                {!isTransformed ? (
                  <motion.div
                    key="anya-anxious"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      Opportunity Cost Dilemma:
                    </span>
                    <p className="leading-relaxed">
                      "I have an urgent client pitch at 2:00 PM. If I step out for fresh air, I might lose my turn. If I stay, I waste 40 minutes sitting blindly."
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="anya-relaxed"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Reclaimed Time:
                    </span>
                    <p className="leading-relaxed">
                      {queueState.isCalled
                        ? "🎉 Turn alert received! Walking back into Consultation Room 3 right on time."
                        : "Opened laptop at the open-air cafe. Working peacefully while phone tracks queue position live."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Waiting Room Seating Status */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Waiting Room Density:</span>
              <span className={`font-bold ${isTransformed ? "text-emerald-400" : "text-red-400"}`}>
                {isTransformed ? "2 People (75% Less Crowding)" : "16 People (Packed & Tense)"}
              </span>
            </div>
          </div>

          {/* Interactive Phone Pass & Live Queue Advance Button */}
          {isTransformed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Anya's Pocket Ticket: #A-{queueState.protagonistToken}</span>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {queueState.isCalled ? "🎉 IT'S YOUR TURN" : `~${queueState.estimatedWaitMinutes}m wait`}
                </span>
              </div>

              {/* Action: Call Next Patient (Advances the queue) */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onCallNext}
                  disabled={queueState.isCalled}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    queueState.isCalled
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{queueState.isCalled ? "Doctor is Serving Anya" : "Call Next Patient (Advance Queue)"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
