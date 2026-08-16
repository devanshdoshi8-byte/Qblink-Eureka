ALTER VIEW public.queue_visitors_public SET (security_invoker = off);
GRANT SELECT ON public.queue_visitors_public TO anon, authenticated;