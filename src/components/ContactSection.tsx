import { useState, useEffect } from "react";
import { Send, CheckCircle2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";
import { toast } from "sonner";
import PrefillNotice from "@/components/PrefillNotice";
import { hapticSuccess } from "@/lib/haptics";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", industry: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [confirmation, setConfirmation] = useState<
    null | {
      type: "demo" | "early_access";
      submitted: typeof form;
      submittedAt: string;
      reference: string;
      emailSent: boolean;
    }
  >(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("qb_prefill_optout") === "1") return;
      const n = localStorage.getItem("qb_visitor_name");
      const p = localStorage.getItem("qb_visitor_phone");
      setForm(f => ({ ...f, name: n || f.name, phone: p || f.phone }));
      if (n || p) setPrefilled(true);
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent, type: "demo" | "early_access") => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error("Name, email and phone are required"); return; }
    try {
      if (localStorage.getItem("qb_prefill_optout") !== "1") {
        localStorage.setItem("qb_visitor_name", form.name.trim());
        localStorage.setItem("qb_visitor_phone", form.phone.trim());
      }
    } catch {}
    setLoading(true);

    const submissionId = crypto.randomUUID();
    const { error } = await supabase.from("contact_submissions").insert({
      id: submissionId,
      name: form.name,
      email: form.email,
      business: form.business || null,
      phone: form.phone || null,
      industry: form.industry || null,
      message: form.message || null,
      submission_type: type,
    });

    if (error) { toast.error("Something went wrong. Please try again."); setLoading(false); return; }

    // Try to send a summary email to the user (gracefully no-op until email infra is set up)
    let emailSent = false;
    try {
      const { error: fnError } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName:
            type === "demo" ? "demo-request-confirmation" : "early-access-confirmation",
          recipientEmail: form.email.trim(),
          idempotencyKey: `${type}-${submissionId}`,
          templateData: {
            name: form.name,
            business: form.business,
            phone: form.phone,
            industry: form.industry,
            message: form.message,
            reference: submissionId.slice(0, 8).toUpperCase(),
          },
        },
      });
      emailSent = !fnError;
    } catch {
      emailSent = false;
    }

    setConfirmation({
      type,
      submitted: { ...form },
      submittedAt: new Date().toLocaleString(),
      reference: submissionId.slice(0, 8).toUpperCase(),
      emailSent,
    });
    hapticSuccess();
    toast.success(type === "demo" ? "Demo request submitted!" : "You're on the early access list!");
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow";

  return (
    <section id="contact" className="section-padding soft-bg">
      <div className="section-container">
        <SectionHeading
          badge="Get Started"
          title="Book a Demo or Join Early Access"
          subtitle="Fill in a few details and our team will reach out to help you get started with Qblink."
        />
        <AnimatedSection>
          {confirmation ? (
            <div className="bg-background rounded-2xl p-8 md:p-10 card-shadow max-w-2xl mx-auto">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {confirmation.type === "demo" ? "Demo request received" : "You're on the early access list"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted {confirmation.submittedAt} · Ref #{confirmation.reference}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What you submitted</p>
                <SummaryRow label="Name" value={confirmation.submitted.name} />
                <SummaryRow label="Email" value={confirmation.submitted.email} />
                <SummaryRow label="Phone" value={confirmation.submitted.phone} />
                {confirmation.submitted.business && <SummaryRow label="Business" value={confirmation.submitted.business} />}
                {confirmation.submitted.industry && <SummaryRow label="Industry" value={confirmation.submitted.industry} />}
                {confirmation.submitted.message && <SummaryRow label="Message" value={confirmation.submitted.message} />}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">
                  {confirmation.emailSent
                    ? <>A copy of this summary has been emailed to <span className="font-semibold">{confirmation.submitted.email}</span>.</>
                    : <>We'll email a copy of this summary to <span className="font-semibold">{confirmation.submitted.email}</span> as soon as our team confirms it.</>}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmation(null);
                    setForm({ name: "", business: "", email: "", phone: "", industry: "", message: "" });
                  }}
                  className="border border-border bg-background text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={(e) => handleSubmit(e, "demo")} className="bg-background rounded-2xl p-8 md:p-10 card-shadow max-w-2xl mx-auto space-y-5">
            <PrefillNotice
              visible={prefilled}
              onClear={() => { setForm(f => ({ ...f, name: "", phone: "" })); setPrefilled(false); }}
              onUpdate={(n, p) => { setForm(f => ({ ...f, name: n, phone: p })); setPrefilled(true); }}
            />
            <div className="grid sm:grid-cols-2 gap-5">
              <input type="text" placeholder="Your Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
              <input type="text" placeholder="Business Name" value={form.business} onChange={e => setForm({...form, business: e.target.value})} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <input type="email" placeholder="Email Address *" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} />
              <input type="tel" required placeholder="Phone Number *" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} />
            </div>
            <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className={inputClass}>
              <option value="">Select Industry</option>
              <option value="restaurant">Restaurant</option>
              <option value="clinic">Clinic / Healthcare</option>
              <option value="bank">Bank / Finance</option>
              <option value="salon">Salon / Beauty</option>
              <option value="government">Government Services</option>
              <option value="service">Service Center</option>
              <option value="other">Other</option>
            </select>
            <textarea placeholder="Tell us about your needs..." rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className={inputClass + " resize-none"} />
            <div className="flex flex-wrap gap-4">
              <button type="submit" disabled={loading} className="gradient-bg text-primary-foreground px-7 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity elevated-shadow flex items-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> Book a Demo
              </button>
              <button type="button" disabled={loading} onClick={(e) => handleSubmit(e as any, "early_access")} className="border border-border bg-background text-foreground px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50">
                Join Early Access
              </button>
            </div>
          </form>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3">
    <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
    <span className="text-sm text-foreground break-words">{value}</span>
  </div>
);

export default ContactSection;
