
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their businesses" ON public.businesses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can create businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their businesses" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their businesses" ON public.businesses FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Queues table
CREATE TABLE public.queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  estimated_service_time INT DEFAULT 5,
  note TEXT,
  current_token INT DEFAULT 0,
  next_token INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue owners can manage" ON public.queues FOR ALL USING (
  business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone can view active queues" ON public.queues FOR SELECT USING (status = 'active');

CREATE TRIGGER update_queues_updated_at BEFORE UPDATE ON public.queues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Queue visitors table
CREATE TABLE public.queue_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  token_number INT NOT NULL,
  visitor_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'served', 'skipped', 'removed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ
);
ALTER TABLE public.queue_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue owners can manage visitors" ON public.queue_visitors FOR ALL USING (
  queue_id IN (SELECT q.id FROM public.queues q JOIN public.businesses b ON q.business_id = b.id WHERE b.owner_id = auth.uid())
);
CREATE POLICY "Anyone can join queue" ON public.queue_visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view queue visitors" ON public.queue_visitors FOR SELECT USING (true);

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business TEXT,
  phone TEXT,
  industry TEXT,
  message TEXT,
  submission_type TEXT NOT NULL DEFAULT 'contact' CHECK (submission_type IN ('contact', 'demo', 'early_access')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.contact_submissions FOR INSERT WITH CHECK (true);

-- Affiliate signups table
CREATE TABLE public.affiliate_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  referral_code TEXT UNIQUE DEFAULT 'QB-' || substr(md5(random()::text), 1, 8),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can signup as affiliate" ON public.affiliate_signups FOR INSERT WITH CHECK (true);
