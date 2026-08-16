import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Copy, Check, MessageSquare, Heart, HandHelping, ExternalLink, UserCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { hapticCopy } from "@/lib/haptics";

const FounderContact = () => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBizEmail, setCopiedBizEmail] = useState(false);

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      hapticCopy();
      setter(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setter(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const ctas = [
    {
      label: "Share Feedback",
      icon: MessageSquare,
      href: "mailto:qblink2025@gmail.com?subject=Qblink%20Feedback&body=Hi%20Devansh,%0A%0AI%20have%20some%20feedback%20about%20Qblink:%0A%0A",
    },
    {
      label: "Recommend a Business",
      icon: HandHelping,
      href: "mailto:qblink2025@gmail.com?subject=Business%20Recommendation&body=Hi%20Devansh,%0A%0AI'd%20like%20to%20recommend%20this%20business%20for%20Qblink:%0A%0ABusiness%20Name:%0ALocation:%0AContact:%0A",
    },
    {
      label: "Contact Founder",
      icon: Send,
      href: "mailto:devanshdoshi8@gmail.com?subject=Qblink%20-%20Connect",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="bg-card rounded-2xl card-shadow border border-border/60 overflow-hidden">
        {/* Top gradient accent */}
        <div className="h-1.5 gradient-bg w-full" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-sm">
              <UserCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight">
                Connect with the Founder
              </h3>
              <p className="text-xs text-muted-foreground">
                Your feedback shapes Qblink
              </p>
            </div>
          </div>

          {/* Mission message */}
          <div className="bg-muted/40 rounded-xl p-4 mb-5 border border-border/40">
            <p className="text-sm text-foreground leading-relaxed">
              Qblink is being built to make waiting smarter, more transparent, and less frustrating for everyone. If you have feedback, ideas, questions, or know a clinic, restaurant, salon, or other busy business that could benefit from Qblink, feel free to reach out directly. Every conversation helps improve the product and bring Qblink to more people.
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <Heart className="w-3.5 h-3.5 text-danger fill-danger" />
              <span className="text-xs text-muted-foreground font-medium">
                Built with care in India
              </span>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-3 mb-5">
            {/* Founder name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Founder</p>
                <p className="text-sm font-semibold text-foreground">Devansh Doshi</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-success-soft flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a
                    href="tel:+919372090507"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    +91 93720 90507
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleCopy("+919372090507", setCopiedPhone)}
                className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                title="Copy phone number"
              >
                {copiedPhone ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Personal email */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Personal Email</p>
                  <a
                    href="mailto:devanshdoshi8@gmail.com"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
                  >
                    devanshdoshi8@gmail.com
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleCopy("devanshdoshi8@gmail.com", setCopiedEmail)}
                className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                title="Copy email"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Business email */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Business Email</p>
                  <a
                    href="mailto:qblink2025@gmail.com"
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
                  >
                    qblink2025@gmail.com
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleCopy("qblink2025@gmail.com", setCopiedBizEmail)}
                className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                title="Copy email"
              >
                {copiedBizEmail ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ctas.map((cta) => (
              <a
                key={cta.label}
                href={cta.href}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted/60 hover:bg-primary/10 border border-border/40 hover:border-primary/30 text-sm font-semibold text-foreground hover:text-primary transition-all group"
              >
                <cta.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cta.label}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary" />
              </a>
            ))}
          </div>

          {/* Trust microcopy */}
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Typically replies within a few hours
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FounderContact;
