
-- 1) Extend queues with integrity settings
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS arrival_window_minutes int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS auto_expire_minutes int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS join_cooldown_minutes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicate_protection boolean NOT NULL DEFAULT true;

-- 2) Extend queue_visitors with integrity timestamps
ALTER TABLE public.queue_visitors
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS serving_started_at timestamptz;

-- 3) Queue Activity Log
CREATE TABLE IF NOT EXISTS public.queue_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  queue_id uuid REFERENCES public.queues(id) ON DELETE CASCADE,
  visitor_id uuid REFERENCES public.queue_visitors(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  token_number int,
  visitor_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.queue_activity_log TO authenticated;
GRANT ALL ON public.queue_activity_log TO service_role;

ALTER TABLE public.queue_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view business activity" ON public.queue_activity_log;
CREATE POLICY "Owners view business activity"
  ON public.queue_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE INDEX IF NOT EXISTS idx_qal_business_created ON public.queue_activity_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qal_queue_created ON public.queue_activity_log (queue_id, created_at DESC);

-- 4) Logging helper (definer, callable from other RPCs)
CREATE OR REPLACE FUNCTION public.log_queue_activity(
  p_queue_id uuid,
  p_visitor_id uuid,
  p_action text,
  p_actor text DEFAULT 'system',
  p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_business uuid;
  v_token int;
  v_name text;
BEGIN
  SELECT business_id INTO v_business FROM public.queues WHERE id = p_queue_id;
  IF v_business IS NULL THEN RETURN; END IF;
  IF p_visitor_id IS NOT NULL THEN
    SELECT token_number, visitor_name INTO v_token, v_name
    FROM public.queue_visitors WHERE id = p_visitor_id;
  END IF;
  INSERT INTO public.queue_activity_log
    (business_id, queue_id, visitor_id, action, actor, token_number, visitor_name, metadata)
  VALUES
    (v_business, p_queue_id, p_visitor_id, p_action, p_actor, v_token, v_name, COALESCE(p_meta, '{}'::jsonb));
END;
$$;

-- 5) Extend join_queue with duplicate protection + cooldown + activity logging
CREATE OR REPLACE FUNCTION public.join_queue(
  p_queue_id uuid,
  p_visitor_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_party_size integer DEFAULT NULL
)
RETURNS TABLE(id uuid, token_number integer, assigned_table_size integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_status text; v_type text; v_table_config jsonb;
  v_token int; v_id uuid; v_name text; v_phone text; v_assigned int;
  v_dup_protect boolean; v_cooldown int; v_hit boolean;
BEGIN
  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN RAISE EXCEPTION 'name too long'; END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN RAISE EXCEPTION 'phone too long'; END IF;

  SELECT q.status, q.next_token, q.queue_type, q.table_config,
         q.duplicate_protection, q.join_cooldown_minutes
    INTO v_status, v_token, v_type, v_table_config, v_dup_protect, v_cooldown
  FROM public.queues q WHERE q.id = p_queue_id FOR UPDATE;

  IF v_status IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'queue not active'; END IF;
  IF v_token IS NULL THEN v_token := 1; END IF;

  IF COALESCE(v_dup_protect, true) AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = p_queue_id AND phone = v_phone
        AND status IN ('waiting','checked_in','called','serving')
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'You are already in this queue.'; END IF;
  END IF;

  IF COALESCE(v_cooldown, 0) > 0 AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = p_queue_id AND phone = v_phone
        AND joined_at > now() - (v_cooldown || ' minutes')::interval
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'Please wait before rejoining this queue.'; END IF;
  END IF;

  IF v_type = 'restaurant' THEN
    IF p_party_size IS NULL OR p_party_size < 1 THEN RAISE EXCEPTION 'party size required'; END IF;
    SELECT (elem->>'seats')::int INTO v_assigned
    FROM jsonb_array_elements(COALESCE(v_table_config, '[]'::jsonb)) elem
    WHERE (elem->>'seats')::int >= p_party_size
      AND COALESCE((elem->>'count')::int, 0) > 0
    ORDER BY (elem->>'seats')::int ASC LIMIT 1;
    IF v_assigned IS NULL THEN RAISE EXCEPTION 'no suitable table for party size %', p_party_size; END IF;
  END IF;

  UPDATE public.queues q SET next_token = v_token + 1, updated_at = now() WHERE q.id = p_queue_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone, party_size, assigned_table_size)
  VALUES (p_queue_id, v_token, v_name, v_phone, p_party_size, v_assigned)
  RETURNING queue_visitors.id INTO v_id;

  PERFORM public.log_queue_activity(p_queue_id, v_id, 'joined', 'customer', '{}'::jsonb);

  id := v_id; token_number := v_token; assigned_table_size := v_assigned;
  RETURN NEXT;
