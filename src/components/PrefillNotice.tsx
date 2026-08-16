import { useState } from "react";
import { ShieldCheck, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  visible: boolean;
  onClear: () => void;
  onUpdate?: (name: string, phone: string) => void;
}

const PrefillNotice = ({ visible, onClear, onUpdate }: Props) => {
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => {
    try { return localStorage.getItem("qb_visitor_name") || ""; } catch { return ""; }
  });
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem("qb_visitor_phone") || ""; } catch { return ""; }
  });
  if (!visible || dismissed) return null;

  const clear = () => {
    try {
      localStorage.removeItem("qb_visitor_name");
      localStorage.removeItem("qb_visitor_phone");
    } catch {}
    onClear();
    toast.success("Saved details cleared from this device");
  };

  const optOut = () => {
    try {
      localStorage.setItem("qb_prefill_optout", "1");
      localStorage.removeItem("qb_visitor_name");
      localStorage.removeItem("qb_visitor_phone");
    } catch {}
    onClear();
    setDismissed(true);
    toast.success("Auto-fill turned off on this device");
  };

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      localStorage.setItem("qb_visitor_name", name.trim());
      localStorage.setItem("qb_visitor_phone", phone.trim());
      localStorage.removeItem("qb_prefill_optout");
    } catch {}
    onUpdate?.(name.trim(), phone.trim());
    setEditing(false);
    toast.success("Details updated on this device");
  };

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-left">
      <div className="flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-foreground font-medium">Prefilled from this device</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            Your name and phone are remembered locally on this device only — never shared with other businesses. You can clear them or turn auto-fill off anytime.
          </p>
          {editing ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-3">
                <button type="button" onClick={save} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                  <Check className="w-3 h-3" /> Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 mt-2">
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                <Pencil className="w-3 h-3" /> Change my details
              </button>
              <button type="button" onClick={clear} className="text-[11px] font-semibold text-primary hover:underline">
                Clear saved details
              </button>
              <button type="button" onClick={optOut} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline">
                Turn off auto-fill
              </button>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PrefillNotice;