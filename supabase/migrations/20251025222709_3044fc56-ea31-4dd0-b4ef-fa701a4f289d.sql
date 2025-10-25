
-- Reset onboarding for Torrance Stroman (craven@usa.com)
-- Mark all tasks as incomplete
UPDATE onboarding_tasks
SET completed = false, completed_at = NULL
WHERE driver_id = (
  SELECT id FROM craver_applications WHERE email = 'craven@usa.com'
);

-- Reset points and priority score in craver_applications
UPDATE craver_applications
SET 
  points = 0,
  priority_score = 0,
  onboarding_completed_at = NULL,
  onboarding_started_at = NULL
WHERE email = 'craven@usa.com';

-- Reset priority score in activation_queue
UPDATE activation_queue
SET priority_score = 0
WHERE driver_id = (
  SELECT id FROM craver_applications WHERE email = 'craven@usa.com'
);

-- Reset onboarding progress
UPDATE driver_onboarding_progress
SET 
  current_step = 'profile_created',
  profile_creation_completed = false,
  orientation_video_watched = false,
  safety_quiz_passed = false,
  payment_method_added = false,
  w9_completed = false,
  first_delivery_bonus_eligible = true,
  onboarding_completed_at = NULL,
  updated_at = NOW()
WHERE user_id = (
  SELECT user_id FROM craver_applications WHERE email = 'craven@usa.com'
);
