-- Fix foreign key constraints to reference auth.users instead of custom users table
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey,
DROP CONSTRAINT IF EXISTS orders_driver_id_fkey;

-- Add correct foreign key constraints pointing to auth.users
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT orders_driver_id_fkey 
  FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE SET NULL;