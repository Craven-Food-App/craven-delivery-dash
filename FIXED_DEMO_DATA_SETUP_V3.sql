-- Enhanced Driver Waitlist System - Demo Data Setup
-- This script populates the database with demo data for testing the enhanced driver waitlist system

-- Insert demo regions (only if they don't exist)
INSERT INTO regions (name, zip_prefix, status, active_quota) 
SELECT * FROM (VALUES
('Toledo', '436', 'active', 50),
('Detroit', '482', 'active', 75),
('Cleveland', '441', 'active', 60),
('Columbus', '432', 'active', 40)
) AS v(name, zip_prefix, status, active_quota)
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE regions.name = v.name);

-- Insert demo driver applications with all required fields
INSERT INTO craver_applications (
  id, first_name, last_name, email, phone, date_of_birth,
  street_address, city, state, zip_code,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate,
  drivers_license, license_state, license_expiry, ssn_last_four,
  bank_account_type, bank_account_name, routing_number, account_number_last_four,
  drivers_license_front, drivers_license_back, insurance_document, vehicle_registration, profile_photo,
  insurance_provider, insurance_policy,
  status, created_at, points, priority_score, region_id
) VALUES
-- Toledo drivers
(gen_random_uuid(), 'John', 'Smith', 'john.smith@example.com', '419-555-0101', '1990-05-15', '123 Main St', 'Toledo', 'OH', '43601', 'car', 'Toyota', 'Camry', 2018, 'Silver', 'ABC123', 'DL123456789', 'OH', '2025-12-31', '1234', 'direct_deposit', 'checking', '123456789', '5678', 'doc1.jpg', 'doc1.jpg', 'doc2.jpg', 'doc3.jpg', 'doc4.jpg', 'photo1.jpg', 'State Farm', 'SF123456789', 'pending', NOW() - INTERVAL '5 days', 25, 25, 1),
(gen_random_uuid(), 'Sarah', 'Johnson', 'sarah.johnson@example.com', '419-555-0102', '1988-03-22', '456 Oak Ave', 'Toledo', 'OH', '43602', 'car', 'Honda', 'Civic', 2020, 'Blue', 'DEF456', 'DL987654321', 'OH', '2026-03-15', '5678', 'cashapp', NULL, NULL, NULL, 'doc5.jpg', 'doc5.jpg', 'doc6.jpg', 'doc7.jpg', 'doc8.jpg', 'photo2.jpg', 'Geico', 'GC987654321', 'pending', NOW() - INTERVAL '3 days', 40, 40, 1),
(gen_random_uuid(), 'Mike', 'Davis', 'mike.davis@example.com', '419-555-0103', '1992-11-08', '789 Pine St', 'Toledo', 'OH', '43603', 'bike', 'Trek', 'FX 3', 2021, 'Black', 'N/A', 'DL456789123', 'OH', '2025-08-20', '9012', 'direct_deposit', 'savings', '987654321', '1234', 'doc9.jpg', 'doc9.jpg', 'doc10.jpg', 'doc11.jpg', 'doc12.jpg', 'photo3.jpg', 'Progressive', 'PR456789123', 'pending', NOW() - INTERVAL '1 day', 10, 10, 1),

