-- Create customer_orders table and add Moov.io support
-- This is a complete deployment script for payment processing

-- Step 1: Create customer_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  order_items JSONB NOT NULL, -- Store cart items as JSON
  subtotal_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  special_instructions TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  estimated_pickup_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Step 3: Add payment provider and Moov fields
ALTER TABLE public.customer_orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS moov_payment_id TEXT,
ADD COLUMN IF NOT EXISTS moov_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moov' CHECK (payment_provider IN ('stripe', 'moov'));

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON public.customer_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_moov_payment_id ON public.customer_orders(moov_payment_id);

-- Step 5: Update existing orders to have provider
UPDATE public.customer_orders SET payment_provider = 'moov' WHERE payment_provider IS NULL;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Restaurants can view their customer orders" ON public.customer_orders;
CREATE POLICY "Restaurants can view their customer orders" 
ON public.customer_orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = customer_orders.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Restaurants can update their customer orders" ON public.customer_orders;
CREATE POLICY "Restaurants can update their customer orders" 
ON public.customer_orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = customer_orders.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Anyone can create customer orders" ON public.customer_orders;
CREATE POLICY "Anyone can create customer orders" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

-- Step 7: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_customer_orders_updated_at ON public.customer_orders;
CREATE TRIGGER update_customer_orders_updated_at
BEFORE UPDATE ON public.customer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Add Moov fields to payment_methods if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    ALTER TABLE public.payment_methods
    ADD COLUMN IF NOT EXISTS moov_card_id TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_payment_methods_moov_card_id ON public.payment_methods(moov_card_id);
  END IF;
END $$;

-- Verification
SELECT 
  '✅ customer_orders table created with Moov support' as status,
  COUNT(*) as existing_orders
FROM public.customer_orders;

