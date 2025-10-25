-- Demo Data Setup for Enhanced Driver Waitlist System (FIXED VERSION 2)
-- This script populates the system with realistic test data

-- Insert additional regions for testing
INSERT INTO public.regions (name, zip_prefix, status, active_quota) VALUES
('Ann Arbor, MI', '481', 'limited', 30),
('Grand Rapids, MI', '495', 'limited', 25),
('Akron, OH', '443', 'limited', 20),
('Dayton, OH', '454', 'limited', 15)
ON CONFLICT DO NOTHING;

-- Insert demo driver applications with all required fields
INSERT INTO public.craver_applications (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  street_address,
  city,
  state,
  zip_code,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  license_plate,
  license_number,
  license_state,
  license_expiry,
  ssn_last_four,
  payout_method,
  bank_account_type,
  routing_number,
  account_number_last_four,
  drivers_license,
  drivers_license_front,
  drivers_license_back,
  insurance_document,
  vehicle_registration,
  profile_photo,
  insurance_provider,
  insurance_policy,
  status,
  waitlist_joined_at,
  points,
  priority_score,
  region_id
) VALUES
-- Toledo drivers
(gen_random_uuid(), 'John', 'Smith', 'john.smith@example.com', '419-555-0101', '1990-05-15', '123 Main St', 'Toledo', 'OH', '43601', 'car', 'Toyota', 'Camry', 2018, 'Silver', 'ABC123', 'DL123456789', 'OH', '2025-12-31', '1234', 'direct_deposit', 'checking', '123456789', '5678', 'doc1.jpg', 'doc1.jpg', 'doc2.jpg', 'doc3.jpg', 'doc4.jpg', 'photo1.jpg', 'State Farm', 'SF123456789', 'waitlist', NOW() - INTERVAL '5 days', 25, 25, 1),
(gen_random_uuid(), 'Sarah', 'Johnson', 'sarah.johnson@example.com', '419-555-0102', '1988-03-22', '456 Oak Ave', 'Toledo', 'OH', '43602', 'car', 'Honda', 'Civic', 2020, 'Blue', 'DEF456', 'DL987654321', 'OH', '2026-03-15', '5678', 'cashapp', NULL, NULL, NULL, 'doc5.jpg', 'doc5.jpg', 'doc6.jpg', 'doc7.jpg', 'doc8.jpg', 'photo2.jpg', 'Geico', 'GC987654321', 'waitlist', NOW() - INTERVAL '3 days', 40, 40, 1),
(gen_random_uuid(), 'Mike', 'Davis', 'mike.davis@example.com', '419-555-0103', '1992-11-08', '789 Pine St', 'Toledo', 'OH', '43603', 'bike', 'Trek', 'FX 3', 2021, 'Black', 'N/A', 'DL456789123', 'OH', '2025-08-20', '9012', 'direct_deposit', 'savings', '987654321', '1234', 'doc9.jpg', 'doc9.jpg', 'doc10.jpg', 'doc11.jpg', 'doc12.jpg', 'photo3.jpg', 'Progressive', 'PR456789123', 'waitlist', NOW() - INTERVAL '1 day', 10, 10, 1),

-- Detroit drivers
(gen_random_uuid(), 'Emily', 'Wilson', 'emily.wilson@example.com', '313-555-0201', '1985-07-12', '321 Elm St', 'Detroit', 'MI', '48201', 'car', 'Ford', 'Focus', 2019, 'Red', 'GHI789', 'DL111222333', 'MI', '2025-11-30', '3456', 'direct_deposit', 'checking', '111222333', '7890', 'doc13.jpg', 'doc13.jpg', 'doc14.jpg', 'doc15.jpg', 'doc16.jpg', 'photo4.jpg', 'Allstate', 'AL111222333', 'waitlist', NOW() - INTERVAL '7 days', 60, 60, 2),
(gen_random_uuid(), 'David', 'Brown', 'david.brown@example.com', '313-555-0202', '1991-09-25', '654 Maple Dr', 'Detroit', 'MI', '48202', 'car', 'Chevrolet', 'Malibu', 2020, 'White', 'JKL012', 'DL444555666', 'MI', '2026-01-15', '7890', 'cashapp', NULL, NULL, NULL, 'doc17.jpg', 'doc17.jpg', 'doc18.jpg', 'doc19.jpg', 'doc20.jpg', 'photo5.jpg', 'Farmers', 'FA444555666', 'waitlist', NOW() - INTERVAL '4 days', 35, 35, 2),
(gen_random_uuid(), 'Lisa', 'Garcia', 'lisa.garcia@example.com', '313-555-0203', '1987-12-03', '987 Cedar Ln', 'Detroit', 'MI', '48203', 'scooter', 'Vespa', 'Primavera', 2022, 'Yellow', 'MNO345', 'DL777888999', 'MI', '2025-09-10', '1234', 'direct_deposit', 'checking', '555666777', '2345', 'doc21.jpg', 'doc21.jpg', 'doc22.jpg', 'doc23.jpg', 'doc24.jpg', 'photo6.jpg', 'USAA', 'US777888999', 'waitlist', NOW() - INTERVAL '2 days', 20, 20, 2),

