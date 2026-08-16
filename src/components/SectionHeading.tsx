import AnimatedSection from "./AnimatedSection";

interface Props {
  badge?: string;
  title: string;
  subtitle?: string;
}

const SectionHeading = ({ badge, title, subtitle }: Props) => (
  <AnimatedSection className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
    {badge && (
      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase gradient-bg text-primary-foreground mb-4">
        {badge}
      </span>
    )}
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">{title}</h2>
    {subtitle && <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}
  </AnimatedSection>
);

export default SectionHeading;
