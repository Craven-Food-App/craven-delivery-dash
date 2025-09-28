-- Fix security warnings by setting search_path on the new functions
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;