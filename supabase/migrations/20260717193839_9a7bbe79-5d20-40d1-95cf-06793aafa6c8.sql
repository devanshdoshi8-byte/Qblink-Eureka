ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS party_sizes integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,8,10]::integer[],
  ADD COLUMN IF NOT EXISTS party_size_mode text NOT NULL DEFAULT 'common';