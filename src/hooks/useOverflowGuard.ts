import { useEffect, useState } from "react";

export interface OverflowReport {
  scrollWidth: number;
  viewportWidth: number;
  offenders: string[];
}

const describe = (el: Element) => {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const cls = (el.getAttribute("class") || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((c) => `.${c}`)
    .join("");
  return `${tag}${id}${cls}`;
};

/**
 * Dev-only guard: detects horizontal overflow and identifies the elements
 * whose bounding box extends past the viewport. No-op in production.
 */
export const useOverflowGuard = (enabled = import.meta.env.DEV) => {
  const [report, setReport] = useState<OverflowReport | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;

    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;

        if (scrollWidth <= viewportWidth + 1) {
          setReport(null);
          return;
        }

        const offenders: string[] = [];
        document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
          if (offenders.length >= 5) return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          if (rect.right > viewportWidth + 1 || rect.left < -1) {
            // skip if an ancestor already reported
            if (offenders.some((o) => el.parentElement && o === describe(el.parentElement))) return;
            offenders.push(describe(el));
          }
        });

        setReport({ scrollWidth, viewportWidth, offenders });
        // eslint-disable-next-line no-console
        console.warn(
          `[overflow-guard] Horizontal overflow: ${scrollWidth}px content in ${viewportWidth}px viewport`,
          offenders
        );
      });
    };

    check();
    window.addEventListener("resize", check);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", check);
      observer.disconnect();
    };
  }, [enabled]);

  return report;
};
