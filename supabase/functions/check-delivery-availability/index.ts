import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { latitude, longitude } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // Check if point is in any active zone using PostGIS
  const { data: containsResult, error: containsError } = await supabase
    .rpc('check_point_in_zones', {
      lat: latitude,
      lng: longitude
    })

  if (containsError) {
    return new Response(JSON.stringify({ error: containsError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ 
    available: containsResult.length > 0,
    zones: containsResult
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
