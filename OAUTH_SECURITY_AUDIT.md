# OAuth Security and Implementation Audit Report
**Date:** 2025-12-12
**Scope:** MCP (Model Context Protocol) OAuth Implementation
**Status:** CRITICAL ISSUES FOUND

---

## Executive Summary

This audit identified **15 critical bugs and security vulnerabilities** in the OAuth implementation for MCP servers. The issues range from complete session store failure (in-memory only, loses all sessions on restart) to token refresh logic gaps, race conditions, CSRF vulnerabilities, and inconsistent state management across multiple OAuth flows.

**Severity Breakdown:**
- **CRITICAL:** 8 issues (session persistence, token refresh, state validation)
- **HIGH:** 4 issues (race conditions, error handling, token expiration)
- **MEDIUM:** 3 issues (documentation inconsistency, caching issues)

**Immediate Action Required:** The in-memory session store makes OAuth unusable in production environments (serverless, containers, or any restart). Token refresh is completely non-functional.

---

## Critical Issues (Severity: CRITICAL)

### 1. In-Memory Session Store - PRODUCTION FAILURE
**File:** `/home/cnye/agenthub/lib/oauth/sessionStore.ts`
**Lines:** 4-32
**Severity:** CRITICAL

**Issue:**
The session store is entirely in-memory using a JavaScript `Map`. This means:
- All OAuth sessions are lost on server restart
- Sessions are not shared across serverless function instances
- Sessions are lost during hot-reload in development
- Complete OAuth re-authorization required after ANY deployment

**Current Code:**
```typescript
class SessionStore {
  private clients = new Map<string, MCPOAuthClient | GitHubOAuthClient>();
  // ...
}
```

**Documentation says:** "Redis-backed store" (CLAUDE.md line mentions Redis)
**Reality:** Pure in-memory, no Redis integration whatsoever

**Impact:**
- Users must re-authorize OAuth every time the server restarts
- In serverless (Vercel), each function invocation may have a different session store
- OAuth callback fails if routed to different instance than initiation

**Fix Required:**
Implement actual Redis-backed session store:

```typescript
import Redis from "ioredis"

class SessionStore {
  private redis: Redis
  private inMemoryCache = new Map<string, MCPOAuthClient | GitHubOAuthClient>()

  constructor() {
    // Use RATE_LIMIT_REDIS_URL or dedicated OAUTH_REDIS_URL
    const redisUrl = process.env.OAUTH_REDIS_URL || process.env.RATE_LIMIT_REDIS_URL
    if (!redisUrl) {
      console.warn("⚠️ No Redis URL configured, falling back to in-memory session store (NOT production-safe)")
    } else {
      this.redis = new Redis(redisUrl)
    }
  }

  async setClient(sessionId: string, client: MCPOAuthClient | GitHubOAuthClient) {
    // Store serializable state in Redis
    const state = {
      tokens: client.getTokens(),
      expiry: client.getTokenExpiry(),
      providerState: (client as any).getProviderState?.(),
      serverUrl: (client as any).serverUrl,
      callbackUrl: (client as any).callbackUrl,
      clientType: client instanceof GitHubOAuthClient ? "github" : "mcp"
    }

    if (this.redis) {
      await this.redis.setex(
        `oauth:session:${sessionId}`,
        3600, // 1 hour TTL
        JSON.stringify(state)
      )
    }

    // Keep in memory for immediate access
    this.inMemoryCache.set(sessionId, client)
  }

  async getClient(sessionId: string): Promise<MCPOAuthClient | GitHubOAuthClient | null> {
    // Check in-memory cache first
    if (this.inMemoryCache.has(sessionId)) {
      return this.inMemoryCache.get(sessionId)!
    }

    // Attempt Redis retrieval and rehydration
    if (this.redis) {
      const stateJson = await this.redis.get(`oauth:session:${sessionId}`)
      if (stateJson) {
        const state = JSON.parse(stateJson)
        // Rehydrate client from state
        const client = state.clientType === "github"
          ? new GitHubOAuthClient(state.serverUrl, state.callbackUrl, () => {})
          : new MCPOAuthClient(state.serverUrl, state.callbackUrl, () => {})

        if (state.tokens) {
          await client.connectWithStoredSession({
            tokens: state.tokens,
            expiresAt: state.expiry,
            providerState: state.providerState
          })
        }

        this.inMemoryCache.set(sessionId, client)
        return client
      }
    }

    return null
  }

  async removeClient(sessionId: string) {
    const client = this.inMemoryCache.get(sessionId)
    if (client && 'disconnect' in client) {
      client.disconnect()
    }
    this.inMemoryCache.delete(sessionId)

    if (this.redis) {
      await this.redis.del(`oauth:session:${sessionId}`)
    }
  }

  generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

export const sessionStore = new SessionStore()
```

