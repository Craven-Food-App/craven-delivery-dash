// @ts-nocheck
// Generate and send hiring packet links; store status records
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { candidateEmail, candidateName, state, packetType = 'employee', docs } = await req.json();
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Create packet and doc rows
    const { data: packet } = await supa.from('hiring_packets').insert({ employee_email: candidateEmail, employee_name: candidateName, state, packet_type: packetType }).select().single();
    if (docs?.length) {
      const rows = docs.map((d: any) => ({ packet_id: packet.id, doc_key: d.key, label: d.label, required: d.required, status: 'sent' }));
      await supa.from('hiring_packet_docs').insert(rows);
    }
    // TODO: send email with packet links (placeholder)
    return new Response(JSON.stringify({ ok: true, packet_id: packet.id, count: docs?.length || 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});


