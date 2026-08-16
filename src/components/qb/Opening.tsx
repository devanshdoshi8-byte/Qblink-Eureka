import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Ticket } from "./Ticket";

export const Opening = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <section
      id="act-wait"
      className="relative min-h-screen ink-surface overflow-hidden grain"
      aria-label="The wait"
    >
      <div className="absolute inset-0 relief-glow pointer-events-none" />

      {/* corner metadata (hidden on small screens to avoid mobile menu overlap) */}
      <div className="hidden sm:block absolute top-6 right-6 lg:top-8 lg:right-8 text-right z-10">
        <div className="font-mono-caps text-glow/70">Act 01 · Wait</div>
        <div className="font-mono-caps text-cream/40 mt-1 tabular-nums">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")} elapsed
        </div>
      </div>

      {/* left index */}
      <div className="absolute left-20 top-1/2 -translate-y-1/2 hidden xl:block">
        <div className="font-mono-caps text-cream/30 [writing-mode:vertical-rl] rotate-180">
          A queue that lives on the internet · No app · No hardware
        </div>
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-12 gap-8 px-6 sm:px-10 lg:px-24 pt-32 pb-16 lg:pt-24">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="font-mono-caps text-glow mb-8 flex items-center gap-3">
            <span className="w-8 h-px bg-glow" />
            Qblink — for walk-in businesses
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[8.5rem] leading-[0.92] text-cream">
            The wait
            <br />
            <span className="text-glow italic font-normal">was never</span>
            <br />
            the point.
          </h1>

          <p className="mt-10 max-w-md text-cream/70 text-lg leading-relaxed">
            Every hour a customer spends standing in your line is an hour
            they'll remember more than the service itself. Qblink gives that
            hour back — no app, no hardware, no line.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-3 bg-glow text-ink font-mono-caps px-6 py-4 hover:bg-cream transition-colors animate-glow-pulse"
            >
              Start free pilot
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a
              href="#act-move"
              className="font-mono-caps text-cream/70 hover:text-glow transition-colors"
            >
              Read the story ↓
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-end lg:items-center justify-center lg:justify-end relative">
          <div className="animate-ticket-rise">
            <Ticket number="A-047" position={3} wait="8 min" />
          </div>
        </div>
      </div>

      {/* bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-glow/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-24 py-4 flex justify-between font-mono-caps text-cream/40">
          <span>Est. 2025 · India</span>
          <span className="hidden sm:inline">Hardware-free · Browser-native</span>
          <span>Ch. 01 / 10</span>
        </div>
      </div>
    </section>
  );
};