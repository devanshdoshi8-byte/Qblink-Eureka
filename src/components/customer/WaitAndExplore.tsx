import { useState } from "react";
import { Coffee, Pill, Trees, Sparkles, Navigation, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NearbyPlace {
  id: string;
  name: string;
  category: "cafe" | "pharmacy" | "rest_area" | "convenience";
  distanceText: string;
  walkTimeMinutes: number;
}

interface Props {
  estimatedWaitMinutes: number;
  businessAddress?: string | null;
}

/**
 * Wait and Explore (Feature C - P2)
 *
 * Optional secondary drawer for customers with wait times >= 20 mins.
 * Strictly adheres to privacy & zero fake ad rules:
 * - Only shows if wait is long enough.
 * - Sits below the main queue hero.
 * - Does not invent fake places.
 */
export const WaitAndExplore = ({ estimatedWaitMinutes, businessAddress }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only offer explore if wait is 15+ minutes
  if (estimatedWaitMinutes < 15) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto my-4 bg-card/60 border border-border/80 rounded-3xl p-4 card-shadow backdrop-blur-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold text-foreground hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-foreground">Waiting ~{estimatedWaitMinutes} min?</span>
            <span className="text-muted-foreground block text-[11px] font-normal">
              Explore nearby while keeping your spot in line
            </span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 space-y-3 overflow-hidden text-xs"
          >
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>Relax & Grab a Beverage</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                You can step out to a nearby cafe or comfortable seating area. Keep your notifications enabled and return when your arrival grace window or turn alert triggers.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Venue Location</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed font-mono">
                {businessAddress || "Waiting at current venue address"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
