ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS discovery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS remote_joining_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_live_queue_info boolean NOT NULL DEFAULT true;