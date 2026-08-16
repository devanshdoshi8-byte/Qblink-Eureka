import { ReactNode } from "react";
import { Lightbulb, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
  cta?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondary?: ReactNode;
  className?: string;
  /** compact removes outer card padding (use inside an existing card) */
  compact?: boolean;
}

/**
 * Premium, on-brand empty state. Same outer card/padding footprint as the
 * plain "No data" messages it replaces — designed to slot in without
 * touching the page layout.
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  tip,
  cta,
  secondary,
  className = "",
  compact = false,
}: EmptyStateProps) => {
  const button = cta ? (
    cta.to ? (
      <Link
        to={cta.to}
        className="inline-flex items-center justify-center gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {cta.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={cta.onClick}
        className="inline-flex items-center justify-center gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {cta.label}
      </button>
    )
  ) : null;

  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-10"} ${className}`}>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-2xl" aria-hidden />
        <div className="relative w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
          <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
        </div>
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4 px-2">{description}</p>
      {button && <div className="mb-3">{button}</div>}
      {secondary && <div className="mb-3">{secondary}</div>}
      {tip && (
        <div className="mt-1 inline-flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 max-w-sm">
          <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <span className="text-left leading-relaxed"><span className="font-semibold text-foreground">Tip · </span>{tip}</span>
        </div>
      )}
    </div>
  );
};

export default EmptyState;