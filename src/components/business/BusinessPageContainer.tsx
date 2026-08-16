import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BusinessPageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Single source of truth for horizontal alignment of every Business page
 * (Queue Manager, Dashboard, Analytics, Queue Configuration, Settings, ...).
 * Keeps content centered with symmetric gutters and prevents overflow.
 */
const BusinessPageContainer = ({ children, className }: BusinessPageContainerProps) => (
  <div className={cn("w-full max-w-6xl mx-auto min-w-0", className)}>{children}</div>
);

export default BusinessPageContainer;