-- Cleveland drivers
(gen_random_uuid(), 'Robert', 'Miller', 'robert.miller@example.com', '216-555-0301', '1983-04-18', '147 Birch St', 'Cleveland', 'OH', '44101', 'car', 'Nissan', 'Altima', 2017, 'Gray', 'PQR678', 'DL000111222', 'OH', '2025-10-05', '4567', 'direct_deposit', 'checking', '000111222', '3456', 'doc25.jpg', 'doc25.jpg', 'doc26.jpg', 'doc27.jpg', 'doc28.jpg', 'photo7.jpg', 'Liberty Mutual', 'LM000111222', 'waitlist', NOW() - INTERVAL '6 days', 50, 50, 3),
(gen_random_uuid(), 'Jennifer', 'Taylor', 'jennifer.taylor@example.com', '216-555-0302', '1994-01-30', '258 Spruce Ave', 'Cleveland', 'OH', '44102', 'car', 'Hyundai', 'Elantra', 2021, 'Green', 'STU901', 'DL333444555', 'OH', '2026-02-28', '5678', 'cashapp', NULL, NULL, NULL, 'doc29.jpg', 'doc29.jpg', 'doc30.jpg', 'doc31.jpg', 'doc32.jpg', 'photo8.jpg', 'Nationwide', 'NW333444555', 'waitlist', NOW() - INTERVAL '8 days', 45, 45, 3),
(gen_random_uuid(), 'James', 'Anderson', 'james.anderson@example.com', '216-555-0303', '1989-06-14', '369 Walnut Blvd', 'Cleveland', 'OH', '44103', 'motorcycle', 'Harley-Davidson', 'Sportster', 2019, 'Black', 'VWX234', 'DL666777888', 'OH', '2025-07-15', '8901', 'direct_deposit', 'savings', '666777888', '4567', 'doc33.jpg', 'doc33.jpg', 'doc34.jpg', 'doc35.jpg', 'doc36.jpg', 'photo9.jpg', 'Dairyland', 'DL666777888', 'waitlist', NOW() - INTERVAL '10 days', 30, 30, 3),

-- Columbus drivers
(gen_random_uuid(), 'Amanda', 'Thomas', 'amanda.thomas@example.com', '614-555-0401', '1993-08-07', '741 Cherry St', 'Columbus', 'OH', '43201', 'car', 'Volkswagen', 'Jetta', 2020, 'Silver', 'YZA567', 'DL999000111', 'OH', '2025-12-10', '0123', 'direct_deposit', 'checking', '999000111', '5678', 'doc37.jpg', 'doc37.jpg', 'doc38.jpg', 'doc39.jpg', 'doc40.jpg', 'photo10.jpg', 'Travelers', 'TR999000111', 'waitlist', NOW() - INTERVAL '9 days', 55, 55, 4),
(gen_random_uuid(), 'Christopher', 'Jackson', 'christopher.jackson@example.com', '614-555-0402', '1986-02-19', '852 Poplar Dr', 'Columbus', 'OH', '43202', 'car', 'Mazda', 'Mazda3', 2018, 'Blue', 'BCD890', 'DL222333444', 'OH', '2026-04-20', '1234', 'cashapp', NULL, NULL, NULL, 'doc41.jpg', 'doc41.jpg', 'doc42.jpg', 'doc43.jpg', 'doc44.jpg', 'photo11.jpg', 'MetLife', 'ML222333444', 'waitlist', NOW() - INTERVAL '11 days', 40, 40, 4),
(gen_random_uuid(), 'Michelle', 'White', 'michelle.white@example.com', '614-555-0403', '1990-10-12', '963 Hickory Ln', 'Columbus', 'OH', '43203', 'bike', 'Specialized', 'Sirrus', 2022, 'Red', 'N/A', 'DL555666777', 'OH', '2025-06-25', '5678', 'direct_deposit', 'savings', '555666777', '6789', 'doc45.jpg', 'doc45.jpg', 'doc46.jpg', 'doc47.jpg', 'doc48.jpg', 'photo12.jpg', 'Safeco', 'SF555666777', 'waitlist', NOW() - INTERVAL '12 days', 25, 25, 4),

