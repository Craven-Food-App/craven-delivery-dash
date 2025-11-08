import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleWorkspaceConfig, getAccessToken } from "../_shared/googleWorkspaceEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SyncPayload {
  maxResults?: number;
  pageToken?: string;
  forceFull?: boolean;
}

serve(async (req: Request) => {
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
    const config = await getGoogleWorkspaceConfig();
    const accessToken = await getAccessToken();

    const payload: SyncPayload = await req.json().catch(() => ({}));
    const maxResults = payload.maxResults || 50;

    console.log(`Syncing Gmail for ${config.delegatedUser}...`);

    // Get sync state
    const { data: syncState } = await supabase
      .from("gmail_sync_state")
      .select("*")
      .eq("delegated_user", config.delegatedUser)
      .maybeSingle();

    // Build Gmail API URL
    let url = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(config.delegatedUser)}/messages?maxResults=${maxResults}`;
    
    if (!payload.forceFull && syncState?.delta_token) {
      // Use delta sync if available
      url = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(config.delegatedUser)}/messages?maxResults=${maxResults}&pageToken=${syncState.delta_token}`;
    }

    if (payload.pageToken) {
      url += `&pageToken=${payload.pageToken}`;
    }

    // Fetch messages list
    const listResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      throw new Error(`Gmail API error: ${listResponse.status} ${error}`);
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    console.log(`Found ${messages.length} messages to sync`);

    // Fetch full message details
    const syncedMessages = [];
    for (const msg of messages) {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(config.delegatedUser)}/messages/${msg.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) continue;

        const fullMsg = await msgResponse.json();
        
        // Parse headers
        const headers = fullMsg.payload?.headers || [];
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const subject = getHeader("Subject");
        const from = getHeader("From");
        const to = getHeader("To");
        const cc = getHeader("Cc");
        const date = getHeader("Date");

        // Extract body
        let bodyText = "";
        let bodyHtml = "";
        
        const extractBody = (part: any) => {
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
          if (part.mimeType === "text/html" && part.body?.data) {
            bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
          if (part.parts) {
            part.parts.forEach(extractBody);
          }
        };

        if (fullMsg.payload) {
          extractBody(fullMsg.payload);
        }

        // Determine folder based on labels
        const labelIds = fullMsg.labelIds || [];
        let folder = "inbox";
        if (labelIds.includes("SENT")) folder = "sent";
        else if (labelIds.includes("DRAFT")) folder = "drafts";
        else if (labelIds.includes("TRASH")) folder = "trash";

        const isRead = !labelIds.includes("UNREAD");
        const isStarred = labelIds.includes("STARRED");

        // Upsert message to database
        const { error: upsertError } = await supabase
          .from("gmail_messages")
          .upsert({
            gmail_message_id: fullMsg.id,
            gmail_thread_id: fullMsg.threadId,
            delegated_user: config.delegatedUser,
            subject,
            from_address: from,
            to_address: to,
            cc_address: cc,
            body_text: bodyText,
            body_html: bodyHtml,
            received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
            label_ids: labelIds,
            is_read: isRead,
            is_starred: isStarred,
            has_attachments: (fullMsg.payload?.parts?.length || 0) > 1,
            folder,
            raw_headers: headers,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: "gmail_message_id",
          });

        if (upsertError) {
          console.error(`Failed to upsert message ${fullMsg.id}:`, upsertError);
        } else {
          syncedMessages.push(fullMsg.id);
        }
      } catch (err) {
        console.error(`Error processing message ${msg.id}:`, err);
      }
    }

    // Update sync state
    await supabase
      .from("gmail_sync_state")
      .upsert({
        delegated_user: config.delegatedUser,
        delta_token: listData.nextPageToken,
        history_id: listData.historyId,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: "delegated_user",
      });

    console.log(`✅ Synced ${syncedMessages.length} messages successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedMessages.length,
        hasMore: !!listData.nextPageToken,
        nextPageToken: listData.nextPageToken,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Gmail sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Gmail sync failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
