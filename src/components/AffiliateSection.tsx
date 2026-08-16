import { Handshake, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const perks = [
  { icon: Handshake, title: "Who Can Join", desc: "Consultants, sales partners, agencies, local business connectors, and anyone with B2B reach." },
  { icon: TrendingUp, title: "Simple Commissions", desc: "Earn a recurring commission for every business you refer that becomes a paying customer." },
  { icon: BarChart3, title: "Referral Tracking", desc: "Get a unique referral link and dashboard to track your leads, conversions, and earnings." },
  { icon: Wallet, title: "Monthly Payouts", desc: "Transparent payout schedule. No hidden terms, no minimum thresholds to start." },
];

const AffiliateSection = () => (
  <section id="affiliate" className="section-padding soft-bg">
    <div className="section-container">
      <SectionHeading
        badge="Affiliate Program"
        title="Earn by Helping Businesses Modernize Their Queue Flow"
        subtitle="Join our partner network and earn recurring commissions for every successful referral."
      />
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {perks.map((p, i) => (
          <AnimatedSection key={p.title} delay={i * 0.1}>
            <div className="bg-background rounded-2xl p-6 card-shadow h-full">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
      <AnimatedSection className="text-center">
        <Link to="/affiliate" className="gradient-bg text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity elevated-shadow inline-block">
          Join Affiliate Program
        </Link>
      </AnimatedSection>
    </div>
  </section>
);

export default AffiliateSection;
