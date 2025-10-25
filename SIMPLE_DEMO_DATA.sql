-- Simple Demo Data - Just the essentials
-- Insert demo regions
INSERT INTO regions (name, zip_prefix, status, active_quota) VALUES
('Toledo', '436', 'active', 50),
('Detroit', '482', 'active', 75),
('Cleveland', '441', 'active', 60),
('Columbus', '432', 'active', 40);

-- Insert just 3 simple driver applications
INSERT INTO craver_applications (
  first_name, last_name, email, phone, date_of_birth,
  street_address, city, state, zip_code,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate,
  drivers_license, license_state, license_expiry, ssn_last_four,
  bank_account_type, routing_number, account_number_last_four,
  drivers_license_front, drivers_license_back, insurance_document, vehicle_registration, profile_photo,
  insurance_provider, insurance_policy,
  status, created_at, points, priority_score, region_id
) VALUES
('John', 'Smith', 'john.smith@example.com', '419-555-0101', '1990-05-15', '123 Main St', 'Toledo', 'OH', '43601', 'car', 'Toyota', 'Camry', 2018, 'Silver', 'ABC123', 'DL123456789', 'OH', '2025-12-31', '1234', 'direct_deposit', '123456789', '5678', 'doc1.jpg', 'doc1.jpg', 'doc2.jpg', 'doc3.jpg', 'doc4.jpg', 'photo1.jpg', 'State Farm', 'SF123456789', 'pending', NOW() - INTERVAL '5 days', 25, 25, 1),
('Sarah', 'Johnson', 'sarah.johnson@example.com', '419-555-0102', '1988-03-22', '456 Oak Ave', 'Toledo', 'OH', '43602', 'car', 'Honda', 'Civic', 2020, 'Blue', 'DEF456', 'DL987654321', 'OH', '2026-03-15', '5678', 'cashapp', NULL, NULL, 'doc5.jpg', 'doc5.jpg', 'doc6.jpg', 'doc7.jpg', 'doc8.jpg', 'photo2.jpg', 'Geico', 'GC987654321', 'pending', NOW() - INTERVAL '3 days', 40, 40, 1),
('Mike', 'Davis', 'mike.davis@example.com', '419-555-0103', '1992-11-08', '789 Pine St', 'Toledo', 'OH', '43603', 'bike', 'Trek', 'FX 3', 2021, 'Black', 'N/A', 'DL456789123', 'OH', '2025-08-20', '9012', 'direct_deposit', '987654321', '1234', 'doc9.jpg', 'doc9.jpg', 'doc10.jpg', 'doc11.jpg', 'doc12.jpg', 'photo3.jpg', 'Progressive', 'PR456789123', 'pending', NOW() - INTERVAL '1 day', 10, 10, 1);

-- Insert some onboarding tasks
INSERT INTO onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed) VALUES
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, true),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, true);

-- Insert some activation queue entries
INSERT INTO activation_queue (driver_id, region_id, priority_score, created_at) VALUES
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 1, 25, NOW() - INTERVAL '5 days'),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 1, 40, NOW() - INTERVAL '3 days'),
((SELECT id FROM craver_applications WHERE email = 'mike.davis@example.com'), 1, 10, NOW() - INTERVAL '1 day');

-- Update one to approved
UPDATE craver_applications SET status = 'approved' WHERE email = 'sarah.johnson@example.com';

-- Remove approved from queue
DELETE FROM activation_queue WHERE driver_id = (SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com');

SELECT 'Simple demo data setup completed!' as status;

