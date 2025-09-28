-- Add missing fields to orders table for enhanced order flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS pickup_photo_url TEXT,
ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  random_chars TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6 character alphanumeric code
  FOR i IN 1..6 LOOP
    random_chars := random_chars || chr(65 + floor(random() * 26)::int);
  END LOOP;
  
  RETURN 'CR' || random_chars;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers for new orders
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS orders_set_order_number ON public.orders;

-- Create trigger for order number generation
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Update existing orders without order numbers
UPDATE public.orders 
SET order_number = generate_order_number()
WHERE order_number IS NULL;