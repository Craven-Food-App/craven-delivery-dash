// @ts-nocheck
// Provision new hire mailboxes and role aliases using Microsoft Graph (app-only)
// Requires env: GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
// Optional: GRAPH_LICENSE_SKU (for assignLicense), GRAPH_DOMAIN (default cravenusa.com)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TENANT = Deno.env.get('GRAPH_TENANT_ID') || '';
const CLIENT = Deno.env.get('GRAPH_CLIENT_ID') || '';
const SECRET = Deno.env.get('GRAPH_CLIENT_SECRET') || '';

async function token() {
  const url = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
  const form = new URLSearchParams();
  form.set('client_id', CLIENT);
  form.set('client_secret', SECRET);
  form.set('grant_type', 'client_credentials');
  form.set('scope', 'https://graph.microsoft.com/.default');
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`token_error ${res.status}`);
  const j = await res.json();
  return j.access_token as string;
}

function emailFor(first: string, last: string, code: string, domain: string) {
  const f = (first || '').trim().toLowerCase();
  const l = (last || '').trim().toLowerCase();
  const base = `${f[0] || ''}${l}`.replace(/[^a-z0-9]/g, '');
  const named = `${base}.${code}@${domain}`;
  const roleAlias = `${code}@${domain}`;
  return { named, roleAlias };
}

async function graph(path: string, method: string, body?: unknown, bearer?: string) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${bearer}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`graph_error ${method} ${path} ${res.status} ${txt}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const payload = await req.json();
    const domain = payload.domain || Deno.env.get('GRAPH_DOMAIN') || 'cravenusa.com';
    const { firstName, lastName, positionCode, personalEmail, executive } = payload;
    const { named, roleAlias } = emailFor(firstName, lastName, positionCode, domain);

    const bearer = await token();

    // 1) Ensure user exists (create if missing)
    let user = null;
    try {
      user = await graph(`/users/${encodeURIComponent(named)}`, 'GET', undefined, bearer);
    } catch (_) {
      // create
      const tempPassword = `Craven!${Math.floor(100000 + Math.random()*899999)}`;
      user = await graph('/users', 'POST', {
        accountEnabled: true,
        displayName: `${firstName} ${lastName}`,
        mailNickname: `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g,''),
        userPrincipalName: named,
        passwordProfile: { forceChangePasswordNextSignIn: true, password: tempPassword },
      }, bearer);
      // include temp password in response (never log in prod)
      user.__tempPassword = tempPassword;
    }

    // 2) Create M365 group for role alias if executive and not exists, and add user
    let group = null;
    if (executive) {
      const found = await graph(`/groups?$filter=mail eq '${roleAlias}'`, 'GET', undefined, bearer);
      if (found?.value?.length) {
        group = found.value[0];
      } else {
        // Create Microsoft 365 group with mailbox
        group = await graph('/groups', 'POST', {
          displayName: `${positionCode.toUpperCase()} Role Alias`,
          description: `${positionCode} role mail alias for ${domain}`,
          groupTypes: [ 'Unified' ],
          mailEnabled: true,
          mailNickname: positionCode,
          securityEnabled: false,
          visibility: 'Private'
        }, bearer);
        // Note: Graph assigns the primary SMTP; we need to set it to roleAlias
        // Best-effort: update proxyAddresses; if not permitted, admin can adjust in Exchange
        try {
          await graph(`/groups/${group.id}`, 'PATCH', { mailNickname: positionCode }, bearer);
        } catch (_) {}
      }
      // Add member/owner
      try {
        await graph(`/groups/${group.id}/members/$ref`, 'POST', { '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${user.id}` }, bearer);
      } catch (_) {}
      try {
        await graph(`/groups/${group.id}/owners/$ref`, 'POST', { '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${user.id}` }, bearer);
      } catch (_) {}
    }

    // 3) Optional: send welcome email to personal email with credentials
    if (personalEmail) {
      try {
        const body = {
          message: {
            subject: 'Welcome to Craven Inc – Your company email and login',
            body: {
              contentType: 'HTML',
              content: `Hello ${firstName} ${lastName},<br/><br/>Your company email is <b>${named}</b>${executive ? ` and your role alias is <b>${roleAlias}</b>` : ''}.<br/>Temporary password will be required to change on first login.<br/><br/>Sign in: https://portal.office.com<br/>MFA enrollment: https://aka.ms/mfasetup<br/><br/>– Craven IT`
            },
            toRecipients: [ { emailAddress: { address: personalEmail } } ]
          },
          saveToSentItems: false
        };
        await graph(`/users/${user.id}/sendMail`, 'POST', body, bearer);
      } catch (_) {}
    }

    return new Response(JSON.stringify({ ok: true, named, roleAlias: executive ? roleAlias : null, user, group }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


