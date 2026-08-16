import { Component, ReactNode, Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, QrCode, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const QueueEcosystem3D = lazy(() => import("./hero/QueueEcosystem3D"));

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D Scene fallback triggered:", error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const proof = [
  { k: "0", v: "apps to install" },
  { k: "0", v: "hardware to buy" },
  { k: "<2 min", v: "to go live" },
  { k: "Live", v: "position, everywhere" },
];

/**
 * Hero — the product stage. A single continuous thread carries tokens from
 * scan to serve behind the value proposition, so the promise is visible
 * before it is read.
 */
export const Hero = () => {
  const [showCanvas, setShowCanvas] = useState(false);

  // Defer the 3D payload until the browser is idle so the QR-scan path
  // (the critical customer route) is never blocked by it.
  useEffect(() => {
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 400));
    const id = idle(() => setShowCanvas(true));
    return () => window.clearTimeout(id as number);
  }, []);

  return (
    <section id="product" className="relative min-h-[94vh] hero-stage overflow-hidden flex items-center">
      <div className="absolute inset-0 stage-grid" aria-hidden />

      {/* Atmospheric kinetic glowing orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[hsl(var(--brand-glow)/0.08)] blur-3xl animate-pulse-halo pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[hsl(var(--brand-teal)/0.1)] blur-3xl animate-float-slow pointer-events-none" />

      <div className="absolute inset-0" aria-hidden>
        {showCanvas && (
          <CanvasErrorBoundary>
            <Suspense fallback={null}>
              <QueueEcosystem3D />
            </Suspense>
          </CanvasErrorBoundary>
        )}
      </div>

      {/* Legibility scrim: keeps the headline column readable over the moving scene. */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-2/3 bg-gradient-to-r from-[hsl(215_60%_7%/0.94)] via-[hsl(215_60%_7%/0.65)] to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full glass-panel px-3.5 py-1.5 mb-7 hover:border-[hsl(var(--brand-glow)/0.4)] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-glow))] animate-pulse" />
            <span className="text-xs tracking-[0.18em] uppercase stage-muted font-medium">
              Customer Flow Intelligence Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl stage-text"
          >
            The line still exists.
            <br />
            <span className="stage-accent relative inline-block">
              Nobody has to stand in it.
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 bottom-1 h-1 bg-gradient-to-r from-[hsl(var(--brand-glow))] to-[hsl(var(--brand-teal))] opacity-75 rounded-full"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-base sm:text-lg stage-muted max-w-xl leading-relaxed"
          >
            Qblink turns walk-in chaos into a measured flow. Customers scan, hold their place from
            anywhere, and arrive at the exact minute they're needed — while your counter runs on
            live position data, forecasts and operational intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3.5"
          >
            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/auth"
                className="group relative inline-flex items-center gap-2.5 rounded-xl bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-semibold px-6 py-3.5 shadow-lg shadow-[hsl(var(--brand-glow)/0.25)] hover:shadow-[hsl(var(--brand-glow)/0.4)] transition-all"
              >
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                Start free pilot
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/pitch"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--brand-glow)/0.15)] text-[hsl(var(--brand-cream))] font-semibold px-5 py-3.5 hover:bg-[hsl(var(--brand-glow)/0.25)] transition-all border border-[hsl(var(--brand-glow)/0.4)] shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Try Pitch Demo
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl glass-panel stage-text font-medium px-5 py-3.5 hover:bg-[hsl(var(--brand-cream)/0.1)] transition-all border border-[hsl(var(--brand-cream)/0.15)]"
              >
                <QrCode className="w-4 h-4 text-[hsl(var(--brand-glow))]" />
                See customer journey
              </Link>
            </motion.div>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 flex flex-wrap gap-y-6 gap-x-6 max-w-xl"
          >
            {proof.map((p, i) => (
              <motion.div
                key={p.v}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-6 ${i !== 0 ? 'sm:border-l sm:border-[hsl(var(--brand-cream)/0.12)] sm:pl-6' : ''}`}
              >
                <div>
                  <dt className="font-display text-2xl stage-text tracking-tight font-bold">{p.k}</dt>
                  <dd className="text-[0.8125rem] stage-muted mt-0.5 leading-snug">{p.v}</dd>
                </div>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"
        aria-hidden
      >
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path d="M2 2l8 8 8-8" stroke="hsl(var(--brand-cream))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </section>
  );
};
