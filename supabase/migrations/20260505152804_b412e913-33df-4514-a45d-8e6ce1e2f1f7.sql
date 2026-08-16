
-- 1) Restrict public read on queue_visitors; expose only safe columns via a view
DROP POLICY IF EXISTS "Anyone can view queue visitors" ON public.queue_visitors;

CREATE OR REPLACE VIEW public.queue_visitors_public AS
SELECT id, queue_id, token_number, status, joined_at, called_at
FROM public.queue_visitors;

GRANT SELECT ON public.queue_visitors_public TO anon, authenticated;

-- 2) Server-side atomic join via SECURITY DEFINER function
DROP POLICY IF EXISTS "Anyone can join queue" ON public.queue_visitors;

CREATE OR REPLACE FUNCTION public.join_queue(
  p_queue_id uuid,
  p_visitor_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
) RETURNS TABLE (id uuid, token_number int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_token int;
  v_id uuid;
  v_name text;
  v_phone text;
BEGIN
  -- Validate input lengths
  v_name := NULLIF(btrim(coalesce(p_visitor_name, '')), '');
  v_phone := NULLIF(btrim(coalesce(p_phone, '')), '');
  IF v_name IS NOT NULL AND length(v_name) > 100 THEN
    RAISE EXCEPTION 'name too long';
  END IF;
  IF v_phone IS NOT NULL AND length(v_phone) > 20 THEN
    RAISE EXCEPTION 'phone too long';
  END IF;

  -- Lock queue row, ensure active, atomically increment next_token
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

  UPDATE public.queues SET next_token = v_token + 1, updated_at = now()
  WHERE id = p_queue_id;

  INSERT INTO public.queue_visitors (queue_id, token_number, visitor_name, phone)
  VALUES (p_queue_id, v_token, v_name, v_phone)
  RETURNING queue_visitors.id INTO v_id;

  RETURN QUERY SELECT v_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_queue(uuid, text, text) TO anon, authenticated;

-- 3) Restrict user_roles self-insert to non-privileged roles only
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can insert their own non-privileged role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('customer'::app_role, 'business'::app_role));
