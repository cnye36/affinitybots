import { OAuth2Client } from "google-auth-library"

export interface GoogleOAuthTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  token_type?: string
  scope?: string
}

/**
 * Google OAuth scopes for Drive access
 */
export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
]

/**
 * Get Google MCP OAuth credentials from environment
 * These are separate from user authentication credentials
 */
export function getGoogleMcpCredentials() {
  const clientId = process.env.GOOGLE_MCP_CLIENT_ID
  const clientSecret = process.env.GOOGLE_MCP_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_MCP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/google/oauth/callback`

  if (!clientId || !clientSecret) {
    throw new Error("Google MCP OAuth credentials not configured. Please set GOOGLE_MCP_CLIENT_ID and GOOGLE_MCP_CLIENT_SECRET environment variables.")
  }

  return { clientId, clientSecret, redirectUri }
}

/**
 * Create OAuth2 client for MCP integration
 */
export function createGoogleMcpOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleMcpCredentials()
  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

/**
 * Generate Google OAuth authorization URL for MCP Drive integration
 */
export function getGoogleAuthorizationUrl(state?: string): string {
  const oauth2Client = createGoogleMcpOAuthClient()
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_DRIVE_SCOPES,
    prompt: "consent",
    state,
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
  const oauth2Client = createGoogleMcpOAuthClient()
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      token_type: tokens.token_type || undefined,
      scope: tokens.scope || undefined,
    }
  } catch (error) {
    console.error("Error exchanging code for tokens:", error)
    throw new Error("Failed to exchange authorization code for tokens")
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiryDate?: number | null): boolean {
  if (!expiryDate) return true
  const bufferMs = 5 * 60 * 1000 // 5 minute buffer
  return Date.now() >= expiryDate - bufferMs
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  const oauth2Client = createGoogleMcpOAuthClient()
  
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token ?? refreshToken,
      expiry_date: credentials.expiry_date ?? undefined,
      token_type: credentials.token_type ?? undefined,
      scope: credentials.scope ?? undefined,
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    throw new Error("Failed to refresh access token")
  }
}

/**
 * Get valid tokens, refreshing if necessary
 */
export async function getValidGoogleTokens(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: number | null
): Promise<GoogleOAuthTokens> {
  if (!isTokenExpired(expiryDate)) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      expiry_date: expiryDate || undefined,
    }
  }

  if (!refreshToken) {
    throw new Error("Token expired and no refresh token available")
  }

  return await refreshAccessToken(refreshToken)
}

