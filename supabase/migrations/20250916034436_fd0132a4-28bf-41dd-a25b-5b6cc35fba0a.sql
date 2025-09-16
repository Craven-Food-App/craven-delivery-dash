-- Create menu item favorites table
CREATE TABLE public.menu_item_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  menu_item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, menu_item_id)
);

-- Enable RLS
ALTER TABLE public.menu_item_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own menu item favorites" 
ON public.menu_item_favorites 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create their own menu item favorites" 
ON public.menu_item_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own menu item favorites" 
ON public.menu_item_favorites 
FOR DELETE 
USING (auth.uid() = customer_id);

-- Add realtime
ALTER TABLE public.menu_item_favorites REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_item_favorites;