---

### 2. No Token Refresh Logic - Tokens Expire Permanently
**Files:**
- `/home/cnye/agenthub/lib/oauth/oauthClient.ts`
- `/home/cnye/agenthub/lib/oauth/githubOauthClient.ts`
**Severity:** CRITICAL

**Issue:**
Neither `MCPOAuthClient` nor `GitHubOAuthClient` implement token refresh logic. Tokens are stored with expiration timestamps, but there is NO code to refresh them when expired.

**Current Code:**
```typescript
// oauthClient.ts - saveTokens calculates expiry but never uses it
saveTokens(tokens: OAuthTokens): void {
  this._tokens = tokens;
  if (typeof tokens.expires_in === "number") {
    this._tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  }
}
```

**No refresh_token usage anywhere in MCPOAuthClient or GitHubOAuthClient**

**Impact:**
- Users must manually re-authorize when tokens expire (typically 1 hour for OAuth)
- Workflows fail when tokens expire mid-execution
- No automatic token renewal despite having refresh tokens stored

**Google OAuth has refresh logic** (`googleOAuthClient.ts` lines 154-172) but MCP/GitHub don't use it.

**Fix Required:**
Add token refresh to `MCPOAuthClient`:

```typescript
async refreshTokensIfNeeded(): Promise<void> {
  if (!this._tokens || !this._tokenExpiresAt) {
    return // No tokens to refresh
  }

  const expiryDate = new Date(this._tokenExpiresAt)
  const now = new Date()
  const bufferMs = 5 * 60 * 1000 // Refresh 5 minutes before expiry

  if (expiryDate.getTime() - bufferMs > now.getTime()) {
    return // Token still valid
  }

  if (!this._tokens.refresh_token) {
    throw new Error("Token expired and no refresh token available")
  }

  // Use the MCP SDK's token refresh mechanism
  const baseUrl = new URL(this.serverUrl)
  const transport = new StreamableHTTPClientTransport(baseUrl, {
    authProvider: this.oauthProvider,
  })

  try {
    // The SDK should handle refresh automatically, but we need to trigger it
    await transport.refreshTokens(this._tokens.refresh_token)
    this.cacheTokensFromProvider()
  } catch (error) {
    console.error("Token refresh failed:", error)
    throw new Error("Failed to refresh OAuth token")
  }
}

// Call this before EVERY API request
async listTools(): Promise<ListToolsResult> {
  await this.refreshTokensIfNeeded()
  // ... existing code
}
```

**GitHub OAuth needs similar implementation** - GitHub tokens expire and need refresh.

---

### 3. Session Rehydration Fails - Missing Client Reconstruction
**File:** `/home/cnye/agenthub/lib/mcp/mcpWebInterface.ts`
**Lines:** 156-185
**Severity:** CRITICAL

**Issue:**
The `finishAuth` method attempts to rehydrate OAuth clients from the database when `sessionStore.getClient(sessionId)` returns null (common in serverless). However, the rehydration logic is fundamentally broken:

**Current Code:**
```typescript
// Line 172: prepareWithState is called but client is never connected
mcpClient.prepareWithState(state);
// ... then stored but NOT connected
sessionStore.setClient(sessionId, client as any);
// Avoid calling connect() here to prevent new client_id registration
```

**The comment says "Avoid calling connect()" but then the client is NEVER connected!**

**Impact:**
- OAuth callback fails in serverless environments
- User completes Google/GitHub OAuth, but callback returns "No active OAuth session found"
- Rehydrated clients are stored but non-functional

**Fix Required:**
```typescript
if (!sessionStore.getClient(sessionId)) {
  try {
    if (serverRow?.url) {
      const callbackUrl = serverRow.config?.callbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/auth/callback`
      const isGitHub = serverRow.url.includes('githubcopilot.com') || serverRow.url.includes('github.com')

      let client: GitHubOAuthClient | MCPOAuthClient

      if (isGitHub) {
        client = new GitHubOAuthClient(serverRow.url, callbackUrl, () => {})
      } else {
        client = new MCPOAuthClient(serverRow.url, callbackUrl, () => {})
        const state = serverRow.config?.providerState
        if (state) {
          client.prepareWithState(state)
        }
      }

      // MUST store before finishAuth because finishAuth expects it in sessionStore
      sessionStore.setClient(sessionId, client as any)
    }
  } catch (rehydrateError) {
    console.error('Failed to rehydrate OAuth client from DB:', rehydrateError)
    throw new Error('OAuth session expired or invalid')
  }
}

