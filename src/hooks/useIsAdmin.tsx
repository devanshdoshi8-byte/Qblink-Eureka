import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const adminCache = new Map<string, boolean>();
const adminRequests = new Map<string, Promise<boolean>>();

export const useIsAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const cached = adminCache.get(user.id);
    if (cached !== undefined) {
      setIsAdmin(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const request = adminRequests.get(user.id) ?? Promise.resolve(supabase.rpc("is_admin")).then(({ data, error }) => {
      const allowed = !error && Boolean(data);
      if (!error) adminCache.set(user.id, allowed);
      adminRequests.delete(user.id);
      return allowed;
    });
    adminRequests.set(user.id, request);

    request.then((allowed) => {
      if (cancelled) return;
      setIsAdmin(allowed);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
