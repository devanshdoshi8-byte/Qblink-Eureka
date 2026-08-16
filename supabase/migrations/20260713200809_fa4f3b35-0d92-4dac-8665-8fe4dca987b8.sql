ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS default_settings JSONB NOT NULL DEFAULT '{}'::jsonb;