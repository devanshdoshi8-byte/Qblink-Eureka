-- 1) Protect customer phone numbers: remove public read access on pickup_orders
DROP POLICY IF EXISTS "Anyone can view pickup orders" ON public.pickup_orders;

CREATE POLICY "Customers view their own pickup orders"
ON public.pickup_orders FOR SELECT
USING (customer_user_id IS NOT NULL AND customer_user_id = auth.uid());

-- Safe single-order tracking lookup (excludes phone), accessed via unguessable order id
CREATE OR REPLACE FUNCTION public.get_pickup_order(p_order_id uuid)
RETURNS TABLE(id uuid, business_id uuid, token text, items jsonb, notes text, status text, eta_minutes integer, created_at timestamptz, ready_at timestamptz, picked_up_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, o.business_id, o.token, o.items, o.notes, o.status, o.eta_minutes, o.created_at, o.ready_at, o.picked_up_at
  FROM public.pickup_orders o
  WHERE o.id = p_order_id
$$;
REVOKE ALL ON FUNCTION public.get_pickup_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pickup_order(uuid) TO anon, authenticated, service_role;

-- Aggregate count of active pickup orders (no row data exposed)
CREATE OR REPLACE FUNCTION public.get_active_pickup_count(p_business_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::int FROM public.pickup_orders
  WHERE business_id = p_business_id AND status IN ('received','preparing','almost_ready')
$$;
REVOKE ALL ON FUNCTION public.get_active_pickup_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_pickup_count(uuid) TO anon, authenticated, service_role;

-- 2) call_next: previously callable by anyone — now requires queue owner or admin
CREATE OR REPLACE FUNCTION public.call_next(p_queue_id uuid)
RETURNS TABLE(id uuid, token_number integer, visitor_name text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_owner uuid;
  v_id uuid;
  v_token integer;
  v_name text;
  v_phone text;
BEGIN
  SELECT q.status, b.owner_id INTO v_status, v_owner
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id
  FOR UPDATE OF q;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.queue_visitors
  SET status = 'served', served_at = COALESCE(served_at, now())
  WHERE queue_id = p_queue_id AND status = 'called';

  SELECT qv.id, qv.token_number, qv.visitor_name, qv.phone
    INTO v_id, v_token, v_name, v_phone
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id AND qv.status = 'waiting'
  ORDER BY qv.token_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NULL THEN
    UPDATE public.queues SET current_token = 0, updated_at = now()
    WHERE public.queues.id = p_queue_id;
    RETURN;
  END IF;

  UPDATE public.queue_visitors
  SET status = 'called', called_at = now()
  WHERE public.queue_visitors.id = v_id;

  UPDATE public.queues
  SET current_token = v_token, updated_at = now()
  WHERE public.queues.id = p_queue_id;

  id := v_id;
  token_number := v_token;
  visitor_name := v_name;
  phone := v_phone;
  RETURN NEXT;
END;
$function$;

-- 3) get_business_benchmark: restrict to business owner or admin
CREATE OR REPLACE FUNCTION public.get_business_benchmark(p_business_id uuid)
RETURNS TABLE(category text, business_avg_seconds numeric, category_avg_seconds numeric, business_sample integer, category_sample integer, peer_business_count integer, faster_percent numeric, direction text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_category text;
  v_biz_avg numeric;
  v_cat_avg numeric;
  v_biz_n integer;
  v_cat_n integer;
  v_peers integer;
  v_pct numeric;
  v_dir text;
BEGIN
  SELECT b.owner_id, COALESCE(b.category, 'Other') INTO v_owner, v_category
  FROM public.businesses b WHERE b.id = p_business_id;

  IF v_category IS NULL THEN
    RETURN;
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.called_at))),
    COUNT(*)
  INTO v_biz_avg, v_biz_n
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  WHERE q.business_id = p_business_id
    AND qv.status = 'served'
    AND qv.called_at IS NOT NULL
    AND qv.served_at IS NOT NULL
    AND qv.served_at > qv.called_at
    AND qv.joined_at > now() - interval '60 days';

  SELECT
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.called_at))),
    COUNT(*),
    COUNT(DISTINCT b.id)
  INTO v_cat_avg, v_cat_n, v_peers
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE b.category = v_category
    AND b.id <> p_business_id
    AND qv.status = 'served'
    AND qv.called_at IS NOT NULL
    AND qv.served_at IS NOT NULL
    AND qv.served_at > qv.called_at
    AND qv.joined_at > now() - interval '60 days';

  IF v_biz_avg IS NOT NULL AND v_cat_avg IS NOT NULL AND v_cat_avg > 0 THEN
    v_pct := ROUND(((v_cat_avg - v_biz_avg) / v_cat_avg) * 100.0, 1);
    IF v_pct >= 0 THEN v_dir := 'faster'; ELSE v_dir := 'slower'; v_pct := ABS(v_pct); END IF;
  ELSE
    v_pct := NULL;
    v_dir := NULL;
  END IF;

  category := v_category;
  business_avg_seconds := ROUND(COALESCE(v_biz_avg, 0)::numeric, 2);
  category_avg_seconds := ROUND(COALESCE(v_cat_avg, 0)::numeric, 2);
  business_sample := COALESCE(v_biz_n, 0);
  category_sample := COALESCE(v_cat_n, 0);
  peer_business_count := COALESCE(v_peers, 0);
  faster_percent := v_pct;
  direction := v_dir;
  RETURN NEXT;
END;
$function$;

-- 4) Revoke anonymous execution of owner-only functions
REVOKE EXECUTE ON FUNCTION public.call_next(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.serve_restaurant_next(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_queue_for_new_day(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_business_benchmark(uuid) FROM PUBLIC, anon;

-- 5) Stop broadcasting PII and business-private data over Realtime.
-- The app keeps live updates through the PII-free queue_live_signals table and polling.
ALTER PUBLICATION supabase_realtime DROP TABLE public.queue_visitors;
ALTER PUBLICATION supabase_realtime DROP TABLE public.queue_health_daily;
ALTER PUBLICATION supabase_realtime DROP TABLE public.queue_health_alerts;