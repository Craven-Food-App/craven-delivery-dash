import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, name, city, state, zip_code, geojson, active } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Zone id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const updates: Record<string, unknown> = {};

    if (typeof name === "string") updates.name = name;
    if (typeof city === "string") updates.city = city;
    if (typeof state === "string") updates.state = state;
    if (typeof zip_code === "string") updates.zip_code = zip_code;
    if (typeof active === "boolean") updates.active = active;

    if (geojson) {
      const { data: geomResult, error: geomError } = await supabase.rpc(
        "st_geomfromgeojson_text",
        { geojson: JSON.stringify(geojson) },
      );

      if (geomError) {
        return new Response(JSON.stringify({ error: geomError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updates.geom = geomResult;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "No update fields provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("delivery_zones")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Failed to update zone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ zone: data?.[0] ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, name, city, state, zip_code, geojson, active } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Zone id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const updates: Record<string, unknown> = {};

    if (typeof name === "string") updates.name = name;
    if (typeof city === "string") updates.city = city;
    if (typeof state === "string") updates.state = state;
    if (typeof zip_code === "string") updates.zip_code = zip_code;
    if (typeof active === "boolean") updates.active = active;

    if (geojson) {
      const { data: geomResult, error: geomError } = await supabase.rpc(
        "st_geomfromgeojson_text",
        { geojson: JSON.stringify(geojson) },
      );

      if (geomError) {
        return new Response(JSON.stringify({ error: geomError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updates.geom = geomResult;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "No update fields provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("delivery_zones")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Failed to update zone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ zone: data?.[0] ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});