-- Detroit drivers
(gen_random_uuid(), 'Emily', 'Wilson', 'emily.wilson@example.com', '313-555-0201', '1985-07-12', '321 Elm St', 'Detroit', 'MI', '48201', 'car', 'Ford', 'Focus', 2019, 'Red', 'GHI789', 'DL111222333', 'MI', '2025-11-30', '3456', 'direct_deposit', 'checking', '111222333', '7890', 'doc13.jpg', 'doc13.jpg', 'doc14.jpg', 'doc15.jpg', 'doc16.jpg', 'photo4.jpg', 'Allstate', 'AL111222333', 'pending', NOW() - INTERVAL '7 days', 60, 60, 2),
(gen_random_uuid(), 'David', 'Brown', 'david.brown@example.com', '313-555-0202', '1991-09-25', '654 Maple Dr', 'Detroit', 'MI', '48202', 'car', 'Chevrolet', 'Malibu', 2020, 'White', 'JKL012', 'DL444555666', 'MI', '2026-01-15', '7890', 'cashapp', NULL, NULL, NULL, 'doc17.jpg', 'doc17.jpg', 'doc18.jpg', 'doc19.jpg', 'doc20.jpg', 'photo5.jpg', 'Farmers', 'FA444555666', 'pending', NOW() - INTERVAL '4 days', 35, 35, 2),
(gen_random_uuid(), 'Lisa', 'Garcia', 'lisa.garcia@example.com', '313-555-0203', '1987-12-03', '987 Cedar Ln', 'Detroit', 'MI', '48203', 'scooter', 'Vespa', 'Primavera', 2022, 'Yellow', 'MNO345', 'DL777888999', 'MI', '2025-09-10', '1234', 'direct_deposit', 'checking', '555666777', '2345', 'doc21.jpg', 'doc21.jpg', 'doc22.jpg', 'doc23.jpg', 'doc24.jpg', 'photo6.jpg', 'USAA', 'US777888999', 'pending', NOW() - INTERVAL '2 days', 20, 20, 2),

-- Cleveland drivers
(gen_random_uuid(), 'Robert', 'Miller', 'robert.miller@example.com', '216-555-0301', '1983-04-18', '147 Birch St', 'Cleveland', 'OH', '44101', 'car', 'Nissan', 'Altima', 2017, 'Gray', 'PQR678', 'DL000111222', 'OH', '2025-10-05', '4567', 'direct_deposit', 'checking', '000111222', '3456', 'doc25.jpg', 'doc25.jpg', 'doc26.jpg', 'doc27.jpg', 'doc28.jpg', 'photo7.jpg', 'Liberty Mutual', 'LM000111222', 'pending', NOW() - INTERVAL '6 days', 50, 50, 3),
(gen_random_uuid(), 'Jennifer', 'Taylor', 'jennifer.taylor@example.com', '216-555-0302', '1994-01-30', '258 Spruce Ave', 'Cleveland', 'OH', '44102', 'car', 'Hyundai', 'Elantra', 2021, 'Green', 'STU901', 'DL333444555', 'OH', '2026-02-28', '5678', 'cashapp', NULL, NULL, NULL, 'doc29.jpg', 'doc29.jpg', 'doc30.jpg', 'doc31.jpg', 'doc32.jpg', 'photo8.jpg', 'Nationwide', 'NW333444555', 'pending', NOW() - INTERVAL '8 days', 45, 45, 3),
(gen_random_uuid(), 'James', 'Anderson', 'james.anderson@example.com', '216-555-0303', '1989-06-14', '369 Walnut Blvd', 'Cleveland', 'OH', '44103', 'motorcycle', 'Harley-Davidson', 'Sportster', 2019, 'Black', 'VWX234', 'DL666777888', 'OH', '2025-07-15', '8901', 'direct_deposit', 'savings', '666777888', '4567', 'doc33.jpg', 'doc33.jpg', 'doc34.jpg', 'doc35.jpg', 'doc36.jpg', 'photo9.jpg', 'Dairyland', 'DL666777888', 'pending', NOW() - INTERVAL '10 days', 30, 30, 3),

