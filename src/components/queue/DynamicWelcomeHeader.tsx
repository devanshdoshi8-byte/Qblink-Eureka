import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** Customer's first name when known. */
  name?: string | null;
  /** People ahead — only meaningful once joined. */
  ahead?: number | null;
  joined?: boolean;
  /** Times this customer has visited this business (from favourites). */
  visitCount?: number | null;
  className?: string;
}

const partOfDay = (h: number) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

/**
 * Contextual greeting above the business name.
 * Changes only when context changes (time band, returning status, position).
 */
const DynamicWelcomeHeader = ({ name, ahead, joined, visitCount, className }: Props) => {
  const reduce = useReducedMotion();
  const first = (name || "").trim().split(/\s+/)[0] || "";

  const { key, title, sub } = useMemo(() => {
    if (joined && typeof ahead === "number") {
      if (ahead <= 0) {
        return { key: "next", title: "Your turn is next.", sub: "Please stay nearby." };
      }
      if (ahead <= 3) {
        return { key: "almost", title: "Almost your turn.", sub: "Start heading over if you're not here yet." };
      }
    }
    const greeting = partOfDay(new Date().getHours());
    if ((visitCount ?? 0) > 1) {
      return {
        key: "returning",
        title: first ? `Welcome back, ${first}.` : "Welcome back.",
        sub: "Good to see you again.",
      };
    }
    return {
      key: `greet-${greeting}`,
      title: first ? `${greeting}, ${first}.` : greeting + ".",
      sub: "Glad you're here — we'll keep you updated.",
    };
  }, [ahead, first, joined, visitCount]);

  return (
    <div className={cn("text-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DynamicWelcomeHeader;
