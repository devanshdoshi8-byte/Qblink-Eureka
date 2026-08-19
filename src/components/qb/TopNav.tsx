import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, Play, Sparkles, Tv, Layers, DollarSign, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/qblink-logo.png";
import { motion, AnimatePresence } from "framer-motion";

const demoLinks = [
  {
    title: "Dual-Device Pitch Simulator",
    href: "/pitch",
    desc: "Interactive live sync between phone pass & staff terminal",
    icon: Play,
    badge: "Stage Ready",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Chaos to Clarity Story",
    href: "/chaos-to-clarity",
    desc: "10-second visual before & after walk-in transformation",
    icon: Sparkles,
    badge: "10s Pitch",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    title: "4-Industry Spatial Morphing",
    href: "/industries",
    desc: "Clinic, Restaurant, Salon & Civic preset simulator",
    icon: Layers,
    badge: "Multi-Industry",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    title: "Illustrative ROI Calculator",
    href: "/roi",
    desc: "Interactive footfall recovery & economic model",
    icon: DollarSign,
    badge: "Business Model",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    title: "Scan & Go Public TV Display",
    href: "/display/demo",
    desc: "Full-screen kiosk mode with voice announcer & live QR",
    icon: Tv,
    badge: "Kiosk Mode",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  },
];

const links = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Demo Videos", href: "#demo" },
];

/**
 * Horizontal product navigation for the marketing surface.
 * Transparent over the hero stage, glass once scrolled.
 */
export const TopNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDemosOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] flex items-center gap-8" aria-label="Primary">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Qblink home">
            <img src={logo} alt="" className="w-8 h-8 object-contain" draggable={false} />
            <span className={`font-display text-lg tracking-tight ${scrolled ? "text-foreground" : "stage-text"}`}>
              Qblink
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {/* Interactive Demos Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDemosOpen(!demosOpen)}
                className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  demosOpen
                    ? "text-primary bg-primary/10"
                    : scrolled
                    ? "text-foreground hover:text-primary"
                    : "stage-muted hover:text-[hsl(var(--brand-cream))]"
                }`}
                aria-expanded={demosOpen}
              >
                <span>Live Demos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${demosOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {demosOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-96 rounded-2xl bg-card border border-border p-2.5 shadow-2xl z-50 backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 border-b border-border/60 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Interactive Pitch & Product Demos
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </div>

                    <div className="space-y-1">
                      {demoLinks.map((demo) => {
                        const Icon = demo.icon;
                        return (
                          <Link
                            key={demo.href}
                            to={demo.href}
                            onClick={() => setDemosOpen(false)}
                            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/70 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {demo.title}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${demo.badgeColor}`}>
                                  {demo.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                                {demo.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  scrolled ? "text-muted-foreground hover:text-foreground" : "stage-muted hover:text-[hsl(var(--brand-cream))]"
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link
              to="/pitch"
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
                scrolled
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-primary/40 bg-primary/20 text-[hsl(var(--brand-cream))] hover:bg-primary/30"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pitch Demo</span>
            </Link>
            <Link
              to="/auth/signin"
              className={`hidden sm:inline-block text-sm px-3 py-2 rounded-lg transition-colors ${
                scrolled ? "text-foreground hover:bg-muted" : "stage-text hover:bg-[hsl(var(--brand-cream)/0.1)]"
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start free
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className={`md:hidden p-2 rounded-lg ${scrolled ? "text-foreground" : "stage-text"}`}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            open ? "max-h-[85vh] overflow-y-auto" : "max-h-0"
          }`}
        >
          <div className="bg-background border-b border-border px-5 pb-6 pt-2 space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Interactive Demos
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {demoLinks.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <span className="font-semibold">{d.title}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${d.badgeColor}`}>
                      {d.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Explore
              </p>
              <div className="space-y-1">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <ThemeToggle />
              <Link to="/auth/signin" className="text-sm font-medium text-foreground">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Mobile Action Bar on Home */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/90 backdrop-blur-lg border-t border-border flex items-center gap-2.5">
        <Link
          to="/pitch"
          className="flex-1 py-2.5 px-3 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Try Pitch Demo</span>
        </Link>
        <Link
          to="/auth"
          className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs text-center flex items-center justify-center gap-1 shadow-sm"
        >
          <span>Start Free</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </>
  );
};