-- Columbus drivers
(gen_random_uuid(), 'Amanda', 'Thomas', 'amanda.thomas@example.com', '614-555-0401', '1993-08-07', '741 Cherry St', 'Columbus', 'OH', '43201', 'car', 'Volkswagen', 'Jetta', 2020, 'Silver', 'YZA567', 'DL999000111', 'OH', '2025-12-10', '0123', 'direct_deposit', 'checking', '999000111', '5678', 'doc37.jpg', 'doc37.jpg', 'doc38.jpg', 'doc39.jpg', 'doc40.jpg', 'photo10.jpg', 'Travelers', 'TR999000111', 'pending', NOW() - INTERVAL '9 days', 55, 55, 4),
(gen_random_uuid(), 'Christopher', 'Jackson', 'christopher.jackson@example.com', '614-555-0402', '1986-02-19', '852 Poplar Dr', 'Columbus', 'OH', '43202', 'car', 'Mazda', 'Mazda3', 2018, 'Blue', 'BCD890', 'DL222333444', 'OH', '2026-04-20', '1234', 'cashapp', NULL, NULL, NULL, 'doc41.jpg', 'doc41.jpg', 'doc42.jpg', 'doc43.jpg', 'doc44.jpg', 'photo11.jpg', 'MetLife', 'ML222333444', 'pending', NOW() - INTERVAL '11 days', 40, 40, 4),
(gen_random_uuid(), 'Michelle', 'White', 'michelle.white@example.com', '614-555-0403', '1990-10-12', '963 Sycamore Rd', 'Columbus', 'OH', '43203', 'car', 'Subaru', 'Impreza', 2019, 'Orange', 'EFG123', 'DL555666777', 'OH', '2025-06-25', '2345', 'direct_deposit', 'checking', '555666777', '6789', 'doc45.jpg', 'doc45.jpg', 'doc46.jpg', 'doc47.jpg', 'doc48.jpg', 'photo12.jpg', 'Safeco', 'SF555666777', 'pending', NOW() - INTERVAL '12 days', 25, 25, 4);

-- Insert demo onboarding tasks
INSERT INTO onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed) VALUES
-- John Smith tasks
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, true),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'vehicle_inspection', 'Vehicle Inspection', 'Schedule and complete vehicle inspection', 15, false),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'orientation', 'Driver Orientation', 'Complete online driver orientation course', 20, false),

-- Sarah Johnson tasks
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, true),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'vehicle_inspection', 'Vehicle Inspection', 'Schedule and complete vehicle inspection', 15, true),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'orientation', 'Driver Orientation', 'Complete online driver orientation course', 20, true),

-- Mike Davis tasks
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, false),
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 'vehicle_inspection', 'Vehicle Inspection', 'Schedule and complete vehicle inspection', 15, false),
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 'orientation', 'Driver Orientation', 'Complete online driver orientation course', 20, false);

-- Insert demo referrals
INSERT INTO driver_referrals (referrer_id, referred_id, referral_code, points_awarded, created_at) VALUES
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), (SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'SARAH123', 10, NOW() - INTERVAL '5 days'),
((SELECT id FROM craver_applications WHERE email = 'emily.wilson@example.com'), (SELECT id FROM craver_applications WHERE email = 'david.brown@example.com'), 'EMILY456', 10, NOW() - INTERVAL '4 days'),
((SELECT id FROM craver_applications WHERE email = 'robert.miller@example.com'), (SELECT id FROM craver_applications WHERE email = 'jennifer.taylor@example.com'), 'ROBERT789', 10, NOW() - INTERVAL '8 days');

-- Insert demo activation queue entries
INSERT INTO activation_queue (driver_id, region_id, priority_score, created_at) VALUES
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 1, 40, NOW() - INTERVAL '3 days'),
((SELECT id FROM craver_applications WHERE email = 'emily.wilson@example.com'), 2, 60, NOW() - INTERVAL '7 days'),
((SELECT id FROM craver_applications WHERE email = 'robert.miller@example.com'), 3, 50, NOW() - INTERVAL '6 days'),
((SELECT id FROM craver_applications WHERE email = 'amanda.thomas@example.com'), 4, 55, NOW() - INTERVAL '9 days'),
((SELECT id FROM craver_applications WHERE email = 'jennifer.taylor@example.com'), 3, 45, NOW() - INTERVAL '8 days'),
((SELECT id FROM craver_applications WHERE email = 'david.brown@example.com'), 2, 35, NOW() - INTERVAL '4 days'),
((SELECT id FROM craver_applications WHERE email = 'christopher.jackson@example.com'), 4, 40, NOW() - INTERVAL '11 days'),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 1, 25, NOW() - INTERVAL '5 days'),
((SELECT id FROM craver_applications WHERE email = 'lisa.garcia@example.com'), 2, 20, NOW() - INTERVAL '2 days'),
((SELECT id FROM craver_applications WHERE email = 'james.anderson@example.com'), 3, 30, NOW() - INTERVAL '10 days'),
((SELECT id FROM craver_applications WHERE email = 'michelle.white@example.com'), 4, 25, NOW() - INTERVAL '12 days'),
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 1, 10, NOW() - INTERVAL '1 day');

