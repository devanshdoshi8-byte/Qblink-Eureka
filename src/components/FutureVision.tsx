import { Globe, TrendingUp, Users, Layers } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const visions = [
  { icon: Globe, title: "Scalable Across Sectors", desc: "Adaptable across multiple high-footfall walk-in sectors — clinics, diagnostics, salons, cafes, and service businesses." },
  { icon: TrendingUp, title: "Practical Queue-Flow Infrastructure", desc: "Built for real-world environments where walk-in volume is unpredictable and operational friction is the real problem." },
  { icon: Layers, title: "Operational Layer, Not a Marketplace", desc: "Qblink stays focused on queue flow and front-desk relief, with optional discoverability for nearby users." },
  { icon: Users, title: "Future Enhancement Layer", desc: "Wait-time prediction, crowd trend insights, and operational recommendations as a future analytics layer — not the core product." },
];

const FutureVision = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Future Vision"
        title="Where Qblink Is Headed"
        subtitle="A grounded roadmap focused on practical operational improvements for walk-in-heavy businesses."
      />
      <div className="grid sm:grid-cols-2 gap-6">
        {visions.map((v, i) => (
          <AnimatedSection key={v.title} delay={i * 0.08}>
            <div className="bg-card rounded-2xl p-6 card-shadow hover:elevated-shadow transition-shadow duration-300 h-full">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default FutureVision;
