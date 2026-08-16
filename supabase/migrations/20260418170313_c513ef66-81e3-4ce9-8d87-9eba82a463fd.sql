
-- Backend-stored admin allowlist
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_emails (email) VALUES
  ('devanshdoshi8@gmail.com'),
  ('devanshdoshi14@gmail.com'),
  ('qblink2025@gmail.com'),
  ('qblinkofficial@gmail.com'),
  ('qblinktrial@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails ae
    JOIN auth.users u ON lower(u.email) = lower(ae.email)
    WHERE u.id = auth.uid()
  );
$$;

CREATE POLICY "Admins can view admin_emails" ON public.admin_emails FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage admin_emails" ON public.admin_emails FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all businesses" ON public.businesses FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all businesses" ON public.businesses FOR DELETE USING (public.is_admin());
CREATE POLICY "Admins can view all customer_profiles" ON public.customer_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all queues" ON public.queues FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all queues" ON public.queues FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage all queue_visitors" ON public.queue_visitors FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view contact_submissions" ON public.contact_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view affiliate_signups" ON public.affiliate_signups FOR SELECT USING (public.is_admin());

-- Auto-grant admin role for allowlisted emails
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_admin_sync ON auth.users;
CREATE TRIGGER on_auth_user_admin_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role();

-- Backfill existing allowlisted users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
JOIN public.admin_emails ae ON lower(u.email) = lower(ae.email)
ON CONFLICT DO NOTHING;
