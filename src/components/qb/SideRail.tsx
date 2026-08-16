import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Moon, Sun } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import logo from "@/assets/qblink-logo.png";

const BrandMark = ({ className = "w-9 h-9" }: { className?: string }) => (
  <img
    src={logo}
    alt="Qblink"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

const acts = [
  { id: "wait", label: "Wait", href: "#act-wait" },
  { id: "move", label: "Move", href: "#act-move" },
  { id: "relief", label: "Relief", href: "#act-relief" },
];

export const SideRail = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("wait");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const appearanceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace("act-", ""));
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    acts.forEach((a) => {
      const el = document.getElementById(`act-${a.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!appearanceOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!appearanceRef.current?.contains(e.target as Node)) setAppearanceOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAppearanceOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [appearanceOpen]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-16 z-40 flex-col items-center justify-between py-8 pointer-events-none"
        aria-label="Primary"
      >
        <Link to="/" className="pointer-events-auto transition-opacity hover:opacity-80" aria-label="Qblink home">
          <BrandMark className="w-10 h-10" />
        </Link>

        <nav className="pointer-events-auto flex flex-col items-center gap-6 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 thread-line" aria-hidden />
          {acts.map((a) => (
            <a
              key={a.id}
              href={a.href}
              className="group relative flex items-center gap-3 py-1"
              aria-label={`Jump to ${a.label}`}
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full border transition-all ${
                  active === a.id
                    ? "bg-glow border-glow shadow-[0_0_16px_hsl(var(--glow))]"
                    : "bg-transparent border-glow/50 group-hover:border-glow"
                }`}
              />
              <span className="font-mono-caps absolute left-6 text-glow/0 group-hover:text-glow transition-all whitespace-nowrap">
                {a.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="pointer-events-auto flex flex-col items-center gap-5">
          <div className="relative" ref={appearanceRef}>
            <button
              type="button"
              onClick={() => setAppearanceOpen((v) => !v)}
              className="no-theme-transition w-9 h-9 flex items-center justify-center rounded-full border border-glow/40 text-glow hover:text-cream hover:border-glow transition-colors"
              aria-haspopup="menu"
              aria-expanded={appearanceOpen}
              aria-label="Appearance"
              title="Appearance"
            >
              {theme === "dark" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </button>
            {appearanceOpen && (
              <div
                role="menu"
                aria-label="Appearance"
                className="no-theme-transition absolute left-12 bottom-0 min-w-[180px] rounded-lg border border-glow/25 bg-[hsl(215_55%_10%/0.98)] backdrop-blur-md shadow-2xl overflow-hidden animate-fade-in"
              >
                <div className="px-3 py-2 font-mono-caps text-[hsl(177_42%_65%)]/80 border-b border-glow/15">
                  Appearance
                </div>
                <AppearanceItem
                  label="Light"
                  icon={<Sun className="w-4 h-4" />}
                  active={theme === "light"}
                  onClick={() => {
                    setTheme("light");
                    setAppearanceOpen(false);
                  }}
                />
                <AppearanceItem
                  label="Dark"
                  icon={<Moon className="w-4 h-4" />}
                  active={theme === "dark"}
                  onClick={() => {
                    setTheme("dark");
                    setAppearanceOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          <Link
            to="/auth"
            className="font-mono-caps text-cream/80 hover:text-glow transition-colors [writing-mode:vertical-rl] rotate-180"
          >
            Start free →
          </Link>
        </div>
      </aside>

      {/* Mobile floating monogram */}
      <div className="lg:hidden fixed top-4 left-4 right-4 z-40 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Qblink home">
          <BrandMark className="w-9 h-9" />
          <span className="font-display text-lg text-cream tracking-tight">Qblink</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            onClick={() => setOpen(true)}
            className="font-mono-caps text-cream/80 border border-glow/40 px-3 py-1.5 rounded-sm backdrop-blur-md bg-ink/40"
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 ink-surface flex flex-col p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <BrandMark className="w-9 h-9" />
              <span className="font-display text-lg text-cream tracking-tight">Qblink</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="font-mono-caps text-cream/80"
              aria-label="Close menu"
            >
              Close ×
            </button>
          </div>
          <nav className="flex flex-col gap-8">
            {acts.map((a, i) => (
              <a
                key={a.id}
                href={a.href}
                onClick={() => setOpen(false)}
                className="font-display text-5xl text-cream hover:text-glow transition-colors"
              >
                <span className="font-mono-caps text-glow/60 align-top mr-3">0{i + 1}</span>
                {a.label}
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-4 items-start">
              <div className="w-full">
                <div className="font-mono-caps text-glow/70 mb-3">Appearance</div>
                <div className="flex gap-2">
                  <MobileAppearance
                    label="Light"
                    icon={<Sun className="w-4 h-4" />}
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                  />
                  <MobileAppearance
                    label="Dark"
                    icon={<Moon className="w-4 h-4" />}
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  />
                </div>
              </div>
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-4 font-mono-caps text-glow border border-glow/40 px-4 py-3"
              >
                Start free →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

const AppearanceItem = ({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    role="menuitemradio"
    aria-checked={active}
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[hsl(44_33%_94%)] hover:bg-[hsl(177_42%_55%/0.1)] transition-colors"
  >
    <span className="text-[hsl(177_42%_65%)]">{icon}</span>
    <span className="flex-1 font-display">{label}</span>
    {active && <Check className="w-4 h-4 text-[hsl(177_42%_65%)]" />}
  </button>
);

const MobileAppearance = ({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono-caps border transition-colors ${
      active
        ? "border-glow text-glow bg-glow/10"
        : "border-glow/25 text-cream/70 hover:border-glow/60 hover:text-cream"
    }`}
  >
    {icon}
    {label}
  </button>
);