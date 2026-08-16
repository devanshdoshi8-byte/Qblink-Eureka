CREATE OR REPLACE FUNCTION public.get_queue_health(p_queue_id uuid, p_days integer DEFAULT 7)
 RETURNS TABLE(queue_id uuid, score numeric, wait_score numeric, abandon_score numeric, efficiency_score numeric, delay_score numeric, accuracy_score numeric, avg_wait_minutes numeric, abandonment_rate numeric, served_per_hour numeric, expected_per_hour numeric, delay_rate numeric, wait_mae_minutes numeric, sample_count integer, total_joined integer, band text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_est int;
  v_avg_wait numeric := 0;
  v_total int := 0;
  v_served int := 0;
  v_abandoned int := 0;
  v_abandon_rate numeric := 0;
  v_active_hours numeric := 0;
  v_served_per_hour numeric := 0;
  v_expected_per_hour numeric := 0;
  v_delay_count int := 0;
  v_delay_rate numeric := 0;
  v_wait_mae numeric := 0;
  v_wait_score numeric := 0;
  v_abandon_score numeric := 0;
  v_efficiency_score numeric := 0;
  v_delay_score numeric := 0;
  v_accuracy_score numeric := 0;
  v_score numeric := 0;
  v_band text;
BEGIN
  SELECT b.owner_id INTO v_owner
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;

  IF v_owner IS NULL THEN
    RETURN;
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT COALESCE(estimated_service_time, 5) INTO v_est FROM public.queues WHERE id = p_queue_id;
  IF v_est IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'served'),
    COUNT(*) FILTER (WHERE status IN ('skipped','removed','no_show')),
    COALESCE(AVG(EXTRACT(EPOCH FROM (served_at - joined_at))/60.0)
      FILTER (WHERE status = 'served' AND served_at IS NOT NULL), 0),
    COUNT(*) FILTER (WHERE status = 'served' AND called_at IS NOT NULL AND served_at IS NOT NULL
                     AND EXTRACT(EPOCH FROM (served_at - called_at))/60.0 > 1.5 * v_est)
  INTO v_total, v_served, v_abandoned, v_avg_wait, v_delay_count
  FROM public.queue_visitors
  WHERE queue_id = p_queue_id
    AND joined_at > now() - (p_days || ' days')::interval;

  IF v_served > 0 THEN
    SELECT GREATEST(0.5, EXTRACT(EPOCH FROM (MAX(served_at) - MIN(joined_at)))/3600.0)
    INTO v_active_hours
    FROM public.queue_visitors
    WHERE queue_id = p_queue_id AND status = 'served' AND served_at IS NOT NULL
      AND joined_at > now() - (p_days || ' days')::interval;
    v_served_per_hour := v_served / NULLIF(v_active_hours, 0);
  END IF;
  v_expected_per_hour := 60.0 / v_est;

  IF v_total > 0 THEN
    v_abandon_rate := v_abandoned::numeric / v_total;
  END IF;

  IF v_served > 0 THEN
    v_delay_rate := v_delay_count::numeric / v_served;
  END IF;

  WITH ranked AS (
    SELECT
      EXTRACT(EPOCH FROM (served_at - joined_at))/60.0 AS actual,
      (ROW_NUMBER() OVER (PARTITION BY date_trunc('day', joined_at) ORDER BY joined_at)) * v_est AS predicted
    FROM public.queue_visitors
    WHERE queue_id = p_queue_id AND status = 'served' AND served_at IS NOT NULL
      AND joined_at > now() - (p_days || ' days')::interval
  )
  SELECT COALESCE(AVG(ABS(actual - predicted)), 0) INTO v_wait_mae FROM ranked;

  v_wait_score := GREATEST(0, LEAST(100,
    CASE WHEN v_avg_wait <= v_est THEN 100
         ELSE 100 - ((v_avg_wait - v_est) / (3.0 * v_est)) * 100 END));
  v_abandon_score := GREATEST(0, LEAST(100, 100 - (v_abandon_rate * 250)));
  v_efficiency_score := GREATEST(0, LEAST(100,
    CASE WHEN v_expected_per_hour <= 0 THEN 50
         ELSE (COALESCE(v_served_per_hour, 0) / v_expected_per_hour) * 100 END));
  v_delay_score := GREATEST(0, LEAST(100, 100 - (v_delay_rate * 200)));
  v_accuracy_score := GREATEST(0, LEAST(100, 100 - (v_wait_mae / 30.0) * 100));

  IF v_served < 10 THEN
    RETURN;
  END IF;

  v_score := ROUND(
    v_wait_score * 0.30 +
    v_abandon_score * 0.25 +
    v_efficiency_score * 0.20 +
    v_delay_score * 0.15 +
    v_accuracy_score * 0.10
  , 1);

  v_band := CASE
    WHEN v_score >= 90 THEN 'excellent'
    WHEN v_score >= 75 THEN 'good'
    WHEN v_score >= 60 THEN 'attention'
    WHEN v_score >= 40 THEN 'poor'
    ELSE 'critical' END;

  queue_id := p_queue_id;
  score := v_score;
  wait_score := ROUND(v_wait_score, 1);
  abandon_score := ROUND(v_abandon_score, 1);
  efficiency_score := ROUND(v_efficiency_score, 1);
  delay_score := ROUND(v_delay_score, 1);
  accuracy_score := ROUND(v_accuracy_score, 1);
  avg_wait_minutes := ROUND(v_avg_wait::numeric, 2);
  abandonment_rate := ROUND(v_abandon_rate::numeric, 3);
  served_per_hour := ROUND(COALESCE(v_served_per_hour, 0)::numeric, 2);
  expected_per_hour := ROUND(v_expected_per_hour::numeric, 2);
  delay_rate := ROUND(v_delay_rate::numeric, 3);
  wait_mae_minutes := ROUND(v_wait_mae::numeric, 2);
  sample_count := v_served;
  total_joined := v_total;
  band := v_band;
  RETURN NEXT;
END;
$function$;