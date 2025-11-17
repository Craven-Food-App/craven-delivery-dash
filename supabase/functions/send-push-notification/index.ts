import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendWebPush } from "./web-push-helper.ts";

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
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@cravenusa.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, type, notification }: PushNotificationRequest = await req.json();

    if (!userId || !notification) {
      throw new Error("Missing required parameters");
    }

    console.log(`Sending push notification to user ${userId}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (subscriptionError || !subscriptions || subscriptions.length === 0) {
      console.warn(`No active push subscriptions found for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No active push subscriptions found for user" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Prepare push payload
    const pushPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/logo.png",
      badge: "/logo.png",
      data: {
        url: notification.data?.url || "/",
        type: type,
        ...notification.data,
      },
      actions: notification.actions || [],
    };

    // Send to all active subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        const result = await sendWebPush(
          subscription,
          pushPayload,
          {
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey,
            subject: vapidSubject,
          }
        );

        // If push failed, mark subscription as inactive
        if (!result.success) {
          console.warn(`Push failed for subscription ${sub.id}: ${result.error}`);
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", sub.id);
        }

        return result;
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    console.log(`Push notification sent: ${successCount}/${subscriptions.length} successful`);

    // Log notification in database for tracking
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        notification_type: type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        status: successCount > 0 ? "sent" : "failed",
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        sentCount: successCount,
        totalSubscriptions: subscriptions.length,
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
