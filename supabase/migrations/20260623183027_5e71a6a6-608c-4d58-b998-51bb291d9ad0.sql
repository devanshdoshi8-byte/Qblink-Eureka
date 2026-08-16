ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can update contact_submissions notes"
ON public.contact_submissions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());