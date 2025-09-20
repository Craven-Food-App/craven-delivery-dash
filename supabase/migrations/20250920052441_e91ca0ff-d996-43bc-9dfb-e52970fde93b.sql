-- Fix order status check constraint to include 'out_for_delivery'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create employee management for POS
CREATE TABLE IF NOT EXISTS public.restaurant_employee_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default roles
INSERT INTO public.restaurant_employee_roles (restaurant_id, name, description, permissions)
SELECT 
  r.id,
  'Manager',
  'Full access to all POS functions',
  '{"orders": true, "menu": true, "employees": true, "reports": true}'
FROM public.restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM public.restaurant_employee_roles 
  WHERE restaurant_id = r.id AND name = 'Manager'
);

INSERT INTO public.restaurant_employee_roles (restaurant_id, name, description, permissions)
SELECT 
  r.id,
  'Cashier',
  'Can take orders and process payments',
  '{"orders": true, "menu": false, "employees": false, "reports": false}'
FROM public.restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM public.restaurant_employee_roles 
  WHERE restaurant_id = r.id AND name = 'Cashier'
);

-- Enable RLS on new tables
ALTER TABLE public.restaurant_employee_roles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for employee roles
CREATE POLICY "Restaurant owners can manage employee roles"
ON public.restaurant_employee_roles
FOR ALL
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r WHERE r.owner_id = auth.uid()
  )
);

-- Add role_id to restaurant_employees table
ALTER TABLE public.restaurant_employees 
ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.restaurant_employee_roles(id);

-- Update existing employees to have cashier role
UPDATE public.restaurant_employees 
SET role_id = (
  SELECT rer.id FROM public.restaurant_employee_roles rer 
  WHERE rer.restaurant_id = restaurant_employees.restaurant_id 
  AND rer.name = 'Cashier'
  LIMIT 1
)
WHERE role_id IS NULL;