END;
$$;

-- 6) Customer check-in (idempotent)
CREATE OR REPLACE FUNCTION public.check_in_visitor(p_visitor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_queue uuid; v_status text; v_already boolean;
BEGIN
  SELECT queue_id, status, (checked_in_at IS NOT NULL)
    INTO v_queue, v_status, v_already
  FROM public.queue_visitors WHERE id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_status NOT IN ('waiting','called','checked_in') THEN RETURN; END IF;

  UPDATE public.queue_visitors
    SET status = CASE WHEN status = 'waiting' THEN 'checked_in' ELSE status END,
        checked_in_at = COALESCE(checked_in_at, now())
    WHERE id = p_visitor_id;

  IF NOT v_already THEN
    PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'checked_in', 'customer', '{}'::jsonb);
  END IF;
END; $$;

-- 7) Skip
CREATE OR REPLACE FUNCTION public.skip_visitor(p_visitor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_queue uuid; v_owner uuid;
BEGIN
  SELECT qv.queue_id, b.owner_id INTO v_queue, v_owner
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.queue_visitors SET status = 'skipped' WHERE id = p_visitor_id;
  PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'skipped', 'business', '{}'::jsonb);
END; $$;

-- 8) Recall (skipped or no_show -> waiting)
CREATE OR REPLACE FUNCTION public.recall_visitor(p_visitor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_queue uuid; v_owner uuid; v_status text;
BEGIN
  SELECT qv.queue_id, b.owner_id, qv.status INTO v_queue, v_owner, v_status
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF v_status NOT IN ('skipped','no_show') THEN RAISE EXCEPTION 'visitor cannot be recalled'; END IF;
  UPDATE public.queue_visitors
    SET status = 'waiting', called_at = NULL, checked_in_at = NULL
    WHERE id = p_visitor_id;
  PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'recalled', 'business', '{}'::jsonb);
END; $$;

-- 9) Mark no-show
CREATE OR REPLACE FUNCTION public.mark_no_show(p_visitor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_queue uuid; v_owner uuid;
BEGIN
  SELECT qv.queue_id, b.owner_id INTO v_queue, v_owner
  FROM public.queue_visitors qv
  JOIN public.queues q ON q.id = qv.queue_id
  JOIN public.businesses b ON b.id = q.business_id
  WHERE qv.id = p_visitor_id FOR UPDATE;
  IF v_queue IS NULL THEN RAISE EXCEPTION 'visitor not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.queue_visitors SET status = 'no_show' WHERE id = p_visitor_id;
  PERFORM public.log_queue_activity(v_queue, p_visitor_id, 'no_show', 'business', '{}'::jsonb);
END; $$;

-- 10) Auto sweep: no-show past arrival window; remove waiting past auto-expire
CREATE OR REPLACE FUNCTION public.run_queue_integrity_sweep(p_queue_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_arr int; v_exp int; v_count int := 0; r record;
BEGIN
  SELECT b.owner_id, q.arrival_window_minutes, q.auto_expire_minutes
    INTO v_owner, v_arr, v_exp
  FROM public.queues q JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id;
  IF v_owner IS NULL THEN RETURN 0; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;

  IF COALESCE(v_arr, 0) > 0 THEN
    FOR r IN
      SELECT id FROM public.queue_visitors
      WHERE queue_id = p_queue_id
        AND status = 'called'
        AND checked_in_at IS NULL
        AND called_at IS NOT NULL
        AND called_at < now() - (v_arr || ' minutes')::interval
    LOOP
      UPDATE public.queue_visitors SET status = 'no_show' WHERE id = r.id;
      PERFORM public.log_queue_activity(p_queue_id, r.id, 'no_show', 'system',
        jsonb_build_object('reason','arrival_window_expired','window_minutes', v_arr));
      v_count := v_count + 1;
    END LOOP;
  END IF;

  IF COALESCE(v_exp, 0) > 0 THEN
    FOR r IN
      SELECT id FROM public.queue_visitors
      WHERE queue_id = p_queue_id
        AND status = 'waiting'
        AND joined_at < now() - (v_exp || ' minutes')::interval
    LOOP
      UPDATE public.queue_visitors SET status = 'removed' WHERE id = r.id;
      PERFORM public.log_queue_activity(p_queue_id, r.id, 'cancelled', 'system',
        jsonb_build_object('reason','auto_expired','expire_minutes', v_exp));
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END; $$;
