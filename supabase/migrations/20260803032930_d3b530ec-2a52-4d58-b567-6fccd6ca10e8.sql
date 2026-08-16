DROP POLICY IF EXISTS "Anon can read active queue tokens" ON public.queue_visitors;
REVOKE SELECT ON public.queue_visitors FROM anon;
ALTER VIEW public.queue_visitors_public SET (security_invoker = off);
GRANT SELECT ON public.queue_visitors_public TO anon, authenticated;