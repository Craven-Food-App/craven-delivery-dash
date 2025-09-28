-- Update functions to set stable search_path and security definer per linter
CREATE OR REPLACE FUNCTION public.sync_driver_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'online' THEN
    NEW.is_available = true;
  ELSIF NEW.status = 'offline' THEN
    NEW.is_available = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_driver_availability ON public.driver_profiles;
CREATE TRIGGER trigger_sync_driver_availability
  BEFORE UPDATE OF status ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_availability();

-- Recreate session sync function with proper attributes
CREATE OR REPLACE FUNCTION public.sync_driver_session_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.driver_profiles 
    SET 
      status = CASE WHEN NEW.is_online THEN 'online' ELSE 'offline' END,
      is_available = NEW.is_online,
      updated_at = now()
    WHERE user_id = NEW.driver_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.driver_profiles 
    SET 
      status = 'offline',
      is_available = false,
      updated_at = now()
    WHERE user_id = OLD.driver_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_driver_session_status ON public.driver_sessions;
CREATE TRIGGER trigger_sync_driver_session_status
  AFTER INSERT OR UPDATE OF is_online OR DELETE ON public.driver_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_session_status();