// Now proceed with finishAuth - client is in sessionStore
await mcpClientFactory.completeOAuth(sessionId, authCode)
```

---

### 4. Race Condition in MCP Client Cache
**File:** `/home/cnye/agenthub/lib/mcp/mcpClientManager.ts`
**Lines:** 215-244
**Severity:** CRITICAL

**Issue:**
The cache validation logic has a race condition where multiple concurrent requests can invalidate and recreate the same cache entry simultaneously.

**Current Code:**
```typescript
if (!forceRefresh && mcpClientCache.has(cacheKey)) {
  const cachedEntry = mcpClientCache.get(cacheKey)!
  // ... validation checks ...
  if (oauthValid && httpValid && !(hasEnabledServers && isEmptyTools)) {
    return cachedEntry.result
  }
  // RACE: Another request may reach here at same time
  mcpClientCache.delete(cacheKey)
}
// Both requests recreate cache simultaneously
```

**Impact:**
- Multiple MCP client connections created for same user
- Doubled OAuth validation requests
- Cache thrashing under concurrent load

**Fix Required:**
Use async locks or promise-based caching:

```typescript
private cacheLocks = new Map<string, Promise<MCPClientResult>>()

async createMcpClientAndTools(config: MCPClientConfig): Promise<MCPClientResult> {
  const { userId, enabledServers, forceRefresh = false } = config
  const cacheKey = `${userId}:${enabledServers.sort().join(",")}`

  // Check if another request is already building this cache entry
  if (this.cacheLocks.has(cacheKey)) {
    console.log(`Waiting for concurrent cache build for ${userId}`)
    return await this.cacheLocks.get(cacheKey)!
  }

  // Check cache first
  if (!forceRefresh && mcpClientCache.has(cacheKey)) {
    const cachedEntry = mcpClientCache.get(cacheKey)!
    const cacheAge = Date.now() - cachedEntry.timestamp

    if (cacheAge < CACHE_DURATION_MS) {
      const oauthValid = await this.validateOAuthSessions(cachedEntry.result.oauthClients)
      const httpValid = await this.validateHttpSessions(cachedEntry.result.client)
      const hasEnabledServers = enabledServers.length > 0
      const isEmptyTools = cachedEntry.result.tools.length === 0

      if (oauthValid && httpValid && !(hasEnabledServers && isEmptyTools)) {
        console.log(`Using cached MCP client for ${userId}`)
        return cachedEntry.result
      }
    }

    mcpClientCache.delete(cacheKey)
  }

  // Create promise for cache building
  const buildPromise = this._buildMcpClient(config, cacheKey)
  this.cacheLocks.set(cacheKey, buildPromise)

  try {
    const result = await buildPromise
    return result
  } finally {
    this.cacheLocks.delete(cacheKey)
  }
}

private async _buildMcpClient(config: MCPClientConfig, cacheKey: string): Promise<MCPClientResult> {
  // ... existing cache build logic ...
}
```

---

### 5. Missing State Parameter Validation (CSRF Vulnerability)
**File:** `/home/cnye/agenthub/app/api/mcp/auth/callback/route.ts`
**Lines:** 7-26
**Severity:** CRITICAL (Security)

**Issue:**
The OAuth callback accepts `state` parameter from query string without ANY validation. The state parameter should be:
1. Generated by the server with cryptographic randomness
2. Stored server-side with expiration
3. Validated on callback to match stored value
4. Single-use (deleted after validation)

**Current Code:**
```typescript
// sessionId can come from either 'sessionId' param or 'state' param
let sessionId = url.searchParams.get('sessionId') || url.searchParams.get('state');

