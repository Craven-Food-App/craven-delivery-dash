-- Create customer_reviews table
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  food_quality INTEGER CHECK (food_quality >= 1 AND food_quality <= 5),
  delivery_speed INTEGER CHECK (delivery_speed >= 1 AND delivery_speed <= 5),
  order_accuracy INTEGER CHECK (order_accuracy >= 1 AND order_accuracy <= 5),
  is_flagged BOOLEAN DEFAULT false,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Customers can create reviews for their orders
CREATE POLICY "Customers can create reviews for their orders"
ON public.customer_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id 
  AND order_id IN (
    SELECT id FROM public.orders WHERE customer_id = auth.uid()
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view their own reviews"
ON public.customer_reviews
FOR SELECT
USING (auth.uid() = customer_id);

-- Restaurant owners can view reviews for their restaurant
CREATE POLICY "Restaurant owners can view their reviews"
ON public.customer_reviews
FOR SELECT
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- Restaurant owners can respond to reviews
CREATE POLICY "Restaurant owners can respond to reviews"
ON public.customer_reviews
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.customer_reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Everyone can view public reviews (for restaurant pages)
CREATE POLICY "Public can view reviews"
ON public.customer_reviews
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_customer_reviews_restaurant ON public.customer_reviews(restaurant_id);
CREATE INDEX idx_customer_reviews_customer ON public.customer_reviews(customer_id);
CREATE INDEX idx_customer_reviews_order ON public.customer_reviews(order_id);
CREATE INDEX idx_customer_reviews_rating ON public.customer_reviews(rating);
CREATE INDEX idx_customer_reviews_created ON public.customer_reviews(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_reviews_updated_at
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();