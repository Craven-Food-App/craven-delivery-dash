-- Add pickup_code column to orders table
-- This is DIFFERENT from order_number - pickup codes are short verification codes
-- Format: 3 letters + 3 numbers (e.g., ABC123)
-- Order numbers are longer tracking codes (e.g., CRABCDEF)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pickup_code TEXT;

-- Create function to generate pickup code
-- Format: 3 letters + 3 numbers (e.g., ABC123)
-- Excludes I and O for clarity (look like 1 and 0)
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  letters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Exclude I, O for clarity
  numbers TEXT := '0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 3 random letters
  FOR i IN 1..3 LOOP
    code := code || substr(letters, floor(random() * length(letters) + 1)::integer, 1);
  END LOOP;
  
  -- Generate 3 random numbers
  FOR i IN 1..3 LOOP
    code := code || substr(numbers, floor(random() * length(numbers) + 1)::integer, 1);
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create function to ensure unique pickup code
CREATE OR REPLACE FUNCTION ensure_unique_pickup_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Only generate if pickup_code is NULL
  IF NEW.pickup_code IS NULL OR NEW.pickup_code = '' THEN
    LOOP
      new_code := generate_pickup_code();
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM public.orders WHERE pickup_code = new_code)
      INTO code_exists;
      
      -- Exit loop if code is unique
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.pickup_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate pickup codes on insert
DROP TRIGGER IF EXISTS trigger_generate_pickup_code ON public.orders;
CREATE TRIGGER trigger_generate_pickup_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unique_pickup_code();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON public.orders(pickup_code);

-- Add comment explaining the difference
COMMENT ON COLUMN public.orders.pickup_code IS 'Short pickup verification code (format: ABC123) automatically generated when order is created. Used by restaurant and driver to verify correct order pickup. This is DIFFERENT from order_number which is a longer tracking code (format: CRABCDEF).';

-- Update existing orders that don't have pickup codes
UPDATE public.orders 
SET pickup_code = generate_pickup_code()
WHERE pickup_code IS NULL OR pickup_code = '';

