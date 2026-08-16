
-- =========================================================
-- ADMIN CONTROL CENTER — Foundation tables (Phases 1-6)
-- =========================================================

-- 1) SITE CONTENT (Phase 1) — editable landing copy
CREATE TABLE public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content admin write" ON public.site_content FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2) ANNOUNCEMENTS (Phase 2)
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  scope TEXT NOT NULL DEFAULT 'platform' CHECK (scope IN ('platform','business','customer')),
  display_type TEXT NOT NULL DEFAULT 'banner' CHECK (display_type IN ('banner','popup','toast','maintenance')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warning','critical')),
  cta_label TEXT,
  cta_url TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements public read active" ON public.announcements FOR SELECT
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "announcements admin all" ON public.announcements FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3) COUPONS (Phase 2)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed','free_trial')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_redemptions INTEGER,
  redemptions_count INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','business','customer')),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4) QUEUE TEMPLATES (Phase 3)
CREATE TABLE public.queue_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  queue_type TEXT NOT NULL DEFAULT 'standard',
  estimated_service_time INTEGER NOT NULL DEFAULT 5,
  table_config JSONB,
  seating_policy TEXT,
  category TEXT,
  is_global BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_templates TO authenticated;
GRANT ALL ON public.queue_templates TO service_role;
ALTER TABLE public.queue_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_templates read all" ON public.queue_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "queue_templates admin write" ON public.queue_templates FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "queue_templates admin update" ON public.queue_templates FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "queue_templates admin delete" ON public.queue_templates FOR DELETE TO authenticated USING (public.is_admin());

-- 5) BUSINESS approval / suspension columns (Phase 3)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending','approved','rejected','suspended')),
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified')),
  ADD COLUMN IF NOT EXISTS operating_hours JSONB;

-- 6) AI KNOWLEDGE BASE (Phase 6)
CREATE TABLE public.ai_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all','customer','business','founder','admin')),
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[],
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_knowledge TO anon, authenticated;
GRANT ALL ON public.ai_knowledge TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.ai_knowledge TO authenticated;
ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_knowledge public read active" ON public.ai_knowledge FOR SELECT USING (is_active = true);
CREATE POLICY "ai_knowledge admin all" ON public.ai_knowledge FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7) NOTIFICATION TEMPLATES (Phase 6)
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('email','push','sms','whatsapp','in_app')),
  key TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates admin all" ON public.notification_templates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8) SYSTEM SETTINGS (Phase 6) — global config
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings public read" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings admin write" ON public.system_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9) Support ticket category on contact_submissions (Phase 4)
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','bug','feedback','feature_request','investor','partnership','demo','support'));

-- 10) Generic updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_site_content_updated_at') THEN
    CREATE TRIGGER tg_site_content_updated_at BEFORE UPDATE ON public.site_content
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_announcements_updated_at') THEN
    CREATE TRIGGER tg_announcements_updated_at BEFORE UPDATE ON public.announcements
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_coupons_updated_at') THEN
    CREATE TRIGGER tg_coupons_updated_at BEFORE UPDATE ON public.coupons
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_queue_templates_updated_at') THEN
    CREATE TRIGGER tg_queue_templates_updated_at BEFORE UPDATE ON public.queue_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_ai_knowledge_updated_at') THEN
    CREATE TRIGGER tg_ai_knowledge_updated_at BEFORE UPDATE ON public.ai_knowledge
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_notification_templates_updated_at') THEN
    CREATE TRIGGER tg_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_system_settings_updated_at') THEN
    CREATE TRIGGER tg_system_settings_updated_at BEFORE UPDATE ON public.system_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 11) Seed a handful of default editable content keys (no-op if exist)
INSERT INTO public.site_content (key, value) VALUES
  ('homepage.hero', '{"badge":"Smart Queue OS","headline":"Skip the wait. Not the visit.","subtitle":"Qblink turns chaotic walk-in lines into calm, hardware-free digital queues."}'::jsonb),
  ('footer', '{"tagline":"The Smart Queue OS for walk-in businesses.","email":"qblink2025@gmail.com"}'::jsonb),
  ('contact', '{"email":"qblink2025@gmail.com","phone":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, description) VALUES
  ('branding', '{"platform_name":"Qblink","primary_color":"#3B82F6"}'::jsonb, 'Logo, name, theme colors'),
  ('queue_defaults', '{"default_service_time":5,"max_queue_size":100,"auto_refresh_seconds":15}'::jsonb, 'Default behavior for new queues'),
  ('session', '{"timeout_minutes":120}'::jsonb, 'Session timeout for dashboard users')
ON CONFLICT (key) DO NOTHING;
