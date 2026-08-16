import React from "react";
import { motion } from "framer-motion";
import { MorphIndustryKey } from "../types";
import { MORPH_INDUSTRIES } from "../data/industryMorphData";

interface IndustrySelectorPillsProps {
  selectedIndustry: MorphIndustryKey;
  onSelectIndustry: (key: MorphIndustryKey) => void;
}

export const IndustrySelectorPills: React.FC<IndustrySelectorPillsProps> = ({
  selectedIndustry,
  onSelectIndustry,
}) => {
  const industries = Object.values(MORPH_INDUSTRIES);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % industries.length;
      onSelectIndustry(industries[nextIndex].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + industries.length) % industries.length;
      onSelectIndustry(industries[prevIndex].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Industry Presets"
      className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/80 max-w-2xl mx-auto backdrop-blur-md overflow-x-auto"
    >
      {industries.map((ind, index) => {
        const isSelected = selectedIndustry === ind.id;
        return (
          <button
            key={ind.id}
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelectIndustry(ind.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="activeIndustryMorphPill"
                className="absolute inset-0 bg-background shadow-sm border border-border rounded-xl -z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="text-base relative z-10">{ind.icon}</span>
            <span className="relative z-10">{ind.label}</span>
          </button>
        );
      })}
    </div>
  );
};
