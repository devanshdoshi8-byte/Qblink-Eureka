import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Plus, Save, Trash2, Clock } from "lucide-react";
import {
  DAY_LABELS,
  DAY_SHORT,
  OperatingHours,
  defaultOperatingHours,
  getOpenState,
  normalizeOperatingHours,
  summarizeWeek,
} from "@/lib/operatingHours";

const OperatingHoursCard = ({ businessId }: { businessId: string }) => {
  const [hours, setHours] = useState<OperatingHours>(defaultOperatingHours());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayLabel, setHolidayLabel] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("operating_hours")
        .eq("id", businessId)
        .maybeSingle();
      if (!active) return;
      setHours(normalizeOperatingHours((data as any)?.operating_hours) ?? defaultOperatingHours());
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [businessId]);

  const setDay = (i: number, patch: Partial<OperatingHours["days"][number]>) =>
    setHours(h => ({ ...h, days: h.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) }));

  const applyToAll = (i: number) =>
    setHours(h => ({ ...h, days: h.days.map(d => (d.closed ? d : { ...d, open: h.days[i].open, close: h.days[i].close })) }));

  const addHoliday = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) { toast.error("Pick a valid date"); return; }
    if (hours.holidays.some(h => h.date === holidayDate)) { toast.error("That date is already added"); return; }
    setHours(h => ({
      ...h,
      holidays: [...h.holidays, { date: holidayDate, label: holidayLabel.trim() || undefined }]
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setHolidayDate("");
    setHolidayLabel("");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({ operating_hours: hours as any })
      .eq("id", businessId);
    setSaving(false);
    if (error) toast.error("Failed to save opening hours");
    else toast.success("Opening hours saved");
  };

  const state = getOpenState(hours);
  const tone =
    state.status === "open" ? "bg-success/10 text-success"
    : state.status === "holiday" ? "bg-warning/10 text-warning"
    : "bg-muted text-muted-foreground";

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow lg:col-span-2">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="font-bold text-foreground">Opening Hours & Holidays</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Customers see your open/closed status on discovery and the join page. Times use your local timezone.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tone}`}>
          {state.status === "open" ? "● " : ""}{state.label}
        </span>
        <span className="text-xs text-muted-foreground">{summarizeWeek(hours)}</span>
      </div>

      {!loaded ? (
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
      ) : (
        <>
          <div className="space-y-2">
            {hours.days.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
                <span className="w-20 text-sm font-medium text-foreground">
                  <span className="hidden sm:inline">{DAY_LABELS[i]}</span>
                  <span className="sm:hidden">{DAY_SHORT[i]}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDay(i, { closed: !d.closed })}
                  aria-label={`Toggle ${DAY_LABELS[i]} ${d.closed ? "open" : "closed"}`}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${!d.closed ? "gradient-bg" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${!d.closed ? "translate-x-5" : ""}`} />
                </button>
                {d.closed ? (
                  <span className="text-xs text-muted-foreground">Closed</span>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="time"
                      aria-label={`${DAY_LABELS[i]} opening time`}
                      value={d.open}
                      onChange={e => setDay(i, { open: e.target.value })}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="time"
                      aria-label={`${DAY_LABELS[i]} closing time`}
                      value={d.close}
                      onChange={e => setDay(i, { close: e.target.value })}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => applyToAll(i)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Apply to all
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Holiday closures</p>
            </div>
            {hours.holidays.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {hours.holidays.map(h => (
                  <li key={h.date} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2">
                    <span className="text-sm text-foreground truncate">
                      {h.date}{h.label ? ` · ${h.label}` : ""}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove holiday on ${h.date}`}
                      onClick={() => setHours(prev => ({ ...prev, holidays: prev.holidays.filter(x => x.date !== h.date) }))}
                      className="text-muted-foreground hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                aria-label="Holiday date"
                value={holidayDate}
                onChange={e => setHolidayDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
              <input
                type="text"
                aria-label="Holiday name"
                placeholder="Reason (optional)"
                value={holidayLabel}
                onChange={e => setHolidayLabel(e.target.value)}
                className="flex-1 min-w-[10rem] rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
              <button
                type="button"
                onClick={addHoliday}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-5 gradient-bg text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Hours"}
          </button>
        </>
      )}
    </div>
  );
};

export default OperatingHoursCard;
