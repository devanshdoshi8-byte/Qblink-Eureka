import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { ChaosToClarityExperience } from "@/features/chaosToClarity/ChaosToClarityExperience";

export const ChaosToClarityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-white">
      <SEO
        title="From Waiting Chaos to Customer Flow — Qblink Simulation"
        description="Experience the interactive transformation from physical waiting room chaos to calm, synchronized digital customer flow with Qblink."
        path="/chaos-to-clarity"
      />

      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl px-5 sm:px-8 py-3.5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border bg-card transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Qblink</span>
            </Link>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <img src={logo} alt="Qblink" className="w-6 h-6 object-contain" />
              <span className="font-display font-extrabold text-sm tracking-tight">
                Chaos to Clarity Experience
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pitch"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs transition-opacity hidden sm:flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Pitch Simulator</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1 w-full flex flex-col justify-center">
        <ChaosToClarityExperience />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 px-5 sm:px-8 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Qblink. Interactive Customer Flow Simulation.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pitch" className="hover:text-foreground">Dual-Device Simulator</Link>
            <Link to="/roi" className="hover:text-foreground">ROI Calculator</Link>
            <Link to="/auth" className="hover:text-foreground">Start Free Pilot</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChaosToClarityPage;
