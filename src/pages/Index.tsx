import { Suspense, lazy } from "react";
import SEO from "@/components/SEO";
import { TopNav } from "@/components/qb/TopNav";
import { Hero } from "@/components/qb/Hero";
import { ProblemInfographic } from "@/components/qb/ProblemInfographic";
import { StaffNotes } from "@/components/qb/StaffNotes";
import { ThreeMotions } from "@/components/qb/ThreeMotions";
import { Environments } from "@/components/qb/Environments";
import { ReliefBento } from "@/components/qb/ReliefBento";
import { DashboardPreview } from "@/components/qb/DashboardPreview";
import { BusinessRoiCalculator } from "@/components/business/BusinessRoiCalculator";
import { Pricing } from "@/components/qb/Pricing";
import { LiveQueueDemo } from "@/components/qb/LiveQueueDemo";
import { InterviewFAQ } from "@/components/qb/InterviewFAQ";
import { Signature } from "@/components/qb/Signature";
import DemoVideosSection from "@/components/DemoVideosSection";

const ChaosToClarityExperience = lazy(() => import("@/features/chaosToClarity/ChaosToClarityExperience"));
const IndustryMorphingExperience = lazy(() => import("@/features/industryMorphing/IndustryMorphingExperience"));

const faqs = [
  { q: "Do customers need to download an app?", a: "No. Customers simply scan a QR code or open a link in their browser. No app download, no sign-up required." },
  { q: "Do businesses need any special hardware?", a: "Not at all. Qblink runs entirely on the web — any phone, tablet, or computer with a browser works." },
  { q: "Can customers join the queue remotely?", a: "Yes! Customers can join from anywhere — home, car, or down the street. They just need the link or QR code." },
  { q: "How does the estimated wait time work?", a: "Qblink calculates wait time based on your average service time and the customer's position in the queue. It updates live as the queue moves." },
  { q: "Will customers get notified when their turn is near?", a: "Yes. Customers see live position updates and receive alerts when their turn is approaching, so they don't need to keep checking." },
  { q: "Can businesses manage walk-ins and digital joiners together?", a: "Absolutely. Staff can manually add walk-in customers into the same queue, creating a single unified flow." },
  { q: "Does it support multiple counters?", a: "Yes. You can manage multiple service counters from a single dashboard and route customers accordingly." },
  { q: "Is Qblink free to use?", a: "Yes, during early access. We offer a free pilot so you can test everything. After launch, affordable SaaS plans will be available with a free tier remaining." },
  { q: "Is it easy to set up?", a: "Very. You can create a queue and start serving in under 2 minutes. No complicated onboarding, no training required." },
  { q: "Can it work for small businesses?", a: "Qblink is specifically built for small and medium walk-in businesses — salons, clinics, restaurants, service centers, and more." },
  { q: "Is there an affiliate program?", a: "Yes! You can earn recurring commissions by referring businesses to Qblink. Visit our Affiliate page to sign up and get your referral code." },
  { q: "How do business owners get started?", a: "Sign up for a free account, create your first queue, and share the QR code or link with your customers. That's it — you're live." },
];

const SITE_URL = "https://qblink-real.lovable.app";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Qblink",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-192.png`,
    contactPoint: {
      "@type": "ContactPoint",
      email: "teamqblink@gmail.com",
      telephone: "+91-9372090507",
      contactType: "customer support",
      areaServed: "IN",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Qblink",
    url: SITE_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Qblink",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Customer Flow Intelligence Platform for walk-in businesses. Hardware-free, no app — remote waiting, live flow visibility, analytics, and AI recommendations.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Qblink — Turn Walk-In Chaos Into Controlled Flow"
      description="Qblink is a hardware-free digital queue system. Customers join via QR code, track wait times live, and businesses manage walk-in flow from a simple dashboard."
      path="/"
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <TopNav />
    <main>
      <Hero />
      <ProblemInfographic />
      <div id="simulation" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-cream/40 font-mono-caps text-xs">Loading Customer Flow Simulation...</div>}>
          <ChaosToClarityExperience />
        </Suspense>
      </div>
      <StaffNotes />
      <ThreeMotions />
      <LiveQueueDemo />
      <ReliefBento />
      <DashboardPreview />
      <div id="industries" className="py-12 sm:py-16">
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground text-xs font-mono">Loading Industry Experience...</div>}>
          <IndustryMorphingExperience />
        </Suspense>
      </div>
      <div id="roi" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <BusinessRoiCalculator />
      </div>
      <DemoVideosSection />
      <Pricing />
      <div id="faq">
        <InterviewFAQ />
      </div>
      <Signature />
    </main>
  </div>
);

export default Index;
