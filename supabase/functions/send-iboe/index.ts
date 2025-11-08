import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SendIboePayload = {
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SendIboePayload = await req.json();

    if (!payload?.to || !payload?.subject || !payload?.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Crave\'n Treasury <treasury@cravenusa.com>';

    const response = await resend.emails.send({
      from: fromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      tags: payload.metadata
        ? Object.entries(payload.metadata).map(([key, value]) => ({ name: key, value: String(value ?? '') }))
        : undefined,
    });

    if (response.error) {
      console.error('Resend error sending IBOE:', response.error);
      return new Response(
        JSON.stringify({ error: response.error.message || 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: response.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unhandled error sending IBOE:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
