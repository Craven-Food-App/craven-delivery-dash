-- FINAL DEMO DATA - NO ERRORS
-- Clear existing data first (in correct order due to foreign keys)
DELETE FROM activation_queue;
DELETE FROM onboarding_tasks;
DELETE FROM craver_applications;
DELETE FROM regions;

-- Insert demo regions (prevent duplicates with ON CONFLICT)
INSERT INTO regions (name, zip_prefix, status, active_quota) VALUES
('Toledo, OH', '436', 'active', 436),
('Detroit, MI', '482', 'active', 75)
ON CONFLICT (zip_prefix) DO NOTHING;

-- Insert 2 driver applications
INSERT INTO craver_applications (
  first_name, last_name, email, phone, date_of_birth,
  street_address, city, state, zip_code,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate,
  drivers_license, license_state, license_expiry, ssn_last_four,
  insurance_provider, insurance_policy,
  status, points, priority_score, region_id
) VALUES
('John', 'Smith', 'john.smith@example.com', '419-555-0101', '1990-05-15', '123 Main St', 'Toledo', 'OH', '43601', 'car', 'Toyota', 'Camry', 2018, 'Silver', 'ABC123', 'DL123456789', 'OH', '2025-12-31', '1234', 'State Farm', 'SF123456789', 'pending', 25, 25, 1),
('Sarah', 'Johnson', 'sarah.johnson@example.com', '419-555-0102', '1988-03-22', '456 Oak Ave', 'Toledo', 'OH', '43602', 'car', 'Honda', 'Civic', 2020, 'Blue', 'DEF456', 'DL987654321', 'OH', '2026-03-15', '5678', 'Geico', 'GC987654321', 'pending', 40, 40, 1);

-- Insert activation queue entries
INSERT INTO activation_queue (driver_id, region_id, priority_score) VALUES
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 1, 25),
((SELECT id FROM craver_applications WHERE email = 'sarah.johnson@example.com'), 1, 40);

-- Insert demo onboarding tasks
INSERT INTO onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed) VALUES
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'profile_complete', 'Complete Profile', 'Upload profile photo and verify personal information', 10, true),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'background_check', 'Background Check', 'Complete background check verification', 25, false),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'vehicle_inspection', 'Vehicle Inspection', 'Schedule and complete vehicle inspection', 15, false),
((SELECT id FROM craver_applications WHERE email = 'john.smith@example.com'), 'orientation', 'Driver Orientation', 'Complete online driver orientation course', 20, false);

SELECT 'Final demo data setup completed successfully!' as status;


