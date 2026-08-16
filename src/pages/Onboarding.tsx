import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import FloatingOrbs from "@/components/onboarding/FloatingOrbs";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import StepIdentity from "@/components/onboarding/StepIdentity";
import StepProfile from "@/components/onboarding/StepProfile";
import StepContextBridge from "@/components/onboarding/StepContextBridge";
import StepConsequence from "@/components/onboarding/StepConsequence";
import StepInsight from "@/components/onboarding/StepInsight";
import StepDesire from "@/components/onboarding/StepDesire";
import StepConversion from "@/components/onboarding/StepConversion";
import TypingText from "@/components/onboarding/TypingText";
import {
  defaultOnboardingData,
  firstNameOf,
  loadOnboarding,
  persistLead,
  saveOnboarding,
  type OnboardingData,
} from "@/lib/onboarding";
import { trackEvent } from "@/lib/analytics";

// Scalable step registry — future story screens get appended here.
type StepId = "identity" | "profile" | "context" | "consequence" | "insight" | "desire" | "conversion" | "outro";
const STEP_FLOW: StepId[] = ["identity", "profile", "context", "consequence", "insight", "desire", "conversion"];

// Visual step number shown in the progress bar. The new "context" screen is
// presented as the closing beat of step 2 so the total still reads 6.
const STEP_DISPLAY: Record<StepId, number> = {
  identity: 1,
  profile: 2,
  context: 2,
  consequence: 3,
  insight: 4,
  desire: 5,
  conversion: 6,
  outro: 6,
};

const Onboarding = () => {
  const [data, setData] = useState<OnboardingData>(() => ({ ...defaultOnboardingData, ...loadOnboarding() }));
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEP_FLOW[stepIdx];

  useEffect(() => {
    saveOnboarding(data);
  }, [data]);

  useEffect(() => {
    trackEvent("onboarding_step_view", { step: STEP_FLOW[stepIdx], index: stepIdx + 1 });
    window.scrollTo({ top: 0 });
  }, [stepIdx]);

  const patch = (p: Partial<OnboardingData>) => setData((d) => ({ ...d, ...p }));
  const next = () => setStepIdx((i) => Math.min(i + 1, STEP_FLOW.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const completeProfile = async () => {
    try {
      await persistLead(data);
    } catch (e) {
      // Never block the journey on a network hiccup — responses stay in localStorage.
      console.error("Failed to save lead", e);
    }
    next();
  };

  const name = firstNameOf(data.fullName);

  return (
    <div className="min-h-screen soft-bg relative flex flex-col">
      <SEO
        title="See Qblink in Action — Interactive Demo"
        description="A personalized walkthrough of how Qblink turns walk-in chaos into controlled flow. Takes about a minute."
        path="/onboarding"
      />
      <FloatingOrbs />

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-5 pb-2 max-w-3xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2" aria-label="Back to Qblink home">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-bold text-foreground">Qblink</span>
        </Link>
        {stepIdx > 0 && step !== "outro" && (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
        )}
      </header>

      <div className="relative z-10 px-4 sm:px-6 pt-4 max-w-3xl mx-auto w-full">
        <OnboardingProgress step={STEP_DISPLAY[step]} />
      </div>

      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-10 sm:py-12 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full"
          >
            {step === "identity" && <StepIdentity data={data} onChange={patch} onNext={next} />}
            {step === "profile" && <StepProfile data={data} onChange={patch} onNext={completeProfile} />}
            {step === "context" && <StepContextBridge data={data} onNext={next} />}
            {step === "consequence" && <StepConsequence data={data} onChange={patch} onNext={next} />}
            {step === "insight" && <StepInsight data={data} onChange={patch} onNext={next} />}
            {step === "desire" && <StepDesire data={data} onChange={patch} onNext={next} />}
            {step === "conversion" && (
              <StepConversion
                data={data}
                onChange={patch}
                onNext={() => (window.location.href = "/")}
              />
            )}
            {step === "outro" && (
              <div className="w-full max-w-md mx-auto text-center">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 elevated-shadow">
                  <Sparkles className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-4">
                  <TypingText text={`${name || "Friend"}, your journey is just beginning.`} speed={28} />
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                  className="text-muted-foreground leading-relaxed mb-8"
                >
                  We've saved your profile. The next chapters of this experience are coming soon —
                  they'll be personalized just for you.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7, duration: 0.4 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  <Link
                    to="/auth"
                    className="gradient-bg text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] transition-all elevated-shadow"
                  >
                    Start Free
                  </Link>
                  <Link
                    to="/"
                    className="border border-primary/30 bg-primary/5 text-primary px-8 py-3 rounded-full text-sm font-semibold hover:bg-primary/10 transition-colors"
                  >
                    Back to Home
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Onboarding;