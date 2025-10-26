import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { name, city, state, zip_code, geojson } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // Convert GeoJSON to PostGIS WKT format
  const wkt = `SRID=4326;${JSON.stringify(geojson)}`;

  const { data, error } = await supabase
    .from('delivery_zones')
    .insert({
      name,
      city,
      state,
      zip_code,
      geom: wkt,
      active: true
    })
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ zone: data[0] }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
