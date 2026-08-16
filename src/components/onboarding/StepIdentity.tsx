import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, User, Phone, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isValidPhone } from "@/lib/phoneAuth";
import TypingText from "./TypingText";
import type { OnboardingData } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

type Field = "name" | "phone" | "social";
const ORDER: Field[] = ["name", "phone", "social"];

const fieldMeta: Record<Field, { icon: typeof User; label: string; placeholder: string; hint?: string }> = {
  name: { icon: User, label: "What's your full name?", placeholder: "e.g. Devansh Sharma" },
  phone: {
    icon: Phone,
    label: "Your phone number? (optional)",
    placeholder: "e.g. 9372090507",
    hint: "Optional — feel free to skip.",
  },
  social: {
    icon: AtSign,
    label: "A social profile or website? (optional)",
    placeholder: "LinkedIn, Instagram, X, or website",
    hint: "Helps us understand you better — feel free to skip.",
  },
};

const StepIdentity = ({ data, onChange, onNext }: Props) => {
  const [fieldIdx, setFieldIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const field = ORDER[fieldIdx];
  const meta = fieldMeta[field];

  const value = field === "name" ? data.fullName : field === "phone" ? data.phone : data.socialProfile;

  const setValue = (v: string) => {
    setError(null);
    if (field === "name") onChange({ fullName: v });
    else if (field === "phone") onChange({ phone: v });
    else onChange({ socialProfile: v });
  };

  const advance = () => {
    if (field === "name" && data.fullName.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (field === "phone" && data.phone.trim() !== "" && !isValidPhone(data.phone)) {
      setError("Please enter a valid phone number or skip this step.");
      return;
    }
    if (fieldIdx < ORDER.length - 1) setFieldIdx(fieldIdx + 1);
    else onNext();
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-3">
        <TypingText text="Before we begin, let's get to know you." speed={22} />
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="text-muted-foreground mb-10"
      >
        This only takes a minute.
      </motion.p>

      <AnimatePresence mode="wait">
        <motion.div
          key={field}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-card border border-border rounded-3xl p-6 sm:p-8 card-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <meta.icon className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <label htmlFor={`ob-${field}`} className="text-base font-semibold text-foreground">
              {meta.label}
            </label>
          </div>
          <Input
            id={`ob-${field}`}
            autoFocus
            type={field === "phone" ? "tel" : "text"}
            inputMode={field === "phone" ? "tel" : "text"}
            value={value}
            maxLength={field === "social" ? 255 : 100}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && advance()}
            placeholder={meta.placeholder}
            className="h-12 rounded-xl text-base transition-shadow focus-visible:ring-primary/40"
          />
          {meta.hint && <p className="text-xs text-muted-foreground mt-2">{meta.hint}</p>}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive font-medium mt-2"
              role="alert"
            >
              {error}
            </motion.p>
          )}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1.5" aria-hidden="true">
              {ORDER.map((f, i) => (
                <span
                  key={f}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === fieldIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              {(field === "social" || field === "phone") && (
                <button
                  type="button"
                  onClick={() => {
                    if (field === "phone") {
                      onChange({ phone: "" });
                      setError(null);
                      setFieldIdx(fieldIdx + 1);
                    } else {
                      onNext();
                    }
                  }}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={advance}
                className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow"
              >
                Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StepIdentity;