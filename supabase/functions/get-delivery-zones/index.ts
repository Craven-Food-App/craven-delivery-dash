import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { zip_code, city, state } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  let query = supabase
    .from('delivery_zones')
    .select('*')
    .eq('active', true)

  if (zip_code) query = query.eq('zip_code', zip_code)
  if (city) query = query.ilike('city', `%${city}%`)
  if (state) query = query.eq('state', state)

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ zones: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
