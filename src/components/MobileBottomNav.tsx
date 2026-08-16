import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export interface BottomNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface Props {
  items: BottomNavItem[];
}

/**
 * App-style bottom navigation. Mobile-only (hidden md+).
 * Pages that include this should add `pb-20 md:pb-0` to their main scroll area
 * so content is not hidden behind the fixed bar.
 */
const MobileBottomNav = ({ items }: Props) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around max-w-xl mx-auto px-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="leading-tight truncate max-w-full">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
