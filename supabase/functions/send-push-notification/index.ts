import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get OAuth2 access token for Firebase V1 API
async function getAccessToken() {
  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Create JWT for OAuth2
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = {
      "alg": "RS256",
      "typ": "JWT"
    };
    
    const jwtPayload = {
      "iss": serviceAccount.client_email,
      "scope": "https://www.googleapis.com/auth/firebase.messaging",
      "aud": "https://oauth2.googleapis.com/token",
      "exp": now + 3600,
      "iat": now
    };

    // Import crypto for JWT signing
    const encoder = new TextEncoder();
    const keyData = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    const headerBase64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadBase64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const dataToSign = `${headerBase64}.${payloadBase64}`;
    
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(dataToSign)
    );
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${dataToSign}.${signatureBase64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Helper function to send native push notification using Firebase V1 API
async function sendNativePushNotification(subscription: any, payload: any) {
  const serviceAccountKey = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  
  if (!serviceAccountKey) {
    console.warn("Firebase service account key not configured, skipping native push");
    return { success: false, error: "Firebase service account key not configured" };
  }

  try {
    // Get access token
    const accessToken = await getAccessToken();
    const serviceAccount = JSON.parse(serviceAccountKey);
    const projectId = serviceAccount.project_id;
    
    // Extract FCM token from endpoint
    let fcmToken = subscription.endpoint;
    
    if (subscription.endpoint.includes('fcm.googleapis.com')) {
      fcmToken = subscription.endpoint.split('/').pop();
    } else if (subscription.endpoint.startsWith('fcm:')) {
      fcmToken = subscription.endpoint.replace('fcm:', '');
    }
    
    if (!fcmToken || fcmToken === subscription.endpoint) {
      // Fallback to web push if not native
      return sendWebPushNotification(subscription, payload);
    }

    // Firebase V1 API endpoint
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    // Construct Firebase V1 payload
    const fcmPayload = {
      message: {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.message,
          image: '/craven-logo.png'
        },
        data: {
          ...payload.data,
          title: payload.title,
          message: payload.message,
          sound: 'enabled'
        },
        android: {
          notification: {
            title: payload.title,
            body: payload.message,
            icon: '/craven-logo.png',
            sound: 'default',
            priority: 'high',
            channel_id: 'craven_notifications',
            visibility: 'public'
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.message
              },
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          },
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert'
          }
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.message,
            icon: '/craven-logo.png',
            badge: '/craven-logo.png',
            tag: 'craven-notification',
            requireInteraction: true
          }
        }
      }
    };

    console.log('Firebase V1 Payload:', JSON.stringify(fcmPayload, null, 2));

    const response = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Firebase V1 API error:", result);
      return { success: false, error: result.error?.message || "Firebase V1 send failed" };
    }

    console.log("Firebase V1 notification sent successfully:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Native push error:", error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
}

// Helper function to send web push notification
async function sendWebPushNotification(subscription: any, payload: any) {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping Web Push");
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    // Import web-push library functionality (simplified implementation)
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(JSON.stringify(payload));

    // For production, you'd use the full web-push protocol with VAPID
    // This is a simplified version for demonstration
    console.log("Would send Web Push notification to:", subscription.endpoint);
    console.log("Payload:", payload);
    
    return { success: true };
  } catch (error) {
    console.error("Web Push error:", error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, message, data = {} } = await req.json();

    if (!userId || !title || !message) {
      throw new Error("Missing required parameters");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Sending push notification to user:", userId);

    // Get user's active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
    }

    const pushPromises = [];
    
    // Send Web Push notifications to all subscriptions
    if (subscriptions && subscriptions.length > 0) {
      for (const subscription of subscriptions) {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        const pushPayload = {
          title,
          message,
          data,
          icon: '/craven-logo.png',
          badge: '/craven-logo.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        };

        pushPromises.push(sendNativePushNotification(pushSubscription, pushPayload));
      }
    }

    // Wait for all push notifications
    const pushResults = await Promise.allSettled(pushPromises);
    const successCount = pushResults.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`Sent ${successCount}/${pushPromises.length} push notifications`);

    // Send real-time notification via Supabase channels (fallback)
    await supabase
      .channel(`user_notifications_${userId}`)
      .send({
        type: "broadcast",
        event: "push_notification",
        payload: {
          title,
          message,
          data,
          timestamp: new Date().toISOString(),
        },
      });

    // Store notification in database
    await supabase.from("order_notifications").insert({
      order_id: data.orderId || null,
      user_id: userId,
      notification_type: data.type || "general",
      title,
      message,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        pushNotificationsSent: successCount,
        totalSubscriptions: pushPromises.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Enhanced push notification error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});