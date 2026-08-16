import { Link } from "react-router-dom";
import { Users, Building2, ArrowRight, ShieldCheck } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const RoleSelection = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const email = user?.email ?? null;

  return (
    <div className="min-h-screen soft-bg flex flex-col items-center justify-center px-4 py-10">
      <SEO title="Get Started — Qblink" description="Join Qblink as a customer or business and start managing walk-in queues today." path="/auth" />
      <header className="w-full max-w-5xl flex items-center justify-between mb-12">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-xl font-bold text-foreground">Qblink</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/signin" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </header>

      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Join Qblink</h1>
        <p className="text-lg text-muted-foreground">How would you like to use Qblink?</p>
        {email && (
          <div className="mt-4 inline-flex flex-col items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-xl px-4 py-2">
            <span>Logged in as: <span className="font-semibold text-foreground">{email}</span></span>
            <span>Admin access: <span className={`font-semibold ${isAdmin ? "text-primary" : "text-muted-foreground"}`}>{isAdmin ? "Yes" : "No"}</span></span>
          </div>
        )}
      </div>

      <div className={`w-full max-w-5xl grid gap-6 ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-2 max-w-3xl"}`}>
        <Link
          to="/auth/customer"
          className="group bg-card rounded-3xl p-10 card-shadow hover:elevated-shadow transition-all border border-border hover:border-primary/40 flex flex-col min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shrink-0">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Customer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
            Find businesses, join queues remotely, and skip the wait. Get notified when it's your turn.
          </p>
          <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all min-h-[44px]">
            Get Started <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/auth/business"
          className="group bg-card rounded-3xl p-10 card-shadow hover:elevated-shadow transition-all border border-border hover:border-secondary/40 flex flex-col min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 shrink-0">
            <Building2 className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Business</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
            Manage your customer queue digitally, reduce crowding, and provide a better experience.
          </p>
          <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm group-hover:gap-3 transition-all min-h-[44px]">
            Register Business <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className="group bg-card rounded-3xl p-10 card-shadow hover:elevated-shadow transition-all border border-border hover:border-primary/40 flex flex-col min-h-[320px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shrink-0">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Admin Panel</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
              Manage the Qblink platform — monitor businesses, customers, queues, and revenue across the network.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all min-h-[44px]">
              Open Admin <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-10 text-center">
        By signing up, you agree to our <Link to="/" className="text-primary hover:underline">Terms</Link> and{" "}
        <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>
      </p>
    </div>
  );
};

export default RoleSelection;
