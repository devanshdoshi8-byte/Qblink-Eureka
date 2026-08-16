import { motion } from "framer-motion";
import { Smartphone, Zap, CreditCard, Users, Play } from "lucide-react";
import { Link } from "react-router-dom";
import phoneMockup from "@/assets/phone-mockup.png";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import { trackEvent } from "@/lib/analytics";

const trustPoints = [
  { icon: Zap, text: "No hardware required" },
  { icon: Smartphone, text: "Works on any phone" },
  { icon: CreditCard, text: "Setup in minutes" },
  { icon: Users, text: "Minimal staff interaction" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-16 overflow-hidden w-full max-w-full">
    <div className="absolute inset-0 soft-bg opacity-60" />
    <div className="section-container section-padding relative z-10 w-full max-w-full">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="min-w-0"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">
            Now in Early Access
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-6">
            Reduce Walk-In Chaos Without{" "}
            <span className="gradient-text">Changing How Your Business Operates</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Qblink is a Customer Flow Intelligence Platform — reduce crowding,
            uncertainty, and reception interruptions with remote waiting, live
            customer flow, analytics, and AI recommendations. No app. No hardware.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <Link
              to="/auth"
              onClick={() => trackEvent("cta_click", { cta: "start_free", location: "hero" })}
              className="border border-primary/30 bg-card text-primary px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-primary/10 transition-colors card-shadow"
            >
              Start Free
            </Link>
            <Link
              to="/onboarding"
              onClick={() => trackEvent("cta_click", { cta: "see_demo", location: "hero" })}
              className="cta-glow gradient-bg text-primary-foreground inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 hover:opacity-95 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              See Demo
            </Link>
            <a
              href="#contact"
              onClick={() => trackEvent("cta_click", { cta: "book_a_demo", location: "hero" })}
              className="border border-primary/30 bg-primary/5 text-primary px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Book a Demo
            </a>
          </div>
          <div className="flex flex-wrap gap-6">
            {trustPoints.map((tp) => (
              <div key={tp.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <tp.icon className="w-4 h-4 text-primary" />
                <span>{tp.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex flex-col items-center justify-center min-w-0 w-full"
        >
          <div className="relative w-full max-w-lg mx-auto">
            <img
              src={dashboardMockup}
              alt="Qblink business dashboard"
              className="w-full rounded-2xl elevated-shadow"
              width={900}
              height={600}
              {...({ fetchpriority: "high" } as any)}
              decoding="async"
            />
            <motion.img
              src={phoneMockup}
              alt="Qblink customer queue screen"
              className="absolute -bottom-6 left-2 sm:-bottom-8 sm:-left-8 w-32 sm:w-48 rounded-2xl elevated-shadow"
              width={512}
              height={800}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="mt-10 text-xs text-muted-foreground text-center max-w-sm">
            Designed primarily for walk-in-heavy environments with unpredictable customer flow.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
