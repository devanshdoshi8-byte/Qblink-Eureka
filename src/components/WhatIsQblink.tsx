import { QrCode, MapPin, Clock, Bell, LayoutDashboard, Wifi, Zap, WifiOff } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const items = [
  { icon: QrCode, title: "Join via QR or Link", desc: "Customers scan a code or open a link to join the queue instantly — no app needed." },
  { icon: MapPin, title: "Live Queue Position", desc: "See your real-time position in the queue — no need to ask or guess." },
  { icon: Clock, title: "Estimated Wait Time", desc: "Know exactly how long the wait is, updated live as the queue moves." },
  { icon: Bell, title: "Turn Notifications", desc: "Get notified when your turn is approaching — no need to keep checking the screen." },
  { icon: LayoutDashboard, title: "Simple Dashboard", desc: "Businesses manage the entire queue from one clean interface with full control." },
  { icon: Wifi, title: "No Hardware Required", desc: "Works on any device with a browser. No kiosks, no ticket printers, no setup cost." },
  { icon: Zap, title: "Setup in Minutes", desc: "Create a queue, share the link, and start serving — no complicated onboarding." },
  { icon: WifiOff, title: "Works on Slow Internet", desc: "Lightweight design runs smoothly even on unstable or low-bandwidth connections." },
];

const WhatIsQblink = () => (
  <section id="what-is-qblink" className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="What is Qblink"
        title="A Smarter Way to Handle Walk-Ins"
        subtitle="Qblink replaces physical queues with a digital flow system. Customers join remotely, track their position live, and get notified when their turn is near — while businesses stay in full control from one dashboard."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <AnimatedSection key={item.title} delay={i * 0.06}>
            <div className="bg-card rounded-2xl p-6 card-shadow hover:elevated-shadow transition-shadow duration-300 h-full">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default WhatIsQblink;