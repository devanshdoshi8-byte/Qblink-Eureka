import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

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

const FAQSection = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="FAQ"
        title="Frequently Asked Questions"
        subtitle="Quick answers to common questions about Qblink."
      />
      <AnimatedSection>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl card-shadow border-none px-6">
                <AccordionTrigger className="text-foreground font-medium text-left hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default FAQSection;