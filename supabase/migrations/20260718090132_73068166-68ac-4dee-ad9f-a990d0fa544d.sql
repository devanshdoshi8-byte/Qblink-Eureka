ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS parent_queue_id uuid REFERENCES public.queues(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS table_size integer;

CREATE INDEX IF NOT EXISTS queues_parent_queue_id_idx ON public.queues(parent_queue_id);
CREATE UNIQUE INDEX IF NOT EXISTS queues_parent_table_size_uidx
  ON public.queues(parent_queue_id, table_size)
  WHERE parent_queue_id IS NOT NULL AND table_size IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_restaurant_child_queues(p_parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent public.queues;
  v_seat int;
  v_seats int[] := ARRAY[]::int[];
  v_child_id uuid;
  v_has_active boolean;
  elem jsonb;
BEGIN
  SELECT * INTO v_parent FROM public.queues WHERE id = p_parent_id;
  IF v_parent.id IS NULL THEN RETURN; END IF;
  IF v_parent.queue_type IS DISTINCT FROM 'restaurant' THEN RETURN; END IF;
  IF v_parent.parent_queue_id IS NOT NULL THEN RETURN; END IF;

  FOR elem IN SELECT jsonb_array_elements(COALESCE(v_parent.table_config, '[]'::jsonb))
  LOOP
    IF COALESCE((elem->>'count')::int, 0) > 0 THEN
      v_seats := array_append(v_seats, (elem->>'seats')::int);
    END IF;
  END LOOP;
  SELECT ARRAY(SELECT DISTINCT unnest(v_seats) ORDER BY 1) INTO v_seats;

  FOREACH v_seat IN ARRAY v_seats LOOP
    SELECT id INTO v_child_id FROM public.queues
      WHERE parent_queue_id = p_parent_id AND table_size = v_seat;
    IF v_child_id IS NULL THEN
      INSERT INTO public.queues (
        business_id, name, status, estimated_service_time, note,
        queue_type, table_config, seating_policy,
        parent_queue_id, table_size,
        arrival_window_minutes, auto_expire_minutes,
        duplicate_protection, join_cooldown_minutes
      ) VALUES (
        v_parent.business_id,
        v_parent.name || ' · ' || v_seat || '-seat',
        'active',
        v_parent.estimated_service_time,
        v_parent.note,
        'restaurant_size',
        '[]'::jsonb,
        v_parent.seating_policy,
        p_parent_id,
        v_seat,
        v_parent.arrival_window_minutes,
        v_parent.auto_expire_minutes,
        v_parent.duplicate_protection,
        v_parent.join_cooldown_minutes
      );
    ELSE
      UPDATE public.queues SET
        name = v_parent.name || ' · ' || v_seat || '-seat',
        estimated_service_time = v_parent.estimated_service_time,
        seating_policy = v_parent.seating_policy,
        arrival_window_minutes = v_parent.arrival_window_minutes,
        auto_expire_minutes = v_parent.auto_expire_minutes,
        duplicate_protection = v_parent.duplicate_protection,
        join_cooldown_minutes = v_parent.join_cooldown_minutes,
        updated_at = now()
      WHERE id = v_child_id;
    END IF;
  END LOOP;

  FOR v_child_id, v_seat IN
    SELECT id, table_size FROM public.queues
    WHERE parent_queue_id = p_parent_id
      AND (table_size IS NULL OR NOT (table_size = ANY(v_seats)))
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = v_child_id
        AND status IN ('waiting','checked_in','called','serving')
    ) INTO v_has_active;
    IF v_has_active THEN
      UPDATE public.queues SET status = 'paused', updated_at = now() WHERE id = v_child_id;
    ELSE
      DELETE FROM public.queues WHERE id = v_child_id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_restaurant_children()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.queue_type = 'restaurant' AND NEW.parent_queue_id IS NULL THEN
    IF TG_OP = 'INSERT'
       OR OLD.table_config IS DISTINCT FROM NEW.table_config
       OR OLD.name IS DISTINCT FROM NEW.name
       OR OLD.estimated_service_time IS DISTINCT FROM NEW.estimated_service_time
       OR OLD.seating_policy IS DISTINCT FROM NEW.seating_policy
       OR OLD.arrival_window_minutes IS DISTINCT FROM NEW.arrival_window_minutes
       OR OLD.auto_expire_minutes IS DISTINCT FROM NEW.auto_expire_minutes
    THEN
      PERFORM public.sync_restaurant_child_queues(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queues_sync_restaurant_children ON public.queues;
CREATE TRIGGER queues_sync_restaurant_children
AFTER INSERT OR UPDATE ON public.queues
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_restaurant_children();

CREATE OR REPLACE FUNCTION public.join_restaurant_queue(
  p_parent_queue_id uuid,
  p_table_size integer,
  p_visitor_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
) RETURNS TABLE(id uuid, token_number integer, child_queue_id uuid, table_size integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent public.queues;
  v_child_id uuid;
  v_configured boolean;
  v_name text;
  v_phone text;
  v_dup_protect boolean;
  v_cooldown int;
  v_hit boolean;
  v_token int;
  v_status text;
  v_id uuid;
BEGIN
  IF p_table_size IS NULL OR p_table_size < 1 THEN
    RAISE EXCEPTION 'Please select a table size to continue.';
  END IF;

  SELECT * INTO v_parent FROM public.queues WHERE queues.id = p_parent_queue_id;
  IF v_parent.id IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_parent.queue_type <> 'restaurant' OR v_parent.parent_queue_id IS NOT NULL THEN
    RAISE EXCEPTION 'not a restaurant queue';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(v_parent.table_config, '[]'::jsonb)) elem
    WHERE (elem->>'seats')::int = p_table_size
      AND COALESCE((elem->>'count')::int, 0) > 0
  ) INTO v_configured;
  IF NOT v_configured THEN
    RAISE EXCEPTION 'This table size is not available right now.';
  END IF;

  PERFORM public.sync_restaurant_child_queues(p_parent_queue_id);
  SELECT queues.id INTO v_child_id FROM public.queues
    WHERE parent_queue_id = p_parent_queue_id AND queues.table_size = p_table_size;
  IF v_child_id IS NULL THEN
    RAISE EXCEPTION 'This table size is not available right now.';
  END IF;

  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN RAISE EXCEPTION 'name too long'; END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN RAISE EXCEPTION 'phone too long'; END IF;

  SELECT status, next_token, duplicate_protection, join_cooldown_minutes
    INTO v_status, v_token, v_dup_protect, v_cooldown
  FROM public.queues WHERE queues.id = v_child_id FOR UPDATE;

  IF v_status <> 'active' THEN RAISE EXCEPTION 'This queue is not accepting new customers right now.'; END IF;
  IF v_token IS NULL THEN v_token := 1; END IF;

  IF COALESCE(v_dup_protect, true) AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = v_child_id AND phone = v_phone
        AND status IN ('waiting','checked_in','called','serving')
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'You are already in this queue.'; END IF;
  END IF;

  IF COALESCE(v_cooldown, 0) > 0 AND v_phone IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.queue_visitors
      WHERE queue_id = v_child_id AND phone = v_phone
        AND joined_at > now() - (v_cooldown || ' minutes')::interval
    ) INTO v_hit;
    IF v_hit THEN RAISE EXCEPTION 'Please wait a moment before rejoining this queue.'; END IF;
  END IF;

  UPDATE public.queues SET next_token = v_token + 1, updated_at = now() WHERE queues.id = v_child_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone, party_size, assigned_table_size)
  VALUES (v_child_id, v_token, v_name, v_phone, p_table_size, p_table_size)
  RETURNING queue_visitors.id INTO v_id;

  PERFORM public.log_queue_activity(v_child_id, v_id, 'joined', 'customer',
    jsonb_build_object('table_size', p_table_size));

  id := v_id;
  token_number := v_token;
  child_queue_id := v_child_id;
  table_size := p_table_size;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_restaurant_queue(uuid, integer, text, text) TO anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.queues WHERE queue_type = 'restaurant' AND parent_queue_id IS NULL
  LOOP
    PERFORM public.sync_restaurant_child_queues(r.id);
  END LOOP;
END $$;