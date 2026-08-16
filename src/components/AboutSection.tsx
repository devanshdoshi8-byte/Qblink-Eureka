import { Target, Users, Rocket, User } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const AboutSection = () => (
  <section id="about" className="section-padding soft-bg">
    <div className="section-container">
      <SectionHeading
        badge="About Us"
        title="The Story Behind Qblink"
      />

      <AnimatedSection>
        <div className="bg-background rounded-2xl p-8 md:p-10 card-shadow max-w-3xl mx-auto">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Qblink started from a simple frustration — watching people stand in long, disorganized queues
              at clinics, banks, and restaurants while holding their phones with nothing useful on screen.
            </p>

            {/* Founder */}
            <div className="flex items-start gap-5 bg-muted/50 rounded-xl p-6">
              <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-lg mb-1">Devansh Doshi</h4>
                <p className="text-sm font-medium text-primary mb-2">Founder & Builder</p>
                <p className="text-sm leading-relaxed">
                  A young entrepreneur solving real-world inefficiencies with technology. Driven by
                  a strong execution mindset and the belief that waiting in lines is a problem that
                  shouldn't exist in a smartphone-first world.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 pt-2">
              <div className="text-center">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Mission</h4>
                <p className="text-xs">Make waiting smarter and less chaotic for everyone.</p>
              </div>
              <div className="text-center">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Vision</h4>
                <p className="text-xs">Build a scalable SaaS platform for walk-in businesses worldwide.</p>
              </div>
              <div className="text-center">
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Team</h4>
                <p className="text-xs">A focused crew of builders shipping fast and iterating constantly.</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default AboutSection;
