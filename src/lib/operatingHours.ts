export interface DayHours {
  closed: boolean;
  open: string;  // "09:00"
  close: string; // "18:00"
}

export interface Holiday {
  date: string; // "YYYY-MM-DD"
  label?: string;
}

export interface OperatingHours {
  days: DayHours[]; // length 7, index 0 = Sunday (matches Date.getDay())
  holidays: Holiday[];
}

export const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_DAY: DayHours = { closed: false, open: "09:00", close: "18:00" };

export const defaultOperatingHours = (): OperatingHours => ({
  days: Array.from({ length: 7 }, (_, i) => ({
    ...DEFAULT_DAY,
    closed: i === 0, // closed Sundays by default
  })),
  holidays: [],
});

const isTime = (v: unknown): v is string => typeof v === "string" && /^\d{2}:\d{2}$/.test(v);

/** Accepts whatever is stored in businesses.operating_hours and returns a safe shape, or null. */
export const normalizeOperatingHours = (raw: unknown): OperatingHours | null => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as any;
  if (!Array.isArray(obj.days)) return null;
  const base = defaultOperatingHours();
  const days: DayHours[] = base.days.map((d, i) => {
    const src = obj.days[i];
    if (!src || typeof src !== "object") return d;
    return {
      closed: !!src.closed,
      open: isTime(src.open) ? src.open : d.open,
      close: isTime(src.close) ? src.close : d.close,
    };
  });
  const holidays: Holiday[] = Array.isArray(obj.holidays)
    ? obj.holidays
        .filter((h: any) => h && typeof h.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(h.date))
        .map((h: any) => ({ date: h.date, label: typeof h.label === "string" ? h.label : undefined }))
    : [];
  return { days, holidays };
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh} ${suffix}` : `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatTime = fmtTime;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type OpenStatus = "open" | "closed" | "holiday" | "unknown";

export interface OpenState {
  status: OpenStatus;
  /** Short badge label, e.g. "Open until 6 PM" */
  label: string;
  /** Longer sentence for banners */
  detail: string;
  holidayLabel?: string;
}

/** Computes open/closed/holiday state in the viewer's local time. */
export const getOpenState = (raw: unknown, now: Date = new Date()): OpenState => {
  const hours = normalizeOperatingHours(raw);
  if (!hours) {
    return { status: "unknown", label: "Hours not set", detail: "This business hasn't published its opening hours yet." };
  }

  const key = toDateKey(now);
  const holiday = hours.holidays.find((h) => h.date === key);
  if (holiday) {
    return {
      status: "holiday",
      label: holiday.label ? `Closed — ${holiday.label}` : "Closed for holiday",
      detail: holiday.label
        ? `Closed today for ${holiday.label}.`
        : "Closed today for a scheduled holiday.",
      holidayLabel: holiday.label,
    };
  }

  const dow = now.getDay();
  const today = hours.days[dow];
  const mins = now.getHours() * 60 + now.getMinutes();

  const nextOpenDay = () => {
    for (let i = 1; i <= 7; i++) {
      const idx = (dow + i) % 7;
      const d = hours.days[idx];
      const dt = new Date(now);
      dt.setDate(dt.getDate() + i);
      if (d.closed || hours.holidays.some((h) => h.date === toDateKey(dt))) continue;
      return { label: i === 1 ? "tomorrow" : DAY_LABELS[idx], time: d.open };
    }
    return null;
  };

  if (!today.closed) {
    const openM = toMinutes(today.open);
    const closeM = toMinutes(today.close);
    const overnight = closeM <= openM;
    const isOpen = overnight ? mins >= openM || mins < closeM : mins >= openM && mins < closeM;
    if (isOpen) {
      return {
        status: "open",
        label: `Open until ${fmtTime(today.close)}`,
        detail: `Open now — closes at ${fmtTime(today.close)}.`,
      };
    }
    if (!overnight && mins < openM) {
      return {
        status: "closed",
        label: `Opens at ${fmtTime(today.open)}`,
        detail: `Closed right now — opens today at ${fmtTime(today.open)}.`,
      };
    }
  }

  const next = nextOpenDay();
  return {
    status: "closed",
    label: next ? `Opens ${next.label}` : "Closed",
    detail: next
      ? `Closed right now — opens ${next.label} at ${fmtTime(next.time)}.`
      : "Closed right now.",
  };
};

export const summarizeWeek = (hours: OperatingHours): string => {
  const open = hours.days.filter((d) => !d.closed);
  if (open.length === 0) return "Closed all week";
  const uniform = open.every((d) => d.open === open[0].open && d.close === open[0].close);
  if (uniform && open.length === 7) return `Open daily ${fmtTime(open[0].open)} – ${fmtTime(open[0].close)}`;
  if (uniform) return `${open.length} days · ${fmtTime(open[0].open)} – ${fmtTime(open[0].close)}`;
  return `${open.length} open days · varies`;
};
