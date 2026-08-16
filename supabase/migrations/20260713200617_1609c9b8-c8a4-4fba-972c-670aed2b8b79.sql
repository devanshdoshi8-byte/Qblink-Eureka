CREATE TABLE public.queue_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES public.queue_visitors(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_check','refresh','page_view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qee_business_created ON public.queue_engagement_events (business_id, created_at DESC);
CREATE INDEX idx_qee_queue_created ON public.queue_engagement_events (queue_id, created_at DESC);

GRANT SELECT, INSERT ON public.queue_engagement_events TO anon;
GRANT SELECT, INSERT ON public.queue_engagement_events TO authenticated;
GRANT ALL ON public.queue_engagement_events TO service_role;

ALTER TABLE public.queue_engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log engagement events"
  ON public.queue_engagement_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners view their engagement events"
  ON public.queue_engagement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = queue_engagement_events.business_id
        AND (b.owner_id = auth.uid() OR public.is_admin())
    )
  );