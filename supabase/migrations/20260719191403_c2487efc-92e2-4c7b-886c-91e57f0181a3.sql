
CREATE TABLE IF NOT EXISTS public.business_internal_notes (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.business_internal_notes (business_id, notes)
SELECT id, internal_notes FROM public.businesses WHERE internal_notes IS NOT NULL
ON CONFLICT (business_id) DO NOTHING;

ALTER TABLE public.businesses DROP COLUMN IF EXISTS internal_notes;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_internal_notes TO authenticated;
GRANT ALL ON public.business_internal_notes TO service_role;

ALTER TABLE public.business_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their internal notes"
  ON public.business_internal_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Owners can manage their internal notes"
  ON public.business_internal_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Admins can view all internal notes"
  ON public.business_internal_notes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all internal notes"
  ON public.business_internal_notes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_business_internal_notes_updated_at
  BEFORE UPDATE ON public.business_internal_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
