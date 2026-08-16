import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Stethoscope, Scissors, FlaskConical, Activity, Store } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const sectors = [
  {
    icon: Stethoscope, label: "Multi-Doctor Clinics",
    problem: "Crowded waiting areas and repeated 'when is my turn?' questions disrupt the front desk during peak OPD hours.",
    solution: "Patients track their queue position themselves and arrive closer to their turn. Qblink does not replace appointment systems — it is designed primarily for unpredictable walk-in flow around trusted, high-demand doctors.",
    advantages: ["Fewer reception interruptions", "Less waiting-room congestion", "Smoother OPD flow without changing operations"]
  },
  {
    icon: Activity, label: "Diagnostics Centers",
    problem: "Sample collection, reporting, and consultation steps create overlapping queues and confused patients.",
    solution: "Each step gets clear queue visibility so patients know exactly where they stand without crowding the reception.",
    advantages: ["Organized multi-step flow", "Reduced front-desk load", "Better patient experience"]
  },
  {
    icon: FlaskConical, label: "Labs",
    problem: "Walk-in samples and pre-booked tests pile up unpredictably, creating bottlenecks at collection.",
    solution: "A single live queue handles walk-ins and scheduled visits with minimal manual coordination.",
    advantages: ["Predictable collection flow", "Less manual queue tracking", "Calmer waiting area"]
  },
  {
    icon: Scissors, label: "Salons & Grooming",
    problem: "Walk-ins overlap with appointments and clients linger inside, creating crowding and confusion.",
    solution: "Clients join the queue from their phone and arrive when their turn is close — stylists manage flow from one screen.",
    advantages: ["Handle walk-ins alongside appointments", "Cleaner waiting experience", "Low-effort queue updates"]
  },
  {
    icon: UtensilsCrossed, label: "Cafes & Restaurants",
    problem: "Rush-hour table waits and crowd buildup at the entrance push customers away before they sit down.",
    solution: "Diners join a remote waitlist, see live wait times, and walk in when a table is nearly ready.",
    advantages: ["Reduce walk-away during peak hours", "Better table turnover", "Less crowd at the door"]
  },
  {
    icon: Store, label: "High-Footfall Service Businesses",
    problem: "Unpredictable walk-in volume overloads staff and creates inconsistent customer experience.",
    solution: "A simple live queue absorbs walk-in spikes with minimal staff effort and clear customer visibility.",
    advantages: ["Smoother peak-hour handling", "Lower coordination overhead", "Consistent walk-in experience"]
  },
];

const IndustrySection = () => {
  const [active, setActive] = useState(0);
  const s = sectors[active];

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => (prev + 1) % sectors.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => (prev - 1 + sectors.length) % sectors.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(sectors.length - 1);
    }
  }, []);

  return (
    <section id="industries" className="section-padding soft-bg">
      <div className="section-container">
        <SectionHeading
          badge="Industries"
          title="Built for Businesses That Serve Walk-Ins"
          subtitle="Every walk-in business faces queue chaos. Qblink adapts to each sector's unique challenges."
        />

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <AnimatedSection className="min-w-0">
            <div
              role="tablist"
              aria-label="Industries"
              onKeyDown={handleKeyDown}
              className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-thin"
              style={{ touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" }}
            >
              {sectors.map((sec, i) => (
                <button
                  key={sec.label}
                  role="tab"
                  aria-selected={i === active}
                  aria-controls={`industry-panel-${i}`}
                  id={`industry-tab-${i}`}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    i === active
                      ? "gradient-bg text-primary-foreground elevated-shadow"
                      : "bg-background text-muted-foreground hover:bg-muted card-shadow"
                  }`}
                >
                  <sec.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {sec.label}
                </button>
              ))}
            </div>
          </AnimatedSection>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              role="tabpanel"
              id={`industry-panel-${active}`}
              aria-labelledby={`industry-tab-${active}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-background rounded-2xl p-6 md:p-8 card-shadow min-w-0 break-words"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center" aria-hidden="true">
                  <s.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{s.label}</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-1.5">The Problem</h4>
                  <p className="text-muted-foreground leading-relaxed">{s.problem}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-1.5">How Qblink Helps</h4>
                  <p className="text-muted-foreground leading-relaxed">{s.solution}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-accent mb-2">Key Advantages</h4>
                  <ul className="space-y-2">
                    {s.advantages.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full gradient-bg flex-shrink-0 mt-1.5" aria-hidden="true" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default IndustrySection;