if (!authCode || !sessionId) {
  // ... error handling
}
// DIRECTLY USES sessionId WITH NO VALIDATION!
const result = await mcpWebInterface.finishAuth(sessionId, authCode, user.id);
```

**This is a textbook CSRF vulnerability in OAuth flows.**

**Impact:**
- Attacker can craft malicious OAuth callbacks
- Authorization code can be intercepted and used by attacker
- No protection against cross-site request forgery

**Fix Required:**
Implement proper state validation:

```typescript
// In connect/route.ts - GENERATE STATE
export async function POST(request: NextRequest) {
  // ...
  const state = crypto.randomBytes(32).toString('hex')
  const sessionId = sessionStore.generateSessionId()

  // Store state with expiration (5 minutes)
  await sessionStore.setOAuthState(state, {
    sessionId,
    userId: user.id,
    serverName,
    serverUrl,
    expiresAt: Date.now() + 5 * 60 * 1000
  })

  // Return state to client, which passes it to OAuth provider
  return NextResponse.json({
    authUrl: `${result.authUrl}&state=${state}`,
    sessionId
  })
}

// In callback/route.ts - VALIDATE STATE
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const authCode = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!authCode || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  // VALIDATE STATE
  const storedState = await sessionStore.getOAuthState(state)
  if (!storedState) {
    console.error('Invalid or expired OAuth state:', state)
    return NextResponse.json({ error: 'Invalid or expired OAuth state' }, { status: 400 })
  }

  if (storedState.expiresAt < Date.now()) {
    await sessionStore.deleteOAuthState(state)
    return NextResponse.json({ error: 'OAuth state expired' }, { status: 400 })
  }

  // DELETE STATE (single-use)
  await sessionStore.deleteOAuthState(state)

  // Validate userId matches
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== storedState.userId) {
    return NextResponse.json({ error: 'User mismatch' }, { status: 403 })
  }

  // Now safe to use sessionId
  const result = await mcpWebInterface.finishAuth(storedState.sessionId, authCode, user.id)
  // ...
}
```

---

### 6. HubSpot OAuth Stores Token in Wrong Field
**File:** `/home/cnye/agenthub/app/api/hubspot/oauth/callback/route.ts`
**Lines:** 43-63
**Severity:** CRITICAL

**Issue:**
HubSpot OAuth callback stores the access token in `config.bearer_token` instead of `oauth_token` field. This creates inconsistency with how tokens are retrieved elsewhere.

**Current Code:**
```typescript
const upsert = {
  user_id: user.id,
  qualified_name: "hubspot",
  url: hubspotMcpUrl,
  config: {
    bearer_token: tokens.access_token, // ❌ WRONG
    scope: tokens.scope,
    provider: "hubspot",
  },
  is_enabled: true,
  expires_at: expiresAt,
  refresh_token: tokens.refresh_token || null,
  // ❌ oauth_token field is NULL!
}
```

**mcpClientManager.ts expects token in `oauth_token` field:**
```typescript
// Line 479
const hasStoredToken =
  typeof serverConfig.oauth_token === 'string' &&
  serverConfig.oauth_token !== '' &&
  serverConfig.oauth_token !== 'present';
```

**Impact:**
- HubSpot OAuth appears to succeed but tokens are never found
- HubSpot integration always requires re-authorization
- Token refresh impossible (wrong field)

**Fix Required:**
```typescript
const upsert = {
  user_id: user.id,
  qualified_name: "hubspot",
  url: hubspotMcpUrl,
  oauth_token: tokens.access_token, // ✅ CORRECT FIELD
  refresh_token: tokens.refresh_token || null,
  expires_at: expiresAt,
  config: {
    scope: tokens.scope,
    provider: "hubspot",
    auth_type: "bearer", // Mark as bearer token auth
    tokenMetadata: {
      token_type: "Bearer",
      scope: tokens.scope,
      expires_at: expiresAt,
    }
  },
  is_enabled: true,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
} as any
```

---

### 7. Session ID Generation is Cryptographically Weak
**File:** `/home/cnye/agenthub/lib/oauth/sessionStore.ts`
**Line:** 28
**Severity:** CRITICAL (Security)

**Issue:**
Session IDs are generated using `Math.random()` which is NOT cryptographically secure.

**Current Code:**
```typescript
generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

**Impact:**
- Session IDs are predictable
- Attacker can guess valid session IDs
- Session hijacking vulnerability

**Fix Required:**
Use Node.js `crypto` module:

```typescript
import crypto from "crypto"

generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}
```

**Same issue in:**
- `/home/cnye/agenthub/app/api/google/oauth/connect/route.ts` line 52
- Multiple other OAuth initiation routes

---

### 8. Google OAuth Connect Uses Weak Session ID
**File:** `/home/cnye/agenthub/app/api/google/oauth/connect/route.ts`
**Line:** 52
**Severity:** CRITICAL (Security)

