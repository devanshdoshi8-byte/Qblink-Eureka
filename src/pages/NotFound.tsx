import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, LifeBuoy } from "lucide-react";
import logo from "@/assets/qblink-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-card rounded-3xl card-shadow p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-lg font-bold text-foreground">Qblink</span>
        </Link>
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">This page doesn't exist</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The link may be broken, the queue may have closed, or the page has moved.
          Try one of the options below to get back on track.
        </p>
        <div className="grid gap-2">
          <Link to="/" className="gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <button onClick={() => window.history.back()} className="bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/70 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/#contact" className="text-primary text-xs font-medium inline-flex items-center justify-center gap-1.5 mt-1 hover:underline">
            <LifeBuoy className="w-3.5 h-3.5" /> Need help? Contact us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
