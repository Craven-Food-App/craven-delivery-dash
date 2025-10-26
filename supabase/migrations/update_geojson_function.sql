-- Update the st_geomfromgeojson function to handle JSONB properly
CREATE OR REPLACE FUNCTION st_geomfromgeojson(geojson JSONB)
RETURNS GEOMETRY AS $$
BEGIN
  RETURN ST_SetSRID(ST_GeomFromGeoJSON(geojson::text), 4326);
END;
$$ LANGUAGE plpgsql;

-- Also create a function that accepts text
CREATE OR REPLACE FUNCTION st_geomfromgeojson_text(geojson TEXT)
RETURNS GEOMETRY AS $$
BEGIN
  RETURN ST_SetSRID(ST_GeomFromGeoJSON(geojson), 4326);
END;
$$ LANGUAGE plpgsql;
