-- Create restaurants table
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  cuisine_type text NOT NULL,
  phone text,
  email text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  image_url text,
  logo_url text,
  delivery_fee_cents integer DEFAULT 299,
  min_delivery_time integer DEFAULT 20,
  max_delivery_time integer DEFAULT 40,
  is_active boolean DEFAULT true,
  is_promoted boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  preparation_time integer DEFAULT 10,
  allergens text[],
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurants
CREATE POLICY "Anyone can view active restaurants"
ON public.restaurants
FOR SELECT
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their restaurants"
ON public.restaurants
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can insert their restaurants"
ON public.restaurants
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- RLS policies for menu categories
CREATE POLICY "Anyone can view active menu categories"
ON public.menu_categories
FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND is_active = true
));

CREATE POLICY "Restaurant owners can manage their menu categories"
ON public.menu_categories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND owner_id = auth.uid()
));

-- RLS policies for menu items
CREATE POLICY "Anyone can view available menu items"
ON public.menu_items
FOR SELECT
USING (is_available = true AND EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND is_active = true
));

CREATE POLICY "Restaurant owners can manage their menu items"
ON public.menu_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.restaurants 
  WHERE id = restaurant_id AND owner_id = auth.uid()
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();