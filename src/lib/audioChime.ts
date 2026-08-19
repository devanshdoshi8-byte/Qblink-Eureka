/**
 * Synthesized Web Audio API Chime Engine for Qblink Staff Command Center.
 * Zero external audio files required. Produces clean, harmonic bells for
 * customer arrivals and next-in-line dispatches.
 */

const AUDIO_STORAGE_KEY = "qblink:staffAudioEnabled";

export const isStaffAudioEnabled = (): boolean => {
  try {
    const item = localStorage.getItem(AUDIO_STORAGE_KEY);
    return item === null ? true : item === "true";
  } catch {
    return true;
  }
};

export const setStaffAudioEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, String(enabled));
  } catch {}
};

/**
 * Plays a pleasant double chime (C5 -> E5) when a new customer joins the line.
 */
export const playArrivalChime = (): void => {
  if (!isStaffAudioEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // Note 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Note 2: E5 (659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.14, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.58);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);
  } catch {}
};

/**
 * Plays an upbeat ascending triad (E5 -> G5 -> C6) when staff calls next token.
 */
export const playCallNextChime = (): void => {
  if (!isStaffAudioEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
    notes.forEach((freq, i) => {
      const start = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);
  } catch {}
};
