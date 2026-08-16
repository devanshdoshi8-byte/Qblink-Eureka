import React from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import { DisplayConnectionStatus, DisplayTheme } from "../types";

interface DisplayTopHeaderProps {
  businessName: string;
  queueName: string;
  connectionStatus: DisplayConnectionStatus;
  theme: DisplayTheme;
  audioEnabled: boolean;
  isFullscreen: boolean;
  onToggleTheme: () => void;
  onToggleAudio: () => void;
  onToggleFullscreen: () => void;
}

export const DisplayTopHeader: React.FC<DisplayTopHeaderProps> = ({
  businessName,
  queueName,
  connectionStatus,
  theme,
  audioEnabled,
  isFullscreen,
  onToggleTheme,
  onToggleAudio,
  onToggleFullscreen,
}) => {
  const isLive = connectionStatus === "live";

  return (
    <header className="w-full flex items-center justify-between gap-4 pb-6 border-b border-border/80">
      {/* Brand & Location */}
      <div className="flex items-center gap-3.5">
        <img
          src={logo}
          alt="Qblink"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-contain shadow-md"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg md:text-xl font-black text-foreground tracking-tight truncate max-w-sm sm:max-w-md">
              {queueName}
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {businessName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"
              }`}
            />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isLive ? "Live Sync Active" : "Reconnecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls (Audio, Theme, Fullscreen) */}
      <div className="flex items-center gap-2">
        {/* Audio Speech Toggle */}
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? "Disable voice announcements" : "Enable voice announcements"}
          aria-label={audioEnabled ? "Disable voice announcements" : "Enable voice announcements"}
          className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
            audioEnabled
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden md:inline">{audioEnabled ? "Voice On" : "Voice Off"}</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Display`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Display`}
          className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Fullscreen Trigger */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen TV Mode"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen TV Mode"}
          className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="text-xs font-bold hidden lg:inline">
            {isFullscreen ? "Exit TV Mode" : "TV Mode"}
          </span>
        </button>
      </div>
    </header>
  );
};
