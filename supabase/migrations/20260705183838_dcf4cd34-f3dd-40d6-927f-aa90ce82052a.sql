
CREATE TABLE public.trust_privacy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('modal_opened','early_access_submitted')),
  session_id text,
  viewed_modal boolean NOT NULL DEFAULT false,
  seconds_since_view integer,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.trust_privacy_events TO anon, authenticated;
GRANT ALL ON public.trust_privacy_events TO service_role;
ALTER TABLE public.trust_privacy_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert trust events"
  ON public.trust_privacy_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can read trust events"
  ON public.trust_privacy_events FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE INDEX idx_trust_privacy_events_type_created ON public.trust_privacy_events(event_type, created_at DESC);
CREATE INDEX idx_trust_privacy_events_session ON public.trust_privacy_events(session_id);
