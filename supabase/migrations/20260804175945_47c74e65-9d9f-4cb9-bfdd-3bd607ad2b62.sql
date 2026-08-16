-- CUSTOMER NOTIFICATIONS
CREATE TABLE public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_notifications_user ON public.customer_notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notifications TO authenticated;
GRANT ALL ON public.customer_notifications TO service_role;

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own notifications"
  ON public.customer_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users update their own notifications"
  ON public.customer_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their own notifications"
  ON public.customer_notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Business owners send notifications"
  ON public.customer_notifications FOR INSERT TO authenticated
  WITH CHECK (
    business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE TRIGGER tg_customer_notifications_updated_at
  BEFORE UPDATE ON public.customer_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  queue_id uuid REFERENCES public.queues(id) ON DELETE SET NULL,
  customer_user_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  service_name text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  party_size integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_customer ON public.appointments(customer_user_id, scheduled_at DESC);
CREATE INDEX idx_appointments_business ON public.appointments(business_id, scheduled_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "Customers create their own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (customer_user_id = auth.uid());

CREATE POLICY "Customers and owners update appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    customer_user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "Customers delete their own appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (customer_user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER tg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger (time-dependent rules must not be CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_appointment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.duration_minutes < 5 OR NEW.duration_minutes > 480 THEN
    RAISE EXCEPTION 'Duration must be between 5 and 480 minutes.';
  END IF;
  IF NEW.party_size < 1 OR NEW.party_size > 50 THEN
    RAISE EXCEPTION 'Party size must be between 1 and 50.';
  END IF;
  IF NEW.status NOT IN ('scheduled','confirmed','completed','cancelled','no_show') THEN
    RAISE EXCEPTION 'Invalid appointment status.';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.scheduled_at < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'Appointments cannot be scheduled in the past.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_validate_appointment
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_appointment();

-- Realtime
ALTER TABLE public.customer_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;