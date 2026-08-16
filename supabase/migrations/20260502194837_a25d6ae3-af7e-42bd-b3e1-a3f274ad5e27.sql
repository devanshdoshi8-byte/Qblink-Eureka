-- Pickup orders
CREATE TABLE public.pickup_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  customer_user_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  token TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  eta_minutes INTEGER NOT NULL DEFAULT 15,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  no_show BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pickup_orders_business ON public.pickup_orders(business_id, created_at DESC);
CREATE INDEX idx_pickup_orders_status ON public.pickup_orders(business_id, status);

ALTER TABLE public.pickup_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create pickup orders"
  ON public.pickup_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view pickup orders"
  ON public.pickup_orders FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their pickup orders"
  ON public.pickup_orders FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admins manage all pickup orders"
  ON public.pickup_orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_pickup_orders_updated
  BEFORE UPDATE ON public.pickup_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Status events log
CREATE TABLE public.pickup_status_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID
);

CREATE INDEX idx_pickup_events_order ON public.pickup_status_events(order_id, changed_at);

ALTER TABLE public.pickup_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pickup events"
  ON public.pickup_status_events FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert pickup events"
  ON public.pickup_status_events FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT po.id FROM public.pickup_orders po
      JOIN public.businesses b ON b.id = po.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage pickup events"
  ON public.pickup_status_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Realtime
ALTER TABLE public.pickup_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_orders;