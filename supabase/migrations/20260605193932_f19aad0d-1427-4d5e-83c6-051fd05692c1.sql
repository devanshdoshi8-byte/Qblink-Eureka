
REVOKE EXECUTE ON FUNCTION public.get_queue_health(uuid, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_business_health(uuid, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_owner_health_branches(int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.snapshot_queue_health(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_queue_health(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_health(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_health_branches(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_queue_health(uuid) TO authenticated;
