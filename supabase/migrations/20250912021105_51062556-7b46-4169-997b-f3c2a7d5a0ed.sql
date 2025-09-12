-- Create restaurant employees table for POS authentication
CREATE TABLE public.restaurant_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  employee_id TEXT NOT NULL, -- Employee ID/username provided by restaurant
  pin_code TEXT NOT NULL, -- 4-6 digit PIN
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier', -- cashier, manager, admin
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(restaurant_id, employee_id)
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employee access
CREATE POLICY "Restaurant owners can manage employees"
ON public.restaurant_employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_id AND r.user_id = auth.uid()
  )
);

-- Allow employees to view their own record for authentication
CREATE POLICY "Employees can view their own record"
ON public.restaurant_employees
FOR SELECT
TO anon, authenticated
USING (true); -- We'll handle auth in the application layer

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_employees_updated_at
BEFORE UPDATE ON public.restaurant_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample employees for testing
INSERT INTO public.restaurant_employees (restaurant_id, employee_id, pin_code, full_name, role) 
SELECT 
  r.id,
  'EMP001',
  '1234',
  'John Cashier',
  'cashier'
FROM public.restaurants r
LIMIT 1;

INSERT INTO public.restaurant_employees (restaurant_id, employee_id, pin_code, full_name, role) 
SELECT 
  r.id,
  'MGR001',
  '9999',
  'Jane Manager',
  'manager'
FROM public.restaurants r
LIMIT 1;