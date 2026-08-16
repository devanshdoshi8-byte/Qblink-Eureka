DROP POLICY IF EXISTS "Anyone can view active queues" ON public.queues;
CREATE POLICY "Anyone can view queues" ON public.queues FOR SELECT USING (true);