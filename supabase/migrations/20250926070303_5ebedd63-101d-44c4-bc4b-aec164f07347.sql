-- Just add the missing indexes, functions and triggers since the table already exists

-- Add missing indexes (skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_order_heat_map_lat_lng ON public.order_heat_map (lat, lng);
CREATE INDEX IF NOT EXISTS idx_order_heat_map_time ON public.order_heat_map (time_window DESC);
CREATE INDEX IF NOT EXISTS idx_order_heat_map_location_type ON public.order_heat_map (location_type);

-- The functions should already exist from earlier, but let's make sure the trigger exists
DROP TRIGGER IF EXISTS update_heat_map_on_order ON public.orders;
CREATE TRIGGER update_heat_map_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_heat_map();