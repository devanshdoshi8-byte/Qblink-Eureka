
-- 1. Make queue_visitors_public run with the invoker's permissions (no longer SECURITY DEFINER)
ALTER VIEW public.queue_visitors_public SET (security_invoker = on);

-- 2. Column-level access for anon on queue_visitors (only non-PII columns)
REVOKE SELECT ON public.queue_visitors FROM anon;
GRANT SELECT (id, queue_id, token_number, status, joined_at, called_at, session_id) ON public.queue_visitors TO anon;

-- 3. Allow anon to read active (non-archived) queue visitor rows via RLS
DROP POLICY IF EXISTS "Anon can read active queue tokens" ON public.queue_visitors;
CREATE POLICY "Anon can read active queue tokens"
ON public.queue_visitors
FOR SELECT
TO anon
USING (session_id IS NULL);

-- 4. Restrict pickup_status_events SELECT to order owner / business owner / admin
DROP POLICY IF EXISTS "Anyone can view pickup events" ON public.pickup_status_events;
CREATE POLICY "Order owner or business owner can view pickup events"
ON public.pickup_status_events
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT po.id FROM public.pickup_orders po
    WHERE po.customer_user_id = auth.uid()
       OR po.business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  )
  OR public.is_admin()
);
