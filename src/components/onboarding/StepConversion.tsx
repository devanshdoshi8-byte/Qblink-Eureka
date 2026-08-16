import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp, TrendingDown, Zap, Bell, MessageSquareHeart, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { firstNameOf, type OnboardingData } from "@/lib/onboarding";

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}


const MetricBar = ({ label, direction, delay }: { label: string; direction: "up" | "down"; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center justify-between p-3 rounded-xl bg-card/70 border border-primary/10"
  >
    <span className="text-sm font-medium text-foreground">{label}</span>
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${direction === "up" ? "text-success" : "text-danger"}`}>
      {direction === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {direction === "up" ? "Up" : "Down"}
    </span>
  </motion.div>
);

const StepConversion = ({ data, onChange, onNext }: Props) => {
  const isBusiness = data.role === "business_owner";
  const [screen, setScreen] = useState<"summary" | "form" | "done">("summary");
  const name = firstNameOf(data.fullName) || "Friend";

  // shared
  const [submitting, setSubmitting] = useState(false);

  // customer form
  const [cName, setCName] = useState(data.fullName);
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState(data.phone);

  // business form
  const [bName, setBName] = useState("");
  const [bIndustry, setBIndustry] = useState("");
  const [bPhone, setBPhone] = useState(data.phone);
  const [bEmail, setBEmail] = useState("");
  const [bSolve, setBSolve] = useState("");

  const submit = async () => {
    setSubmitting(true);
    try {
      const finalResponses = {
        ...(data.responses || {}),
        conversion: isBusiness
          ? { type: "business", business_name: bName, industry: bIndustry, contact: bPhone, email: bEmail, solve: bSolve }
          : { type: "customer", name: cName, email: cEmail, phone: cPhone },
      };
      onChange({ responses: finalResponses });
      const payload = {
        full_name: (isBusiness ? bName : cName).trim().slice(0, 100) || data.fullName || "Anonymous",
        phone: (isBusiness ? bPhone : cPhone).trim().slice(0, 30) || data.phone || "n/a",
        social_profile: data.socialProfile?.trim()?.slice(0, 255) || null,
        role: data.role,
        tags: data.tags,
        responses: finalResponses,
        status: "completed",
      };
      const { error } = await (supabase as any).from("onboarding_leads").insert(payload);
      if (error) throw error;
      try {
        const { trackEarlyAccessSubmitted } = await import("@/lib/trustAnalytics");
        void trackEarlyAccessSubmitted("onboarding", { role: data.role, type: isBusiness ? "business" : "customer" });
      } catch {}
      setScreen("done");
    } catch (e: any) {
      toast.error(e?.message || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const validCustomer = cName.trim().length > 1 && /\S+@\S+\.\S+/.test(cEmail);
  const validBusiness = bName.trim().length > 1 && bIndustry.trim().length > 1 && /\S+@\S+\.\S+/.test(bEmail) && bPhone.trim().length > 4;

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {screen === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5 elevated-shadow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground leading-tight mb-2">
              {isBusiness ? "Ready to improve customer flow?" : "Be among the first."}
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              {isBusiness
                ? "Help shape the future of customer flow and gain early access to Qblink."
                : `${name}, gain early access and help shape what comes next.`}
            </p>

            {isBusiness ? (
              <div className="space-y-2.5 mb-6">
                <MetricBar label="Customer Experience" direction="up" delay={0.15} />
                <MetricBar label="Operational Clarity" direction="up" delay={0.3} />
                <MetricBar label="Waiting Friction" direction="down" delay={0.45} />
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/80 border border-primary/10"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Priority Access</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Skip the wait at clinics, salons, and cafés near you — be the first to join their queue remotely.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/80 border border-primary/10"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Live Turn Alerts</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Get notified when your spot is close. No more standing around or losing your place.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/80 border border-primary/10"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquareHeart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Shape the Product</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Your feedback directly influences what we build next. Early users get insider updates.
                    </p>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-[10px] text-center text-muted-foreground tracking-wide"
                >
                  No spam. Unsubscribe anytime. We never share your contact info.
                </motion.p>
              </div>
            )}

            <button
              onClick={() => setScreen("form")}
              className="w-full gradient-bg text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.01] transition-all elevated-shadow inline-flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {screen === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground leading-tight mb-2">
              {isBusiness ? "Request Business Access" : "Join Early Access"}
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              Your feedback will directly help improve Qblink.
            </p>

            <div className="space-y-4 mb-6 p-5 rounded-2xl bg-card/80 border border-primary/10 elevated-shadow">
              {isBusiness ? (
                <>
                  <div>
                    <Label htmlFor="bName">Business Name</Label>
                    <Input id="bName" value={bName} onChange={(e) => setBName(e.target.value)} maxLength={100} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bIndustry">Industry</Label>
                    <Input id="bIndustry" value={bIndustry} onChange={(e) => setBIndustry(e.target.value)} placeholder="Clinic, Salon, Restaurant…" maxLength={80} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bPhone">Contact Number</Label>
                    <Input id="bPhone" value={bPhone} onChange={(e) => setBPhone(e.target.value)} maxLength={30} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bEmail">Email</Label>
                    <Input id="bEmail" type="email" value={bEmail} onChange={(e) => setBEmail(e.target.value)} maxLength={255} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="bSolve">Anything you'd like Qblink to solve? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea id="bSolve" value={bSolve} onChange={(e) => setBSolve(e.target.value)} maxLength={500} className="mt-1.5" rows={3} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="cName">Full Name</Label>
                    <Input id="cName" value={cName} onChange={(e) => setCName(e.target.value)} maxLength={100} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="cEmail">Email</Label>
                    <Input id="cEmail" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} maxLength={255} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="cPhone">Phone Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="cPhone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} maxLength={30} className="mt-1.5" />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={submit}
              disabled={submitting || (isBusiness ? !validBusiness : !validCustomer)}
              className="w-full gradient-bg text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all elevated-shadow inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isBusiness ? "Request Access" : "Join Early Access"}
            </button>
          </motion.div>
        )}

        {screen === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 className="w-9 h-9 text-success" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-3">
              You're on the list, {name}.
            </h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              {isBusiness
                ? "We'll reach out shortly with your early access details. Thank you for helping shape Qblink."
                : "We'll be in touch with early access soon. Thank you for being one of the first."}
            </p>
            <button
              onClick={onNext}
              className="gradient-bg text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all elevated-shadow"
            >
              Finish
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepConversion;