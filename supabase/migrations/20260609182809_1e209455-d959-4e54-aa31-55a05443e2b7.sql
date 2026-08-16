CREATE TABLE public.onboarding_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  social_profile TEXT,
  role TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.onboarding_leads TO anon;
GRANT INSERT ON public.onboarding_leads TO authenticated;
GRANT ALL ON public.onboarding_leads TO service_role;

ALTER TABLE public.onboarding_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit onboarding leads"
ON public.onboarding_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view onboarding leads"
ON public.onboarding_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_onboarding_leads_updated_at
BEFORE UPDATE ON public.onboarding_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();