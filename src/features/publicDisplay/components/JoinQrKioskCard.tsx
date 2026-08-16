import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { publicUrl } from "@/lib/publicUrl";
import { Smartphone, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface JoinQrKioskCardProps {
  queueId: string;
  queueName: string;
}

export const JoinQrKioskCard: React.FC<JoinQrKioskCardProps> = ({ queueId, queueName }) => {
  const joinUrl = publicUrl(`/join/${queueId}`);

  return (
    <div className="w-full p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl flex flex-col sm:flex-row items-center gap-6 justify-between relative overflow-hidden">
      {/* Visual QR Code Container with High Contrast Quiet Zone */}
      <div className="flex items-center gap-6">
        <div className="p-3.5 bg-white rounded-2xl shadow-md shrink-0 border border-slate-200">
          <QRCodeSVG
            value={joinUrl}
            size={130}
            level="H"
            includeMargin={false}
            className="w-28 h-28 sm:w-32 sm:h-32"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Scan with Phone Camera</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Scan to Join the Line
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
            No app download required. Get your digital pass and wait comfortably anywhere.
          </p>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="hidden lg:flex flex-col gap-2 shrink-0 text-xs text-muted-foreground border-l border-border/80 pl-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Live wait countdown on phone</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Turn alert before your number</span>
        </div>
      </div>
    </div>
  );
};
