-- First, create a user record for Torrance Stroman in the users table
INSERT INTO public.users (
  id,
  email,
  role,
  password_hash,
  phone
) VALUES (
  '93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd',
  'torrance.stroman@example.com',
  'driver',
  '$2b$10$defaulthashfordemopurposes', -- placeholder hash
  '555-0123'
);

-- Now create the driver profile
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