import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/qblink-logo.png";

const links = [
  { label: "Product", href: "#product" },
  { label: "Simulation", href: "#simulation" },
  { label: "Industries", href: "#industries" },
  { label: "ROI Estimator", href: "#roi" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Demo", href: "#demo" },
];

/**
 * Horizontal product navigation for the marketing surface.
 * Transparent over the hero stage, glass once scrolled.
 */
export const TopNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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

        <div className="hidden md:flex items-center gap-7 text-sm">
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

      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="bg-background border-b border-border px-5 pb-5 pt-1 space-y-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-foreground"
            >
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-3">
            <ThemeToggle />
            <Link to="/auth/signin" className="text-sm text-foreground">Sign in</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
