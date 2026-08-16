import { AnimatePresence, motion } from "framer-motion";

interface SuccessCelebrationProps {
  token: number | null;
  visible: boolean;
}

/**
 * Gentle inline success confirmation shown inside the joined queue card.
 * A checkmark draws itself, then the banner fades away after a few seconds.
 */
const SuccessCelebration = ({ token, visible }: SuccessCelebrationProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 12l5 5L20 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
              />
            </svg>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">You're in line</span>
            {token !== null && (
              <span className="text-muted-foreground ml-1.5">· Token #{token}</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
