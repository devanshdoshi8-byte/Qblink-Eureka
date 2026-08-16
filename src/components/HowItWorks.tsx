import { QrCode, ListOrdered, Clock, Bell, LayoutDashboard, UserPlus, Monitor, BarChart3 } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const customerSteps = [
  { icon: QrCode, title: "Scan QR or Open Link", desc: "No app download needed." },
  { icon: ListOrdered, title: "Join the Queue", desc: "Enter your name and you're in." },
  { icon: Clock, title: "Track Wait Time", desc: "See your live position and ETA." },
  { icon: Bell, title: "Get Notified", desc: "Alerted when your turn is near." },
];

const businessSteps = [
  { icon: LayoutDashboard, title: "Open Dashboard", desc: "Access your live queue control panel." },
  { icon: Monitor, title: "Monitor Live Queue", desc: "See current position, waits, and load at a glance." },
  { icon: ListOrdered, title: "Progress With One Tap", desc: "Call next, skip, or recall — minimal manual updates." },
  { icon: UserPlus, title: "Merge Walk-Ins + Digital", desc: "Add walk-ins into the same queue alongside QR joiners." },
  { icon: Bell, title: "Reduce Interruptions", desc: "Customers self-track, so the front desk is freed up." },
  { icon: BarChart3, title: "Maintain Smoother Flow", desc: "Steady walk-in handling with low training overhead." },
];

const StepCard = ({ step, index, delay }: { step: typeof customerSteps[0]; index: number; delay: number }) => (
  <AnimatedSection delay={delay} className="flex flex-col items-center text-center">
    <div className="relative mb-4">
      <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
        <step.icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
    </div>
    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
    <p className="text-sm text-muted-foreground">{step.desc}</p>
  </AnimatedSection>
);

const HowItWorks = () => (
  <section id="how-it-works" className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="How It Works"
        title="Simple for Everyone"
        subtitle="Whether you're a customer waiting or a business managing — Qblink keeps it effortless."
      />

      <div className="mb-16">
        <AnimatedSection>
          <h3 className="text-xl font-bold text-foreground text-center mb-8">For Customers</h3>
        </AnimatedSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {customerSteps.map((s, i) => (
            <StepCard key={s.title} step={s} index={i} delay={i * 0.1} />
          ))}
        </div>
      </div>

      <div>
        <AnimatedSection>
          <h3 className="text-xl font-bold text-foreground text-center mb-8">For Businesses</h3>
        </AnimatedSection>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
          {businessSteps.map((s, i) => (
            <StepCard key={s.title} step={s} index={i} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
