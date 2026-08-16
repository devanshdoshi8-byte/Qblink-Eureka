
CREATE TABLE public.queue_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL,
  business_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL DEFAULT now(),
  total_joined int NOT NULL DEFAULT 0,
  total_served int NOT NULL DEFAULT 0,
  total_skipped int NOT NULL DEFAULT 0,
  total_removed int NOT NULL DEFAULT 0,
  total_no_show int NOT NULL DEFAULT 0,
  avg_wait_minutes numeric NOT NULL DEFAULT 0,
  peak_hour int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_queue_sessions_business ON public.queue_sessions(business_id, session_date DESC);
CREATE INDEX idx_queue_sessions_queue ON public.queue_sessions(queue_id, session_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_sessions TO authenticated;
GRANT ALL ON public.queue_sessions TO service_role;

ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their queue_sessions"
  ON public.queue_sessions FOR SELECT
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can manage their queue_sessions"
  ON public.queue_sessions FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admins manage all queue_sessions"
  ON public.queue_sessions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.queue_visitors ADD COLUMN session_id uuid;
CREATE INDEX idx_queue_visitors_session ON public.queue_visitors(session_id);

CREATE OR REPLACE FUNCTION public.reset_queue_for_new_day(p_queue_id uuid)
RETURNS public.queue_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_owner uuid;
  v_started_at timestamptz;
  v_session public.queue_sessions;
  v_total_joined int := 0;
  v_total_served int := 0;
  v_total_skipped int := 0;
  v_total_removed int := 0;
  v_total_no_show int := 0;
  v_avg_wait numeric := 0;
  v_peak_hour int;
BEGIN
  SELECT q.business_id INTO v_business_id FROM public.queues q WHERE q.id = p_queue_id FOR UPDATE;
  IF v_business_id IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;

  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = v_business_id;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Mark still-active visitors as no-show
  UPDATE public.queue_visitors
    SET status = 'no_show'
    WHERE queue_id = p_queue_id AND session_id IS NULL AND status IN ('waiting', 'called');

  -- Aggregate this session's data (visitors not yet tagged with a session)
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'served'),
    count(*) FILTER (WHERE status = 'skipped'),
    count(*) FILTER (WHERE status = 'removed'),
    count(*) FILTER (WHERE status = 'no_show'),
    COALESCE(AVG(EXTRACT(EPOCH FROM (served_at - joined_at)) / 60.0)
             FILTER (WHERE status = 'served' AND served_at IS NOT NULL), 0),
    MIN(joined_at)
  INTO v_total_joined, v_total_served, v_total_skipped, v_total_removed, v_total_no_show, v_avg_wait, v_started_at
  FROM public.queue_visitors
  WHERE queue_id = p_queue_id AND session_id IS NULL;

  SELECT EXTRACT(HOUR FROM joined_at)::int
  INTO v_peak_hour
  FROM public.queue_visitors
  WHERE queue_id = p_queue_id AND session_id IS NULL
  GROUP BY EXTRACT(HOUR FROM joined_at)
  ORDER BY count(*) DESC
  LIMIT 1;

  INSERT INTO public.queue_sessions (
    queue_id, business_id, started_at, ended_at,
    total_joined, total_served, total_skipped, total_removed, total_no_show,
    avg_wait_minutes, peak_hour
  ) VALUES (
    p_queue_id, v_business_id, COALESCE(v_started_at, now()), now(),
    v_total_joined, v_total_served, v_total_skipped, v_total_removed, v_total_no_show,
    ROUND(v_avg_wait, 2), v_peak_hour
  ) RETURNING * INTO v_session;

  -- Tag visitors with this session
  UPDATE public.queue_visitors
    SET session_id = v_session.id
    WHERE queue_id = p_queue_id AND session_id IS NULL;

  -- Reset live queue state for next day
  UPDATE public.queues
    SET current_token = 0, next_token = 1, status = 'active', updated_at = now()
    WHERE id = p_queue_id;

  RETURN v_session;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_queue_for_new_day(uuid) TO authenticated;
