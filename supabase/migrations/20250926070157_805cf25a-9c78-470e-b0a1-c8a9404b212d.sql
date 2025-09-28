-- Create table to store heat map data points for order demand
CREATE TABLE public.order_heat_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  intensity INTEGER NOT NULL DEFAULT 1,
  location_type TEXT NOT NULL DEFAULT 'pickup', -- 'pickup' or 'dropoff'
  time_window TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_heat_map ENABLE ROW LEVEL SECURITY;

-- Create policies for heat map data (readable by all drivers)
CREATE POLICY "Drivers can view heat map data" 
ON public.order_heat_map 
FOR SELECT 
USING (true);

-- Create indexes for better performance on location and time queries
CREATE INDEX idx_order_heat_map_lat_lng ON public.order_heat_map (lat, lng);
CREATE INDEX idx_order_heat_map_time ON public.order_heat_map (time_window DESC);
CREATE INDEX idx_order_heat_map_location_type ON public.order_heat_map (location_type);

-- Create function to update heat map data based on recent orders
CREATE OR REPLACE FUNCTION public.update_order_heat_map()
RETURNS void AS $$
BEGIN
  -- Clear old heat map data (older than 24 hours)
  DELETE FROM public.order_heat_map 
  WHERE time_window < NOW() - INTERVAL '24 hours';
  
  -- Insert pickup location heat map points from recent orders (last 4 hours)
  INSERT INTO public.order_heat_map (lat, lng, intensity, location_type, time_window)
  SELECT 
    (pickup_address->>'lat')::numeric as lat,
    (pickup_address->>'lng')::numeric as lng,
    COUNT(*) as intensity,
    'pickup' as location_type,
    DATE_TRUNC('hour', created_at) as time_window
  FROM public.orders 
  WHERE created_at >= NOW() - INTERVAL '4 hours'
    AND pickup_address IS NOT NULL
    AND pickup_address->>'lat' IS NOT NULL 
    AND pickup_address->>'lng' IS NOT NULL
    AND pickup_address->>'lat' != ''
    AND pickup_address->>'lng' != ''
  GROUP BY 
    (pickup_address->>'lat')::numeric,
    (pickup_address->>'lng')::numeric,
    DATE_TRUNC('hour', created_at)
  ON CONFLICT DO NOTHING;
  
  -- Insert dropoff location heat map points from recent orders (last 4 hours)
  INSERT INTO public.order_heat_map (lat, lng, intensity, location_type, time_window)
  SELECT 
    (dropoff_address->>'lat')::numeric as lat,
    (dropoff_address->>'lng')::numeric as lng,
    COUNT(*) as intensity,
    'dropoff' as location_type,
    DATE_TRUNC('hour', created_at) as time_window
  FROM public.orders 
  WHERE created_at >= NOW() - INTERVAL '4 hours'
    AND dropoff_address IS NOT NULL
    AND dropoff_address->>'lat' IS NOT NULL 
    AND dropoff_address->>'lng' IS NOT NULL
    AND dropoff_address->>'lat' != ''
    AND dropoff_address->>'lng' != ''
  GROUP BY 
    (dropoff_address->>'lat')::numeric,
    (dropoff_address->>'lng')::numeric,
    DATE_TRUNC('hour', created_at)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update heat map when orders are created
CREATE OR REPLACE FUNCTION public.trigger_update_heat_map()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the heat map update function
  PERFORM public.update_order_heat_map();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_heat_map_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_heat_map();