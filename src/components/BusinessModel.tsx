import { Rocket, CreditCard, BarChart3, Building, Users, Megaphone } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const tiers = [
  { icon: Rocket, title: "Free Pilot", desc: "Early access with full features during the pilot phase. No strings attached." },
  { icon: CreditCard, title: "Monthly SaaS Plans", desc: "Affordable plans for growing businesses once the product launches publicly." },
  { icon: BarChart3, title: "Pro Plan", desc: "Advanced analytics, priority support, and custom controls for serious operations." },
  { icon: Building, title: "Enterprise", desc: "Multi-location support, API access, and dedicated onboarding for chains." },
  { icon: Users, title: "Affiliate Program", desc: "Earn commissions by referring businesses to Qblink. Simple and transparent." },
  { icon: Megaphone, title: "Optional Ads (Free Tier)", desc: "Non-intrusive ads only on the free customer view — kept secondary and tasteful." },
];

const BusinessModel = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Business Model"
        title="A Practical, Grounded Revenue Path"
        subtitle="Built to grow sustainably across walk-in sectors — from free pilots to multi-location operations."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <AnimatedSection key={t.title} delay={i * 0.08}>
            <div className="bg-card rounded-2xl p-6 card-shadow h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default BusinessModel;
