
-- ============ Tables ============
CREATE TABLE public.queue_health_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  queue_id uuid, -- null = business-wide rollup
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  score numeric NOT NULL,
  wait_score numeric NOT NULL DEFAULT 0,
  abandon_score numeric NOT NULL DEFAULT 0,
  efficiency_score numeric NOT NULL DEFAULT 0,
  delay_score numeric NOT NULL DEFAULT 0,
  accuracy_score numeric NOT NULL DEFAULT 0,
  sample_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX queue_health_daily_unique ON public.queue_health_daily (business_id, COALESCE(queue_id, '00000000-0000-0000-0000-000000000000'::uuid), day);
CREATE INDEX queue_health_daily_business_day ON public.queue_health_daily (business_id, day DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_health_daily TO authenticated;
GRANT ALL ON public.queue_health_daily TO service_role;
ALTER TABLE public.queue_health_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their health history" ON public.queue_health_daily FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admins manage all health history" ON public.queue_health_daily FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.queue_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  queue_id uuid,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  message text NOT NULL,
  score numeric,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX queue_health_alerts_business ON public.queue_health_alerts (business_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_health_alerts TO authenticated;
GRANT ALL ON public.queue_health_alerts TO service_role;
ALTER TABLE public.queue_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their health alerts" ON public.queue_health_alerts FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admins manage all health alerts" ON public.queue_health_alerts FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_queue_health_daily_updated_at BEFORE UPDATE ON public.queue_health_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Core scoring function for a single queue ============
CREATE OR REPLACE FUNCTION public.get_queue_health(p_queue_id uuid, p_days int DEFAULT 7)
RETURNS TABLE (
  queue_id uuid,
  score numeric,
  wait_score numeric,
  abandon_score numeric,
  efficiency_score numeric,
  delay_score numeric,
  accuracy_score numeric,
  avg_wait_minutes numeric,
  abandonment_rate numeric,
  served_per_hour numeric,
  expected_per_hour numeric,
  delay_rate numeric,
  wait_mae_minutes numeric,
  sample_count integer,
  total_joined integer,
  band text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
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

  -- Wait-time accuracy: MAE between predicted wait (token position × est) and actual
  WITH ranked AS (
    SELECT
      EXTRACT(EPOCH FROM (served_at - joined_at))/60.0 AS actual,
      (ROW_NUMBER() OVER (PARTITION BY date_trunc('day', joined_at) ORDER BY joined_at)) * v_est AS predicted
    FROM public.queue_visitors
    WHERE queue_id = p_queue_id AND status = 'served' AND served_at IS NOT NULL
      AND joined_at > now() - (p_days || ' days')::interval
  )
  SELECT COALESCE(AVG(ABS(actual - predicted)), 0) INTO v_wait_mae FROM ranked;

  -- Component scores (0..100)
  -- Wait: 100 at <= est, 0 at >= 4*est
  v_wait_score := GREATEST(0, LEAST(100,
    CASE WHEN v_avg_wait <= v_est THEN 100
         ELSE 100 - ((v_avg_wait - v_est) / (3.0 * v_est)) * 100 END));
  -- Abandon: 100 at 0%, 0 at >= 40%
  v_abandon_score := GREATEST(0, LEAST(100, 100 - (v_abandon_rate * 250)));
  -- Efficiency: ratio served/expected, capped
  v_efficiency_score := GREATEST(0, LEAST(100,
    CASE WHEN v_expected_per_hour <= 0 THEN 50
         ELSE (COALESCE(v_served_per_hour, 0) / v_expected_per_hour) * 100 END));
  -- Delay: 100 at 0%, 0 at >= 50%
  v_delay_score := GREATEST(0, LEAST(100, 100 - (v_delay_rate * 200)));
  -- Accuracy: 100 at MAE 0, 0 at MAE >= 30 min
  v_accuracy_score := GREATEST(0, LEAST(100, 100 - (v_wait_mae / 30.0) * 100));

  IF v_served < 10 THEN
    RETURN; -- insufficient data
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
$$;

-- ============ Business-level aggregation ============
CREATE OR REPLACE FUNCTION public.get_business_health(p_business_id uuid, p_days int DEFAULT 7)
RETURNS TABLE (
  business_id uuid,
  score numeric,
  wait_score numeric,
  abandon_score numeric,
  efficiency_score numeric,
  delay_score numeric,
  accuracy_score numeric,
  sample_count integer,
  total_joined integer,
  queue_count integer,
  band text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_sum_w numeric := 0; v_sum_a numeric := 0; v_sum_e numeric := 0;
  v_sum_d numeric := 0; v_sum_acc numeric := 0; v_total_samples int := 0;
  v_total_joined int := 0; v_queue_count int := 0;
  v_band text;
  v_score numeric;
  r record;
BEGIN
  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = p_business_id;
  IF v_owner IS NULL THEN RETURN; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR r IN
    SELECT h.* FROM public.queues q,
      LATERAL public.get_queue_health(q.id, p_days) h
    WHERE q.business_id = p_business_id
  LOOP
    v_sum_w := v_sum_w + r.wait_score * r.sample_count;
    v_sum_a := v_sum_a + r.abandon_score * r.sample_count;
    v_sum_e := v_sum_e + r.efficiency_score * r.sample_count;
    v_sum_d := v_sum_d + r.delay_score * r.sample_count;
    v_sum_acc := v_sum_acc + r.accuracy_score * r.sample_count;
    v_total_samples := v_total_samples + r.sample_count;
    v_total_joined := v_total_joined + r.total_joined;
    v_queue_count := v_queue_count + 1;
  END LOOP;

  IF v_total_samples = 0 THEN RETURN; END IF;

  business_id := p_business_id;
  wait_score := ROUND(v_sum_w / v_total_samples, 1);
  abandon_score := ROUND(v_sum_a / v_total_samples, 1);
  efficiency_score := ROUND(v_sum_e / v_total_samples, 1);
  delay_score := ROUND(v_sum_d / v_total_samples, 1);
  accuracy_score := ROUND(v_sum_acc / v_total_samples, 1);
  v_score := ROUND(
    wait_score * 0.30 + abandon_score * 0.25 + efficiency_score * 0.20 +
    delay_score * 0.15 + accuracy_score * 0.10, 1);
  score := v_score;
  sample_count := v_total_samples;
  total_joined := v_total_joined;
  queue_count := v_queue_count;
  v_band := CASE
    WHEN v_score >= 90 THEN 'excellent'
    WHEN v_score >= 75 THEN 'good'
    WHEN v_score >= 60 THEN 'attention'
    WHEN v_score >= 40 THEN 'poor'
    ELSE 'critical' END;
  band := v_band;
  RETURN NEXT;
END;
$$;

-- ============ Owner branches rollup ============
CREATE OR REPLACE FUNCTION public.get_owner_health_branches(p_days int DEFAULT 7)
RETURNS TABLE (
  business_id uuid,
  business_name text,
  category text,
  score numeric,
  sample_count integer,
  band text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  h record;
BEGIN
  FOR r IN SELECT id, name, category FROM public.businesses WHERE owner_id = auth.uid()
  LOOP
    SELECT * INTO h FROM public.get_business_health(r.id, p_days) LIMIT 1;
    IF h.score IS NOT NULL THEN
      business_id := r.id;
      business_name := r.name;
      category := r.category;
      score := h.score;
      sample_count := h.sample_count;
      band := h.band;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- ============ Snapshot to history + alerts ============
CREATE OR REPLACE FUNCTION public.snapshot_queue_health(p_business_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_count int := 0;
  v_prev_score numeric;
  q record;
  h record;
  bh record;
BEGIN
  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = p_business_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'business not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Per-queue snapshots
  FOR q IN SELECT id FROM public.queues WHERE business_id = p_business_id LOOP
    SELECT * INTO h FROM public.get_queue_health(q.id, 7) LIMIT 1;
    IF h.score IS NOT NULL THEN
      INSERT INTO public.queue_health_daily
        (business_id, queue_id, day, score, wait_score, abandon_score, efficiency_score, delay_score, accuracy_score, sample_count)
      VALUES (p_business_id, q.id, v_today, h.score, h.wait_score, h.abandon_score, h.efficiency_score, h.delay_score, h.accuracy_score, h.sample_count)
      ON CONFLICT (business_id, COALESCE(queue_id, '00000000-0000-0000-0000-000000000000'::uuid), day)
      DO UPDATE SET score = EXCLUDED.score, wait_score = EXCLUDED.wait_score,
        abandon_score = EXCLUDED.abandon_score, efficiency_score = EXCLUDED.efficiency_score,
        delay_score = EXCLUDED.delay_score, accuracy_score = EXCLUDED.accuracy_score,
        sample_count = EXCLUDED.sample_count, updated_at = now();
      v_count := v_count + 1;
    END IF;
  END LOOP;

  -- Business rollup snapshot
  SELECT * INTO bh FROM public.get_business_health(p_business_id, 7) LIMIT 1;
  IF bh.score IS NOT NULL THEN
    SELECT score INTO v_prev_score FROM public.queue_health_daily
      WHERE business_id = p_business_id AND queue_id IS NULL AND day < v_today
      ORDER BY day DESC LIMIT 1;

    INSERT INTO public.queue_health_daily
      (business_id, queue_id, day, score, wait_score, abandon_score, efficiency_score, delay_score, accuracy_score, sample_count)
    VALUES (p_business_id, NULL, v_today, bh.score, bh.wait_score, bh.abandon_score, bh.efficiency_score, bh.delay_score, bh.accuracy_score, bh.sample_count)
    ON CONFLICT (business_id, COALESCE(queue_id, '00000000-0000-0000-0000-000000000000'::uuid), day)
    DO UPDATE SET score = EXCLUDED.score, wait_score = EXCLUDED.wait_score,
      abandon_score = EXCLUDED.abandon_score, efficiency_score = EXCLUDED.efficiency_score,
      delay_score = EXCLUDED.delay_score, accuracy_score = EXCLUDED.accuracy_score,
      sample_count = EXCLUDED.sample_count, updated_at = now();

    -- Generate alerts (debounced: only one of each type per day)
    IF bh.score < 60 AND NOT EXISTS (
      SELECT 1 FROM public.queue_health_alerts
      WHERE business_id = p_business_id AND type = 'low_score'
        AND created_at::date = v_today
    ) THEN
      INSERT INTO public.queue_health_alerts (business_id, type, severity, message, score)
      VALUES (p_business_id, 'low_score',
        CASE WHEN bh.score < 40 THEN 'critical' ELSE 'warning' END,
        'Queue Health Score is ' || bh.score || '. Review wait times and abandonment.', bh.score);
    END IF;

    IF v_prev_score IS NOT NULL AND v_prev_score - bh.score >= 15 AND NOT EXISTS (
      SELECT 1 FROM public.queue_health_alerts
      WHERE business_id = p_business_id AND type = 'score_drop'
        AND created_at::date = v_today
    ) THEN
      INSERT INTO public.queue_health_alerts (business_id, type, severity, message, score)
      VALUES (p_business_id, 'score_drop', 'warning',
        'Health Score dropped from ' || v_prev_score || ' to ' || bh.score || ' since yesterday.', bh.score);
    END IF;

    IF bh.abandon_score < 50 AND NOT EXISTS (
      SELECT 1 FROM public.queue_health_alerts
      WHERE business_id = p_business_id AND type = 'abandonment_spike'
        AND created_at::date = v_today
    ) THEN
      INSERT INTO public.queue_health_alerts (business_id, type, severity, message, score)
      VALUES (p_business_id, 'abandonment_spike', 'warning',
        'Abandonment rate is high this week. Consider shorter waits or notifications.', bh.score);
    END IF;
  END IF;

  RETURN v_count;
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_health_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_health_daily;
