import { Check, X } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const comparisons = [
  { feature: "Hardware needed", traditional: true, qblink: false },
  { feature: "App download required", traditional: true, qblink: false },
  { feature: "Remote queue joining", traditional: false, qblink: true },
  { feature: "Live position tracking", traditional: false, qblink: true },
  { feature: "Real-time wait time", traditional: false, qblink: true },
  { feature: "Walk-in + digital merge", traditional: false, qblink: true },
  { feature: "Setup in minutes", traditional: false, qblink: true },
  { feature: "Works on any device", traditional: false, qblink: true },
  { feature: "Built-in analytics", traditional: false, qblink: true },
  { feature: "Affordable for small businesses", traditional: false, qblink: true },
];

const WhyDifferent = () => (
  <section className="section-padding soft-bg">
    <div className="section-container">
      <SectionHeading
        badge="Why Qblink"
        title="Not Just Another Queue App"
        subtitle="See how Qblink compares to traditional customer flow setups — hardware kiosks, paper tokens, and manual tracking."
      />
      <AnimatedSection>
        <div className="bg-background rounded-2xl card-shadow max-w-3xl mx-auto overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] px-6 py-4 border-b border-border bg-muted/40">
            <span className="text-sm font-semibold text-foreground">Feature</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Traditional</span>
            <span className="text-xs font-semibold text-primary text-center">Qblink</span>
          </div>
          {/* Rows */}
          {comparisons.map((c, i) => (
            <div
              key={c.feature}
              className={`grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] px-6 py-3.5 items-center ${
                i < comparisons.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <span className="text-sm text-foreground">{c.feature}</span>
              <div className="flex justify-center">
                {c.traditional ? (
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                {c.qblink ? (
                  <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-success" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-success" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default WhyDifferent;