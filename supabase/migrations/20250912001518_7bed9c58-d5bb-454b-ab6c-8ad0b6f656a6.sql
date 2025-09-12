-- Create customer_favorites table for favorites functionality
CREATE TABLE public.customer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate favorites
  UNIQUE(customer_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for customer favorites
CREATE POLICY "Users can view their own favorites" 
ON public.customer_favorites 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create their own favorites" 
ON public.customer_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.customer_favorites 
FOR DELETE 
USING (auth.uid() = customer_id);