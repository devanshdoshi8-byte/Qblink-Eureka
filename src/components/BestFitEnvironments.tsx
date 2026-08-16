import { Stethoscope, Activity, FlaskConical, Scissors, Coffee, Store } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const fits = [
  { icon: Stethoscope, title: "Multi-doctor OPDs", desc: "High walk-in volume with repetitive 'when is my turn?' questions and unpredictable consultation times." },
  { icon: Activity, title: "Diagnostics Centers", desc: "Overlapping sample, report, and consultation steps creating crowd buildup at reception." },
  { icon: FlaskConical, title: "Labs", desc: "Walk-in samples mixed with scheduled tests — bottlenecks form fast at peak hours." },
  { icon: Scissors, title: "Salons", desc: "Walk-ins overlap with appointments, creating unpredictable waiting flow inside the shop." },
  { icon: Coffee, title: "Cafes With Waiting Queues", desc: "Rush-hour entrance crowding and walk-aways before customers even get a table." },
  { icon: Store, title: "Walk-in-Heavy Service Businesses", desc: "Inconsistent customer flow that overloads staff and creates uneven experience." },
];

const BestFitEnvironments = () => (
  <section id="best-fit" className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Best Fit Environments"
        title="Where Qblink Works Best"
        subtitle="Qblink is designed for high-footfall walk-in environments where queue uncertainty and front-desk interruptions create operational friction."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fits.map((f, i) => (
          <AnimatedSection key={f.title} delay={i * 0.06}>
            <div className="bg-card rounded-2xl p-6 card-shadow hover:elevated-shadow transition-shadow duration-300 h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
      <AnimatedSection delay={0.2}>
        <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto mt-10">
          Qblink is intentionally not built for every business. It works best where walk-in volume,
          repetitive queue questions, and unpredictable waiting flow are real daily problems.
        </p>
      </AnimatedSection>
    </div>
  </section>
);

export default BestFitEnvironments;