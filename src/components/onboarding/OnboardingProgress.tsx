import { motion } from "framer-motion";
import { TOTAL_STEPS } from "@/lib/onboarding";

interface Props {
  step: number; // 1-based
}

const OnboardingProgress = ({ step }: Props) => {
  const pct = Math.min(100, (step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs font-semibold text-primary">{Math.round(pct)}%</span>
      </div>
      <div
        className="h-1.5 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label="Onboarding progress"
      >
        <motion.div
          className="h-full rounded-full gradient-bg"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default OnboardingProgress;