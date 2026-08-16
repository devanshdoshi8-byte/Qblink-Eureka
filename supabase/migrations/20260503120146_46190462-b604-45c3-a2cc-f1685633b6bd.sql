-- Menu items for restaurants/cafes powering the pickup feature
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  prep_minutes INTEGER NOT NULL DEFAULT 5,
  description TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_business ON public.menu_items(business_id);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view available menu items (public ordering pages)
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Owners manage their own menu items
CREATE POLICY "Owners can manage their menu items"
  ON public.menu_items FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Admins manage all
CREATE POLICY "Admins can manage all menu items"
  ON public.menu_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();