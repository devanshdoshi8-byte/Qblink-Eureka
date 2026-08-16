/**
 * Subtle haptic feedback helper. Falls back silently on devices/OSes that
 * don't support vibration (e.g. iOS Safari or desktop).
 */
export const haptic = (pattern: number | number[] = 15) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore unsupported devices
  }
};

export const hapticSuccess = () => haptic([40, 25, 40]);
export const hapticJoin = () => haptic([60, 30, 60]);
export const hapticCopy = () => haptic(20);
export const hapticRefresh = () => haptic(15);
