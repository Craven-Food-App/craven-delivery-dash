
-- Insert missing restaurant_onboarding_progress records for existing restaurants
INSERT INTO restaurant_onboarding_progress (restaurant_id, menu_preparation_status, business_info_verified, go_live_ready)
SELECT 
  r.id,
  'not_started',
  false,
  false
FROM restaurants r
LEFT JOIN restaurant_onboarding_progress rop ON r.id = rop.restaurant_id
WHERE rop.id IS NULL;

-- Create function to auto-create onboarding progress when restaurant is created
CREATE OR REPLACE FUNCTION create_restaurant_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO restaurant_onboarding_progress (
    restaurant_id,
    menu_preparation_status,
    business_info_verified,
    go_live_ready
  ) VALUES (
    NEW.id,
    'not_started',
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create onboarding progress
DROP TRIGGER IF EXISTS create_onboarding_progress_trigger ON restaurants;
CREATE TRIGGER create_onboarding_progress_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION create_restaurant_onboarding_progress();
