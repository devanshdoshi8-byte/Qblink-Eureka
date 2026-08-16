import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Users, Check, Loader2 } from "lucide-react";
import TypingText from "./TypingText";
import { firstNameOf, ROLE_OPTIONS, TAG_OPTIONS, type OnboardingData, type OnboardingRole } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => Promise<void> | void;
}

const roleIcons: Record<OnboardingRole, typeof Building2> = {
  business_owner: Building2,
  customer: Users,
};

const StepProfile = ({ data, onChange, onNext }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const name = firstNameOf(data.fullName) || "there";

  const toggleTag = (tag: string) => {
    onChange({
      tags: data.tags.includes(tag) ? data.tags.filter((t) => t !== tag) : [...data.tags, tag],
    });
  };

  const submit = async () => {
    if (!data.role) {
      setError("Pick the option that describes you best.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-3">
        <TypingText text={`Nice to meet you, ${name}.`} speed={30} />
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="text-muted-foreground mb-8"
      >
        Which best describes you?
      </motion.p>

      <div className="grid grid-cols-2 gap-3 mb-8" role="radiogroup" aria-label="Which best describes you?">
        {ROLE_OPTIONS.map((opt, i) => {
          const Icon = roleIcons[opt.value];
          const selected = data.role === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.35 }}
              onClick={() => {
                setError(null);
                onChange({ role: opt.value });
              }}
              className={`relative text-left rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                selected
                  ? "border-primary bg-primary/5 elevated-shadow"
                  : "border-border bg-card card-shadow hover:border-primary/40"
              }`}
            >
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full gradient-bg flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" aria-hidden="true" />
                </motion.span>
              )}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <p className="font-bold text-foreground text-sm mb-1">{opt.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <p className="text-sm font-semibold text-foreground mb-3 text-left">
          What brings you here? <span className="text-muted-foreground font-normal">(pick any)</span>
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {TAG_OPTIONS.map((tag) => {
            const selected = data.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selected
                    ? "gradient-bg text-primary-foreground border-transparent elevated-shadow"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive font-medium mb-4"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="gradient-bg text-primary-foreground inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all elevated-shadow disabled:opacity-60 disabled:pointer-events-none"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
        Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default StepProfile;