import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePublicDisplaySync } from "./hooks/usePublicDisplaySync";
import { DisplayTopHeader } from "./components/DisplayTopHeader";
import { NowServingHero } from "./components/NowServingHero";
import { NextInLineStrip } from "./components/NextInLineStrip";
import { JoinQrKioskCard } from "./components/JoinQrKioskCard";
import { DisplayTheme } from "./types";
import SEO from "@/components/SEO";

interface PublicQueueDisplayProps {
  queueId?: string;
}

export const PublicQueueDisplay: React.FC<PublicQueueDisplayProps> = ({ queueId: propQueueId }) => {
  const { queueId: paramQueueId } = useParams<{ queueId: string }>();
  const activeQueueId = propQueueId || paramQueueId || "";

  const [theme, setTheme] = useState<DisplayTheme>(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "dark";
    }
    return "dark";
  });

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { displayData, refresh } = usePublicDisplaySync(activeQueueId, audioEnabled);

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDarkMode = theme === "dark";

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 flex flex-col justify-between p-4 sm:p-8 md:p-10 ${
        isDarkMode
          ? "dark bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <SEO
        title={`${displayData.queueName} — Now Serving Live Display`}
        description={`Live public counter display for ${displayData.queueName}. Track now serving token and scan to join the digital line.`}
        path={`/display/${activeQueueId}`}
      />

      <div className="max-w-6xl w-full mx-auto space-y-6 md:space-y-8 flex-1 flex flex-col justify-between">
        {/* Header */}
        <DisplayTopHeader
          businessName={displayData.businessName}
          queueName={displayData.queueName}
          connectionStatus={displayData.connectionStatus}
          theme={theme}
          audioEnabled={audioEnabled}
          isFullscreen={isFullscreen}
          onToggleTheme={toggleTheme}
          onToggleAudio={() => setAudioEnabled((prev) => !prev)}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Central Giant Hero Now Serving Area */}
        <main className="flex-1 flex flex-col justify-center space-y-6 my-auto">
          <NowServingHero displayData={displayData} />

          {/* Up Next Tokens In Line */}
          <NextInLineStrip
            nextTokens={displayData.nextTokens}
            waitingCount={displayData.waitingCount}
            estimatedWaitMinutes={displayData.estimatedWaitMinutes}
          />
        </main>

        {/* Bottom Scan & Go Kiosk QR Card */}
        {displayData.status !== "closed" && (
          <footer className="pt-2">
            <JoinQrKioskCard
              queueId={displayData.queueId}
              queueName={displayData.queueName}
            />
          </footer>
        )}
      </div>
    </div>
  );
};

export default PublicQueueDisplay;
