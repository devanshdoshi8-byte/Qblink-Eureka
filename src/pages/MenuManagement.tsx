import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, UtensilsCrossed, Save, X, Clock, IndianRupee } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supportsPickup } from "@/lib/categories";
import { Link } from "react-router-dom";

interface MenuItem {
  id: string;
  business_id: string;
  name: string;
  price: number;
  prep_minutes: number;
  description: string | null;
  is_available: boolean;
  sort_order: number;
}

const MenuManagement = () => (
  <BusinessLayout>
    {(business) =>
      supportsPickup(business.category) ? (
        <MenuBoard businessId={business.id} businessName={business.name} />
      ) : (
        <div className="bg-card rounded-2xl card-shadow p-8 max-w-xl">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Menu management</h1>
          <p className="text-sm text-muted-foreground mb-4">
            The menu and pickup features are available for restaurants, cafes and bakeries only.
            Update your business category in settings to enable pickup ordering.
          </p>
          <Link to="/dashboard/settings" className="text-sm text-primary font-semibold hover:underline">Go to settings →</Link>
        </div>
      )
    }
  </BusinessLayout>
);

const emptyDraft = { name: "", price: "", prep_minutes: "", description: "" };

const MenuBoard = ({ businessId, businessName }: { businessId: string; businessName: string }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems((data ?? []) as MenuItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [businessId]);

  const resetDraft = () => { setDraft(emptyDraft); setEditingId(null); };

  const submit = async () => {
    if (!draft.name.trim() || !draft.price || !draft.prep_minutes) {
      toast.error("Name, price and prep time are required");
      return;
    }
    setSaving(true);
    const payload = {
      business_id: businessId,
      name: draft.name.trim(),
      price: Number(draft.price),
      prep_minutes: Number(draft.prep_minutes),
      description: draft.description.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("menu_items").update(payload).eq("id", editingId)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) { toast.error("Could not save item"); return; }
    toast.success(editingId ? "Item updated" : "Item added");
    resetDraft();
    load();
  };

  const startEdit = (it: MenuItem) => {
    setEditingId(it.id);
    setDraft({
      name: it.name,
      price: String(it.price),
      prep_minutes: String(it.prep_minutes),
      description: it.description ?? "",
    });
  };

  const remove = async (it: MenuItem) => {
    if (!confirm(`Remove "${it.name}" from the menu?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", it.id);
    if (error) { toast.error("Could not delete"); return; }
    toast.success("Removed");
    load();
  };

  const toggleAvailable = async (it: MenuItem) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !it.is_available }).eq("id", it.id);
    if (error) { toast.error("Could not update"); return; }
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        <p className="text-sm text-muted-foreground">Manage what customers can order for pickup at {businessName}</p>
      </div>

      <div className="bg-card rounded-2xl card-shadow p-5 mb-6">
        <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
          {editingId ? <><Pencil className="w-4 h-4 text-primary" /> Edit item</> : <><Plus className="w-4 h-4 text-primary" /> Add item</>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Item name *"
            className="px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={draft.price}
            onChange={e => setDraft(d => ({ ...d, price: e.target.value.replace(/[^0-9.]/g, "") }))}
            placeholder="Price (₹) *"
            inputMode="decimal"
            className="px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={draft.prep_minutes}
            onChange={e => setDraft(d => ({ ...d, prep_minutes: e.target.value.replace(/[^0-9]/g, "") }))}
            placeholder="Prep time (min) *"
            inputMode="numeric"
            className="px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Description (optional)"
            className="px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={submit}
            disabled={saving}
            className="gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? "Save changes" : "Add item"}
          </button>
          {editingId && (
            <button onClick={resetDraft} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-foreground">Items ({items.length})</p>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={UtensilsCrossed}
              title="Your menu is empty"
              description="Add the dishes customers can pre-order or pick up. Each item shows its price and prep time so wait estimates stay accurate."
              tip="Start with your 3–5 bestsellers — you can always expand later as orders pick up."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(it => (
              <li key={it.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{it.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{Number(it.price).toFixed(0)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{it.prep_minutes} min</span>
                    {!it.is_available && <span className="text-warning font-medium">Hidden</span>}
                  </div>
                  {it.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{it.description}</p>}
                </div>
                <button onClick={() => toggleAvailable(it)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/70">
                  {it.is_available ? "Hide" : "Show"}
                </button>
                <button onClick={() => startEdit(it)} className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center" aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5 text-foreground" />
                </button>
                <button onClick={() => remove(it)} className="w-8 h-8 rounded-lg bg-danger-soft hover:bg-danger-soft flex items-center justify-center" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-danger" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;