**Same as issue #7** - uses `Math.random()` instead of `crypto.randomBytes()`

**Fix Required:**
```typescript
import crypto from "crypto"

// Line 52
const sessionId = crypto.randomBytes(32).toString('hex')
```

---

## High Severity Issues

### 9. Token Expiration Not Checked Before Use
**File:** `/home/cnye/agenthub/lib/mcp/mcpClientManager.ts`
**Lines:** 479-493
**Severity:** HIGH

**Issue:**
When rehydrating OAuth sessions, the code checks if `oauth_token` exists but does NOT validate expiration before attempting to use it.

**Current Code:**
```typescript
const hasStoredToken =
  typeof serverConfig.oauth_token === 'string' &&
  serverConfig.oauth_token !== '' &&
  serverConfig.oauth_token !== 'present';

const tokens: OAuthTokens | null = hasStoredToken
  ? {
      access_token: serverConfig.oauth_token,
      token_type: storedTokenType,
      scope: storedScope,
      refresh_token: serverConfig.refresh_token || undefined,
    }
  : null;

const expiresAt: string | undefined = serverConfig.expires_at || ...
// expiresAt is captured but NEVER CHECKED before use!
```

**Impact:**
- Expired tokens are used, causing API failures
- No automatic refresh despite having refresh token
- Poor user experience (random failures)

**Fix Required:**
```typescript
const hasStoredToken =
  typeof serverConfig.oauth_token === 'string' &&
  serverConfig.oauth_token !== '' &&
  serverConfig.oauth_token !== 'present'

// Check expiration
const expiresAt: string | undefined = serverConfig.expires_at || serverConfig.config?.tokenMetadata?.expires_at
let isTokenExpired = false

if (expiresAt) {
  const expiryDate = new Date(expiresAt)
  const bufferMs = 5 * 60 * 1000 // 5 minute buffer
  isTokenExpired = expiryDate.getTime() - bufferMs <= Date.now()
}

// Only use token if not expired OR if we have refresh token
const tokens: OAuthTokens | null = hasStoredToken && !isTokenExpired
  ? {
      access_token: serverConfig.oauth_token,
      token_type: storedTokenType,
      scope: storedScope,
      refresh_token: serverConfig.refresh_token || undefined,
    }
  : hasStoredToken && isTokenExpired && serverConfig.refresh_token
    ? await this.refreshExpiredToken(serverConfig) // NEW METHOD
    : null

// New method to refresh expired tokens
private async refreshExpiredToken(serverConfig: any): Promise<OAuthTokens> {
  // Provider-specific refresh logic
  if (serverConfig.config?.provider === 'google-drive' || serverConfig.config?.provider === 'gmail') {
    const { refreshAccessToken } = await import('@/lib/oauth/googleOAuthClient')
    return await refreshAccessToken(serverConfig.refresh_token)
  }

  if (serverConfig.config?.provider === 'hubspot') {
    // Implement HubSpot token refresh
    throw new Error('HubSpot token refresh not implemented')
  }

  // Generic OAuth refresh (needs MCP SDK support)
  throw new Error('Token refresh not supported for this provider')
}
```

---

### 10. OAuth Provider State Not Persisted to Database
**File:** `/home/cnye/agenthub/lib/mcp/mcpWebInterface.ts`
**Lines:** 195-209
**Severity:** HIGH

**Issue:**
The `providerState` (client_id, client_secret, PKCE verifier) is retrieved from the OAuth client after `finishAuth` but may not be properly persisted if it's a new registration.

**Current Code:**
```typescript
if (client instanceof MCPOAuthClient) {
  tokens = client.getTokens();
  expiresAt = client.getTokenExpiry();
  providerState = client.getProviderState() || providerState; // Fallback to old state
}

await this.updateOAuthCompletion(sessionId, userId, {
  tokens,
  expiresAt,
  providerState,
  existingConfig: serverRow?.config || {},
});
```

**The issue:** If `serverRow?.config` is missing, providerState might not be saved.

**Impact:**
- PKCE verifier lost after first OAuth
- Client ID/secret not persisted for dynamic registration
- Re-authentication required on next use

**Fix Required:**
Ensure providerState is always captured:

