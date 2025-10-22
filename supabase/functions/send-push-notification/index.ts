import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId: string;
  type: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, any>;
    actions?: Array<{
      action: string;
      title: string;
    }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    if (!firebaseServerKey) {
      throw new Error("Firebase Server Key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, type, notification }: PushNotificationRequest = await req.json();

    if (!userId || !notification) {
      throw new Error("Missing required parameters");
    }

    // Get user's FCM token
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("fcm_token")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.fcm_token) {
      console.warn(`No FCM token found for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No FCM token found for user" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Not an error - user just doesn't have notifications enabled
        }
      );
    }

    // Send push notification via Firebase Cloud Messaging
    const fcmPayload = {
      to: profile.fcm_token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/logo.png",
        badge: "/logo.png",
        click_action: notification.data?.url || "/",
        tag: type,
      },
      data: notification.data || {},
      priority: "high",
      content_available: true,
    };

    const fcmResponse = await fetch(
      "https://fcm.googleapis.com/fcm/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${firebaseServerKey}`,
        },
        body: JSON.stringify(fcmPayload),
      }
    );

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("FCM Error:", fcmResult);
      throw new Error(`FCM Error: ${JSON.stringify(fcmResult)}`);
    }

    // Log notification in database for tracking
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        notification_type: type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        status: "sent",
        fcm_message_id: fcmResult.results?.[0]?.message_id,
      });

    if (logError) {
      console.error("Error logging notification:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: fcmResult.results?.[0]?.message_id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
