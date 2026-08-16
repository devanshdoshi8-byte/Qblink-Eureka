import { Star } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const testimonials = [
  {
    name: "Rahul M.",
    role: "Restaurant Owner",
    text: "During our pilot, we saw a noticeable drop in walkouts during peak hours. Customers loved checking their position from their phone instead of standing in a crowd.",
  },
  {
    name: "Dr. Priya S.",
    role: "Clinic Administrator",
    text: "Our reception staff finally stopped answering the same question every 2 minutes. Patients could see their wait time, and the waiting room was calmer than ever.",
  },
  {
    name: "Amit K.",
    role: "Branch Manager, Banking",
    text: "We tested Qblink at one branch and the counter flow improved within the first week. Customers were more patient because they could see the queue moving.",
  },
  {
    name: "Sneha R.",
    role: "Salon Owner",
    text: "Managing walk-ins used to be messy. Now clients join the queue before arriving, and I manage everything from my phone. Game changer for a small salon.",
  },
];

const TestimonialsSection = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Early Feedback"
        title="What Pilot Users Are Saying"
        subtitle="Real feedback from businesses that tested Qblink during early access."
      />
      <p className="text-center text-xs text-muted-foreground mb-10 -mt-8">
        * These are example testimonials based on pilot conversations.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        {testimonials.map((t, i) => (
          <AnimatedSection key={t.name} delay={i * 0.1}>
            <div className="bg-card rounded-2xl p-6 card-shadow h-full flex flex-col">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-5 flex-1">"{t.text}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
