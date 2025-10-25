-- Remove duplicate onboarding tasks, keeping only the most recent one for each task_key per driver
DELETE FROM onboarding_tasks a
USING onboarding_tasks b
WHERE a.id < b.id
  AND a.driver_id = b.driver_id
  AND a.task_key = b.task_key;