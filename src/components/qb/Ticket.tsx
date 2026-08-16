import { useEffect, useState } from "react";

type Props = {
  number?: string;
  position?: number;
  wait?: string;
  className?: string;
  live?: boolean;
};

export const Ticket = ({
  number = "A-047",
  position = 3,
  wait = "8 min",
  className = "",
  live = true,
}: Props) => {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setPulse((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div
      className={`relative inline-block ${className}`}
      role="img"
      aria-label={`Ticket ${number}, position ${position}, wait ${wait}`}
    >
      {/* perforation edge */}
      <div className="absolute -left-1 top-0 bottom-0 w-2 flex flex-col justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="block w-2 h-2 rounded-full bg-ink" />
        ))}
      </div>
      <div className="cream-surface ticket-shadow px-8 py-6 pl-10 min-w-[260px]">
        <div className="flex items-center justify-between border-b border-ink/15 pb-3 mb-4">
          <span className="font-mono-caps text-ink/60">Qblink · Ticket</span>
          {live && (
            <span className="flex items-center gap-1.5 font-mono-caps text-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-tick" />
              Live
            </span>
          )}
        </div>
        <div className="font-display text-6xl leading-none text-ink mb-4">
          {number}
        </div>
        <div className="grid grid-cols-2 gap-4 text-ink/80">
          <div>
            <div className="font-mono-caps text-ink/50 mb-1">Position</div>
            <div className="font-display text-2xl">
              {position}
              <span className="text-ink/40 text-base ml-1">/ ahead</span>
            </div>
          </div>
          <div>
            <div className="font-mono-caps text-ink/50 mb-1">Est. wait</div>
            <div className="font-display text-2xl">{wait}</div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-dashed border-ink/20 flex items-center justify-between gap-3">
          <span className="font-mono-caps text-ink/50 truncate">no app · no hardware</span>
          <span className="font-mono-caps text-ink/50 tabular-nums shrink-0" aria-hidden>
            {String(pulse % 60).padStart(2, "0")}s
          </span>
        </div>
      </div>
    </div>
  );
};