import { Activity, Clock, CalendarRange } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const bars = [
  { h: 30, label: "9a", level: "low" },
  { h: 45, label: "10a", level: "low" },
  { h: 70, label: "11a", level: "mod" },
  { h: 95, label: "12p", level: "high" },
  { h: 80, label: "1p", level: "high" },
  { h: 55, label: "2p", level: "mod" },
  { h: 40, label: "3p", level: "low" },
  { h: 65, label: "4p", level: "mod" },
  { h: 90, label: "5p", level: "high" },
  { h: 75, label: "6p", level: "high" },
  { h: 50, label: "7p", level: "mod" },
  { h: 35, label: "8p", level: "low" },
];

const levelColor: Record<string, string> = {
  low: "bg-success/70",
  mod: "bg-warning/80",
  high: "bg-danger/70",
};

const CrowdVisibility = () => (
  <section className="section-padding soft-bg">
    <div className="section-container">
      <SectionHeading
        badge="Crowd Visibility"
        title="Know Before You Walk In"
        subtitle="A lightweight busyness indicator that helps customers pick a better time and helps businesses anticipate the rush."
      />
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-stretch">
        <AnimatedSection>
          <div className="bg-background rounded-2xl p-6 card-shadow h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Live Busyness</p>
                <p className="text-xs text-muted-foreground">Updated in real time</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-soft text-warning text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Moderate
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-32 mb-2">
              {bars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className={`w-full rounded-t-md ${levelColor[b.level]} transition-all`}
                    style={{ height: `${b.h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {bars.map((b) => <span key={b.label}>{b.label}</span>)}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success/70" /> Low</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning/80" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger/70" /> Crowded</span>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid gap-5">
          <AnimatedSection delay={0.08}>
            <div className="bg-background rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Best Time to Visit</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Customers see a clear suggestion of quieter windows so they can avoid the busiest hours
                and reduce physical waiting.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.16}>
            <div className="bg-background rounded-2xl p-6 card-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarRange className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Predicted Busy Periods</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Businesses get a simple view of likely peak periods based on past walk-in patterns —
                useful for staffing and planning, without overcomplicating the dashboard.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  </section>
);

export default CrowdVisibility;