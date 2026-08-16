import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 card-shadow max-w-sm text-center">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Admin Only</h1>
          <p className="text-sm text-muted-foreground mb-5">
            This area is restricted to Qblink platform administrators.
          </p>
          <Link to="/" replace className="inline-block gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;