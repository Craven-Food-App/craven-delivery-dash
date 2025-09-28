-- Function to sync driver_profiles.is_available with status
CREATE OR REPLACE FUNCTION sync_driver_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_available based on status
  IF NEW.status = 'online' THEN
    NEW.is_available = true;
  ELSIF NEW.status = 'offline' THEN
    NEW.is_available = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for driver_profiles status changes
CREATE TRIGGER trigger_sync_driver_availability
  BEFORE UPDATE OF status ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_driver_availability();

-- Function to update driver_profiles when session changes
CREATE OR REPLACE FUNCTION sync_driver_session_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update driver_profiles based on session status
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE driver_profiles 
    SET 
      status = CASE 
        WHEN NEW.is_online = true THEN 'online'
        ELSE 'offline'
      END,
      is_available = NEW.is_online,
      updated_at = now()
    WHERE user_id = NEW.driver_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- When session is deleted, set driver offline
    UPDATE driver_profiles 
    SET 
      status = 'offline',
      is_available = false,
      updated_at = now()
    WHERE user_id = OLD.driver_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for driver_sessions changes
CREATE TRIGGER trigger_sync_driver_session_status
  AFTER INSERT OR UPDATE OF is_online OR DELETE ON driver_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_driver_session_status();

-- Backfill existing data to fix inconsistencies
UPDATE driver_profiles 
SET 
  is_available = CASE 
    WHEN status = 'online' THEN true
    ELSE false
  END,
  updated_at = now()
WHERE is_available != (status = 'online');

-- Sync driver profiles with current session status
UPDATE driver_profiles 
SET 
  status = CASE 
    WHEN EXISTS (
      SELECT 1 FROM driver_sessions 
      WHERE driver_sessions.driver_id = driver_profiles.user_id 
      AND driver_sessions.is_online = true
    ) THEN 'online'
    ELSE 'offline'
  END,
  is_available = EXISTS (
    SELECT 1 FROM driver_sessions 
    WHERE driver_sessions.driver_id = driver_profiles.user_id 
    AND driver_sessions.is_online = true
  ),
  updated_at = now();