import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  RotateCcw,
  Sparkles,
  QrCode,
  Smartphone,
  Laptop,
  Clock,
  User,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Maximize2,
  Eye,
} from "lucide-react";
import {
  ChaosToClarityState,
  IndustryConfig,
  HotspotInfo,
  StoryStep,
} from "../types";
import { HOTSPOTS } from "../engine/simulationState";

interface SpatialClinicSceneProps {
  state: ChaosToClarityState;
  industryConfig: IndustryConfig;
  currentStep: StoryStep;
  onSelectHotspot: (hotspot: HotspotInfo | null) => void;
  onTriggerScan: () => void;
  onOpenPhoneModal: () => void;
  onOpenStaffModal: () => void;
  onTransform: () => void;
}

export const SpatialClinicScene: React.FC<SpatialClinicSceneProps> = ({
  state,
  industryConfig,
  currentStep,
  onSelectHotspot,
  onTriggerScan,
  onOpenPhoneModal,
  onOpenStaffModal,
  onTransform,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotInfo | null>(null);

  const isAfter = state.phase === "after";
  const isTransitioning = state.phase === "transitioning";

  // Mouse & Touch Drag Controls for 360 Panoramic Look-around
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(-160, Math.min(160, e.clientX - dragStart.x));
    const newY = Math.max(-40, Math.min(40, e.clientY - dragStart.y));
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const newX = Math.max(-160, Math.min(160, e.touches[0].clientX - dragStart.x));
    const newY = Math.max(-40, Math.min(40, e.touches[0].clientY - dragStart.y));
    setPanOffset({ x: newX, y: newY });
  };

  const handleResetCamera = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  // Quick viewpoints
  const jumpToView = (x: number, y: number) => {
    setPanOffset({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className={`relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden select-none cursor-grab ${
        isDragging ? "cursor-grabbing" : ""
      } bg-slate-900 border border-border shadow-2xl transition-colors duration-1000`}
    >
      {/* 360 Panoramic Background Canvas Environment */}
      <motion.div
        animate={{
          x: panOffset.x,
          y: panOffset.y,
          scale: isTransitioning ? [1, 1.02, 1] : 1,
        }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="absolute inset-[-80px] sm:inset-[-120px] flex items-center justify-center pointer-events-none"
      >
        {/* Architectural Environment SVG & Elements */}
        <div
          className={`relative w-[1200px] h-[780px] rounded-3xl transition-all duration-1000 overflow-hidden border ${
            isAfter
              ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-emerald-500/20"
              : "bg-gradient-to-b from-slate-950 via-slate-900 to-neutral-950 border-slate-800"
          }`}
        >
          {/* Room Architecture: Lighted Walls & Floor */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900/10 to-transparent" />
          
          {/* Floor grid perspective */}
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent border-t border-slate-800/40" />

          {/* Large Panoramic Background Windows (Daylight & Outside Terrace) */}
          <div className="absolute top-12 right-16 w-80 h-60 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-slate-800/80 p-3 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              <span>Outdoor View</span>
              <span className={isAfter ? "text-emerald-400 font-bold" : "text-slate-600"}>
                {isAfter ? "Open-Air Cafe (Waiting Zone)" : "Street View"}
              </span>
            </div>
            
            {/* Terrace / Cafe Area in Window */}
            <div className="h-40 rounded-xl bg-slate-950/60 border border-slate-800/50 p-2 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <span className="text-2xl block mb-1">☕</span>
                <span className="text-[11px] font-bold text-slate-300 block">Terrace Lounge</span>
                <span className="text-[9px] text-slate-500">
                  {isAfter ? "Anya working calmly on laptop" : "Patients trapped inside instead"}
                </span>
              </div>

              {isAfter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold"
                >
                  Remote Wait Active
                </motion.div>
              )}
            </div>
          </div>

          {/* Wall Clock */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg relative">
              <Clock className={`w-6 h-6 ${isAfter ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
              <div className="absolute -bottom-5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono font-bold text-slate-400">
                1:35 PM
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE 1: RECEPTION DESK & STAFF (LEFT SIDE) */}
          {/* ========================================================================= */}
          <div className="absolute left-20 bottom-24 w-80 p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  👩‍💼
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{industryConfig.staffTitle} Desk</h4>
                  <span className="text-[10px] text-slate-400">{industryConfig.counterTitle}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAfter ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
              }`}>
                {isAfter ? "Calm Dispatch" : "Repeatedly Interrupted"}
              </span>
            </div>

            {/* Receptionist State */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Current Activity</span>
                <p className="text-xs text-slate-200 mt-0.5">
                  {isAfter
                    ? "Dispatching Next Patient via Qblink Terminal. Zero queue questions."
                    : "Answering 4th patient asking: 'Doctor kab aayenge? Kitna time lagega?'"}
                </p>
              </div>

              {/* Staff Terminal Preview */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenStaffModal(); }}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pointer-events-auto"
                >
                  <Laptop className="w-3.5 h-3.5" /> View Staff Console Terminal ➔
                </button>
                <span className="font-mono text-[10px] text-slate-400">
                  {isAfter ? "Velocity: 3m/turn" : "Manual Logbook"}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE 2: DIGITAL TOKEN DISPLAY (TOP RIGHT) */}
          {/* ========================================================================= */}
          <div className="absolute top-16 left-28 w-64 p-4 rounded-2xl bg-slate-950 border-2 border-primary/40 shadow-xl">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
              <span>Live Queue Display</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-[10px] text-slate-500 block">NOW SERVING</span>
                <span className="font-mono font-black text-2xl text-emerald-400">
                  {isAfter ? "Token A-24" : "Token 18 (?)"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">IN LINE</span>
                <span className="font-mono font-bold text-base text-slate-300">
                  {isAfter ? "12 Waiting" : "Unclear"}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{isAfter ? "Scan QR for Pocket Ticket" : "Flickering Paper Token Board"}</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE 3: QBLINK QR STANDEE (CENTER FOREGROUND) */}
          {/* ========================================================================= */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-20 flex flex-col items-center">
            <motion.div
              animate={{
                scale: isTransitioning ? [1, 1.15, 1] : 1,
                boxShadow: isAfter ? "0 0 35px rgba(16,185,129,0.35)" : "0 0 20px rgba(59,130,246,0.2)",
              }}
              className="p-4 rounded-3xl bg-slate-900/95 border-2 border-primary text-white shadow-2xl flex flex-col items-center gap-2 backdrop-blur-lg"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Zero-App QR Entry</span>
              </div>

              {/* QR Code Graphic Box */}
              <div className="w-24 h-24 rounded-2xl bg-white p-2 flex items-center justify-center shadow-inner relative group cursor-pointer pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); onTriggerScan(); }}
              >
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center text-white relative overflow-hidden">
                  <QrCode className="w-16 h-16 text-white" />
                  {/* Animated Scan Beam */}
                  <motion.div
                    animate={{ y: [-30, 30, -30] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_#3b82f6]"
                  />
                </div>
              </div>

              <span className="text-[11px] font-extrabold text-white text-center">
                Scan to Join & Wait Anywhere
              </span>
              <span className="text-[9px] text-slate-400">iOS & Android • No App Download</span>

              <button
                onClick={(e) => { e.stopPropagation(); onTriggerScan(); }}
                className="mt-1 px-3 py-1 rounded-xl bg-primary text-white text-[10px] font-bold hover:opacity-90 pointer-events-auto transition-all flex items-center gap-1 shadow-sm"
              >
                <span>Simulate Scan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE 4: PROTAGONIST CUSTOMER (ANYA) */}
          {/* ========================================================================= */}
          <div className="absolute right-28 bottom-28 w-72 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                  👩‍💻
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Anya (Protagonist)</h4>
                  <span className="text-[10px] text-slate-400">{industryConfig.customerTitle}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAfter ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
              }`}>
                {isAfter ? "Relaxed at Cafe" : "Anxious & Trapped"}
              </span>
            </div>

            {/* Human Opportunity Cost Context Bubble */}
            <div className="mt-2.5 space-y-2 text-xs">
              <div className={`p-2.5 rounded-xl border ${
                isAfter ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" : "bg-amber-950/40 border-amber-500/30 text-amber-200"
              }`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold opacity-80">
                  {isAfter ? "Reclaimed Time" : "Opportunity Cost Conflict"}
                </span>
                <p className="text-[11px] leading-snug mt-0.5">
                  {isAfter
                    ? "Holding Token #A-27 on phone (3 ahead, ~9m wait). Working on client slides in terrace cafe."
                    : "Urgent 2:00 PM client call in 40 mins. Stuck in crowded room unable to leave or plan."}
                </p>
              </div>

              {/* Phone Action */}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPhoneModal(); }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-between pointer-events-auto transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAfter ? "View Digital Ticket #A-27" : "Simulate Customer Phone"}</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE 5: WAITING LOUNGE & CROWD OF AVATARS */}
          {/* ========================================================================= */}
          <div className="absolute right-16 top-48 w-80 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
              <span>Waiting Area Seating</span>
              <span className={isAfter ? "text-emerald-400" : "text-red-400"}>
                {isAfter ? "4 / 20 Seats Occupied" : "18 / 20 Seats Full (Crowded)"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const isOccupied = isAfter ? i <= 2 : true;
                return (
                  <div
                    key={i}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isOccupied
                        ? "bg-slate-900 border-slate-700 text-slate-300"
                        : "bg-slate-950/40 border-slate-900 text-slate-700"
                    }`}
                  >
                    <User className={`w-3.5 h-3.5 ${isOccupied ? (isAfter ? "text-emerald-400" : "text-amber-400") : "opacity-20"}`} />
                    <span className="text-[8px] font-mono mt-0.5">
                      {isOccupied ? (isAfter ? `A-${23 + i}` : `#${10 + i}`) : "Empty"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Hotspots Click Targets Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {HOTSPOTS.map((hotspot) => {
          const isTargeted = currentStep.hotspotTarget === hotspot.id;
          return (
            <div
              key={hotspot.id}
              style={{
                left: `${hotspot.x + (panOffset.x / 10)}%`,
                top: `${hotspot.y + (panOffset.y / 10)}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            >
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHotspot(hotspot);
                  }}
                  onMouseEnter={() => setHoveredHotspot(hotspot)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isTargeted
                      ? "bg-primary text-white scale-125 ring-4 ring-primary/40 animate-bounce"
                      : "bg-slate-900/90 border border-slate-700 text-slate-300 hover:scale-110 hover:border-primary hover:text-white"
                  }`}
                  aria-label={hotspot.label}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {/* Hotspot Hover Tag */}
                {(hoveredHotspot?.id === hotspot.id || isTargeted) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-slate-950/95 border border-slate-700 text-white text-[10px] shadow-2xl backdrop-blur-md pointer-events-none z-30"
                  >
                    <p className="font-bold text-primary">{hotspot.label}</p>
                    <p className="text-slate-300 text-[9px] mt-0.5">
                      {isAfter ? hotspot.afterNote : hotspot.beforeNote}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Left Compass & 360 Guidance Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: "12s" }} />
          <span>Drag to look around (360° Scene)</span>
        </div>

        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Right Quick View Jump Buttons */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => jumpToView(-80, 0)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900"
        >
          Reception
        </button>
        <button
          onClick={() => jumpToView(0, 0)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900"
        >
          QR Standee
        </button>
        <button
          onClick={() => jumpToView(80, 0)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900"
        >
          Anya & Terrace
        </button>
      </div>

      {/* Central Emotional Transform Hero CTA (During Before State) */}
      {!isAfter && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onTransform}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-primary/40 flex items-center gap-2 border border-white/20 animate-pulse hover:animate-none"
          >
            <Sparkles className="w-4 h-4" />
            <span>TRANSFORM WITH QBLINK</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* State Badge (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className={`px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest border shadow-lg ${
          isAfter
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            : "bg-red-500/20 text-red-300 border-red-500/40"
        }`}>
          {isAfter ? "✨ THE QBLINK WAY (Visible Digital Flow)" : "⚠️ THE OLD WAY (Physical Uncertainty & Chaos)"}
        </div>
      </div>
    </div>
  );
};
