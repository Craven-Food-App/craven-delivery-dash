-- Enable PostGIS (run this first)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create delivery_zones table
CREATE TABLE public.delivery_zones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    geom GEOMETRY(POLYGON, 4326) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    name VARCHAR(100)
);

-- Create indexes
CREATE INDEX idx_delivery_zones_geom ON public.delivery_zones USING GIST (geom);
CREATE INDEX idx_delivery_zones_zip ON public.delivery_zones(zip_code);
CREATE INDEX idx_delivery_zones_city ON public.delivery_zones(city);
CREATE INDEX idx_delivery_zones_active ON public.delivery_zones(active);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage delivery zones"
    ON public.delivery_zones FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public can view active delivery zones"
    ON public.delivery_zones FOR SELECT
    USING (active = true);

-- Create PostGIS function for point-in-polygon checking
CREATE OR REPLACE FUNCTION check_point_in_zones(
  lat NUMERIC,
  lng NUMERIC
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  city VARCHAR,
  zip_code VARCHAR,
  state VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dz.id,
    dz.name,
    dz.city,
    dz.zip_code,
    dz.state
  FROM delivery_zones dz
  WHERE dz.active = true
  AND ST_Contains(dz.geom, ST_SetSRID(ST_Point(lng, lat), 4326));
END;
$$ LANGUAGE plpgsql;

-- Create function to convert GeoJSON to PostGIS geometry
CREATE OR REPLACE FUNCTION st_geomfromgeojson(geojson TEXT)
RETURNS GEOMETRY AS $$
BEGIN
  RETURN ST_GeomFromGeoJSON(geojson);
END;
$$ LANGUAGE plpgsql;
