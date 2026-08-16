
CREATE OR REPLACE FUNCTION public.get_queue_forecast(p_queue_id uuid, p_day_of_week int DEFAULT NULL)
RETURNS TABLE(
  hour int,
  day_of_week int,
  avg_joins numeric,
  avg_wait_minutes numeric,
  no_show_rate numeric,
  sample_count int,
  total_sample int,
  distinct_days int,
  confidence numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dow int;
  v_total int;
  v_days int;
BEGIN
  v_dow := COALESCE(p_day_of_week, EXTRACT(DOW FROM (now() AT TIME ZONE 'UTC'))::int);

  SELECT COUNT(*), COUNT(DISTINCT (qv.joined_at AT TIME ZONE 'UTC')::date)
    INTO v_total, v_days
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id
    AND qv.joined_at > now() - interval '60 days'
    AND EXTRACT(DOW FROM (qv.joined_at AT TIME ZONE 'UTC'))::int = v_dow;

  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 23) AS h
  ),
  per_day AS (
    SELECT
      EXTRACT(HOUR FROM (qv.joined_at AT TIME ZONE 'UTC'))::int AS h,
      (qv.joined_at AT TIME ZONE 'UTC')::date AS d,
      COUNT(*) AS joins,
      AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.joined_at)) / 60.0)
        FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL) AS wait_min,
      AVG(CASE WHEN qv.status = 'no_show' THEN 1.0 ELSE 0.0 END) AS no_show
    FROM public.queue_visitors qv
    WHERE qv.queue_id = p_queue_id
      AND qv.joined_at > now() - interval '60 days'
      AND EXTRACT(DOW FROM (qv.joined_at AT TIME ZONE 'UTC'))::int = v_dow
    GROUP BY 1, 2
  ),
  agg AS (
    SELECT
      h.h AS hour,
      COALESCE(AVG(pd.joins), 0)::numeric AS avg_joins,
      COALESCE(AVG(pd.wait_min), 0)::numeric AS avg_wait_minutes,
      COALESCE(AVG(pd.no_show), 0)::numeric AS no_show_rate,
      COALESCE(SUM(pd.joins), 0)::int AS sample_count
    FROM hours h
    LEFT JOIN per_day pd ON pd.h = h.h
    GROUP BY h.h
  )
  SELECT
    a.hour,
    v_dow,
    ROUND(a.avg_joins, 2),
    ROUND(a.avg_wait_minutes, 2),
    ROUND(a.no_show_rate, 3),
    a.sample_count,
    COALESCE(v_total, 0),
    COALESCE(v_days, 0),
    LEAST(1.0, (COALESCE(v_days, 0)::numeric / 6.0))::numeric AS confidence
  FROM agg a
  ORDER BY a.hour;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_queue_forecast(uuid, int) TO anon, authenticated, service_role;