-- Cincinnati drivers
(gen_random_uuid(), 'Daniel', 'Harris', 'daniel.harris@example.com', '513-555-0501', '1984-12-28', '159 Sycamore St', 'Cincinnati', 'OH', '45201', 'car', 'Subaru', 'Impreza', 2019, 'Blue', 'EFG123', 'DL888999000', 'OH', '2025-11-15', '2345', 'direct_deposit', 'checking', '888999000', '7890', 'doc49.jpg', 'doc49.jpg', 'doc50.jpg', 'doc51.jpg', 'doc52.jpg', 'photo13.jpg', 'Erie Insurance', 'ER888999000', 'waitlist', NOW() - INTERVAL '13 days', 35, 35, 5),
(gen_random_uuid(), 'Ashley', 'Martin', 'ashley.martin@example.com', '513-555-0502', '1995-03-05', '270 Dogwood Ave', 'Cincinnati', 'OH', '45202', 'car', 'Kia', 'Forte', 2021, 'White', 'HIJ456', 'DL111222333', 'OH', '2026-03-30', '3456', 'cashapp', NULL, NULL, NULL, 'doc53.jpg', 'doc53.jpg', 'doc54.jpg', 'doc55.jpg', 'doc56.jpg', 'photo14.jpg', 'Mercury', 'MR111222333', 'waitlist', NOW() - INTERVAL '14 days', 20, 20, 5),
(gen_random_uuid(), 'Kevin', 'Thompson', 'kevin.thompson@example.com', '513-555-0503', '1988-11-16', '381 Magnolia Dr', 'Cincinnati', 'OH', '45203', 'walking', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'DL444555666', 'OH', '2025-08-30', '4567', 'direct_deposit', 'checking', '444555666', '8901', 'doc57.jpg', 'doc57.jpg', 'doc58.jpg', 'doc59.jpg', 'doc60.jpg', 'photo15.jpg', 'AAA', 'AA444555666', 'waitlist', NOW() - INTERVAL '15 days', 15, 15, 5);

-- Insert some approved drivers to show active status
INSERT INTO public.craver_applications (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  street_address,
  city,
  state,
  zip_code,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  license_plate,
  license_number,
  license_state,
  license_expiry,
  ssn_last_four,
  payout_method,
  bank_account_type,
  routing_number,
  account_number_last_four,
  drivers_license,
  drivers_license_front,
  drivers_license_back,
  insurance_document,
  vehicle_registration,
  profile_photo,
  insurance_provider,
  insurance_policy,
  status,
  waitlist_joined_at,
  points,
  priority_score,
  region_id,
  background_check,
  background_check_initiated_at
) VALUES
-- Approved Toledo drivers
(gen_random_uuid(), 'Michael', 'Rodriguez', 'michael.rodriguez@example.com', '419-555-1001', '1982-09-14', '100 First St', 'Toledo', 'OH', '43601', 'car', 'BMW', '3 Series', 2020, 'Black', 'XYZ999', 'DL111111111', 'OH', '2025-12-31', '1111', 'direct_deposit', 'checking', '111111111', '1111', 'doc61.jpg', 'doc61.jpg', 'doc62.jpg', 'doc63.jpg', 'doc64.jpg', 'photo16.jpg', 'State Farm', 'SF111111111', 'approved', NOW() - INTERVAL '20 days', 100, 100, 1, true, NOW() - INTERVAL '18 days'),
(gen_random_uuid(), 'Jessica', 'Lee', 'jessica.lee@example.com', '419-555-1002', '1987-05-22', '200 Second Ave', 'Toledo', 'OH', '43602', 'car', 'Audi', 'A4', 2019, 'Silver', 'ABC111', 'DL222222222', 'OH', '2026-01-15', '2222', 'cashapp', NULL, NULL, NULL, 'doc65.jpg', 'doc65.jpg', 'doc66.jpg', 'doc67.jpg', 'doc68.jpg', 'photo17.jpg', 'Geico', 'GC222222222', 'approved', NOW() - INTERVAL '18 days', 95, 95, 1, true, NOW() - INTERVAL '16 days'),

