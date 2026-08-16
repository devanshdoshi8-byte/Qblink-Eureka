import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  businessId: string | null | undefined;
  businessName?: string;
  className?: string;
  variant?: "compact" | "full";
}

/**
 * Star button to add/remove a business from the customer's favorites.
 * Silently hides when there's no real business id (e.g. demo queues).
 */
const SaveBusinessButton = ({ businessId, businessName, className = "", variant = "full" }: Props) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !businessId) { setReady(true); return; }
      const { data } = await (supabase as any)
        .from("customer_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (cancelled) return;
      setSaved(!!data);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, businessId]);

  if (!businessId) return null;

  const toggle = async () => {
    if (!user) {
      toast.info("Sign in to save favorites", {
        description: "Create a free account to keep your favorite businesses handy.",
      });
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        const { error } = await (supabase as any)
          .from("customer_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", businessId);
        if (error) throw error;
        setSaved(false);
        toast.success(businessName ? `Removed ${businessName} from favorites` : "Removed from favorites");
      } else {
        const { error } = await (supabase as any)
          .from("customer_favorites")
          .upsert(
            { user_id: user.id, business_id: businessId, last_used_at: new Date().toISOString() },
            { onConflict: "user_id,business_id" }
          );
        if (error) throw error;
        setSaved(true);
        toast.success(businessName ? `Saved ${businessName} to favorites` : "Saved to favorites");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not update favorites");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={toggle}
        disabled={loading || !ready}
        aria-label={saved ? "Remove from favorites" : "Save business"}
        aria-pressed={saved}
        className={`p-2 rounded-full hover:bg-muted transition-colors ${className}`}
        title={saved ? "Saved" : "Save business"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Star className={`w-4 h-4 ${saved ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !ready}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        saved
          ? "bg-warning-soft border-warning/30 text-warning hover:bg-warning-soft"
          : "bg-card border-border text-foreground hover:bg-muted"
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Star className={`w-3.5 h-3.5 ${saved ? "fill-warning text-warning" : ""}`} />
      )}
      {saved ? "Saved" : "Save Business"}
    </button>
  );
};

export default SaveBusinessButton;