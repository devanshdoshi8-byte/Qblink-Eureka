import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEarlyAccessSubmitted } from "@/lib/trustAnalytics";
import { toast } from "sonner";
import { Handshake, TrendingUp, Wallet, BarChart3, Users, CheckCircle, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import SectionHeading from "@/components/SectionHeading";
import PrefillNotice from "@/components/PrefillNotice";
import SEO from "@/components/SEO";

const perks = [
  { icon: Handshake, title: "Who Can Join", desc: "Consultants, sales partners, agencies, local business connectors, and anyone with B2B reach." },
  { icon: TrendingUp, title: "Simple Commissions", desc: "Earn a recurring commission for every business you refer that becomes a paying customer." },
  { icon: BarChart3, title: "Referral Tracking", desc: "Get a unique referral link and dashboard to track your leads, conversions, and earnings." },
  { icon: Wallet, title: "Monthly Payouts", desc: "Transparent payout schedule. No hidden terms, no minimum thresholds to start." },
];

const steps = [
  { num: "1", title: "Sign Up", desc: "Fill out the form below to join the affiliate program." },
  { num: "2", title: "Get Your Link", desc: "Receive your unique referral code and shareable link." },
  { num: "3", title: "Refer Businesses", desc: "Share Qblink with businesses that serve walk-in customers." },
  { num: "4", title: "Earn Rewards", desc: "Get commissions for every successful referral that converts." },
];

const SITE = "https://qblink-real.lovable.app";
const affiliateJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Affiliate Program", item: `${SITE}/affiliate` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to become a Qblink affiliate",
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.desc })),
  },
];

const AffiliatePage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("qb_prefill_optout") === "1") return;
      const n = localStorage.getItem("qb_visitor_name");
      const p = localStorage.getItem("qb_visitor_phone");
      setForm(f => ({ ...f, name: n || f.name, phone: p || f.phone }));
      if (n || p) setPrefilled(true);
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error("Name, email and phone are required"); return; }
    try {
      if (localStorage.getItem("qb_prefill_optout") !== "1") {
        localStorage.setItem("qb_visitor_name", form.name.trim());
        localStorage.setItem("qb_visitor_phone", form.phone.trim());
      }
    } catch {}
    setLoading(true);

    const { data, error } = await supabase.from("affiliate_signups").insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      company: form.company || null,
    }).select("referral_code").single();

    if (error) {
      toast.error(error.message?.includes("duplicate") ? "This email is already registered" : "Something went wrong");
      setLoading(false);
      return;
    }

    setReferralCode(data?.referral_code || "");
    setSubmitted(true);
    setLoading(false);
    toast.success("Welcome to the affiliate program!");
    void trackEarlyAccessSubmitted("affiliate", { company: form.company || null });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow";

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Affiliate Program — Qblink" description="Earn recurring commissions by referring businesses to Qblink. Join the affiliate program." path="/affiliate" jsonLd={affiliateJsonLd} />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase gradient-bg text-primary-foreground mb-4">
            Affiliate Program
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4">
            Earn by Helping Businesses <span className="gradient-text">Modernize Their Queue Flow</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Join our partner network and earn recurring commissions for every successful referral. No upfront costs, no complicated contracts.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="section-padding soft-bg">
        <div className="section-container">
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {perks.map((p, i) => (
              <AnimatedSection key={p.title} delay={i * 0.1}>
                <div className="bg-background rounded-2xl p-6 card-shadow h-full">
                  <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center mb-4">
                    <p.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding">
        <div className="section-container">
          <SectionHeading title="How It Works" subtitle="Four simple steps to start earning" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <AnimatedSection key={s.num} delay={i * 0.1}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3 text-primary-foreground font-bold text-lg">{s.num}</div>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Signup form */}
      <section className="section-padding soft-bg">
        <div className="section-container">
          <SectionHeading title="Join the Program" subtitle="Fill in your details and we'll set you up with a referral code." />
          <AnimatedSection>
            <div className="max-w-lg mx-auto">
              {submitted ? (
                <div className="bg-background rounded-2xl p-8 card-shadow text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">You're In!</h3>
                  <p className="text-muted-foreground mb-4">Your referral code:</p>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-6 py-3 inline-block">
                    <span className="text-lg font-bold text-primary">{referralCode}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Share this code with businesses. We'll reach out with your tracking dashboard soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-background rounded-2xl p-8 card-shadow space-y-4">
                  <PrefillNotice
                    visible={prefilled}
                    onClear={() => { setForm(f => ({ ...f, name: "", phone: "" })); setPrefilled(false); }}
                    onUpdate={(n, p) => { setForm(f => ({ ...f, name: n, phone: p })); setPrefilled(true); }}
                  />
                  <input type="text" placeholder="Your Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                  <input type="email" placeholder="Email Address *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  <input type="tel" required placeholder="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Company / Organization (optional)" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputClass} />
                  <button type="submit" disabled={loading} className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Join Affiliate Program"}
                  </button>
                </form>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AffiliatePage;
