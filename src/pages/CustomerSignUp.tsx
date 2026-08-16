import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock, Phone, Mail, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { COUNTRY_CODES, normalizePhone, phoneToEmail, isValidPhone } from "@/lib/phoneAuth";
import { GoogleButton, AuthDivider } from "@/components/auth/GooglePickerModal";
import { signInWithGoogle } from "@/lib/auth/authService";

const CustomerSignUp = () => {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const nextUrl = searchParams.get("next");
  const safeNext = nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : null;

  useEffect(() => {
    if (user) navigate(safeNext || "/customer-dashboard");
  }, [user, navigate, safeNext]);

  const fullDigits = normalizePhone(countryCode, phone);

  const handleGoogle = async () => {
    setGoogleBusy(true);
    setFormError(null);
    try {
      await signInWithGoogle("customer", safeNext ?? undefined);
    } catch (err: any) {
      const msg = err?.message ?? "Couldn't sign in with Google";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fullName.trim()) { setFormError("Please enter your full name."); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    if (mode === "phone") {
      if (!isValidPhone(phone)) { setFormError("Enter a valid WhatsApp number (at least 7 digits)."); return; }
      createAccount(phoneToEmail(fullDigits), `+${fullDigits}`);
    } else {
      const em = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setFormError("Enter a valid email address."); return; }
      createAccount(em, null);
    }
  };

  const createAccount = async (loginEmail: string, phoneNumber: string | null) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/customer-dashboard`,
          data: { full_name: fullName, role: "customer", ...(phoneNumber ? { phone: phoneNumber } : {}) },
        },
      });
      if (error) throw error;
      if (data.user) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "customer" });
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
        const { error: profErr } = await supabase
          .from("customer_profiles")
          .insert({ user_id: data.user.id, full_name: fullName, ...(phoneNumber ? { phone: phoneNumber } : {}) });
        if (profErr && !profErr.message.includes("duplicate")) throw profErr;
      }
      toast.success("Welcome to Qblink!");
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      const low = msg.toLowerCase();
      if (low.includes("registered") || low.includes("already")) {
        toast.error("This account already exists. Redirecting to sign in…");
        const next = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";
        navigate(`/auth/signin${next}`);
      } else {
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center px-4 py-10">
      <SEO title="Create your Qblink account" description="Sign up in seconds and start joining queues from your phone." path="/auth/customer" />
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/auth")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <img src={logo} alt="Qblink" className="h-10 w-10 rounded-lg object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">Skip the line. Join queues from your phone.</p>
        </div>

        <form onSubmit={handleContinue} className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <GoogleButton onClick={handleGoogle} loading={googleBusy} />
          <p className="text-xs text-center text-muted-foreground -mt-1">
            <span className="font-semibold text-primary">Recommended</span> · No password to remember
          </p>
          <AuthDivider />

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted">
            <button type="button" onClick={() => { setMode("phone"); setFormError(null); }}
              className={`py-2 rounded-lg text-sm font-medium transition ${mode === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              WhatsApp
            </button>
            <button type="button" onClick={() => { setMode("email"); setFormError(null); }}
              className={`py-2 rounded-lg text-sm font-medium transition ${mode === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Email
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
            </div>
          </div>

          {mode === "phone" ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp number</label>
              <div className="flex gap-2">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="px-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" inputMode="numeric" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                    required placeholder="98765 43210"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Businesses use this to notify you when it's your turn.</p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
            </div>
          </div>

          {formError && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium leading-snug">{formError}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
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

export default CustomerSignUp;
