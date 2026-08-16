import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote } from "lucide-react";

/**
 * Community Voices — reusable carousel placeholder.
 *
 * IMPORTANT: This component intentionally ships with NO real testimonials.
 * The strings below are generic placeholder patterns ("Many customers
 * mention…") — NOT fabricated reviews. Real, verified voices will be
 * supplied later by administrators and slotted into the `voices` prop.
 */
export interface CommunityVoice {
  /** Short pattern description, e.g. "Many customers mention uncertainty." */
  text: string;
  /** Optional source label, e.g. "Verified customer" — leave empty for placeholders. */
  source?: string;
}

interface Props {
  voices?: CommunityVoice[];
  audience: "customer" | "business_owner";
  className?: string;
}

const PLACEHOLDERS: Record<"customer" | "business_owner", CommunityVoice[]> = {
  customer: [
    { text: "Many customers mention uncertainty more than the wait itself." },
    { text: "Many people describe checking the line over and over." },
    { text: "Many visitors say not knowing what's next is the hardest part." },
  ],
  business_owner: [
    { text: "Many businesses mention staff interruptions as a daily struggle." },
    { text: "Many owners describe complaints that trace back to the wait." },
    { text: "Many teams notice silent walk-outs they never saw coming." },
  ],
};

const CommunityVoices = ({ voices, audience, className = "" }: Props) => {
  const list = voices && voices.length > 0 ? voices : PLACEHOLDERS[audience];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 4200);
    return () => clearInterval(t);
  }, [list.length]);

  const current = list[idx];

  return (
    <div className={`relative rounded-2xl border border-border bg-card/80 backdrop-blur card-shadow p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Quote className="w-4 h-4" aria-hidden="true" />
        </span>
        <div className="flex-1 min-h-[3.25rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-sm text-foreground font-medium leading-relaxed"
            >
              {current.text}
            </motion.p>
          </AnimatePresence>
          {current.source && (
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2 font-semibold">
              {current.source}
            </p>
          )}
        </div>
      </div>

      {list.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4" aria-hidden="true">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityVoices;