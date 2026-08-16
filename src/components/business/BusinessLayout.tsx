import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Users, BarChart3, Ticket, Settings, LogOut, UtensilsCrossed, BookOpen, History, Activity, Sparkles } from "lucide-react";
import { SkeletonAppShell } from "@/components/skeletons/DashboardSkeletons";
import logo from "@/assets/qblink-logo.png";
import { supportsPickup } from "@/lib/categories";
import AIAssistant from "@/components/AIAssistant";
import MobileBottomNav from "@/components/MobileBottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import BusinessPageContainer from "@/components/business/BusinessPageContainer";
import OverflowWarning from "@/components/business/OverflowWarning";

interface Business {
  id: string;
  name: string;
  category: string | null;
}

const BASE_NAV = [
  { to: "/dashboard", label: "Queue Manager", icon: Users },
  { to: "/dashboard/insights", label: "Insights", icon: Sparkles },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/queue-health", label: "Queue Health", icon: Activity },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/tokens", label: "Tokens", icon: Ticket },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const PICKUP_NAV = [
  { to: "/dashboard/menu", label: "Menu", icon: BookOpen },
  { to: "/dashboard/pickup", label: "Pickup Orders", icon: UtensilsCrossed },
];

interface Props {
  children: (business: Business) => ReactNode;
}

const BusinessLayout = ({ children }: Props) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth/signin");
    if (!roleLoading && user && role === "customer") navigate("/customer-dashboard");
  }, [user, role, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("businesses").select("*").eq("owner_id", user.id).limit(1).maybeSingle()
        .then(({ data }) => {
          setBusiness(data as Business);
          setLoading(false);
        });
    }
  }, [user]);

  if (authLoading || loading) return <SkeletonAppShell />;

  if (!business) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-muted-foreground mb-4">No business found for your account.</p>
        <Link to="/auth/business" className="text-primary font-semibold hover:underline">Register a business</Link>
      </div>
    </div>
  );

  // Pickup/menu only for restaurants/cafes
  const NAV = supportsPickup(business.category)
    ? [BASE_NAV[0], ...PICKUP_NAV, ...BASE_NAV.slice(1)]
    : BASE_NAV;

  return (
    <div className="min-h-screen soft-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 mb-6 px-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-bold text-foreground">Qblink</span>
        </Link>

        <div className="bg-muted/50 rounded-xl p-3 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            {business.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{business.name}</p>
            <p className="text-xs text-muted-foreground truncate">{business.category || "Business"}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-bold text-foreground text-sm">{business.name}</span>
          </Link>
          <button onClick={signOut}><LogOut className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to} end className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                active ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-28 md:pt-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <BusinessPageContainer>
          <OfflineBanner />
          {children(business)}
        </BusinessPageContainer>
      </main>
      <AIAssistant mode="business" businessId={business.id} />
      <OverflowWarning />
      <MobileBottomNav
        items={NAV.slice(0, 5).map(({ to, label, icon }) => ({ to, label, icon, end: true }))}
      />
    </div>
  );
};

export default BusinessLayout;
