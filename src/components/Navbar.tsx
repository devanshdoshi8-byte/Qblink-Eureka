import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/qblink-logo.png";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Industries", href: "/#industries" },
  { label: "Features", href: "/#features" },
  { label: "Affiliate", href: "/affiliate" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { isAdmin } = useIsAdmin();

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      if (isHome) {
        const el = document.querySelector(href.replace("/", ""));
        el?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="section-container flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-xl font-bold text-foreground">Qblink</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) =>
            l.href.startsWith("/") && !l.href.startsWith("/#") ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} onClick={(e) => { if (isHome && l.href.startsWith("/#")) { e.preventDefault(); handleNavClick(l.href); } }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            )
          )}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
              <Shield size={14} /> Admin
            </Link>
          )}
          <Link to="/auth" className="gradient-bg text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
            Dashboard
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((l) =>
                l.href.startsWith("/") && !l.href.startsWith("/#") ? (
                  <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} onClick={(e) => { if (isHome) { e.preventDefault(); handleNavClick(l.href); } else { setOpen(false); } }} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                    {l.label}
                  </a>
                )
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-sm font-semibold text-primary py-2">
                  <Shield size={14} /> Admin
                </Link>
              )}
              <Link to="/auth" onClick={() => setOpen(false)} className="gradient-bg text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold text-center">
                Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
