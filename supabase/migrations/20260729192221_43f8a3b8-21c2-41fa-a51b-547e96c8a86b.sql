CREATE OR REPLACE FUNCTION public.get_public_queue_activity(p_queue_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, action text, token_number integer, actor text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.id, l.action, l.token_number, l.actor, l.created_at
  FROM public.queue_activity_log l
  WHERE l.queue_id = p_queue_id
    AND l.created_at > now() - interval '12 hours'
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 20)
$$;

REVOKE ALL ON FUNCTION public.get_public_queue_activity(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_queue_activity(uuid, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_queue_pulse(p_queue_id uuid)
RETURNS TABLE(
  waiting integer,
  joined_today integer,
  served_today integer,
  avg_wait_minutes numeric,
  avg_service_minutes numeric,
  reliability_pct numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_waiting int := 0;
  v_joined int := 0;
  v_served int := 0;
  v_lost int := 0;
  v_wait numeric;
  v_service numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.queues WHERE queues.id = p_queue_id) THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE qv.status IN ('waiting','checked_in')),
    COUNT(*) FILTER (WHERE (qv.joined_at AT TIME ZONE 'utc')::date = v_today),
    COUNT(*) FILTER (WHERE qv.status = 'served' AND (qv.served_at AT TIME ZONE 'utc')::date = v_today),
    COUNT(*) FILTER (WHERE qv.status IN ('no_show','skipped','removed') AND (qv.joined_at AT TIME ZONE 'utc')::date = v_today),
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.joined_at))/60.0)
      FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL AND (qv.served_at AT TIME ZONE 'utc')::date = v_today),
    AVG(EXTRACT(EPOCH FROM (qv.served_at - qv.called_at))/60.0)
      FILTER (WHERE qv.status = 'served' AND qv.served_at IS NOT NULL AND qv.called_at IS NOT NULL
              AND qv.served_at > qv.called_at AND (qv.served_at AT TIME ZONE 'utc')::date = v_today)
  INTO v_waiting, v_joined, v_served, v_lost, v_wait, v_service
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id;

  waiting := COALESCE(v_waiting, 0);
  joined_today := COALESCE(v_joined, 0);
  served_today := COALESCE(v_served, 0);
  avg_wait_minutes := CASE WHEN v_wait IS NULL THEN NULL ELSE ROUND(v_wait::numeric, 1) END;
  avg_service_minutes := CASE WHEN v_service IS NULL THEN NULL ELSE ROUND(v_service::numeric, 1) END;
  reliability_pct := CASE
    WHEN (v_served + v_lost) >= 5 THEN ROUND((v_served::numeric / (v_served + v_lost)) * 100, 0)
    ELSE NULL END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_queue_pulse(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_queue_pulse(uuid) TO anon, authenticated, service_role;