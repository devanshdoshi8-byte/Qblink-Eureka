-- Performance: the hottest read paths in the app
CREATE INDEX IF NOT EXISTS idx_queue_visitors_queue_status ON public.queue_visitors (queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_visitors_queue_token ON public.queue_visitors (queue_id, token_number);
CREATE INDEX IF NOT EXISTS idx_queue_visitors_joined_at ON public.queue_visitors (joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_live_signals_queue_created ON public.queue_live_signals (queue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queues_parent ON public.queues (parent_queue_id);

-- Referential integrity: no orphaned records
ALTER TABLE public.queue_live_signals
  ADD CONSTRAINT queue_live_signals_queue_id_fkey
  FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE CASCADE;

ALTER TABLE public.queue_sessions
  ADD CONSTRAINT queue_sessions_queue_id_fkey
  FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE CASCADE,
  ADD CONSTRAINT queue_sessions_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.pickup_orders
  ADD CONSTRAINT pickup_orders_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.customer_favorites
  ADD CONSTRAINT customer_favorites_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.queue_health_daily
  ADD CONSTRAINT queue_health_daily_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.queue_health_alerts
  ADD CONSTRAINT queue_health_alerts_business_id_fkey
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Keep the realtime signal table bounded: prune rows older than 1 hour
-- opportunistically on insert (cheap, indexed, no cron required).
CREATE OR REPLACE FUNCTION public.prune_queue_live_signals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF random() < 0.02 THEN
    DELETE FROM public.queue_live_signals WHERE created_at < now() - interval '1 hour';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_queue_live_signals ON public.queue_live_signals;
CREATE TRIGGER trg_prune_queue_live_signals
AFTER INSERT ON public.queue_live_signals
FOR EACH ROW EXECUTE FUNCTION public.prune_queue_live_signals();