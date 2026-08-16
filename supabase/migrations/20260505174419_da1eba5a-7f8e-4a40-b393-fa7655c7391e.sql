CREATE OR REPLACE FUNCTION public.join_queue(p_queue_id uuid, p_visitor_name text DEFAULT NULL::text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, token_number integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_token int;
  v_id uuid;
  v_name text;
  v_phone text;
BEGIN
  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN
    RAISE EXCEPTION 'name too long';
  END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN
    RAISE EXCEPTION 'phone too long';
  END IF;

  SELECT q.status, q.next_token INTO v_status, v_token
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'queue not active';
  END IF;

  IF v_token IS NULL THEN v_token := 1; END IF;

  UPDATE public.queues q SET next_token = v_token + 1, updated_at = now()
  WHERE q.id = p_queue_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone)
  VALUES (p_queue_id, v_token, v_name, v_phone)
  RETURNING queue_visitors.id INTO v_id;

  RETURN QUERY SELECT v_id, v_token;
END;
$function$;