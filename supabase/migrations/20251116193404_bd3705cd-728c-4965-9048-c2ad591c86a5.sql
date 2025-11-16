-- Create marketing_settings table
CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_hero_image_url TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promotional_banners table
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_settings (admin only)
CREATE POLICY "Allow read access to marketing_settings"
  ON public.marketing_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert on marketing_settings"
  ON public.marketing_settings
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Allow admin update on marketing_settings"
  ON public.marketing_settings
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- RLS Policies for promotional_banners
CREATE POLICY "Allow read access to active promotional_banners"
  ON public.promotional_banners
  FOR SELECT
  USING (is_active = true OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Allow admin insert on promotional_banners"
  ON public.promotional_banners
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Allow admin update on promotional_banners"
  ON public.promotional_banners
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Allow admin delete on promotional_banners"
  ON public.promotional_banners
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));