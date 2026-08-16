import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Building2, Users, Activity, BarChart3, DollarSign, Settings, Inbox, Compass,
  LogOut, Menu, X, ShieldCheck, FileText, Megaphone, Tag, LayoutTemplate, Sparkles, Bell,
  HeartPulse, Download, MessageSquare, ChevronDown,
} from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import MobileBottomNav from "@/components/MobileBottomNav";
import OfflineBanner from "@/components/OfflineBanner";

type NavItem = { to: string; label: string; icon: any; end?: boolean; highlight?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/impact", label: "Impact", icon: HeartPulse },
      { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/admin/businesses", label: "Businesses", icon: Building2 },
      { to: "/admin/discovery", label: "Discovery", icon: Compass, highlight: true },
      { to: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Queues",
    items: [
      { to: "/admin/queues", label: "Live Queues", icon: Activity },
      { to: "/admin/queue-templates", label: "Queue Templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/content", label: "Site Content", icon: FileText },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/admin/marketing", label: "Marketing & Coupons", icon: Tag },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/support", label: "Support Center", icon: MessageSquare },
      { to: "/admin/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/ai", label: "AI Knowledge", icon: Sparkles },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/exports", label: "Export Center", icon: Download },
      { to: "/admin/system", label: "System Settings", icon: Settings },
      { to: "/admin/settings", label: "Account & Access", icon: ShieldCheck },
    ],
  },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen soft-bg flex w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border p-4 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 mb-6 px-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-bold text-foreground">Qblink</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Admin</span>
        </Link>

        <div className="bg-muted/50 rounded-xl p-3 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Platform Admin</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
          <GroupedNav location={location} />
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
            <span className="font-bold text-foreground text-sm">Qblink Admin</span>
          </Link>
          <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg hover:bg-muted">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-border px-2 py-2 flex flex-col gap-1 max-h-[75vh] overflow-y-auto">
            <GroupedNav location={location} onNavigate={() => setMobileOpen(false)} />
            <button onClick={signOut} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 pt-16 md:pt-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <OfflineBanner />
        {children}
      </main>
      <MobileBottomNav
        items={[
          { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
          { to: "/admin/businesses", label: "Businesses", icon: Building2 },
          { to: "/admin/content", label: "Content", icon: FileText },
          { to: "/admin/support", label: "Support", icon: MessageSquare },
          { to: "/admin/system", label: "System", icon: Settings },
        ]}
      />
    </div>
  );
};

const GroupedNav = ({ location, onNavigate }: { location: ReturnType<typeof useLocation>; onNavigate?: () => void }) => {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    GROUPS.forEach((g) => {
      init[g.label] = g.items.some((i) => i.end ? location.pathname === i.to : location.pathname.startsWith(i.to));
      if (g.label === "Platform") init[g.label] = true;
    });
    return init;
  });
  return (
    <>
      {GROUPS.map((group) => {
        const isOpen = open[group.label] ?? false;
        return (
          <div key={group.label} className="mb-1">
            <button
              onClick={() => setOpen((o) => ({ ...o, [group.label]: !o[group.label] }))}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground"
            >
              {group.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
            </button>
            {isOpen && group.items.map((item) => {
              const Icon = item.icon;
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "gradient-bg text-primary-foreground"
                      : item.highlight
                        ? "text-primary bg-primary/10 hover:bg-primary/15 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                  {item.highlight && !active && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">New</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

export default AdminLayout;
