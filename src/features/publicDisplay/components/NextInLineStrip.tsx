import React from "react";
import { Users, Clock } from "lucide-react";

interface NextInLineStripProps {
  nextTokens: number[];
  waitingCount: number;
  estimatedWaitMinutes: number | null;
}

export const NextInLineStrip: React.FC<NextInLineStripProps> = ({
  nextTokens,
  waitingCount,
  estimatedWaitMinutes,
}) => {
  if (nextTokens.length === 0) {
    return null;
  }

  return (
    <div className="w-full p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-lg">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Up Next In Line
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{waitingCount} waiting</span>
          </span>
          {estimatedWaitMinutes !== null && (
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>~{estimatedWaitMinutes}m</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {nextTokens.slice(0, 4).map((token, index) => (
          <div
            key={token}
            className="p-3 sm:p-4 rounded-2xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-center shadow-xs"
          >
            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
              {index === 0 ? "Next" : `Position ${index + 1}`}
            </span>
            <span className="font-mono font-black text-xl sm:text-2xl text-foreground mt-0.5">
              #{token}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