-- Update region active quotas to reflect current capacity
UPDATE regions SET active_quota = 45 WHERE name = 'Toledo';
UPDATE regions SET active_quota = 70 WHERE name = 'Detroit';
UPDATE regions SET active_quota = 55 WHERE name = 'Cleveland';
UPDATE regions SET active_quota = 35 WHERE name = 'Columbus';

-- Add some approved drivers to show the system working
UPDATE craver_applications 
SET status = 'approved' 
WHERE email IN ('sarah.johnson@example.com', 'emily.wilson@example.com', 'robert.miller@example.com');

-- Remove approved drivers from activation queue
DELETE FROM activation_queue 
WHERE driver_id IN (
  SELECT id FROM craver_applications 
  WHERE status = 'approved'
);

-- Add some rejected applications
UPDATE craver_applications 
SET status = 'rejected' 
WHERE email IN ('mike.davis@example.com', 'james.anderson@example.com');

-- Remove rejected drivers from activation queue
DELETE FROM activation_queue 
WHERE driver_id IN (
  SELECT id FROM craver_applications 
  WHERE status = 'rejected'
);

-- Create some demo user accounts (these would normally be created through the signup flow)
-- Note: In a real scenario, these would be created through Supabase Auth
-- For demo purposes, we'll just reference the application IDs

-- Update some applications to show different stages
UPDATE craver_applications 
SET points = 0, priority_score = 0 
WHERE email = 'mike.davis@example.com';

-- Add some applications with referral codes
UPDATE craver_applications 
SET referred_by = (SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com')
WHERE email = 'john.smith@example.com';

UPDATE craver_applications 
SET referred_by = (SELECT id FROM craver_applications WHERE email = 'emily.wilson@example.com')
WHERE email = 'david.brown@example.com';

-- Set up some realistic queue positions
-- This would normally be calculated by the trigger, but for demo purposes we'll set them manually
UPDATE activation_queue SET queue_position = 1 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'amanda.thomas@example.com');
UPDATE activation_queue SET queue_position = 2 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'jennifer.taylor@example.com');
UPDATE activation_queue SET queue_position = 3 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'david.brown@example.com');
UPDATE activation_queue SET queue_position = 4 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'christopher.jackson@example.com');
UPDATE activation_queue SET queue_position = 5 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'john.smith@example.com');
UPDATE activation_queue SET queue_position = 6 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'lisa.garcia@example.com');
UPDATE activation_queue SET queue_position = 7 WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'michelle.white@example.com');

-- Add some demo notifications
INSERT INTO notifications (user_id, title, message, type, created_at) VALUES
((SELECT id FROM craver_applications WHERE email = 'amanda.thomas@example.com'), 'Welcome to Crave''n!', 'Your driver application has been received and you''re #1 in the Columbus region queue!', 'info', NOW() - INTERVAL '9 days'),
((SELECT id FROM craver_applications WHERE email = 'jennifer.taylor@example.com'), 'Queue Update', 'You''ve moved up to position #2 in the Cleveland region queue!', 'info', NOW() - INTERVAL '8 days'),
((SELECT id FROM craver_applications WHERE email = 'david.brown@example.com'), 'Priority Boost', 'You''ve earned 10 bonus points for completing your background check!', 'success', NOW() - INTERVAL '4 days'),
((SELECT id FROM craver_applications WHERE email = 'christopher.jackson@example.com'), 'Referral Bonus', 'You''ve earned 10 points for referring a friend!', 'success', NOW() - INTERVAL '11 days');

-- Final status update
SELECT 'Demo data setup completed successfully!' as status;
