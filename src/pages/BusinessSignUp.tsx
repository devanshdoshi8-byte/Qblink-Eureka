import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Building2, Tag, FileText, MapPin, ArrowLeft, Sparkles, Check, Clock, BellRing, Users } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { GoogleButton, AuthDivider } from "@/components/auth/GooglePickerModal";
import { signInWithGoogle, ensureRoleAndProfile } from "@/lib/auth/authService";
import { INDUSTRIES, getIndustryDefaults, type IndustryDefaults } from "@/lib/industryDefaults";

const ALERT_LABELS: Record<string, string> = {
  doctor_delay: "Doctor Delay Alerts",
  table_ready: "Table Ready Alerts",
  service_time: "Estimated Service Time",
  counter_ready: "Counter Ready Alerts",
  prescription_ready: "Prescription Ready Alerts",
  test_ready: "Test Ready Alerts",
  fasting_reminder: "Fasting Reminder",
  billing_ready: "Billing Ready Alerts",
  technician_ready: "Technician Ready Alerts",
  job_status: "Job Status Alerts",
};
const ARRIVAL_WINDOWS = [5, 10, 15, 20];

const BusinessSignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<string>("Clinic");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const defaults = getIndustryDefaults(category);
  const [overrides, setOverrides] = useState<IndustryDefaults>(defaults);

  // Reset overrides to the fresh industry defaults whenever the industry changes.
  useEffect(() => {
    setOverrides(getIndustryDefaults(category));
  }, [category]);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "business" });
        await supabase.from("businesses").insert({
          owner_id: data.user.id,
          name: businessName,
          category,
          description: description || null,
          address: address || null,
          default_settings: overrides as any,
        });
      }

      toast.success(`Business account created — ${category} defaults enabled`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    if (!businessName.trim()) {
      toast.error("Enter your business name before continuing with Google.");
      return;
    }
    setGoogleBusy(true);
    try {
      // Stash the draft so it can be created once a real session exists.
      sessionStorage.setItem(
        "qblink.pendingBusiness",
        JSON.stringify({ name: businessName, category, description, address, default_settings: overrides }),
      );
      await signInWithGoogle("business");
      await ensureRoleAndProfile();
      await createPendingBusiness();
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't sign in with Google");
    } finally {
      setGoogleBusy(false);
    }
  };

  /** Creates the stashed business draft for the signed-in owner, if any. */
  const createPendingBusiness = async () => {
    const raw = sessionStorage.getItem("qblink.pendingBusiness");
    if (!raw) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const draft = JSON.parse(raw);
    const { data: existing } = await supabase
      .from("businesses").select("id").eq("owner_id", data.user.id).limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("businesses").insert({
        owner_id: data.user.id,
        name: draft.name,
        category: draft.category,
        description: draft.description || null,
        address: draft.address || null,
        default_settings: draft.default_settings as any,
      });
    }
    sessionStorage.removeItem("qblink.pendingBusiness");
    toast.success("Business account ready");
  };

  // Finish the Google flow when the browser returns from the provider.
  useEffect(() => {
    if (user) { createPendingBusiness().catch(() => {}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center px-4 py-10">
      <SEO title="Sign up your business — Qblink" description="Run a smarter walk-in operation with Qblink's hardware-free customer flow platform — no app, remote waiting, live visibility, and AI recommendations." path="/auth/business" />
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-8">
          <img src={logo} alt="Qblink" className="h-10 w-10 rounded-lg object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Register Your Business</h1>
          <p className="text-sm text-muted-foreground">Set up your customer flow profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 card-shadow space-y-4">
          <GoogleButton onClick={continueWithGoogle} loading={googleBusy} />
          <p className="text-xs text-center text-muted-foreground -mt-1">
            <span className="font-semibold text-primary">Recommended</span> · Use your business Google account
          </p>
          <AuthDivider />

          <Field icon={<Building2 className="w-4 h-4" />} label="Business Name">
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="e.g. Sharma Dental Clinic"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
          </Field>
          <Field icon={<Mail className="w-4 h-4" />} label="Business Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="business@email.com"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
          </Field>
          <Field icon={<Tag className="w-4 h-4" />} label="Industry">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors appearance-none">
              {INDUSTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Queue Configuration · {category}</p>
              </div>
              <button
                type="button"
                onClick={() => setOverrides(getIndustryDefaults(category))}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Arrival window */}
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">Arrival window</p>
              <div className="flex flex-wrap gap-1.5">
                {ARRIVAL_WINDOWS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOverrides({ ...overrides, arrival_window_minutes: m })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      overrides.arrival_window_minutes === m
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated service time */}
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">
                Estimated service time · <span className="text-primary">{overrides.estimated_service_time} min</span>
              </p>
              <input
                type="range"
                min={2}
                max={60}
                step={1}
                value={overrides.estimated_service_time}
                onChange={e => setOverrides({ ...overrides, estimated_service_time: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            {/* Party size toggle */}
            <MiniToggle
              label="Party size on join"
              checked={overrides.party_size_enabled}
              onChange={v => setOverrides({ ...overrides, party_size_enabled: v })}
            />

            {/* Alerts */}
            {defaults.alerts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Alerts</p>
                <div className="space-y-1.5">
                  {defaults.alerts.map(key => {
                    const on = overrides.alerts.includes(key);
                    return (
                      <MiniToggle
                        key={key}
                        label={ALERT_LABELS[key] ?? key}
                        checked={on}
                        onChange={v =>
                          setOverrides({
                            ...overrides,
                            alerts: v
                              ? [...overrides.alerts, key]
                              : overrides.alerts.filter(a => a !== key),
                          })
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              Starts from {category} defaults. You can change any of these later in Settings.
            </p>

            <ImpactPreview overrides={overrides} />
          </div>

          <Field icon={<FileText className="w-4 h-4" />} label="Description (optional)">
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your business" rows={2}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors resize-none" />
          </Field>
          <Field icon={<MapPin className="w-4 h-4" />} label="Address (optional)">
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="City or area"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
          </Field>

          <button type="submit" disabled={loading}
            className="w-full gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Creating..." : "Create Business Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/signin" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-3.5 text-muted-foreground">{icon}</span>
      {children}
    </div>
  </div>
);

const MiniToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-foreground">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </button>
  </div>
);

// Live preview of how the current overrides translate into customer-facing
// wait time estimates and notification timing. Numbers are illustrative and
// derived only from the values on this screen — no backend data required.
const ImpactPreview = ({ overrides }: { overrides: IndustryDefaults }) => {
  const partyFactor = overrides.party_size_enabled ? 1.15 : 1; // parties nudge service up
  const perCustomer = Math.round(overrides.estimated_service_time * partyFactor);
  const wait5 = perCustomer * 5; // 5th person in line
  const readyLead = Math.max(2, Math.round(overrides.arrival_window_minutes * 0.6));
  const notifyBefore = overrides.arrival_window_minutes + readyLead;
  const finalCall = overrides.arrival_window_minutes;
  const noShowAfter = overrides.arrival_window_minutes + 5;

  return (
    <div className="rounded-lg border border-border/60 bg-background/70 p-2.5 space-y-2">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-primary" /> Impact preview
      </p>

      <div className="grid grid-cols-2 gap-2">
        <ImpactStat
          icon={<Clock className="w-3 h-3" />}
          label="Wait · 5th in line"
          value={`~${wait5} min`}
        />
        <ImpactStat
          icon={<Users className="w-3 h-3" />}
          label="Per customer"
          value={`~${perCustomer} min`}
        />
        <ImpactStat
          icon={<BellRing className="w-3 h-3" />}
          label="Heads-up sent"
          value={`${notifyBefore} min before`}
        />
        <ImpactStat
          icon={<BellRing className="w-3 h-3" />}
          label="Final call"
          value={`${finalCall} min before`}
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Marked no-show if not arrived within <span className="font-semibold text-foreground">{noShowAfter} min</span> of being called.
        {overrides.party_size_enabled && " Party size adds ~15% to service time."}
      </p>
    </div>
  );
};

const ImpactStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-md bg-muted/40 px-2 py-1.5">
    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-xs font-semibold text-foreground mt-0.5">{value}</div>
  </div>
);

export default BusinessSignUp;
