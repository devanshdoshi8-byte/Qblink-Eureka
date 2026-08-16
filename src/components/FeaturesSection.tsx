import { QrCode, MapPin, Clock, Monitor, UserPlus, SkipForward, BarChart3, Building, Wifi, Tv, Palette, Users, Bell, History, WifiOff, Layers } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const features = [
  { icon: QrCode, title: "QR-Based Queue Joining", desc: "Customers scan a QR code at the entrance or open a shared link — no app download needed." },
  { icon: MapPin, title: "Real-Time Queue Position", desc: "Live position updates so customers always know where they stand in the queue." },
  { icon: Clock, title: "Estimated Wait Time", desc: "Automatic wait time calculation that updates as the queue moves forward." },
  { icon: Bell, title: "Turn Notifications", desc: "Customers get alerted when their turn is approaching — no need to keep checking." },
  { icon: Monitor, title: "Multi-Counter Support", desc: "Manage multiple service counters from a single dashboard and route customers accordingly." },
  { icon: UserPlus, title: "Walk-In + Digital Merge", desc: "Add walk-in customers manually into the same queue alongside digital joiners." },
  { icon: SkipForward, title: "Serve / Skip / Recall", desc: "Full control over every visitor — mark served, skip, or recall with one click." },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Track peak hours, average wait times, visitor counts, and queue performance." },
  { icon: History, title: "Queue History & Logs", desc: "Review past queue activity, visitor logs, and trends to plan better." },
  { icon: Building, title: "Multi-Location Ready", desc: "Scale across branches with separate dashboards for each location." },
  { icon: Tv, title: "Optional Public Display", desc: "Show a live 'Now Serving' screen on a tablet or monitor — completely optional." },
  { icon: Palette, title: "Branding & Customization", desc: "Custom queue names, labels, and branding to match your business identity." },
  { icon: Wifi, title: "No Hardware Required", desc: "Runs entirely on the web — any phone, tablet, or computer with a browser works." },
  { icon: Users, title: "Team Access Controls", desc: "Invite staff to help manage queues with appropriate access levels." },
  { icon: WifiOff, title: "Low-Internet Friendly", desc: "Lightweight design works reliably even on slow or unstable connections." },
  { icon: Layers, title: "Multiple Queue Types", desc: "Set up separate queues for different services, departments, or priority levels." },
];

const FeaturesSection = () => (
  <section id="features" className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Features"
        title="Everything You Need to Manage Walk-In Flow"
        subtitle="Designed for minimal staff interaction, simple queue progression, low training requirement, and minimal manual updates — so adoption is effortless."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <AnimatedSection key={f.title} delay={i * 0.04}>
            <div className="bg-card rounded-2xl p-5 card-shadow hover:elevated-shadow transition-shadow duration-300 h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;