-- Create menu item modifiers table
CREATE TABLE public.menu_item_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  modifier_type TEXT NOT NULL DEFAULT 'addon', -- 'addon', 'removal', 'substitution'
  is_required BOOLEAN DEFAULT false,
  max_selections INTEGER DEFAULT 1, -- for group modifiers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available modifiers for available menu items" 
ON public.menu_item_modifiers 
FOR SELECT 
USING (
  is_available = true 
  AND EXISTS (
    SELECT 1 FROM menu_items 
    WHERE menu_items.id = menu_item_modifiers.menu_item_id 
    AND menu_items.is_available = true
  )
);

CREATE POLICY "Restaurant owners can manage their menu item modifiers" 
ON public.menu_item_modifiers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM menu_items 
    JOIN restaurants ON restaurants.id = menu_items.restaurant_id
    WHERE menu_items.id = menu_item_modifiers.menu_item_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_menu_item_modifiers_updated_at
BEFORE UPDATE ON public.menu_item_modifiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();