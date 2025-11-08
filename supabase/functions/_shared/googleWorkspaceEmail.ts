import { encode as encodeBase64Url } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

type AddressList = string | string[];

export interface GoogleWorkspaceAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface GoogleWorkspaceEmailOptions {
  to: AddressList;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: AddressList;
  bcc?: AddressList;
  attachments?: GoogleWorkspaceAttachment[];
  headers?: Record<string, string>;
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

const textEncoder = new TextEncoder();

let cachedToken: CachedAccessToken | null = null;
let privateKeyPromise: Promise<CryptoKey> | null = null;

const DEFAULT_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

function coerceAddressList(value?: AddressList): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(", ") : value;
}

function base64EncodeString(input: string): string {
  const bytes = textEncoder.encode(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return encodeBase64Url(bytes);
}

function normalizePrivateKey(pem: string): string {
  return pem.replace(/\\n/g, "\n");
}

function pemToUint8Array(pem: string): Uint8Array {
  const normalized = normalizePrivateKey(pem)
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importPrivateKey(): Promise<CryptoKey> {
  if (privateKeyPromise) return privateKeyPromise;

  const privateKeyPem = Deno.env.get("GOOGLE_WORKSPACE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!privateKeyPem) {
    throw new Error("GOOGLE_WORKSPACE_SERVICE_ACCOUNT_PRIVATE_KEY is not configured.");
  }

  const keyData = pemToUint8Array(privateKeyPem);

  privateKeyPromise = crypto.subtle.importKey(
    "pkcs8",
    keyData.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return privateKeyPromise;
}

function encodeSubject(subject: string): string {
  if (!subject) return "";
  const encoded = base64EncodeString(subject);
  return `=?UTF-8?B?${encoded}?=`;
}

function chunkString(value: string, size = 76): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += size) {
    chunks.push(value.slice(i, i + size));
  }
  return chunks;
}

function randomBoundary(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildMimeMessage(options: Required<Pick<GoogleWorkspaceEmailOptions, "to" | "subject" | "html">> &
  Omit<GoogleWorkspaceEmailOptions, "to" | "subject" | "html"> &
  { from: string }): string {
  const lines: string[] = [];

  lines.push(`From: ${options.from}`);
  lines.push(`To: ${coerceAddressList(options.to)}`);

  const cc = coerceAddressList(options.cc);
  if (cc) lines.push(`Cc: ${cc}`);

  const bcc = coerceAddressList(options.bcc);
  if (bcc) lines.push(`Bcc: ${bcc}`);

  if (options.replyTo) {
    lines.push(`Reply-To: ${options.replyTo}`);
  }

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (!key) continue;
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push(`Subject: ${encodeSubject(options.subject)}`);
  lines.push("MIME-Version: 1.0");

  const attachments = options.attachments ?? [];

  if (attachments.length === 0) {
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(options.html);
  } else {
    const boundary = randomBoundary();
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push("");

    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(options.html);
    lines.push("");

    for (const attachment of attachments) {
      lines.push(`--${boundary}`);
      const contentType = attachment.contentType ?? "application/octet-stream";
      lines.push(`Content-Type: ${contentType}; name="${attachment.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      lines.push("Content-Transfer-Encoding: base64");
      lines.push("");
      chunkString(attachment.content).forEach((chunk) => lines.push(chunk));
      lines.push("");
    }

    lines.push(`--${boundary}--`);
  }

  return lines.join("\r\n");
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const serviceAccountEmail = Deno.env.get("GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL");
  if (!serviceAccountEmail) {
    throw new Error("GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL is not configured.");
  }

  const delegatedUser = Deno.env.get("GOOGLE_WORKSPACE_DELEGATED_USER");
  if (!delegatedUser) {
    throw new Error("GOOGLE_WORKSPACE_DELEGATED_USER is not configured.");
  }

  const scope = Deno.env.get("GOOGLE_WORKSPACE_GMAIL_SCOPE") ?? DEFAULT_SCOPE;

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: serviceAccountEmail,
    scope,
    aud: TOKEN_ENDPOINT,
    sub: delegatedUser,
    iat,
    exp,
  };

  const headerSegment = base64UrlEncodeBytes(textEncoder.encode(JSON.stringify(header)));
  const claimSegment = base64UrlEncodeBytes(textEncoder.encode(JSON.stringify(claimSet)));
  const unsignedJwt = `${headerSegment}.${claimSegment}`;

  const key = await importPrivateKey();

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      textEncoder.encode(unsignedJwt),
    ),
  );

  const signedJwt = `${unsignedJwt}.${base64UrlEncodeBytes(signature)}`;

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text();
    throw new Error(`Failed to obtain Google Workspace access token: ${tokenResponse.status} ${message}`);
  }

  const tokenJson = await tokenResponse.json() as { access_token: string; expires_in: number };

  cachedToken = {
    token: tokenJson.access_token,
    expiresAt: now + (tokenJson.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export async function sendGoogleWorkspaceEmail(options: GoogleWorkspaceEmailOptions): Promise<{ id: string; threadId?: string }> {
  const from = options.from ?? Deno.env.get("GOOGLE_WORKSPACE_DEFAULT_FROM");
  if (!from) {
    throw new Error("No from address provided and GOOGLE_WORKSPACE_DEFAULT_FROM is not configured.");
  }

  const delegatedUser = Deno.env.get("GOOGLE_WORKSPACE_DELEGATED_USER");
  if (!delegatedUser) {
    throw new Error("GOOGLE_WORKSPACE_DELEGATED_USER is not configured.");
  }

  const mimeMessage = buildMimeMessage({
    ...options,
    from,
  });

  const raw = base64UrlEncodeBytes(textEncoder.encode(mimeMessage));

  const accessToken = await getAccessToken();

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(delegatedUser)}/messages/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Workspace email send failed: ${response.status} ${errorText}`);
  }

  const json = await response.json() as { id: string; threadId?: string };
  return json;
}

