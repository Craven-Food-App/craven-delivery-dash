import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Gmail push notification webhook
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Gmail sends notification as Pub/Sub message
    const body = await req.json();
    const message = body.message;

    if (!message || !message.data) {
      console.log("Invalid webhook payload");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode the Pub/Sub message
    const decodedData = atob(message.data);
    const notification = JSON.parse(decodedData);

    console.log("Gmail webhook notification:", notification);

    // Notification contains historyId and emailAddress
    const { emailAddress, historyId } = notification;

    if (!emailAddress) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger a sync for this user
    // In a production setup, you'd queue this in a job queue
    // For now, we'll just trigger the gmail-sync function
    const syncResponse = await supabase.functions.invoke("gmail-sync", {
      body: { forceFull: false },
    });

    if (syncResponse.error) {
      console.error("Failed to trigger sync:", syncResponse.error);
    } else {
      console.log("✅ Triggered sync successfully");
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    
    // Still return 200 to avoid retries
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
