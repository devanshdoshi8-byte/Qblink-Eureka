import { cn } from "@/lib/utils";

interface AnimatedCheckProps {
  size?: number;
  className?: string;
}

/**
 * Animated success checkmark — circle pops in, then the check stroke draws.
 * Drop in anywhere a confirmation appears.
 */
const AnimatedCheck = ({ size = 64, className }: AnimatedCheckProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-full bg-primary/10 text-primary animate-check-pop",
      className,
    )}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size * 0.55, height: size * 0.55 }}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" className="animate-check-draw" />
    </svg>
  </span>
);

export default AnimatedCheck;