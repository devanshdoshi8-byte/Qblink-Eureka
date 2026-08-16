import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Focus return: when keyboard focus moves into the toast stack (via Alt+T,
  // Tab, or clicking a toast action) and the focused toast is dismissed or
  // times out, restore focus to whatever was focused beforehand.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let previouslyFocused: HTMLElement | null = null;

    const isInToaster = (el: Element | null) =>
      !!el && !!(el as HTMLElement).closest?.("[data-sonner-toaster]");

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      const related = (e as FocusEvent & { relatedTarget: EventTarget | null }).relatedTarget as
        | HTMLElement
        | null;
      // Focus entered the toaster from outside — remember where we came from.
      if (isInToaster(target) && !isInToaster(related)) {
        if (related && document.contains(related)) {
          previouslyFocused = related;
        }
      }
    };

    const restore = () => {
      const el = previouslyFocused;
      previouslyFocused = null;
      if (!el || !document.contains(el)) return;
      // Only restore if focus has landed on <body> (i.e. was lost when the
      // toast was removed). Don't steal focus if the user has moved on.
      if (document.activeElement && document.activeElement !== document.body) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (!previouslyFocused) return;
      for (const m of mutations) {
        for (const node of Array.from(m.removedNodes)) {
          if (node.nodeType !== 1) continue;
          const el = node as HTMLElement;
          if (el.matches?.("[data-sonner-toast]") || el.querySelector?.("[data-sonner-toast]")) {
            // Wait a tick for Sonner to finish its own focus juggling.
            setTimeout(restore, 0);
            return;
          }
        }
      }
    });

    document.addEventListener("focusin", handleFocusIn, true);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      observer.disconnect();
    };
  }, []);

  // More forgiving swipe on mobile: shorter distance to dismiss + tighter offset.
  const mobileOffset = isMobile ? 12 : 16;

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "top-right"}
      expand
      visibleToasts={isMobile ? 3 : 4}
      gap={10}
      offset={mobileOffset}
      duration={4200}
      closeButton
      swipeDirections={isMobile ? ["top", "left", "right"] : ["right", "top"]}
      hotkey={["altKey", "KeyT"]}
      pauseWhenPageIsHidden
      containerAriaLabel="Notifications"
      style={
        {
          // Sonner reads these for swipe follow + snap behavior.
          "--swipe-threshold": isMobile ? "32px" : "55px",
          "--width": isMobile ? "min(92vw, 380px)" : "356px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast qb-toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-elevated group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-primary/30",
          error: "group-[.toaster]:border-destructive/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
