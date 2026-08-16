
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_rank integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_businesses_display_rank ON public.businesses(display_rank DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_reviews TO authenticated;
GRANT ALL ON public.business_reviews TO service_role;

ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible reviews"
  ON public.business_reviews FOR SELECT
  USING (is_hidden = false OR public.is_admin());

CREATE POLICY "Authenticated can create reviews"
  ON public.business_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Reviewer can update own review"
  ON public.business_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_user_id)
  WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Reviewer can delete own review"
  ON public.business_reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Admins manage all reviews"
  ON public.business_reviews FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_business_reviews_updated
  BEFORE UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