```typescript
// After finishAuth, ALWAYS get fresh provider state
let providerState = serverRow?.config?.providerState
let tokens: OAuthTokens | undefined
let expiresAt: string | undefined

const client = sessionStore.getClient(sessionId)
if (client instanceof MCPOAuthClient) {
  tokens = client.getTokens()
  expiresAt = client.getTokenExpiry()
  // ALWAYS override with fresh state from client
  const freshState = client.getProviderState()
  if (freshState) {
    providerState = freshState
  }
} else if (client instanceof GitHubOAuthClient) {
  tokens = client.getTokens()
  expiresAt = client.getTokenExpiry()
  // GitHub doesn't use provider state
}

// Ensure config object exists
const existingConfig = serverRow?.config || {}
const updatedConfig = {
  ...existingConfig,
  providerState: providerState || existingConfig.providerState,
  callbackUrl: existingConfig.callbackUrl,
}

await this.updateOAuthCompletion(sessionId, userId, {
  tokens,
  expiresAt,
  providerState,
  existingConfig: updatedConfig, // Pass updated config
})
```

---

### 11. Error Handling Swallows Critical OAuth Errors
**File:** `/home/cnye/agenthub/lib/mcp/mcpClientManager.ts`
**Lines:** 567-579, 608-610
**Severity:** HIGH

**Issue:**
OAuth session rehydration errors are caught and logged but then ignored, allowing execution to continue with null/broken sessions.

**Current Code:**
```typescript
try {
  await githubClient.connectWithStoredSession({ tokens, expiresAt });
  // ...
} catch (error) {
  console.warn(`Failed to reconnect GitHub OAuth session for ${qualifiedName}:`, error);
  // ❌ NO RETHROW OR CLEANUP - continues with broken session
}
```

**Impact:**
- Silent failures in OAuth reconnection
- Tools appear available but fail when called
- No user feedback about expired sessions

**Fix Required:**
```typescript
try {
  await githubClient.connectWithStoredSession({ tokens, expiresAt })
  if (serverConfig.session_id) {
    sessionStore.setClient(serverConfig.session_id, githubClient)
  }
  return {
    url: serverConfig.url,
    client: githubClient,
    sessionId: serverConfig.session_id,
  }
} catch (error) {
  console.error(`Failed to reconnect GitHub OAuth session for ${qualifiedName}:`, error)

  // Check if token is expired and can be refreshed
  if (serverConfig.refresh_token && this.isTokenExpiredError(error)) {
    console.log(`Attempting to refresh expired GitHub token for ${qualifiedName}`)
    try {
      const refreshedTokens = await this.refreshGitHubToken(serverConfig.refresh_token)
      await githubClient.connectWithStoredSession({
        tokens: refreshedTokens,
        expiresAt: refreshedTokens.expiry_date
      })

      // Update database with new tokens
      await this.updateTokensInDatabase(userId, qualifiedName, refreshedTokens)

      return {
        url: serverConfig.url,
        client: githubClient,
        sessionId: serverConfig.session_id,
      }
    } catch (refreshError) {
      console.error(`Token refresh failed for ${qualifiedName}:`, refreshError)
      // Mark server as needing re-authorization
      await this.markServerNeedsReauth(userId, qualifiedName)
      return null
    }
  }

  // Non-recoverable error
  await this.markServerNeedsReauth(userId, qualifiedName)
  return null
}
```

---

### 12. Cache Invalidation Logic Has Flawed Empty Tools Check
**File:** `/home/cnye/agenthub/lib/mcp/mcpClientManager.ts`
**Lines:** 229-233
**Severity:** HIGH

**Issue:**
The cache validation invalidates cache when `hasEnabledServers && isEmptyTools`, but this is TOO aggressive and causes cache thrashing.

**Current Code:**
```typescript
const hasEnabledServers = enabledServers.length > 0;
const isEmptyTools = cachedEntry.result.tools.length === 0;

if (oauthValid && httpValid && !(hasEnabledServers && isEmptyTools)) {
  // Use cache
} else {
  // Refresh - but empty tools might be VALID state!
}
```

**Issue:** Empty tools is a VALID state if:
- Server has no tools configured yet
- Server is in initial setup phase
- Server only provides resources, not tools

**Impact:**
- Cache constantly invalidated for servers with no tools
- Unnecessary OAuth validation requests
- Performance degradation

**Fix Required:**
Add timestamp-based cache invalidation instead:

