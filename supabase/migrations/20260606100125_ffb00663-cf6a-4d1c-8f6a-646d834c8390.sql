CREATE TABLE IF NOT EXISTS public.health_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_health_ai_sessions_biz_user ON public.health_ai_sessions(business_id, user_id, last_message_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_ai_sessions TO authenticated;
GRANT ALL ON public.health_ai_sessions TO service_role;
ALTER TABLE public.health_ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their AI sessions" ON public.health_ai_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admins manage all AI sessions" ON public.health_ai_sessions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.health_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.health_ai_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_ai_messages_session ON public.health_ai_messages(session_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_ai_messages TO authenticated;
GRANT ALL ON public.health_ai_messages TO service_role;
ALTER TABLE public.health_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage messages in their sessions" ON public.health_ai_messages
  FOR ALL TO authenticated
  USING (session_id IN (SELECT id FROM public.health_ai_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.health_ai_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all AI messages" ON public.health_ai_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());