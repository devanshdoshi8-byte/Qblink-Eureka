import { Headphones, Building2, UserCheck } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const cards = [
  {
    icon: Headphones,
    role: "Receptionists / Front Desk",
    headline: "Fewer interruptions. Calmer front desk.",
    points: [
      "Patients track their queue position themselves instead of repeatedly asking the front desk.",
      "Fewer 'when is my turn?' interruptions during peak OPD hours.",
      "Smoother coordination with less manual queue tracking.",
      "Reception can focus on actual operations instead of crowd control.",
    ],
    emphasis: true,
  },
  {
    icon: Building2,
    role: "Business Owners / Clinics",
    headline: "Smoother walk-in flow, more organized operations.",
    points: [
      "Reduced waiting-area congestion during busy hours.",
      "More organized handling of unpredictable walk-in volume.",
      "Improved operational visibility across the day.",
      "A more professional, consistent customer experience.",
    ],
    emphasis: true,
  },
  {
    icon: UserCheck,
    role: "Customers",
    headline: "Live visibility, less uncertainty.",
    points: [
      "See live queue position and estimated wait time.",
      "Arrive closer to your turn instead of waiting in a crowd.",
      "Less standing around in busy waiting areas.",
    ],
    emphasis: false,
  },
];

const WhoBenefitsFirst = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Who Benefits First"
        title="Why Businesses Actually Use Qblink"
        subtitle="Qblink is not just customer convenience software. It is designed to reduce operational friction in high-volume walk-in environments."
      />
      <div className="grid lg:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <AnimatedSection key={c.role} delay={i * 0.08}>
            <div className={`rounded-2xl p-6 h-full transition-shadow duration-300 ${
              c.emphasis
                ? "bg-card elevated-shadow border border-primary/10"
                : "bg-card card-shadow"
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                c.emphasis ? "gradient-bg" : "bg-primary/10"
              }`}>
                <c.icon className={`w-5 h-5 ${c.emphasis ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">{c.role}</p>
              <h3 className="font-semibold text-foreground mb-3 text-lg leading-snug">{c.headline}</h3>
              <ul className="space-y-2">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default WhoBenefitsFirst;