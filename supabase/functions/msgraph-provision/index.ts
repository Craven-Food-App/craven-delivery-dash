// @ts-nocheck
// Provision new hire mailboxes and aliases (scaffold). Replace with real Graph calls.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const payload = await req.json();
    // Expected: { firstName, lastName, positionCode, domain, personalEmail?, groups?: string[] }
    console.log('provision request', payload);
    // TODO: use client credentials to call Graph: create user/shared mailbox, assign license, add aliases
    return new Response(JSON.stringify({ ok: true, suggested: {
      named: `${(payload.firstName||'')[0]||''}${(payload.lastName||'').toLowerCase()}.${payload.positionCode}@${payload.domain}`,
      roleAlias: `${payload.positionCode}@${payload.domain}`
    }}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});


