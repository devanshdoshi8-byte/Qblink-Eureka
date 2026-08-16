CREATE OR REPLACE VIEW public.queue_visitors_public
WITH (security_invoker = on) AS
SELECT id, queue_id, token_number, status, joined_at, called_at
FROM public.queue_visitors
WHERE session_id IS NULL;

GRANT SELECT ON public.queue_visitors_public TO anon, authenticated;