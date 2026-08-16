/**
 * jsdom has no layout engine, so CLS is computed against a deterministic
 * block-flow model: every leaf element stacks vertically with a fixed height.
 * Identity is derived from an element's position in its parent chain + tag,
 * so an element that keeps its place across a re-render keeps its identity and
 * any change to the elements above it registers as a shift — exactly what CLS
 * penalises in a real browser.
 */

const LEAF_HEIGHT = 24;
const VIEWPORT_HEIGHT = 800;
const VIEWPORT_WIDTH = 390;

export interface LayoutBox {
  top: number;
  height: number;
}

export type LayoutSnapshot = Map<string, LayoutBox>;

const keyOf = (el: Element): string => {
  const path: string[] = [];
  let node: Element | null = el;
  while (node && node.parentElement) {
    path.unshift(`${node.tagName}:${Array.prototype.indexOf.call(node.parentElement.children, node)}`);
    node = node.parentElement;
  }
  return path.join("/");
};

/** Lay a rendered container out as a simple vertical block flow. */
export const measureLayout = (container: HTMLElement): LayoutSnapshot => {
  const snapshot: LayoutSnapshot = new Map();
  let cursor = 0;
  const walk = (el: Element, tracked = true) => {
    // Skeleton placeholders are aria-hidden. They occupy space (so parents
    // keep their footprint) but they are NOT the same element as the content
    // that replaces them, so they must never be matched across frames — a
    // browser only scores movement of elements present in both frames.
    const visible = tracked && el.getAttribute("aria-hidden") !== "true";
    const children = Array.from(el.children);
    if (!children.length) {
      if (visible) snapshot.set(keyOf(el), { top: cursor, height: LEAF_HEIGHT });
      cursor += LEAF_HEIGHT;
      return;
    }
    const start = cursor;
    children.forEach((child) => walk(child, visible));
    // Cards that declare a reserved footprint are fixed-height boxes (their
    // inner list scrolls), so however much content arrives, siblings below
    // never move. That is what keeps skeleton -> data transitions CLS-free.
    const reserved = Number((el as HTMLElement).dataset?.reservedHeight ?? 0);
    const height = reserved > 0 ? reserved : cursor - start;
    cursor = start + height;
    if (visible) snapshot.set(keyOf(el), { top: start, height });
  };
  walk(container);
  return snapshot;
};

/**
 * Layout shift score between two snapshots, following the browser formula:
 * impact fraction x distance fraction, over unstable elements (present in
 * both frames but moved).
 */
export const layoutShiftScore = (before: LayoutSnapshot, after: LayoutSnapshot): number => {
  let maxDistance = 0;
  let impactTop = Infinity;
  let impactBottom = -Infinity;

  for (const [key, prev] of before) {
    const next = after.get(key);
    if (!next) continue;
    const distance = Math.abs(next.top - prev.top);
    if (distance === 0) continue;
    maxDistance = Math.max(maxDistance, distance);
    impactTop = Math.min(impactTop, prev.top, next.top);
    impactBottom = Math.max(impactBottom, prev.top + prev.height, next.top + next.height);
  }

  if (maxDistance === 0) return 0;
  const impactFraction = Math.min(1, (impactBottom - impactTop) / VIEWPORT_HEIGHT);
  const distanceFraction = Math.min(1, maxDistance / VIEWPORT_HEIGHT);
  return Number((impactFraction * distanceFraction).toFixed(4));
};

export const VIEWPORT = { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT };
