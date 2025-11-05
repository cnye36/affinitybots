# GitHub MCP OAuth Fixes

## Issues Fixed

### 1. **Incomplete Disconnect Cleanup**
**Problem:** When disconnecting from GitHub MCP server, the system wasn't properly clearing all state:
- In-memory OAuth sessions remained
- MCP client cache wasn't cleared
- Database records weren't fully cleaned

**Fix:** Updated `disconnectServer()` and `disconnectServerByName()` in `lib/mcp/mcpWebInterface.ts` to:
- Clear OAuth sessions from memory via `mcpClientFactory.disconnectOAuth()`
- Clear MCP client cache via `mcpClientFactory.clearCache()`
- Delete database records completely
- Added comprehensive logging

### 2. **Session Rehydration Failures**
**Problem:** When Next.js serverless functions restart (hot reload, cold start), the in-memory OAuth sessions are lost. The callback handler tried to rehydrate from database but didn't properly initialize the OAuth client before calling `finishAuth()`.

**Fix:** Updated `finishAuth()` in `lib/mcp/mcpWebInterface.ts` to:
- Properly rehydrate OAuth clients from database when in-memory session is lost
- Initialize clients by calling `connect()` (which sets up internal client and oauthProvider)
- Handle expected "OAuth authorization required" error gracefully
- Set sessionId in GitHub clients during rehydration
- Throw clear error if database record is missing

### 3. **Poor Error Handling in OAuth Callback**
**Problem:** OAuth callback route had minimal error handling and logging, making debugging difficult. Errors were returned as JSON instead of redirecting users back to UI with error messages.

**Fix:** Updated `app/api/mcp/auth/callback/route.ts` to:
- Add comprehensive logging of all callback parameters
- Properly extract error parameters from OAuth provider
- Redirect users back to tools page with error messages (instead of returning JSON)
- Add success parameter to redirect URL when OAuth completes
- Improve error messages for missing parameters

### 4. **Insufficient Logging in Connect Flow**
**Problem:** Limited logging made it hard to debug connection issues.

**Fix:**
- Added detailed logging to `app/api/mcp/auth/connect/route.ts`
- Added logging to `lib/oauth/githubOauthClient.ts` `finishAuth()` method
- Added logging throughout the rehydration process
- Log success/failure states at each step

## Files Modified

1. `/lib/mcp/mcpWebInterface.ts`
   - Enhanced `disconnectServer()` method
   - Enhanced `disconnectServerByName()` method
   - Fixed `finishAuth()` session rehydration logic

2. `/app/api/mcp/auth/callback/route.ts`
   - Improved error handling
   - Added comprehensive logging
   - Changed error responses to redirect to UI with messages

3. `/app/api/mcp/auth/connect/route.ts`
   - Added detailed logging

4. `/lib/oauth/githubOauthClient.ts`
   - Added logging to `finishAuth()` method
   - Improved error messages

## Testing Instructions

### Prerequisites
1. Ensure GitHub OAuth app is configured with:
   - `GITHUB_CLIENT_ID` environment variable
   - `GITHUB_CLIENT_SECRET` environment variable
   - Callback URL: `http://localhost:3000/api/mcp/auth/callback`

### Test Scenario 1: Fresh Connection
1. Navigate to `/tools/github`
2. Click "Connect"
3. Verify redirect to GitHub OAuth
4. Approve authorization
5. Verify redirect back to `/tools?success=connected`
6. Verify server shows as connected
7. Check server logs for successful completion messages

### Test Scenario 2: Disconnect and Reconnect
1. With GitHub connected, click "Disconnect"
2. Verify server shows as disconnected
3. Check logs for cleanup messages
4. Click "Connect" again
5. Verify OAuth flow starts fresh (should see GitHub auth screen again)
6. Complete authorization
7. Verify connection works

### Test Scenario 3: Session Loss Recovery (Hot Reload)
1. Start OAuth flow (click Connect, get redirected to GitHub)
2. While on GitHub auth page, restart Next.js dev server (`pnpm dev`)
3. Complete GitHub authorization
4. Verify callback still works and session is rehydrated from database
5. Check logs for "rehydrating" messages

### Expected Log Output

**On Connect:**
```
Connect request received: { serverUrl: '...', callbackUrl: '...', serverName: 'github' }
Initiating connection to github for user <user_id>
MCPWebInterface: Connecting to <url> for user <user_id>
Connect result: { success: false, requiresAuth: true, hasAuthUrl: true, hasSessionId: true }
```

**On Callback:**
```
OAuth callback received: { hasCode: true, hasState: true, url: '...' }
Processing OAuth callback for session <session_id> and user <user_id>
Session <session_id> not found in memory, attempting to rehydrate from database
Rehydrating GitHub OAuth client for session <session_id>
Successfully rehydrated and initialized OAuth client for session <session_id>
GitHubOAuthClient: Finishing OAuth with auth code
GitHubOAuthClient: Exchanging auth code for tokens
GitHubOAuthClient: Connecting to MCP server
GitHubOAuthClient: Successfully completed OAuth flow
OAuth completed successfully, redirecting to /tools
```

**On Disconnect:**
```
MCPWebInterface: Disconnecting server github for user <user_id>
MCPWebInterface: Successfully disconnected server github
```

## Known Limitations

1. **In-Memory Session Store**: The session store is still in-memory. While session rehydration mitigates this, a Redis-backed session store would be more robust for production.

2. **GitHub Callback URL**: The callback URL must exactly match what's configured in GitHub's OAuth app settings. Localhost works for development, but production needs the correct domain.

## Future Improvements

1. Implement Redis-backed session store for true session persistence
2. Add session expiration and automatic cleanup
3. Add retry logic for transient OAuth failures
4. Implement token refresh for expired OAuth tokens
5. Add MCP server health checks after connection
