import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowUpDown, MessageSquareText, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "qb-admin-onboarding-dismissed";

const items = [
  {
    label: "Open Discovery Control",
    description: "Click the highlighted Discovery link in the left sidebar.",
    icon: Compass,
    link: "/admin/discovery",
  },
  {
    label: "Try Ranking & Promotion",
    description: "Reorder businesses, set Sponsored or Featured flags.",
    icon: ArrowUpDown,
    link: "/admin/discovery",
  },
  {
    label: "Manage Reviews",
    description: "Hide or remove reviews from the Reviews tab.",
    icon: MessageSquareText,
    link: "/admin/discovery",
  },
];

export default function AdminOnboardingChecklist() {
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const toggle = (idx: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6 overflow-hidden">
      <div className="absolute top-0 right-0 p-3">
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Admin Quick Start</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4 max-w-md">
        Complete these steps to take full control of business discovery and reviews.
      </p>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const done = completed.has(idx);
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                done ? "bg-success/5" : "bg-card/60 hover:bg-card"
              }`}
            >
              <button
                onClick={() => toggle(idx)}
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-primary"
                }`}
                aria-label={`Mark ${item.label} as done`}
              >
                {done && <Check className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className={`text-sm font-semibold ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${done ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                  {item.description}
                </p>
              </div>
              <Link to={item.link} onClick={() => toggle(idx)}>
                <Button size="sm" variant={done ? "ghost" : "default"} className="h-8 text-xs">
                  {done ? "Revisit" : "Go"}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {completed.size} of {items.length} completed
        </span>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={dismiss}>
          Dismiss checklist
        </Button>
      </div>
    </div>
  );
}
