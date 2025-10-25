
-- Delete related records for Torrance Stroman drivers except craven@usa.com
DELETE FROM activation_queue WHERE driver_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

DELETE FROM onboarding_tasks WHERE driver_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

DELETE FROM driver_referrals WHERE referrer_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
) OR referee_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
) OR referred_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

DELETE FROM background_check_reports WHERE application_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

DELETE FROM driver_profiles WHERE user_id IN (
  SELECT user_id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

DELETE FROM driver_onboarding_progress WHERE application_id IN (
  SELECT id FROM craver_applications 
  WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com'
);

-- Delete the driver applications themselves
DELETE FROM craver_applications 
WHERE first_name = 'Torrance' AND last_name = 'Stroman' AND email != 'craven@usa.com';
