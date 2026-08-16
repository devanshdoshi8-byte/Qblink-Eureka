
CREATE OR REPLACE FUNCTION public.call_next(p_queue_id uuid)
RETURNS TABLE(id uuid, token_number integer, visitor_name text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_id uuid;
  v_token integer;
  v_name text;
  v_phone text;
BEGIN
  SELECT q.status INTO v_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;

  UPDATE public.queue_visitors
  SET status = 'served', served_at = COALESCE(served_at, now())
  WHERE queue_id = p_queue_id AND status = 'called';

  SELECT qv.id, qv.token_number, qv.visitor_name, qv.phone
    INTO v_id, v_token, v_name, v_phone
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id AND qv.status = 'waiting'
  ORDER BY qv.token_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NULL THEN
    UPDATE public.queues SET current_token = 0, updated_at = now()
    WHERE public.queues.id = p_queue_id;
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
  RETURN NEXT;
END;
$$;
