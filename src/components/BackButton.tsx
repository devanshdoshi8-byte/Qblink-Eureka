import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to?: string;
  className?: string;
  label?: string;
}

/**
 * Small back button rendered at the top-left of a page.
 * Falls back to browser history when `to` is not provided.
 */
export const BackButton = ({ to, className, label = "Back" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "fixed top-4 left-4 z-50 inline-flex items-center gap-1 rounded-full",
        "bg-background/90 backdrop-blur border border-border shadow-sm",
        "px-2.5 py-1.5 text-xs font-medium text-foreground",
        "hover:bg-background hover:shadow transition-all",
        "md:top-6 md:left-8 md:px-3 md:py-2 md:text-sm",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default BackButton;