```typescript
const EMPTY_TOOLS_CACHE_DURATION_MS = 30 * 1000 // 30 seconds for empty results
const cacheAge = Date.now() - cachedEntry.timestamp
const maxAge = cachedEntry.result.tools.length === 0
  ? EMPTY_TOOLS_CACHE_DURATION_MS
  : CACHE_DURATION_MS

if (cacheAge < maxAge) {
  const oauthValid = await this.validateOAuthSessions(cachedEntry.result.oauthClients)
  const httpValid = await this.validateHttpSessions(cachedEntry.result.client)

  if (oauthValid && httpValid) {
    console.log(`Using cached MCP client for ${userId} (age: ${Math.round(cacheAge / 1000)}s, tools: ${cachedEntry.result.tools.length})`)
    return cachedEntry.result
  }
}
```

---

## Medium Severity Issues

### 13. Documentation Claims Redis, Implementation Uses In-Memory
**File:** `/home/cnye/agenthub/CLAUDE.md`
**Lines:** OAuth Integration section
**Severity:** MEDIUM (Documentation)

**Issue:**
Documentation states "Session management with Redis-backed store" but implementation is pure in-memory.

**Fix Required:**
Update CLAUDE.md:

```markdown
- **OAuth Sessions**: Currently in-memory (NOT PRODUCTION SAFE - TODO: implement Redis)
  - Sessions lost on server restart/redeploy
  - Not compatible with serverless (Vercel) or multi-instance deployments
  - See OAUTH_SECURITY_AUDIT.md Issue #1 for implementation plan
```

---

### 14. Google OAuth Callback Missing Refresh Token Storage Verification
**File:** `/home/cnye/agenthub/app/api/google/oauth/callback/route.ts`
**Lines:** 74-94
**Severity:** MEDIUM

**Issue:**
Google OAuth callback stores refresh token but doesn't verify it was actually provided by Google (only returned on first authorization with `prompt=consent`).

**Current Code:**
```typescript
refresh_token: tokens.refresh_token || null,
```

**Impact:**
- Subsequent OAuth flows (without prompt=consent) won't get refresh token
- Old refresh token might be overwritten with null
- Token refresh fails after re-authorization

**Fix Required:**
```typescript
// Only update refresh_token if a new one is provided
const updates: any = {
  oauth_token: tokens.access_token,
  expires_at: expiresAt,
  is_enabled: true,
  config: {
    ...serverConfig.config,
    provider,
    tokenMetadata: {
      token_type: tokens.token_type || "Bearer",
      scope: tokens.scope,
      expires_at: expiresAt,
    },
  },
  updated_at: new Date().toISOString(),
}

// Only overwrite refresh_token if we got a new one
if (tokens.refresh_token) {
  updates.refresh_token = tokens.refresh_token
}

const { error: updateError } = await supabase
  .from("user_mcp_servers")
  .update(updates)
  .eq("user_id", user.id)
  .eq("qualified_name", qualifiedName)
  .eq("session_id", state)
```

---

### 15. MCPClientFactory.validateAndRefresh Never Called
**File:** `/home/cnye/agenthub/lib/mcp/mcpClientFactory.ts`
**Lines:** 94-148
**Severity:** MEDIUM

**Issue:**
The `validateAndRefresh` method implements token expiration checking but is NEVER called anywhere in the codebase.

**Search for usage:**
```bash
grep -r "validateAndRefresh" --include="*.ts" --include="*.tsx"
# Returns: Only definition in mcpClientFactory.ts, no usage
```

**Impact:**
- Token expiration checking is dead code
- Expired sessions are never proactively refreshed
- Method is implemented but wasted effort

**Fix Required:**
Call `validateAndRefresh` before agent execution:

```typescript
// In lib/agent/reactAgent.ts or wherever agents are initialized
const factory = MCPClientFactory.getInstance()

// Check and refresh expired sessions BEFORE creating client
const validation = await factory.validateAndRefresh(userId, agentConfig)
if (validation.needsRefresh && validation.expiredSessions.length > 0) {
  console.warn(`Expired OAuth sessions detected: ${validation.expiredSessions.join(', ')}`)
  // Use the refreshed result
  if (validation.result) {
    factoryResult = validation.result
  }
}
```

---

## Architectural Concerns

### A. Multiple OAuth Flow Implementations (Inconsistency)

There are **THREE separate OAuth implementations** with different patterns:

1. **MCP OAuth** (`/app/api/mcp/auth/*`) - Uses sessionStore + mcpClientFactory
2. **HubSpot OAuth** (`/app/api/hubspot/oauth/*`) - Direct database storage, NO sessionStore
3. **Google OAuth** (`/app/api/google/oauth/*`) - Direct database storage, NO sessionStore

