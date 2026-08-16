import {
  ArrowRight, Check, Eye, Info, Plus, Sparkles, Trash2,
  Users, Utensils, Wand2, X, Zap,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TableSize {
  seats: number;
  count: number;
}

export const COMMON_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 8, 10];
export type PartySizeMode = "common" | "custom";

interface Props {
  tables: TableSize[];
  onChange: (next: TableSize[]) => void;
  policy: "strict" | "flexible";
  onPolicyChange: (next: "strict" | "flexible") => void;
  partySizes: number[];
  onPartySizesChange: (next: number[]) => void;
  partySizeMode: PartySizeMode;
  onPartySizeModeChange: (next: PartySizeMode) => void;
}

const RestaurantTableConfig = ({
  tables,
  onChange,
  policy,
  onPolicyChange,
  partySizes,
  onPartySizesChange,
  partySizeMode,
  onPartySizeModeChange,
}: Props) => {
  const [customInput, setCustomInput] = useState("");
  const [previewMode, setPreviewMode] = useState<"flexible" | "strict" | null>(null);
  const [learnMore, setLearnMore] = useState(false);
  const [justSelected, setJustSelected] = useState<"flexible" | "strict" | null>(null);
  const learnMoreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const flexibleCardRef = useRef<HTMLDivElement | null>(null);
  const strictCardRef = useRef<HTMLDivElement | null>(null);

  const selectPolicy = (next: "flexible" | "strict") => {
    onPolicyChange(next);
    setJustSelected(next);
    window.setTimeout(() => setJustSelected((c) => (c === next ? null : c)), 900);
  };

  const handlePolicyKeyDown = (e: React.KeyboardEvent, current: "flexible" | "strict") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectPolicy(current);
      return;
    }
    if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      const next = current === "flexible" ? "strict" : "flexible";
      selectPolicy(next);
      (next === "flexible" ? flexibleCardRef : strictCardRef).current?.focus();
    }
  };

  const update = (idx: number, patch: Partial<TableSize>) => {
    const next = tables.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(next);
  };
  const remove = (idx: number) => onChange(tables.filter((_, i) => i !== idx));
  const add = () => onChange([...tables, { seats: 2, count: 1 }]);

  const toggleCommon = (n: number) => {
    const has = partySizes.includes(n);
    const next = has ? partySizes.filter((x) => x !== n) : [...partySizes, n];
    onPartySizesChange(next.sort((a, b) => a - b));
  };
  const addCustom = () => {
    const n = Math.max(1, Math.min(50, parseInt(customInput) || 0));
    if (!n || partySizes.includes(n)) { setCustomInput(""); return; }
    onPartySizesChange([...partySizes, n].sort((a, b) => a - b));
    setCustomInput("");
  };
  const removeSize = (n: number) => onPartySizesChange(partySizes.filter((x) => x !== n));

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">Table sizes</label>
        <div className="space-y-2">
          {tables.length === 0 && (
            <p className="text-xs text-muted-foreground">No tables configured yet — add at least one.</p>
          )}
          {tables.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground">Seats</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={t.seats}
                  onChange={(e) => update(i, { seats: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground"># Tables</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={t.count}
                  onChange={(e) => update(i, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-4 px-2.5 py-2 rounded-lg bg-danger-soft text-danger hover:bg-danger-soft transition-colors"
                aria-label="Remove table size"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Table Size
        </button>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">Available Party Sizes</label>
        <p className="text-[11px] text-muted-foreground mb-2">
          These are the party sizes customers can pick from when joining.
        </p>
        <div className="flex gap-2 mb-3">
          {(["common", "custom"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onPartySizeModeChange(m)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                partySizeMode === m ? "gradient-bg text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {partySizeMode === "common" ? (
          <div className="flex flex-wrap gap-2">
            {COMMON_PARTY_SIZES.map((n) => {
              const active = partySizes.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleCommon(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n === 10 ? "10+" : n}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {partySizes.length === 0 && (
                <p className="text-xs text-muted-foreground">No sizes added yet.</p>
              )}
              {partySizes.map((n) => (
                <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-semibold">
                  {n}
                  <button type="button" onClick={() => removeSize(n)} aria-label={`Remove ${n}`} className="hover:text-primary/70">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                placeholder="Add size"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <Plus className="w-3.5 h-3.5 inline" /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground tracking-tight">Restaurant Seating Policy</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug mt-1 max-w-md">
                Choose how customers are assigned to tables before joining your queues.
              </p>
            </div>
            <button
              type="button"
              ref={learnMoreTriggerRef}
              onClick={() => setLearnMore(true)}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background px-1 py-0.5"
              aria-haspopup="dialog"
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" /> Learn more about seating policies
            </button>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-2 mt-4"
            role="radiogroup"
            aria-label="Restaurant seating policy"
          >
            <PolicyCard
              cardRef={flexibleCardRef}
              active={policy === "flexible"}
              justSelected={justSelected === "flexible"}
              onSelect={() => selectPolicy("flexible")}
              onPreview={(trigger) => { previewTriggerRef.current = trigger; setPreviewMode("flexible"); }}
              onKeyDown={(e) => handlePolicyKeyDown(e, "flexible")}
              icon={<Wand2 className="w-4 h-4" />}
              title="Flexible Matching"
              badge="Recommended"
              tagline="Customers just say party size. Qblink finds the best-fit table queue automatically."
              benefits={[
                "Fastest customer experience",
                "Lowest joining friction",
                "Higher completion rate",
                "Automatic queue assignment",
                "Best for most restaurants",
              ]}
              suited={["Cafes", "Casual Dining", "Family Restaurants", "Fast Food"]}
              flow={["Party size", "Auto-assign", "Queued"]}
            />
            <PolicyCard
              cardRef={strictCardRef}
              active={policy === "strict"}
              justSelected={justSelected === "strict"}
              onSelect={() => selectPolicy("strict")}
              onPreview={(trigger) => { previewTriggerRef.current = trigger; setPreviewMode("strict"); }}
              onKeyDown={(e) => handlePolicyKeyDown(e, "strict")}
              icon={<Users className="w-4 h-4" />}
              title="Strict Matching"
              tagline="Customers explicitly pick one of your configured seating categories before joining."
              benefits={[
                "Maximum seating control",
                "Exact table allocation",
                "Best for reservations",
                "Best for fixed seating policies",
              ]}
              suited={["Fine Dining", "Luxury", "Reservation-only", "Fixed layouts"]}
              flow={["Seat category", "Join queue", "Queued"]}
            />
          </div>

          <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-3 flex gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11.5px] text-foreground/80 leading-snug">
              <span className="font-semibold text-foreground">Most restaurants benefit from Flexible Matching</span> —
              customers join faster while Qblink manages queue assignment behind the scenes.
              Use <span className="font-semibold text-foreground">Strict Matching</span> only for fixed seating
              policies or reservation-based operations.
            </p>
          </div>
        </div>

        {previewMode && (
          <CustomerPreviewModal
            mode={previewMode}
            tables={tables}
            partySizes={partySizes}
            onClose={() => { setPreviewMode(null); previewTriggerRef.current?.focus(); }}
          />
        )}
        {learnMore && (
          <LearnMoreModal
            onClose={() => { setLearnMore(false); learnMoreTriggerRef.current?.focus(); }}
          />
        )}
      </div>
    </div>
  );
};

export default RestaurantTableConfig;

// ---------- Policy card ----------

interface PolicyCardProps {
  active: boolean;
  justSelected: boolean;
  onSelect: () => void;
  onPreview: (trigger: HTMLButtonElement) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  cardRef?: React.Ref<HTMLDivElement>;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  tagline: string;
  benefits: string[];
  suited: string[];
  flow: string[];
}

const PolicyCard = ({
  active, justSelected, onSelect, onPreview, onKeyDown, cardRef, icon, title, badge, tagline, benefits, suited, flow,
}: PolicyCardProps) => {
  const titleId = useId();
  const descId = useId();
  return (
  <div
    ref={cardRef}
    className={`group relative rounded-2xl border p-4 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      active
        ? "border-primary bg-primary/[0.06] ring-2 ring-primary/30 shadow-lg shadow-primary/10 -translate-y-0.5"
        : "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md"
    }`}
    onClick={onSelect}
    role="radio"
    aria-checked={active}
    tabIndex={active ? 0 : -1}
    aria-labelledby={titleId}
    aria-describedby={descId}
    onKeyDown={onKeyDown}
  >
    {active && (
      <div aria-hidden="true" className={`absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-bg text-primary-foreground flex items-center justify-center shadow-md ${justSelected ? "animate-check-pop" : ""}`}>
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </div>
    )}
    <div className="flex items-center gap-2 mb-1">
      <span aria-hidden="true" className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? "gradient-bg text-primary-foreground" : "bg-primary/10 text-primary"}`}>
        {icon}
      </span>
      <p id={titleId} className="text-sm font-bold text-foreground">{title}</p>
      {badge && (
        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
          <Sparkles className="w-2.5 h-2.5" aria-hidden="true" /> {badge}
        </span>
      )}
    </div>
    <p id={descId} className="text-[11.5px] text-muted-foreground leading-snug mb-3">{tagline}</p>

    <ul className="space-y-1 mb-3">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-1.5 text-[11px] text-foreground/85">
          <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" strokeWidth={3} aria-hidden="true" />
          <span>{b}</span>
        </li>
      ))}
    </ul>

    <div className="mb-3">
      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Suitable for</p>
      <div className="flex flex-wrap gap-1">
        {suited.map((s) => (
          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50">{s}</span>
        ))}
      </div>
    </div>

    <div className="rounded-lg bg-muted/40 border border-border/60 p-2 mb-3">
      <div className="flex items-center justify-between gap-1 text-[10px]">
        {flow.map((step, i) => (
          <div key={step} className="contents">
            <span className={`px-1.5 py-0.5 rounded font-semibold ${i === 1 && active ? "gradient-bg text-primary-foreground" : "bg-card text-foreground/70 border border-border/50"}`}>
              {step}
            </span>
            {i < flow.length - 1 && <ArrowRight aria-hidden="true" className={`w-3 h-3 shrink-0 ${active ? "text-primary animate-pulse" : "text-muted-foreground/60"}`} />}
          </div>
        ))}
      </div>
    </div>

    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPreview(e.currentTarget); }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-haspopup="dialog"
      aria-label={`Preview ${title} customer experience`}
      className="w-full inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold px-3 py-2 rounded-lg border border-primary/40 bg-card text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Preview customer experience
    </button>
  </div>
  );
};

// ---------- Modal a11y hook: Escape + focus trap + autofocus ----------

function useModalA11y(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("aria-hidden"));

    // Move initial focus into the dialog
    window.setTimeout(() => {
      const focusables = getFocusable();
      (focusables[0] ?? containerRef.current)?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = getFocusable();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [onClose]);

  return containerRef;
}

// ---------- Customer preview modal (phone mockup) ----------

const CustomerPreviewModal = ({
  mode, tables, partySizes, onClose,
}: { mode: "flexible" | "strict"; tables: TableSize[]; partySizes: number[]; onClose: () => void }) => {
  const [chosen, setChosen] = useState<number | null>(null);
  const [routed, setRouted] = useState<number | null>(null);
  const containerRef = useModalA11y(onClose);
  const titleId = useId();
  const descId = useId();
  const statusId = useId();

  const seatOptions = Array.from(new Set(tables.map((t) => t.seats))).sort((a, b) => a - b);
  const partyChips = mode === "flexible"
    ? (partySizes.length ? partySizes : [1, 2, 3, 4, 5, 6])
    : seatOptions;

  // Demo waiting counts per seat-size queue (visual only — no backend).
  const demoWaits: Record<number, number> = { 2: 3, 4: 5, 6: 2, 8: 1, 10: 1 };
  const lanes = (seatOptions.length ? seatOptions : [2, 4, 6]).slice(0, 5);
  const routedIndex = routed != null ? lanes.indexOf(routed) : -1;

  const handlePick = (n: number) => {
    setChosen(n);
    if (mode === "flexible" && seatOptions.length) {
      const fit = seatOptions.find((s) => s >= n) ?? seatOptions[seatOptions.length - 1];
      setTimeout(() => setRouted(fit), 550);
    } else {
      setRouted(n);
    }
  };

  const body = (
    <div
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p id={descId} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer preview</p>
            <p id={titleId} className="text-sm font-bold text-foreground">{mode === "flexible" ? "Flexible Matching" : "Strict Matching"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer preview"
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 bg-gradient-to-b from-muted/40 to-transparent">
          {/* Phone frame */}
          <div aria-hidden="true" className="mx-auto w-[280px] rounded-[2rem] border-[10px] border-foreground/90 bg-background shadow-xl overflow-hidden">
            <div className="h-5 bg-foreground/90 relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-1 w-14 h-3 rounded-full bg-background/20" />
            </div>
            <div className="p-4 min-h-[380px] space-y-3">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Restaurant</p>
                <p className="text-[13px] font-bold text-foreground">Main Counter</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground mb-2 text-center">
                  {mode === "flexible" ? "How many people are joining today?" : "Choose seating category"}
                </p>
                <div
                  className="grid grid-cols-4 gap-1.5"
                  role="radiogroup"
                  aria-label={mode === "flexible" ? "Party size" : "Seating category"}
                >
                  {partyChips.map((n) => {
                    const active = chosen === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => handlePick(n)}
                        className={`aspect-square rounded-lg border text-[13px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          active
                            ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                      >
                        {mode === "strict" ? `${n}` : (n === partyChips[partyChips.length - 1] && mode === "flexible" && partyChips.length > 6 ? `${n}+` : n)}
                      </button>
                    );
                  })}
                </div>
                {mode === "strict" && <p className="text-[9px] text-muted-foreground text-center mt-1">seats</p>}
              </div>

              <div id={statusId} role="status" aria-live="polite" className="space-y-2">
              {chosen != null && (
                <div className="space-y-2 animate-fade-in">
                  <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Party of {chosen}</p>
                    {mode === "flexible" ? (
                      routed ? (
                        <p className="text-[11px] font-semibold text-foreground mt-0.5">
                          <Zap className="w-3 h-3 inline text-primary mr-0.5" aria-hidden="true" />
                          Auto-assigned to {routed}-seat table queue
                        </p>
                      ) : (
                        <p className="text-[10px] text-primary mt-0.5 animate-pulse">Finding best table…</p>
                      )
                    ) : (
                      <p className="text-[11px] font-semibold text-foreground mt-0.5">
                        {chosen}-seat queue selected
                      </p>
                    )}
                  </div>
                  {(mode === "strict" || routed) && (
                    <button type="button" className="w-full py-2 rounded-lg gradient-bg text-primary-foreground text-[12px] font-bold">
                      Join Queue
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-card border border-border p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">What happens internally</p>
            <p className="text-[11px] text-foreground/80 leading-snug">
              {mode === "flexible"
                ? "Qblink reads the party size and routes the customer to the smallest configured seating queue that fits. The customer never sees internal queue names."
                : "The customer is placed into the exact seating queue they selected. Each seating category runs as an independent queue with its own metrics."}
            </p>
          </div>

          {/* Routing visualization */}
          <div className="mt-3 rounded-lg bg-card border border-border p-3" aria-hidden="true">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Internal queue routing
              </p>
              <span className="text-[9.5px] font-semibold text-muted-foreground/80">Demo values</span>
            </div>

            <div className="relative pt-6">
              {/* Traveler dot */}
              <div
                className="absolute top-0 left-0 h-4 w-4 rounded-full gradient-bg shadow-md shadow-primary/40 flex items-center justify-center text-[8px] font-bold text-primary-foreground transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: chosen != null ? 1 : 0,
                  transform:
                    routedIndex >= 0
                      ? `translateX(calc(${(routedIndex + 0.5) * (100 / lanes.length)}% - 0.5rem)) translateY(0)`
                      : `translateX(calc(50% - 0.5rem)) translateY(-2px)`,
                }}
              >
                {chosen ?? ""}
              </div>

              {/* Routing rail */}
              <div className="relative h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-2" />

              {/* Lanes */}
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))` }}>
                {lanes.map((seats, i) => {
                  const isRouted = routedIndex === i;
                  const waiting = (demoWaits[seats] ?? Math.max(1, 6 - i)) + (isRouted ? 1 : 0);
                  return (
                    <div
                      key={seats}
                      className={`relative rounded-md border p-1.5 text-center transition-all duration-300 ${
                        isRouted
                          ? "border-primary bg-primary/10 shadow-sm shadow-primary/20 -translate-y-0.5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      {isRouted && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />
                      )}
                      <p className={`text-[9px] font-semibold uppercase tracking-wide ${isRouted ? "text-primary" : "text-muted-foreground"}`}>
                        {seats}-seat
                      </p>
                      <p className={`text-[12px] font-bold leading-none mt-0.5 tabular-nums ${isRouted ? "text-foreground" : "text-foreground/70"}`}>
                        {waiting}
                      </p>
                      <p className="text-[8.5px] text-muted-foreground/80 mt-0.5">waiting</p>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 leading-snug min-h-[1.4em]">
                {chosen == null ? (
                  mode === "flexible"
                    ? "Pick a party size above to see Qblink pick the best-fit queue."
                    : "Pick a seat category above to see it slot into its own queue."
                ) : routed == null ? (
                  <span className="text-primary">Routing party of {chosen}…</span>
                ) : (
                  <span>
                    <span className="font-semibold text-foreground">Party of {chosen}</span>{" "}
                    {mode === "flexible" ? "auto-routed" : "placed"} into the{" "}
                    <span className="font-semibold text-foreground">{routed}-seat</span> queue.
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setChosen(null); setRouted(null); }}
            className="mt-3 w-full text-[11px] font-semibold text-primary hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-1"
          >
            Reset preview
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(body, document.body);
};

// ---------- Learn more modal ----------

const LearnMoreModal = ({ onClose }: { onClose: () => void }) => {
  const containerRef = useModalA11y(onClose);
  const titleId = useId();
  const descId = useId();

  const body = (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <p id={titleId} className="text-base font-bold text-foreground">Seating policies, explained</p>
            <p id={descId} className="text-[12px] text-muted-foreground mt-0.5">Why two modes exist, which one fits your restaurant, and what changes for you and your customers.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close seating policies help"
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Why this exists */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <svg aria-hidden="true" viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="10" y="20" width="18" height="24" rx="3" />
                  <rect x="36" y="14" width="18" height="30" rx="3" />
                  <path d="M28 32h8" />
                  <path d="M42 8v6M20 14v6" />
                  <circle cx="46" cy="46" r="8" className="fill-primary/15" />
                  <path d="M43 46l3 3 5-5" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground mb-1">Why this matters</h3>
                <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                  A single queue for every table size creates unfair waits: a party of two should not wait behind a party of six when a two-seat table is open. Qblink keeps an independent queue for each table size so every party is matched to a seat that actually fits — automatically or by choice.
                </p>
              </div>
            </div>
          </div>

          {/* Flexible vs Strict comparison */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl gradient-bg text-primary-foreground flex items-center justify-center">
                  <Wand2 className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Flexible Matching</p>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Recommended</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug mb-4">
                Customers tap how many people are joining. Qblink silently routes them to the smallest available table queue that fits.
              </p>

              <div className="flex justify-center mb-4">
                <svg aria-hidden="true" viewBox="0 0 220 88" className="w-full max-w-[220px] h-auto text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="52" width="36" height="28" rx="5" className="fill-primary/8" />
                  <rect x="60" y="40" width="48" height="40" rx="5" className="fill-primary/8" />
                  <rect x="124" y="48" width="40" height="32" rx="5" className="fill-primary/8" />
                  <rect x="180" y="32" width="32" height="48" rx="5" className="fill-primary/15" />
                  <text x="26" y="44" fontSize="10" textAnchor="middle" className="fill-current">2</text>
                  <text x="84" y="32" fontSize="10" textAnchor="middle" className="fill-current">4</text>
                  <text x="144" y="40" fontSize="10" textAnchor="middle" className="fill-current">6</text>
                  <text x="196" y="24" fontSize="10" textAnchor="middle" className="fill-current">8</text>
                  <circle cx="26" cy="20" r="9" className="fill-primary/15" />
                  <text x="26" y="23" fontSize="9" textAnchor="middle" className="fill-current">3</text>
                  <path d="M35 20h70" strokeDasharray="3 2" />
                  <path d="M105 20l-4-3M105 20l-4 3" />
                </svg>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Best for</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Cafes", "Casual Dining", "Family Restaurants", "Fast Food"].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Customer experience</p>
                  <p className="text-[11.5px] text-foreground/80 leading-snug">One question, one tap. No table categories to understand. Just “How many people?” and a live wait.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Operational benefits</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Faster joins, fewer drop-offs</li>
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Automatic best-fit routing</li>
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Independent metrics per table size</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Strict Matching</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Fixed categories</p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug mb-4">
                Customers explicitly choose one of your configured seating categories. Each category runs its own queue with its own metrics.
              </p>

              <div className="flex justify-center mb-4">
                <svg aria-hidden="true" viewBox="0 0 220 96" className="w-full max-w-[220px] h-auto text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="52" width="36" height="28" rx="5" className="fill-primary/8" />
                  <rect x="60" y="40" width="48" height="40" rx="5" className="fill-primary/15" />
                  <rect x="124" y="48" width="40" height="32" rx="5" className="fill-primary/8" />
                  <rect x="180" y="32" width="32" height="48" rx="5" className="fill-primary/8" />
                  <text x="26" y="44" fontSize="10" textAnchor="middle" className="fill-current">2</text>
                  <text x="84" y="32" fontSize="10" textAnchor="middle" className="fill-current font-bold">4</text>
                  <text x="144" y="40" fontSize="10" textAnchor="middle" className="fill-current">6</text>
                  <text x="196" y="24" fontSize="10" textAnchor="middle" className="fill-current">8</text>
                  <circle cx="84" cy="18" r="9" className="fill-primary/15" />
                  <text x="84" y="21" fontSize="9" textAnchor="middle" className="fill-current">4</text>
                  <path d="M84 27v13" />
                  <path d="M80 37l4 3 4-3" />
                </svg>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Best for</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Fine Dining", "Luxury", "Reservation-only", "Fixed layouts"].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Customer experience</p>
                  <p className="text-[11.5px] text-foreground/80 leading-snug">Guests pick the seating category they want — booth, terrace, bar, private table — and wait for exactly that.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">Operational benefits</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Exact table allocation control</li>
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Category-level wait forecasts</li>
                    <li className="flex items-start gap-1.5 text-[11.5px] text-foreground/80"><Check className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true" /> Preserves seating as part of brand</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Customer experience and operational impact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Utensils className="w-4 h-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-foreground">What customers see</p>
              </div>
              <div className="flex justify-center mb-3">
                <svg aria-hidden="true" viewBox="0 0 160 120" className="w-32 h-auto text-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="20" y="8" width="120" height="104" rx="14" className="fill-card" />
                  <rect x="36" y="24" width="88" height="16" rx="4" className="fill-muted/60" />
                  <rect x="40" y="32" width="56" height="3" rx="1.5" className="fill-muted-foreground/30" />
                  <rect x="44" y="52" width="28" height="22" rx="5" className="fill-primary/15" stroke="hsl(var(--primary))" />
                  <rect x="80" y="52" width="28" height="22" rx="5" className="fill-primary/8" />
                  <rect x="44" y="82" width="28" height="22" rx="5" className="fill-primary/8" />
                  <rect x="80" y="82" width="28" height="22" rx="5" className="fill-primary/8" />
                  <text x="58" y="66" fontSize="8" textAnchor="middle" className="fill-current font-bold">2</text>
                  <text x="94" y="66" fontSize="8" textAnchor="middle" className="fill-current">3</text>
                  <text x="58" y="96" fontSize="8" textAnchor="middle" className="fill-current">4</text>
                  <text x="94" y="96" fontSize="8" textAnchor="middle" className="fill-current">5</text>
                </svg>
              </div>
              <p className="text-[11.5px] text-muted-foreground leading-snug text-center">
                A friendly party-size picker. No queue names, no table jargon, no guessing. Just tap, confirm, and wait comfortably.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="w-4 h-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-foreground">What you get</p>
              </div>
              <div className="flex justify-center mb-3">
                <svg aria-hidden="true" viewBox="0 0 160 100" className="w-32 h-auto text-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="12" y="20" width="28" height="56" rx="4" className="fill-primary/15" />
                  <rect x="50" y="34" width="28" height="42" rx="4" className="fill-primary/10" />
                  <rect x="88" y="28" width="28" height="48" rx="4" className="fill-primary/20" />
                  <rect x="126" y="44" width="28" height="32" rx="4" className="fill-primary/8" />
                  <text x="26" y="14" fontSize="8" textAnchor="middle" className="fill-current">2-seat</text>
                  <text x="64" y="14" fontSize="8" textAnchor="middle" className="fill-current">4-seat</text>
                  <text x="102" y="14" fontSize="8" textAnchor="middle" className="fill-current">6-seat</text>
                  <text x="140" y="14" fontSize="8" textAnchor="middle" className="fill-current">8-seat</text>
                </svg>
              </div>
              <p className="text-[11.5px] text-muted-foreground leading-snug text-center">
                Separate metrics for every table size. Clear forecasts, precise turn-time tracking, and no more hidden crowding behind one big number.
              </p>
            </div>
          </div>

          {/* Decision hint */}
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5 flex gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11.5px] text-foreground/80 leading-snug">
              <span className="font-semibold text-foreground">Start with Flexible Matching</span> unless your seating categories are part of the guest experience — like a rooftop, private room, or tasting menu area. You can switch modes anytime without changing your queues or losing data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(body, document.body);
};