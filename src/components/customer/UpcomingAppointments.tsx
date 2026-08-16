import { useState } from "react";
import { CalendarClock, Plus, X, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAppointments } from "@/hooks/useCustomerRealtime";
import { Skeleton } from "@/components/ui/skeleton";
import { hapticSuccess } from "@/lib/haptics";

interface BookableBusiness { id: string; name: string }

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const UpcomingAppointments = ({ businesses = [], customerName = "" }: { businesses?: BookableBusiness[]; customerName?: string }) => {
  const { user } = useAuth();
  const { appointments, loading, cancel, refresh } = useCustomerAppointments();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ business_id: "", scheduled_at: "", party_size: 1, service_name: "", notes: "" });

  const book = async () => {
    if (!user) return;
    if (!form.business_id || !form.scheduled_at) { toast.error("Pick a business and a time"); return; }
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      business_id: form.business_id,
      customer_user_id: user.id,
      customer_name: customerName || user.email?.split("@")[0] || "Customer",
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      party_size: Number(form.party_size) || 1,
      service_name: form.service_name || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    hapticSuccess();
    toast.success("Appointment scheduled");
    setOpen(false);
    setForm({ business_id: "", scheduled_at: "", party_size: 1, service_name: "", notes: "" });
    refresh();
  };

  return (
    <section className="mb-8" data-reserved-height>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <CalendarClock className="w-4.5 h-4.5 text-primary" /> Upcoming appointments
        </h2>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-card rounded-2xl card-shadow p-5 text-sm text-muted-foreground">
          No appointments booked. Schedule one to skip the wait entirely.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {appointments.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl card-shadow p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate">{a.businesses?.name || "Appointment"}</p>
                <p className="text-xs text-primary font-medium mt-0.5">{fmt(a.scheduled_at)}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration_minutes} min</span>
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{a.party_size}</span>
                  <span className="capitalize">{a.status}</span>
                </div>
                {a.service_name && <p className="text-[11px] text-muted-foreground mt-1 truncate">{a.service_name}</p>}
              </div>
              <button onClick={() => cancel(a.id)} aria-label="Cancel appointment" className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Schedule an appointment</h3>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <select
                value={form.business_id}
                onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm"
                aria-label="Business"
              >
                <option value="">Select a business…</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm"
                aria-label="Date and time"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number" min={1} max={50} value={form.party_size}
                  onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm"
                  aria-label="Party size"
                />
                <input
                  placeholder="Service (optional)" value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm"
                />
              </div>
              <textarea
                rows={2} placeholder="Notes (optional)" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm"
              />
              <button
                onClick={book} disabled={saving}
                className="w-full gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Scheduling…" : "Confirm appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UpcomingAppointments;