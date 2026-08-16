
CREATE TABLE public.customer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, business_id)
);

CREATE INDEX idx_customer_favorites_user_recent ON public.customer_favorites (user_id, last_used_at DESC);
CREATE INDEX idx_customer_favorites_business ON public.customer_favorites (business_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_favorites TO authenticated;
GRANT ALL ON public.customer_favorites TO service_role;

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own favorites"
ON public.customer_favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all favorites"
ON public.customer_favorites
FOR SELECT
TO authenticated
USING (public.is_admin());