-- Approved Detroit drivers
(gen_random_uuid(), 'William', 'Clark', 'william.clark@example.com', '313-555-2001', '1981-12-03', '300 Third St', 'Detroit', 'MI', '48201', 'car', 'Mercedes', 'C-Class', 2021, 'White', 'DEF222', 'DL333333333', 'MI', '2025-10-20', '3333', 'direct_deposit', 'savings', '333333333', '3333', 'doc69.jpg', 'doc69.jpg', 'doc70.jpg', 'doc71.jpg', 'doc72.jpg', 'photo18.jpg', 'Progressive', 'PR333333333', 'approved', NOW() - INTERVAL '22 days', 110, 110, 2, true, NOW() - INTERVAL '20 days'),
(gen_random_uuid(), 'Sarah', 'Lewis', 'sarah.lewis@example.com', '313-555-2002', '1989-07-18', '400 Fourth Ave', 'Detroit', 'MI', '48202', 'car', 'Lexus', 'ES', 2020, 'Gold', 'GHI333', 'DL444444444', 'MI', '2026-02-10', '4444', 'direct_deposit', 'checking', '444444444', '4444', 'doc73.jpg', 'doc73.jpg', 'doc74.jpg', 'doc75.jpg', 'doc76.jpg', 'photo19.jpg', 'Allstate', 'AL444444444', 'approved', NOW() - INTERVAL '19 days', 90, 90, 2, true, NOW() - INTERVAL '17 days');

-- Update some regions to show different statuses
UPDATE public.regions SET status = 'active' WHERE id = 1; -- Toledo
UPDATE public.regions SET status = 'active' WHERE id = 2; -- Detroit
UPDATE public.regions SET status = 'limited' WHERE id = 3; -- Cleveland
UPDATE public.regions SET status = 'paused' WHERE id = 4; -- Columbus
UPDATE public.regions SET status = 'limited' WHERE id = 5; -- Cincinnati

-- Create some referral relationships
UPDATE public.craver_applications 
SET referred_by = (
  SELECT id FROM public.craver_applications 
  WHERE email = 'michael.rodriguez@example.com'
)
WHERE email IN ('john.smith@example.com', 'sarah.johnson@example.com');

UPDATE public.craver_applications 
SET referred_by = (
  SELECT id FROM public.craver_applications 
  WHERE email = 'william.clark@example.com'
)
WHERE email IN ('emily.wilson@example.com', 'david.brown@example.com');

-- Generate referral codes for approved drivers
UPDATE public.craver_applications 
SET referral_code = 'CRV' || substring(md5(random()::text) from 1 for 6)
WHERE status = 'approved' AND referral_code IS NULL;

-- Insert some completed onboarding tasks for demo
INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed, completed_at)
SELECT 
  ca.id,
  'profile_complete',
  'Complete Profile',
  'Fill out all personal information',
  10,
  true,
  NOW() - INTERVAL '1 day'
FROM public.craver_applications ca
WHERE ca.status = 'waitlist'
LIMIT 5;

INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed, completed_at)
SELECT 
  ca.id,
  'documents_uploaded',
  'Upload Documents',
  'Upload driver license and insurance',
  20,
  true,
  NOW() - INTERVAL '2 days'
FROM public.craver_applications ca
WHERE ca.status = 'waitlist'
LIMIT 3;

INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed, completed_at)
SELECT 
  ca.id,
  'orientation_video',
  'Watch Orientation',
  'Complete orientation video',
  15,
  true,
  NOW() - INTERVAL '3 days'
FROM public.craver_applications ca
WHERE ca.status = 'waitlist'
LIMIT 2;

-- Update points based on completed tasks
UPDATE public.craver_applications 
SET points = (
  SELECT COALESCE(SUM(ot.points_reward), 0)
  FROM public.onboarding_tasks ot
  WHERE ot.driver_id = public.craver_applications.id
  AND ot.completed = true
),
priority_score = (
  SELECT COALESCE(SUM(ot.points_reward), 0)
  FROM public.onboarding_tasks ot
  WHERE ot.driver_id = public.craver_applications.id
  AND ot.completed = true
)
WHERE status = 'waitlist';

-- Verify the setup
SELECT 'Demo data setup completed successfully!' as status;
SELECT 
  r.name as region,
  r.status,
  COUNT(ca.id) as total_drivers,
  COUNT(CASE WHEN ca.status = 'approved' THEN 1 END) as active_drivers,
  COUNT(CASE WHEN ca.status = 'waitlist' THEN 1 END) as waitlist_drivers
FROM public.regions r
LEFT JOIN public.craver_applications ca ON ca.region_id = r.id
GROUP BY r.id, r.name, r.status
ORDER BY r.name;