**Recommendation:** Unify all OAuth flows to use the same pattern (sessionStore + factory) for consistency.

---

### B. No Centralized Token Refresh Service

Token refresh is implemented inconsistently:
- Google: Has refresh logic in `googleOAuthClient.ts`
- HubSpot: NO refresh logic
- MCP/GitHub: NO refresh logic

**Recommendation:** Create centralized `OAuthTokenManager` service:

```typescript
// lib/oauth/tokenManager.ts
export class OAuthTokenManager {
  async getValidTokens(
    provider: 'google' | 'hubspot' | 'github' | 'mcp',
    userId: string,
    serverName: string
  ): Promise<OAuthTokens> {
    // 1. Fetch from database
    // 2. Check expiration
    // 3. Refresh if needed
    // 4. Update database
    // 5. Return valid tokens
  }
}
```

---

### C. No Webhook/Event System for Token Expiration

Users are not notified when tokens expire. Need proactive expiration handling:

**Recommendation:**
- Cron job to check token expiration daily
- Email/notification when tokens expire within 7 days
- Background job to auto-refresh tokens (if refresh_token available)

---

## Priority Fixes (Implement Immediately)

1. **Issue #1:** Implement Redis-backed session store (BLOCKS PRODUCTION)
2. **Issue #7 & #8:** Fix cryptographically weak session ID generation (SECURITY)
3. **Issue #5:** Add state parameter validation (CSRF SECURITY)
4. **Issue #6:** Fix HubSpot token storage field mismatch
5. **Issue #2:** Implement token refresh logic for MCP/GitHub

---

## Testing Recommendations

After implementing fixes, test:

1. **Session Persistence:** Restart server mid-OAuth flow, verify callback works
2. **Token Refresh:** Set token expiry to 1 minute, verify auto-refresh
3. **Concurrent Requests:** Send 10 simultaneous requests, verify no race conditions
4. **CSRF Protection:** Attempt OAuth callback with invalid state, verify rejection
5. **Serverless Compatibility:** Deploy to Vercel, test complete OAuth flow
6. **Token Expiration:** Wait for token to expire, verify auto-refresh or re-auth prompt

---

## Code Files Requiring Changes

### Critical Priority:
1. `/home/cnye/agenthub/lib/oauth/sessionStore.ts` - Implement Redis
2. `/home/cnye/agenthub/lib/oauth/oauthClient.ts` - Add token refresh
3. `/home/cnye/agenthub/lib/oauth/githubOauthClient.ts` - Add token refresh
4. `/home/cnye/agenthub/app/api/mcp/auth/callback/route.ts` - Add state validation
5. `/home/cnye/agenthub/app/api/mcp/auth/connect/route.ts` - Generate secure state
6. `/home/cnye/agenthub/app/api/hubspot/oauth/callback/route.ts` - Fix token field
7. `/home/cnye/agenthub/app/api/google/oauth/connect/route.ts` - Secure session ID

### High Priority:
8. `/home/cnye/agenthub/lib/mcp/mcpClientManager.ts` - Fix expiration checks, error handling, cache logic
9. `/home/cnye/agenthub/lib/mcp/mcpWebInterface.ts` - Fix session rehydration

### Medium Priority:
10. `/home/cnye/agenthub/CLAUDE.md` - Update documentation
11. `/home/cnye/agenthub/lib/mcp/mcpClientFactory.ts` - Wire up validateAndRefresh

---

## Environment Variables Needed

Add to `.env`:

```bash
# OAuth Session Storage (REQUIRED for production)
OAUTH_REDIS_URL=redis://localhost:6379
# OR reuse existing Redis:
# Uses RATE_LIMIT_REDIS_URL if OAUTH_REDIS_URL not set

# OAuth Security
OAUTH_STATE_SECRET=<generate-32-byte-hex-secret>
```

---

## Conclusion

The OAuth implementation has **critical production-blocking issues**, primarily the in-memory session store and missing token refresh logic. The codebase also has **CSRF vulnerabilities** from improper state parameter handling.

**Estimated remediation time:** 2-3 days for critical fixes, 1 week for complete overhaul including architectural improvements.

**Risk if not fixed:**
- OAuth completely non-functional in production (Vercel/serverless)
- Security vulnerabilities (CSRF, session hijacking)
- Poor user experience (constant re-authorization)
- Data loss (sessions/tokens lost on restart)

---

**End of Report**
