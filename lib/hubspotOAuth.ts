import { NextRequest } from "next/server";

const HUBSPOT_AUTH_BASE = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";

export function getHubSpotClientId(): string {
  const value = process.env.HUBSPOT_CLIENT_ID;
  if (!value) throw new Error("HUBSPOT_CLIENT_ID is not set");
  return value;
}

export function getHubSpotClientSecret(): string {
  const value = process.env.HUBSPOT_CLIENT_SECRET;
  if (!value) throw new Error("HUBSPOT_CLIENT_SECRET is not set");
  return value;
}

function sanitizeScopeList(raw: string): string {
  // Remove quotes/brackets and normalize separators
  const cleaned = raw
    .replace(/[\[\]\"\'`]/g, " ")
    .replace(/[;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean)
    // Strip trailing punctuation just in case
    .map((s) => s.replace(/[.,]+$/g, ""));
  // De-duplicate while preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      result.push(p);
    }
  }
  return result.join(" ");
}

export function getHubSpotScopes(): string {
  const raw = process.env.HUBSPOT_SCOPES || "crm.objects.contacts.read";
  const normalized = sanitizeScopeList(raw);
  const parts = normalized ? normalized.split(" ") : [];
  if (!parts.includes("oauth")) parts.unshift("oauth");
  return parts.join(" ");
}

export function getHubSpotOptionalScopes(): string | undefined {
  const raw = process.env.HUBSPOT_OPTIONAL_SCOPES;
  if (!raw) return undefined;
  const normalized = sanitizeScopeList(raw);
  return normalized || undefined;
}

export function buildCallbackUrl(req: NextRequest): string {
  // Prefer explicit env; fall back to request origin
  const envCallback = process.env.HUBSPOT_REDIRECT_URI;
  if (envCallback) return envCallback;
  const origin = req.nextUrl.origin;
  return `${origin}/api/hubspot/oauth/callback`;
}

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  scopes: string;
  state?: string;
  accountId?: string; // optional: target a specific account
  optionalScopes?: string;
}): string {
  const url = new URL(HUBSPOT_AUTH_BASE);
  if (params.accountId) {
    url.pathname = `/oauth/${params.accountId}/authorize`;
  }
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scopes);
  url.searchParams.set("response_type", "code");
  if (params.optionalScopes) {
    url.searchParams.set("optional_scope", params.optionalScopes);
  }
  if (params.state) url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<any> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", args.clientId);
  body.set("client_secret", args.clientSecret);
  body.set("redirect_uri", args.redirectUri);
  body.set("code", args.code);

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // Never cache token responses
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}


