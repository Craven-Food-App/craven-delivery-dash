-- Create active driver profile for Torrance Stroman
INSERT INTO public.driver_profiles (
  user_id,
  is_available,
  status,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  license_plate,
  rating,
  total_deliveries
) VALUES (
  '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd',
  true,
  'online',
  'car',
  'Toyota',
  'Camry',
  2022,
  'CRAVE001',
  5.0,
  0
);

-- Update their user profile role to driver
UPDATE public.user_profiles 
SET role = 'driver'
WHERE user_id = '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd';