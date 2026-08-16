
CREATE OR REPLACE FUNCTION public.call_next(p_queue_id uuid)
RETURNS TABLE(id uuid, token_number integer, visitor_name text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_next record;
BEGIN
  -- Lock the queue row to serialize Call Next on this queue
  SELECT q.status INTO v_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'queue not found';
  END IF;

  -- Finalize anyone currently 'called' on this queue (auto-serve previous)
  UPDATE public.queue_visitors
  SET status = 'served', served_at = COALESCE(served_at, now())
  WHERE queue_id = p_queue_id AND status = 'called';

  -- Pick the lowest-numbered waiting visitor
  SELECT qv.id, qv.token_number, qv.visitor_name, qv.phone
    INTO v_next
  FROM public.queue_visitors qv
  WHERE qv.queue_id = p_queue_id AND qv.status = 'waiting'
  ORDER BY qv.token_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_next.id IS NULL THEN
    -- No one waiting; clear current_token
    UPDATE public.queues SET current_token = 0, updated_at = now()
    WHERE id = p_queue_id;
    RETURN;
  END IF;

  UPDATE public.queue_visitors
  SET status = 'called', called_at = now()
  WHERE id = v_next.id;

  UPDATE public.queues
  SET current_token = v_next.token_number, updated_at = now()
  WHERE id = p_queue_id;

  RETURN QUERY SELECT v_next.id, v_next.token_number, v_next.visitor_name, v_next.phone;
END;
$$;
