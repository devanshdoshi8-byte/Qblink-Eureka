import { useState } from "react";
import { Lock, ShieldCheck, Radio, Building2 } from "lucide-react";
import { trackTrustModalOpen } from "@/lib/trustAnalytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const indicators = [
  {
    Icon: Lock,
    title: "Secure Sign In",
    desc: "Your account is protected with secure authentication.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by Design",
    desc: "Your personal information is never sold to third parties.",
  },
  {
    Icon: Radio,
    title: "Encrypted Connection",
    desc: "Your queue activity is transmitted securely.",
  },
  {
    Icon: Building2,
    title: "Business Controlled Access",
    desc: "Only the business managing your queue can access queue-related information.",
  },
];

const TrustPrivacyCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label="Trust and privacy"
      className="mt-4 bg-card rounded-2xl p-4 sm:p-5 card-shadow border border-info/30 dark:border-primary/25"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Trust & Privacy
        </h3>
        <span className="text-[10px] font-medium text-primary bg-info-soft dark:bg-primary/15 px-2 py-0.5 rounded-full">
          Protected
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {indicators.map(({ Icon, title, desc }, i) => (
          <li
            key={title}
            className="flex items-start gap-2.5 rounded-xl bg-info-soft/60 dark:bg-[hsl(215_45%_18%)] dark:border dark:border-primary/20 p-2.5 text-left"
          >
            <span
              className="shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-primary/20 flex items-center justify-center text-primary shadow-sm animate-trust-pulse"
              style={{ animationDelay: `${i * 0.6}s` }}
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed text-center">
        Your queue updates are live and your information stays protected throughout your experience.
      </p>

      <div className="mt-2 text-center">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) void trackTrustModalOpen("join_queue");
          }}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
            >
              Learn More →
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">

                <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                How Qblink Protects You
              </DialogTitle>
              <DialogDescription>
                A simple summary of how we handle your information while you use Qblink.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2.5 text-sm text-foreground mt-2">
              <li className="flex gap-2"><span className="text-primary">•</span> We only collect information required to provide queue services.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Businesses can only access queue information relevant to their own customers.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Your data is handled securely.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> We do not sell your personal information.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Qblink is committed to protecting customer privacy.</li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default TrustPrivacyCard;