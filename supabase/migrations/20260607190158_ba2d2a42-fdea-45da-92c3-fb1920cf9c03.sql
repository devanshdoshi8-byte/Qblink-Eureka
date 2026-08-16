
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS queue_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS table_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seating_policy text NOT NULL DEFAULT 'strict';

ALTER TABLE public.queue_visitors
  ADD COLUMN IF NOT EXISTS party_size int,
  ADD COLUMN IF NOT EXISTS assigned_table_size int;

-- Replace join_queue with a backward-compatible version that also accepts party size.
DROP FUNCTION IF EXISTS public.join_queue(uuid, text, text);
DROP FUNCTION IF EXISTS public.join_queue(uuid, text, text, int);

CREATE OR REPLACE FUNCTION public.join_queue(
  p_queue_id uuid,
  p_visitor_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_party_size int DEFAULT NULL
)
RETURNS TABLE(id uuid, token_number integer, assigned_table_size integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_type text;
  v_table_config jsonb;
  v_token int;
  v_id uuid;
  v_name text;
  v_phone text;
  v_assigned int;
BEGIN
  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN RAISE EXCEPTION 'name too long'; END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN RAISE EXCEPTION 'phone too long'; END IF;

  SELECT q.status, q.next_token, q.queue_type, q.table_config
    INTO v_status, v_token, v_type, v_table_config
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_status IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'queue not active'; END IF;

  IF v_token IS NULL THEN v_token := 1; END IF;

  IF v_type = 'restaurant' THEN
    IF p_party_size IS NULL OR p_party_size < 1 THEN
      RAISE EXCEPTION 'party size required';
    END IF;
    -- pick smallest configured seats >= party_size with count > 0
    SELECT (elem->>'seats')::int
      INTO v_assigned
    FROM jsonb_array_elements(COALESCE(v_table_config, '[]'::jsonb)) elem
    WHERE (elem->>'seats')::int >= p_party_size
      AND COALESCE((elem->>'count')::int, 0) > 0
    ORDER BY (elem->>'seats')::int ASC
    LIMIT 1;

    IF v_assigned IS NULL THEN
      RAISE EXCEPTION 'no suitable table for party size %', p_party_size;
    END IF;
  END IF;

  UPDATE public.queues q SET next_token = v_token + 1, updated_at = now()
  WHERE q.id = p_queue_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone, party_size, assigned_table_size)
  VALUES (p_queue_id, v_token, v_name, v_phone, p_party_size, v_assigned)
  RETURNING queue_visitors.id INTO v_id;

  id := v_id;
  token_number := v_token;
  assigned_table_size := v_assigned;
  RETURN NEXT;
END;
$function$;

-- Serve next visitor for a chosen table size in a restaurant queue.
CREATE OR REPLACE FUNCTION public.serve_restaurant_next(
  p_queue_id uuid,
  p_table_size int
)
RETURNS TABLE(id uuid, token_number integer, visitor_name text, phone text, assigned_table_size integer, party_size integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_type text;
  v_policy text;
  v_id uuid;
  v_token int;
  v_name text;
  v_phone text;
  v_assigned int;
  v_party int;
BEGIN
  SELECT b.owner_id, q.queue_type, q.seating_policy
    INTO v_owner, v_type, v_policy
  FROM public.queues q
  JOIN public.businesses b ON b.id = q.business_id
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'queue not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF v_type <> 'restaurant' THEN
    RAISE EXCEPTION 'not a restaurant queue';
  END IF;

  -- Auto-complete any prior called visitor (mirrors call_next)
  UPDATE public.queue_visitors
  SET status = 'served', served_at = COALESCE(served_at, now())
  WHERE queue_id = p_queue_id AND status = 'called';

  -- Strict: exact match only. Flexible: exact first, then smaller sizes (largest-first).
  IF v_policy = 'flexible' THEN
    SELECT qv.id, qv.token_number, qv.visitor_name, qv.phone, qv.assigned_table_size, qv.party_size
      INTO v_id, v_token, v_name, v_phone, v_assigned, v_party
    FROM public.queue_visitors qv
    WHERE qv.queue_id = p_queue_id
      AND qv.status = 'waiting'
      AND qv.assigned_table_size IS NOT NULL
      AND qv.assigned_table_size <= p_table_size
    ORDER BY (qv.assigned_table_size = p_table_size) DESC,
             qv.assigned_table_size DESC,
             qv.token_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  ELSE
    SELECT qv.id, qv.token_number, qv.visitor_name, qv.phone, qv.assigned_table_size, qv.party_size
      INTO v_id, v_token, v_name, v_phone, v_assigned, v_party
    FROM public.queue_visitors qv
    WHERE qv.queue_id = p_queue_id
      AND qv.status = 'waiting'
      AND qv.assigned_table_size = p_table_size
    ORDER BY qv.token_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF v_id IS NULL THEN
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
  assigned_table_size := v_assigned;
  party_size := v_party;
  RETURN NEXT;
END;
$function$;
