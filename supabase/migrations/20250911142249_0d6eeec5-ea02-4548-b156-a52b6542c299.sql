-- Create menu item modifiers table for add-ons and customizations
CREATE TABLE public.menu_item_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  modifier_type TEXT NOT NULL DEFAULT 'addon', -- 'addon', 'removal', 'substitution', 'size', 'preparation'
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER DEFAULT 1, -- for multi-select modifiers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view menu item modifiers" 
ON public.menu_item_modifiers 
FOR SELECT 
USING (true);

CREATE POLICY "Restaurant owners can manage their menu item modifiers" 
ON public.menu_item_modifiers 
FOR ALL 
USING (menu_item_id IN (
  SELECT mi.id 
  FROM menu_items mi 
  JOIN restaurants r ON mi.restaurant_id = r.id 
  WHERE r.owner_id = auth.uid()
));

-- Add some sample modifiers for existing menu items
INSERT INTO public.menu_item_modifiers (menu_item_id, name, description, modifier_type, price_cents, is_required, display_order) VALUES
-- For pizzas (assuming menu item exists)
('00000000-0000-0000-0000-000000000001', 'Extra Cheese', 'Add extra mozzarella cheese', 'addon', 150, false, 1),
('00000000-0000-0000-0000-000000000001', 'Pepperoni', 'Add pepperoni slices', 'addon', 200, false, 2),
('00000000-0000-0000-0000-000000000001', 'Mushrooms', 'Add fresh mushrooms', 'addon', 100, false, 3),
('00000000-0000-0000-0000-000000000001', 'No Tomato Sauce', 'Remove tomato sauce', 'removal', 0, false, 4),
('00000000-0000-0000-0000-000000000001', 'Gluten-Free Crust', 'Substitute with gluten-free crust', 'substitution', 300, false, 5),
('00000000-0000-0000-0000-000000000001', 'Pizza Size', 'Choose pizza size', 'size', 0, true, 0);

-- Add size options as separate modifiers
INSERT INTO public.menu_item_modifiers (menu_item_id, name, description, modifier_type, price_cents, is_required, display_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Small (10")', '10 inch pizza', 'size', 0, false, 1),
('00000000-0000-0000-0000-000000000001', 'Medium (12")', '12 inch pizza', 'size', 400, false, 2),
('00000000-0000-0000-0000-000000000001', 'Large (14")', '14 inch pizza', 'size', 800, false, 3);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_menu_item_modifiers_updated_at
BEFORE UPDATE ON public.menu_item_modifiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_menu_item_modifiers_menu_item_id ON public.menu_item_modifiers(menu_item_id);
CREATE INDEX idx_menu_item_modifiers_type ON public.menu_item_modifiers(modifier_type);
CREATE INDEX idx_menu_item_modifiers_available ON public.menu_item_modifiers(is_available);

-- Add missing columns to menu_items table for better customization
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS spice_level TEXT DEFAULT 'mild',
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- Create order items table to store detailed order information
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  menu_item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (order_id IN (
  SELECT id FROM orders WHERE customer_id = auth.uid() OR driver_id = auth.uid()
));

CREATE POLICY "Users can create order items for their orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (order_id IN (
  SELECT id FROM orders WHERE customer_id = auth.uid()
));

-- Create order item modifiers table to store selected modifiers
CREATE TABLE public.order_item_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL,
  modifier_id UUID NOT NULL,
  modifier_name TEXT NOT NULL, -- store name for historical purposes
  modifier_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order item modifiers
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Create policies for order item modifiers
CREATE POLICY "Users can view their own order item modifiers" 
ON public.order_item_modifiers 
FOR SELECT 
USING (order_item_id IN (
  SELECT oi.id FROM order_items oi 
  JOIN orders o ON oi.order_id = o.id 
  WHERE o.customer_id = auth.uid() OR o.driver_id = auth.uid()
));

CREATE POLICY "Users can create order item modifiers" 
ON public.order_item_modifiers 
FOR INSERT 
WITH CHECK (order_item_id IN (
  SELECT oi.id FROM order_items oi 
  JOIN orders o ON oi.order_id = o.id 
  WHERE o.customer_id = auth.uid()
));