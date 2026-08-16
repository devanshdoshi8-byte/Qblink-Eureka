import { Users, Clock, HelpCircle, FileText, AlertTriangle, BarChart3, DollarSign, Eye } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const problems = [
  { icon: Users, text: "Long physical waiting lines that frustrate customers" },
  { icon: AlertTriangle, text: "Customers leave after seeing the crowd" },
  { icon: HelpCircle, text: "Repeated questions at the reception desk" },
  { icon: FileText, text: "Paper tokens and manual tracking chaos" },
  { icon: Clock, text: "Staff overload during peak rush hours" },
  { icon: Eye, text: "No live visibility into queue status" },
  { icon: BarChart3, text: "No useful data on peak times or patterns" },
  { icon: DollarSign, text: "Expensive hardware-based queue systems" },
];

const ProblemSection = () => (
  <section className="section-padding soft-bg">
    <div className="section-container">
      <SectionHeading
        badge="The Problem"
        title="Walk-In Businesses Are Losing Customers Every Day"
        subtitle="Unmanaged queues create chaos, frustration, and revenue loss. Most solutions are expensive, complex, or built for enterprises — not real businesses."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {problems.map((p, i) => (
          <AnimatedSection key={i} delay={i * 0.06}>
            <div className="bg-background rounded-2xl p-5 card-shadow flex items-start gap-4 h-full">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <p.icon className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">{p.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
