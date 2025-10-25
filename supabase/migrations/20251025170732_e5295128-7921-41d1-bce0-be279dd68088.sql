-- Fix: Just create onboarding tasks for existing applications without changing status
DO $$
DECLARE
  app_record RECORD;
BEGIN
  -- For each craver_application that doesn't have tasks yet
  FOR app_record IN 
    SELECT DISTINCT ca.id 
    FROM craver_applications ca
    LEFT JOIN onboarding_tasks ot ON ca.id = ot.driver_id
    WHERE ot.driver_id IS NULL
  LOOP
    -- Insert default onboarding tasks
    INSERT INTO public.onboarding_tasks (driver_id, task_key, task_name, description, points_reward, completed) VALUES
      (app_record.id, 'complete_profile', 'Complete Profile Setup', 'Fill out all required profile information and verify your details', 25, false),
      (app_record.id, 'upload_vehicle_photos', 'Upload Vehicle Photos', 'Take and upload clear photos of your vehicle from multiple angles', 30, false),
      (app_record.id, 'pass_safety_quiz', 'Pass Safety Quiz', 'Complete the driver safety quiz with a passing score of 80% or higher', 50, false),
      (app_record.id, 'setup_cashapp_payouts', 'Setup CashApp Payouts', 'Connect your CashApp account for instant payout processing', 35, false),
      (app_record.id, 'download_mobile_app', 'Download Mobile App', 'Download and log in to the Craven delivery mobile app', 20, false),
      (app_record.id, 'complete_practice_route', 'Complete First Practice Route', 'Complete a practice delivery route to familiarize yourself with the app', 25, false),
      (app_record.id, 'join_facebook_group', 'Join Driver Facebook Group', 'Join our exclusive driver community on Facebook for tips and support', 15, false),
      (app_record.id, 'complete_service_training', 'Complete Customer Service Training', 'Watch customer service training videos and pass the assessment', 30, false),
      (app_record.id, 'social_media_share', 'Social Media Share', 'Share about joining Craven on your social media accounts', 10, false);
  END LOOP;
  
  -- Add pending applications to activation queue if not already there and have a region
  INSERT INTO activation_queue (driver_id, region_id, priority_score)
  SELECT id, region_id, COALESCE(priority_score, 0)
  FROM craver_applications
  WHERE status = 'pending'
    AND region_id IS NOT NULL
    AND id NOT IN (SELECT COALESCE(driver_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM activation_queue)
  ON CONFLICT DO NOTHING;
END $$;