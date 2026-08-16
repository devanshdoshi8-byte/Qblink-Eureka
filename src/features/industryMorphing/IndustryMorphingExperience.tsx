import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Layers, CheckCircle2 } from "lucide-react";
import { MorphIndustryKey } from "./types";
import { MORPH_INDUSTRIES } from "./data/industryMorphData";
import { IndustrySelectorPills } from "./components/IndustrySelectorPills";
import { MorphingVisualStage } from "./components/MorphingVisualStage";

interface IndustryMorphingExperienceProps {
  className?: string;
}

export const IndustryMorphingExperience: React.FC<IndustryMorphingExperienceProps> = ({
  className = "",
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<MorphIndustryKey>("clinic");
  const currentIndustry = MORPH_INDUSTRIES[selectedIndustry];

  return (
    <section id="industries" className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One Platform. Every Queue.</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            From Clinics to Cafes, Salons to Public Services
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Qblink adapts to the way each business manages customer flow while preserving the exact same underlying digital architecture.
          </p>
        </div>

        {/* 4-Industry Selector Pills */}
        <IndustrySelectorPills
          selectedIndustry={selectedIndustry}
          onSelectIndustry={setSelectedIndustry}
        />

        {/* The Morphing Visual Stage */}
        <MorphingVisualStage industry={currentIndustry} />

        {/* Bottom CTA to Pitch Simulator */}
        <div className="p-6 rounded-3xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Same reliable queue infrastructure across every high-footfall industry</span>
          </div>

          <Link
            to="/pitch"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 transition-all text-center"
          >
            <span>See Qblink in Action</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default IndustryMorphingExperience;
