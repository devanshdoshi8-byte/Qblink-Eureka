import { useState } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface InfoHintProps {
  /** One-sentence explanation of the metric / chart / filter. */
  description: string;
  /** Optional concrete example to clarify. */
  example?: string;
  /** Optional short title shown above the description. */
  title?: string;
  /** Size of the info glyph. */
  size?: "sm" | "md";
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Contextual help affordance — a small info icon that reveals a one-sentence
 * explanation. Opens on hover (desktop) and tap (mobile/touch).
 * Keeps existing layouts intact — inline, transparent, design-token aware.
 */
const InfoHint = ({
  description,
  example,
  title,
  size = "sm",
  ariaLabel,
  className,
}: InfoHintProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const hoverProps = isMobile
    ? {}
    : {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel || title || "More info"}
          onClick={(e) => {
            e.stopPropagation();
            if (isMobile) setOpen((v) => !v);
          }}
          {...hoverProps}
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            className,
          )}
        >
          <Info className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-64 p-3 text-xs leading-relaxed"
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...hoverProps}
      >
        {title && (
          <p className="font-semibold text-foreground mb-1 text-[13px]">{title}</p>
        )}
        <p className="text-muted-foreground">{description}</p>
        {example && (
          <p className="mt-2 text-[11px] text-muted-foreground/80 italic border-l-2 border-primary/30 pl-2">
            {example}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default InfoHint;