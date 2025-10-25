-- Fix search_path security issue for auto_complete_onboarding function
CREATE OR REPLACE FUNCTION auto_complete_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ALL tasks for this driver are now completed
  IF NOT EXISTS (
    SELECT 1 FROM onboarding_tasks 
    WHERE driver_id = NEW.driver_id 
    AND completed = false
  ) THEN
    -- All tasks complete! Mark onboarding as done in craver_applications
    UPDATE craver_applications
    SET onboarding_completed_at = NOW()
    WHERE id = NEW.driver_id
    AND onboarding_completed_at IS NULL;
    
    -- Update driver_onboarding_progress
    UPDATE driver_onboarding_progress
    SET 
      current_step = 'onboarding_complete',
      updated_at = NOW()
    WHERE user_id = (
      SELECT user_id FROM craver_applications WHERE id = NEW.driver_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;