// @ts-nocheck
// Generate and send hiring packet links; store status records
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { candidateEmail, candidateName, state, packetType = 'employee', docs } = await req.json();
    // TODO: create signing envelopes per doc and send emails; for now, stub
    console.log('send-hiring-packet', { candidateEmail, candidateName, state, packetType, count: docs?.length });
    return new Response(JSON.stringify({ ok: true, sent: docs?.length || 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});


