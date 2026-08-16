import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const qa = [
  { q: "Do customers need to download an app?", a: "No. They scan a QR code or open a link. Whatever browser is already on their phone is enough." },
  { q: "Do businesses need any special hardware?", a: "None. Qblink runs entirely in the browser — any phone, tablet, or laptop works." },
  { q: "Can customers join the queue remotely?", a: "Yes. From home, from the car, from down the street. They just need the link." },
  { q: "How does the wait estimate work?", a: "It's calculated from your average service time and their position, and it updates live as the queue moves." },
  { q: "Are walk-ins and digital joiners handled together?", a: "Yes. Staff can add walk-ins into the same queue — one honest flow, no favouritism." },
  { q: "Does it support multiple counters?", a: "Yes. Route customers across counters from a single dashboard." },
  { q: "Is Qblink free to use?", a: "During early access, yes — a full free pilot. After launch, affordable plans with a permanent free tier." },
  { q: "How fast is setup?", a: "Under two minutes from account to first queue. No training, no onboarding call required." },
];

export const InterviewFAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative deep-surface py-24 sm:py-32" aria-label="Interview">
      <div className="max-w-5xl mx-auto px-6 lg:px-24">
        <div className="font-mono-caps text-glow/80 mb-4">Ch. 09 · Transcript</div>
        <h2 className="font-display text-4xl sm:text-5xl text-cream leading-tight max-w-2xl">
          Interview with the product, edited for length.
        </h2>

        <div className="mt-16 space-y-8">
          {qa.map((row, i) => (
            <div key={i} className="border-b border-glow/15 pb-8">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-6 items-baseline"
                aria-expanded={open === i}
              >
                <span className="font-mono-caps text-glow/70">Q · 0{i + 1}</span>
                <span className="font-display text-xl sm:text-2xl text-cream leading-snug italic">
                  {row.q}
                </span>
                <span className="font-mono-caps text-glow/60">
                  {open === i ? "–" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key={`answer-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] gap-6 mt-6">
                      <span className="font-mono-caps text-cream/40">A ·</span>
                      <p className="text-cream/75 leading-relaxed text-lg">{row.a}</p>
                      <span />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};