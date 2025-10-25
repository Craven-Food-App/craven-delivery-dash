-- Trigger function to automatically complete onboarding when all tasks are done
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_complete_onboarding ON onboarding_tasks;

-- Create trigger to run after task completion
CREATE TRIGGER trigger_auto_complete_onboarding
AFTER UPDATE OF completed ON onboarding_tasks
FOR EACH ROW
WHEN (NEW.completed = true AND OLD.completed = false)
EXECUTE FUNCTION auto_complete_onboarding();