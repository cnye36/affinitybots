import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  buildCallbackUrl,
  getHubSpotClientId,
  getHubSpotScopes,
  getHubSpotOptionalScopes,
} from "@/lib/hubspotOAuth";

export async function GET(req: NextRequest) {
  const clientId = getHubSpotClientId();
  const scopes = getHubSpotScopes();
  const optionalScopes = getHubSpotOptionalScopes();
  const redirectUri = buildCallbackUrl(req);
  const state = req.nextUrl.searchParams.get("state") || undefined;
  const accountId = req.nextUrl.searchParams.get("accountId") || undefined;

  const url = buildAuthorizeUrl({
    clientId,
    redirectUri,
    scopes,
    state,
    accountId: accountId || undefined,
    optionalScopes,
  });
  if (req.nextUrl.searchParams.get("debug") === "1") {
    return NextResponse.json({
      clientId,
      redirectUri,
      scopes,
      optionalScopes,
      state,
      accountId,
      authorizeUrl: url,
    });
  }
  return NextResponse.redirect(url);
}


