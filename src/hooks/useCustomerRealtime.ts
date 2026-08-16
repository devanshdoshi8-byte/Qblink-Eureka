import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
  business_id: string | null;
}

export interface CustomerAppointment {
  id: string;
  business_id: string;
  customer_name: string;
  service_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  party_size: number;
  notes: string | null;
  status: string;
  businesses?: { name: string; address: string | null } | null;
}

/** Live customer notifications, ordered newest first. */
export const useCustomerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    const { data } = await supabase
      .from("customer_notifications")
      .select("id,title,message,type,link,read_at,created_at,business_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data as CustomerNotification[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`customer-notifications-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "customer_notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    await supabase.from("customer_notifications").update({ read_at: now }).in("id", unread);
  }, [notifications, user?.id]);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("customer_notifications").delete().eq("id", id);
  }, []);

  return {
    notifications,
    loading,
    refresh,
    markAllRead,
    dismiss,
    unreadCount: notifications.filter((n) => !n.read_at).length,
  };
};

/** Live upcoming appointments for the signed-in customer. */
export const useCustomerAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setAppointments([]); setLoading(false); return; }
    const { data } = await supabase
      .from("appointments")
      .select("id,business_id,customer_name,service_name,scheduled_at,duration_minutes,party_size,notes,status,businesses(name,address)")
      .eq("customer_user_id", user.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);
    setAppointments((data as unknown as CustomerAppointment[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`customer-appointments-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "appointments",
        filter: `customer_user_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  const cancel = useCallback(async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    refresh();
  }, [refresh]);

  return { appointments, loading, refresh, cancel };
};