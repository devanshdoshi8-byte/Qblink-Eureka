import { MessageSquareWarning, Users2, TrendingUp, ClipboardList, EyeOff, Workflow, HelpCircle, Shuffle } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const items = [
  { icon: MessageSquareWarning, text: "Repetitive queue-status interruptions at the front desk" },
  { icon: Users2, text: "Overcrowded waiting areas during peak hours" },
  { icon: TrendingUp, text: "Unmanaged peak-hour rush with no visibility" },
  { icon: ClipboardList, text: "Manual queue coordination and paper tokens" },
  { icon: EyeOff, text: "Lack of real-time wait-time visibility for customers" },
  { icon: Workflow, text: "Reception bottlenecks slowing down the whole operation" },
  { icon: HelpCircle, text: "Patient and customer confusion about turn order" },
  { icon: Shuffle, text: "Inconsistent walk-in flow handling across the day" },
];

const OperationalProblems = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Operational Friction"
        title="Operational Problems Qblink Helps Reduce"
        subtitle="Real, daily friction points in high-footfall environments — not abstract pain points."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((it, i) => (
          <AnimatedSection key={i} delay={i * 0.05}>
            <div className="bg-card rounded-2xl p-5 card-shadow flex items-start gap-4 h-full">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <it.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">{it.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default OperationalProblems;