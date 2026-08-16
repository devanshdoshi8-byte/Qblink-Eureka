import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";

type Step = "email" | "otp" | "done";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    setErrorMsg(null);
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      const raw = (error.message || "").toLowerCase();
      if (raw.includes("rate") || raw.includes("too many")) {
        setErrorMsg("Too many requests. Please wait a minute and try again.");
        return;
      }
      // Do not reveal whether an account exists for this email.
      // Fall through to the OTP step with the same generic message.
    }
    setStep("otp");
    setResendIn(45);
    toast.success("If an account exists for this email, we've sent a 6-digit code.");
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    if (errorMsg) setErrorMsg(null);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const verifyAndReset = async () => {
    setErrorMsg(null);
    const token = otp.join("");
    if (token.length !== 6) { setErrorMsg("Enter the 6-digit code from your email."); return; }
    if (newPassword.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setErrorMsg("Passwords don't match."); return; }
    setLoading(true);
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    if (vErr) {
      setLoading(false);
      setErrorMsg("That code is invalid or expired. Try again.");
      return;
    }
    const { error: uErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (uErr) {
      setErrorMsg("Couldn't update your password. Please try again.");
      return;
    }
    await supabase.auth.signOut();
    setStep("done");
    toast.success("Password updated. Please sign in.");
    setTimeout(() => navigate("/auth/signin"), 1800);
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center px-4 py-10">
      <SEO title="Reset password — Qblink" description="Reset your Qblink password with a 6-digit email code." path="/auth/forgot-password" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logo} alt="Qblink" className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-2xl font-bold text-foreground">Qblink</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {step === "email" && "Reset your password"}
            {step === "otp" && "Enter the code"}
            {step === "done" && "All set"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "email" && "We'll email you a 6-digit code to verify it's you."}
            {step === "otp" && (<>If an account exists for <span className="font-medium text-foreground">{email}</span>, a code is on its way.</>)}
            {step === "done" && "Your password has been updated."}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
          {step === "email" && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" autoFocus value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                </div>
              </div>
              {errorMsg && <ErrorBox msg={errorMsg} />}
              <button onClick={sendCode} disabled={loading}
                className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
                {loading ? "Sending..." : "Send code"}
              </button>
              <Link to="/auth/signin" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </>
          )}

          {step === "otp" && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">6-digit code</label>
                <div className="flex justify-between gap-2">
                  {otp.map((d, i) => (
                    <input key={i} ref={(el) => (inputRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      className="w-11 h-12 text-center text-lg font-semibold rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">New password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={newPassword} minLength={6}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={confirmPassword} minLength={6}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors" />
                </div>
              </div>
              {errorMsg && <ErrorBox msg={errorMsg} />}
              <button onClick={verifyAndReset} disabled={loading}
                className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
                {loading ? "Updating..." : "Update password"}
              </button>
              <div className="text-center text-sm text-muted-foreground">
                Didn't get a code?{" "}
                {resendIn > 0 ? (
                  <span className="text-muted-foreground">Resend in {resendIn}s</span>
                ) : (
                  <button onClick={sendCode} className="text-primary font-semibold hover:underline">Resend</button>
                )}
              </div>
              <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Redirecting you to sign in...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ErrorBox = ({ msg }: { msg: string }) => (
  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex gap-2.5">
    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
    <p className="text-sm text-destructive font-medium leading-snug">{msg}</p>
  </div>
);

export default ForgotPassword;