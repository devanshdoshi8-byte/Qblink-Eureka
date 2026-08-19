import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeInitModal } from "@/components/ThemeInitModal";
import BackButton from "./components/BackButton";
import InstallAppPrompt from "./components/InstallAppPrompt";
import StageDemoSwitcher from "./components/pitch/StageDemoSwitcher";
import Index from "./pages/Index.tsx";
import JoinQueue from "./pages/JoinQueue.tsx";
import AdminRoute from "./components/admin/AdminRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const RoleSelection = lazy(() => import("./pages/RoleSelection.tsx"));
const SignIn = lazy(() => import("./pages/SignIn.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const CustomerSignUp = lazy(() => import("./pages/CustomerSignUp.tsx"));
const BusinessSignUp = lazy(() => import("./pages/BusinessSignUp.tsx"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Analytics = lazy(() => import("./pages/Analytics.tsx"));
const Insights = lazy(() => import("./pages/Insights.tsx"));
const QueueHealth = lazy(() => import("./pages/QueueHealth.tsx"));
const Tokens = lazy(() => import("./pages/Tokens.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const QueueHistory = lazy(() => import("./pages/QueueHistory.tsx"));
const PublicDisplay = lazy(() => import("./pages/PublicDisplay.tsx"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage.tsx"));
const Install = lazy(() => import("./pages/Install.tsx"));
const Pickup = lazy(() => import("./pages/Pickup.tsx"));
const PickupOrder = lazy(() => import("./pages/PickupOrder.tsx"));
const PickupTrack = lazy(() => import("./pages/PickupTrack.tsx"));
const MenuManagement = lazy(() => import("./pages/MenuManagement.tsx"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.tsx"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses.tsx"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers.tsx"));
const AdminQueues = lazy(() => import("./pages/admin/AdminQueues.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics.tsx"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads.tsx"));
const AdminDiscovery = lazy(() => import("./pages/admin/AdminDiscovery.tsx"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent.tsx"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements.tsx"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing.tsx"));
const AdminQueueTemplates = lazy(() => import("./pages/admin/AdminQueueTemplates.tsx"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport.tsx"));
const AdminImpact = lazy(() => import("./pages/admin/AdminImpact.tsx"));
const AdminAIKnowledge = lazy(() => import("./pages/admin/AdminAIKnowledge.tsx"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications.tsx"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem.tsx"));
const AdminExports = lazy(() => import("./pages/admin/AdminExports.tsx"));
const PwaStatus = lazy(() => import("./pages/PwaStatus.tsx"));
const CacheDiagnostics = lazy(() => import("./pages/CacheDiagnostics.tsx"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent.tsx"));
const PitchDemo = lazy(() => import("./pages/PitchDemo.tsx"));
const RoiCalculatorPage = lazy(() => import("./pages/RoiCalculatorPage.tsx"));
const ChaosToClarityPage = lazy(() => import("./pages/ChaosToClarityPage.tsx"));
const IndustryMorphPage = lazy(() => import("./pages/IndustryMorphPage.tsx"));

const queryClient = new QueryClient();

/** Neutral, layout-stable fallback while a route chunk loads. */
const RouteFallback = () => (
  <div className="min-h-dvh bg-background" role="status" aria-live="polite" aria-label="Loading page" />
);

/**
 * Renders a small floating back button on every page except the
 * landing page and the public kiosk display.
 */
const GlobalBackButton = () => {
  const { pathname } = useLocation();
  const hidden =
    pathname === "/" ||
    pathname === "/pitch" ||
    pathname === "/roi" ||
    pathname === "/calculator" ||
    pathname === "/chaos-to-clarity" ||
    pathname === "/industries" ||
    pathname.startsWith("/display/") ||
    pathname.startsWith("/customer-dashboard") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pickup") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/signin") ||
    pathname.startsWith("/auth/forgot-password") ||
    pathname.startsWith("/auth/customer") ||
    pathname.startsWith("/auth/business") ||
    pathname.startsWith("/install");
  if (hidden) return null;
  return <BackButton />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <GlobalBackButton />
            <StageDemoSwitcher />
            <InstallAppPrompt />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pitch" element={<PitchDemo />} />
            <Route path="/roi" element={<RoiCalculatorPage />} />
            <Route path="/calculator" element={<RoiCalculatorPage />} />
            <Route path="/chaos-to-clarity" element={<ChaosToClarityPage />} />
            <Route path="/industries" element={<IndustryMorphPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<RoleSelection />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/customer" element={<CustomerSignUp />} />
            <Route path="/auth/business" element={<BusinessSignUp />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/insights" element={<Insights />} />
            <Route path="/dashboard/queue-health" element={<QueueHealth />} />
            <Route path="/dashboard/tokens" element={<Tokens />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/history" element={<QueueHistory />} />
            <Route path="/dashboard/pickup" element={<Pickup />} />
            <Route path="/dashboard/menu" element={<MenuManagement />} />
            <Route path="/join/:queueId" element={<JoinQueue />} />
            <Route path="/display/:queueId" element={<PublicDisplay />} />
            <Route path="/pickup/:businessId" element={<PickupOrder />} />
            <Route path="/pickup/track/:orderId" element={<PickupTrack />} />
            <Route path="/affiliate" element={<AffiliatePage />} />
            <Route path="/install" element={<Install />} />
            <Route path="/pwa-status" element={<PwaStatus />} />
            <Route path="/cache-diagnostics" element={<CacheDiagnostics />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/businesses" element={<AdminRoute><AdminBusinesses /></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
            <Route path="/admin/queues" element={<AdminRoute><AdminQueues /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
            <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
            <Route path="/admin/discovery" element={<AdminRoute><AdminDiscovery /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="/admin/marketing" element={<AdminRoute><AdminMarketing /></AdminRoute>} />
            <Route path="/admin/queue-templates" element={<AdminRoute><AdminQueueTemplates /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
            <Route path="/admin/impact" element={<AdminRoute><AdminImpact /></AdminRoute>} />
            <Route path="/admin/ai" element={<AdminRoute><AdminAIKnowledge /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/system" element={<AdminRoute><AdminSystem /></AdminRoute>} />
            <Route path="/admin/exports" element={<AdminRoute><AdminExports /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
