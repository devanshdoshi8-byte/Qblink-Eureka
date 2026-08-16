import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Clock, Users, ArrowRight, Sparkles, MapPin } from "lucide-react";
import { IndustryMorphConfig } from "../types";

interface MorphCustomerCardProps {
  industry: IndustryMorphConfig;
}

export const MorphCustomerCard: React.FC<MorphCustomerCardProps> = ({ industry }) => {
  const { customer } = industry;

  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-xl flex flex-col justify-between relative overflow-hidden h-full">
      {/* Decorative Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Customer Perspective</h4>
              <span className="text-[11px] text-muted-foreground">{customer.roleTitle} Mobile Ticket</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            {customer.statusBadge}
          </span>
        </div>

        {/* Digital Ticket Body */}
        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Assigned Token
              </span>
              <span className="text-xs font-semibold text-foreground">{customer.name}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-3xl sm:text-4xl font-black text-primary tracking-tight">
                #{customer.tokenNumber}
              </span>
              <div className="text-right">
                <span className="text-xs font-bold text-foreground block">{customer.peopleAheadText}</span>
                <span className="text-[11px] text-muted-foreground font-mono">{customer.estimatedWaitText}</span>
              </div>
            </div>
          </div>

          {/* Queue & Routing Destination */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate">{customer.queueLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Target: <strong className="text-foreground">{customer.destinationText}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Human Scenario Callout */}
      <div className="mt-6 pt-4 border-t border-border/60">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600 dark:text-emerald-400">
            Real-World Human Benefit:
          </span>
          <p className="mt-0.5 leading-relaxed font-medium">
            "{customer.actionNote}"
          </p>
        </div>
      </div>
    </div>
  );
};
