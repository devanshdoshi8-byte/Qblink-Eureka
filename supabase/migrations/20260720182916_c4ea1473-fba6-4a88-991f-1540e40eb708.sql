
-- Ensure existing restaurant parent queues have a sensible default seating mode.
UPDATE public.queues
SET seating_policy = 'flexible'
WHERE queue_type = 'restaurant'
  AND parent_queue_id IS NULL
  AND (seating_policy IS NULL OR seating_policy NOT IN ('flexible','strict'));

CREATE OR REPLACE FUNCTION public.join_restaurant_queue(
  p_parent_queue_id uuid,
  p_table_size integer,
  p_visitor_name text DEFAULT NULL::text,
  p_phone text DEFAULT NULL::text
)
 RETURNS TABLE(id uuid, token_number integer, child_queue_id uuid, table_size integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_parent public.queues;
  v_child_id uuid;
  v_policy text;
  v_effective_size int;
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
    RAISE EXCEPTION 'Please tell us how many people are joining.';
  END IF;

  SELECT * INTO v_parent FROM public.queues WHERE queues.id = p_parent_queue_id;
  IF v_parent.id IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_parent.queue_type <> 'restaurant' OR v_parent.parent_queue_id IS NOT NULL THEN
    RAISE EXCEPTION 'not a restaurant queue';
  END IF;

  v_policy := COALESCE(v_parent.seating_policy, 'flexible');

  -- Make sure child queues exist for every configured seat size.
  PERFORM public.sync_restaurant_child_queues(p_parent_queue_id);

  IF v_policy = 'strict' THEN
    -- Strict: party size must exactly match a configured seating size.
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(v_parent.table_config, '[]'::jsonb)) elem
      WHERE (elem->>'seats')::int = p_table_size
        AND COALESCE((elem->>'count')::int, 0) > 0
    ) THEN
      RAISE EXCEPTION 'Please pick one of our available seating sizes.';
    END IF;
    v_effective_size := p_table_size;
  ELSE
    -- Flexible: auto-route to the smallest configured seat >= party size.
    SELECT (elem->>'seats')::int INTO v_effective_size
    FROM jsonb_array_elements(COALESCE(v_parent.table_config, '[]'::jsonb)) elem
    WHERE COALESCE((elem->>'count')::int, 0) > 0
      AND (elem->>'seats')::int >= p_table_size
    ORDER BY (elem->>'seats')::int ASC
    LIMIT 1;

    -- If nobody fits, fall back to the largest configured seating (party size
    -- exceeds every table — customers will be seated by combining tables).
    IF v_effective_size IS NULL THEN
      SELECT (elem->>'seats')::int INTO v_effective_size
      FROM jsonb_array_elements(COALESCE(v_parent.table_config, '[]'::jsonb)) elem
      WHERE COALESCE((elem->>'count')::int, 0) > 0
      ORDER BY (elem->>'seats')::int DESC
      LIMIT 1;
    END IF;

    IF v_effective_size IS NULL THEN
      RAISE EXCEPTION 'This restaurant has not configured any tables yet.';
    END IF;
  END IF;

  SELECT queues.id INTO v_child_id FROM public.queues
    WHERE parent_queue_id = p_parent_queue_id AND queues.table_size = v_effective_size;
  IF v_child_id IS NULL THEN
    RAISE EXCEPTION 'This seating size is not available right now.';
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
  VALUES (v_child_id, v_token, v_name, v_phone, p_table_size, v_effective_size)
  RETURNING queue_visitors.id INTO v_id;

  PERFORM public.log_queue_activity(v_child_id, v_id, 'joined', 'customer',
    jsonb_build_object('party_size', p_table_size, 'table_size', v_effective_size, 'policy', v_policy));

  id := v_id;
  token_number := v_token;
  child_queue_id := v_child_id;
  table_size := v_effective_size;
  RETURN NEXT;
END;
$function$;
