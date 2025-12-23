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
 * Google OAuth scopes for Gmail access
 */
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
]

/**
 * Google OAuth scopes for Calendar access
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
]

/**
 * Google OAuth scopes for Docs access
 */
export const GOOGLE_DOCS_SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
]

/**
 * Google OAuth scopes for Sheets access
 */
export const GOOGLE_SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
]

/**
 * Map of Google services to their required scopes
 * Add new services here when you add more Google integrations
 */
export const GOOGLE_SERVICE_SCOPES: Record<string, string[]> = {
  drive: GOOGLE_DRIVE_SCOPES,
  gmail: GOOGLE_GMAIL_SCOPES,
  calendar: GOOGLE_CALENDAR_SCOPES,
  docs: GOOGLE_DOCS_SCOPES,
  sheets: GOOGLE_SHEETS_SCOPES,
}

/**
 * Get Google MCP OAuth credentials from environment
 * These are separate from user authentication credentials
 */
export function getGoogleMcpCredentials() {
  const clientId = process.env.GOOGLE_MCP_CLIENT_ID
  const clientSecret = process.env.GOOGLE_MCP_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_MCP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/google/oauth/callback`

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
 * Generate Google OAuth authorization URL for any Google service
 * @param service - Which Google service to request scopes for
 * @param state - State parameter to track the OAuth flow
 * @throws Error if service is not supported
 */
export function getGoogleAuthorizationUrl(
  service: keyof typeof GOOGLE_SERVICE_SCOPES,
  state?: string
): string {
  const oauth2Client = createGoogleMcpOAuthClient()
  const scopes = GOOGLE_SERVICE_SCOPES[service]
  
  if (!scopes) {
    throw new Error(
      `Unknown Google service: ${service}. Valid services: ${Object.keys(GOOGLE_SERVICE_SCOPES).join(", ")}`
    )
  }
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Always show consent screen to ensure proper scopes
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
