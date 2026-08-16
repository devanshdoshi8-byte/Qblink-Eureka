ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.queue_visitors REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_visitors;