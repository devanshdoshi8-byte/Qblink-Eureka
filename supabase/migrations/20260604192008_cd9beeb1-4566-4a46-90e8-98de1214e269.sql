
CREATE OR REPLACE FUNCTION public.get_business_benchmark(p_business_id uuid)
RETURNS TABLE (
  category text,
  business_avg_seconds numeric,
  category_avg_seconds numeric,
  business_sample integer,
  category_sample integer,
  peer_business_count integer,
  faster_percent numeric,
  direction text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
  v_biz_avg numeric;
  v_cat_avg numeric;
  v_biz_n integer;
  v_cat_n integer;
  v_peers integer;
  v_pct numeric;
  v_dir text;
BEGIN
  SELECT COALESCE(b.category, 'Other') INTO v_category
  FROM public.businesses b WHERE b.id = p_business_id;

  IF v_category IS NULL THEN
    RETURN;
  END IF;

  -- This business: avg service duration (called -> served) over last 60 days
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

  -- Peer businesses in same category (excluding this one)
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
$$;

GRANT EXECUTE ON FUNCTION public.get_business_benchmark(uuid) TO authenticated, service_role;
