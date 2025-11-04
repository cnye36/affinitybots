# Google Services Multi-Tenant Architecture

## Problem We Solved

When adding Gmail integration, the agent was getting **Google Drive tools instead of Gmail tools** despite Gmail being configured. This was due to OAuth scope contamination.

### Root Cause Analysis

1. **Scope Contamination**: The Gmail database entry received Drive OAuth scopes instead of Gmail scopes
2. **Missing Service Parameter**: OAuth flow defaulted to Drive scopes when `service` parameter was missing  
3. **No Scope Validation**: System didn't verify that tokens had correct permissions for the service
4. **Cache Poisoning**: In-memory cache stored wrong tools for Gmail

## Architecture Overview

### Shared OAuth Client, Separate Scopes

```
┌─────────────────────────────────────────────────────────────┐
│              SINGLE GOOGLE OAUTH CLIENT                      │
│         (GOOGLE_MCP_CLIENT_ID / CLIENT_SECRET)               │
│                                                              │
│  Used for ALL Google services with different scopes:        │
│  - Drive: drive, drive.file                                  │
│  - Gmail: gmail.readonly, gmail.compose, gmail.modify        │
│  - Calendar: calendar, calendar.events                       │
│  - Docs: documents, drive.file                               │
│  - Sheets: spreadsheets, drive.file                          │
└─────────────────────────────────────────────────────────────┘
```

### Service Isolation

Each Google service is treated as a **completely separate MCP server**:

| Service | Qualified Name | Port | Scopes | MCP Client Class |
|---------|---------------|------|--------|------------------|
| Drive | `google-drive` | 3002 | `drive`, `drive.file` | `GoogleDriveMCPClient` |
| Gmail | `gmail` | 3003 | `gmail.*` | `GmailMCPClient` |
| Calendar | `google-calendar` | 3004 | `calendar.*` | `GoogleCalendarMCPClient` |
| Docs | `google-docs` | 3005 | `documents`, `drive.file` | `GoogleDocsMCPClient` |
| Sheets | `google-sheets` | 3006 | `spreadsheets`, `drive.file` | `GoogleSheetsMCPClient` |

### Database Schema

```sql
-- user_mcp_servers table
CREATE TABLE user_mcp_servers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  qualified_name TEXT NOT NULL,  -- e.g., 'gmail', 'google-drive'
  url TEXT,                       -- Service-specific URL (port 3002, 3003, etc.)
  oauth_token TEXT,               -- Access token with SERVICE-SPECIFIC scopes
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  config JSONB,                   -- Must include { provider: 'gmail' | 'drive' | ... }
  is_enabled BOOLEAN,
  UNIQUE(user_id, qualified_name)
);
```

**Critical**: Each service gets its own row with its own OAuth token scoped appropriately.

## OAuth Flow (Per Service)

### 1. Initiate Connection
```
User clicks "Connect" on Gmail →
/api/google/oauth/connect?service=gmail
```

**What happens:**
1. Validates `service` parameter (gmail, drive, calendar, etc.)
2. Looks up service config (port, qualified_name, URL)
3. Creates temporary `user_mcp_servers` entry with `is_enabled=false`
4. Calls `getGoogleAuthorizationUrl(service, sessionId)` with **Gmail scopes**
5. Redirects to Google consent screen

### 2. User Consents
User sees:
```
AffinityBots wants to:
✓ Read, compose, and modify your Gmail
✓ View your email address
```

### 3. OAuth Callback
```
Google redirects to:
/api/google/oauth/callback?code=...&state=<sessionId>
```

**What happens:**
1. Looks up pending session by `session_id` (finds `gmail` entry)
2. Exchanges code for tokens (tokens have Gmail scopes)
3. Updates `gmail` entry with tokens and sets `is_enabled=true`
4. Stores `provider: "gmail"` in config for validation

## MCP Client Selection Logic

In `mcpClientManager.handleOAuthServer()`:

```typescript
// Determine which service this is
const isGoogleDriveServer =
  qualifiedName === 'google-drive' ||
  serverConfig.config?.provider === 'google-drive';

const isGmailServer =
  qualifiedName === 'gmail' ||
  serverConfig.config?.provider === 'gmail';

const isGoogleCalendarServer =
  qualifiedName === 'google-calendar' ||
  serverConfig.config?.provider === 'calendar';

// Create service-specific client
if (isGoogleDriveServer) {
  return createGoogleDriveClient(userId, serverConfig);
}
if (isGmailServer) {
  return createGmailClient(userId, serverConfig);
}
if (isGoogleCalendarServer) {
  return createGoogleCalendarClient(userId, serverConfig);
}
```

**Key insight**: Each Google service needs:
1. Its own MCP client class
2. Its own URL/port
3. Its own OAuth scopes
4. Its own database entry

## Adding New Google Services

### Step 1: Define Scopes
```typescript
// lib/oauth/googleOAuthClient.ts
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
]

// Add to the map
export const GOOGLE_SERVICE_SCOPES = {
  // ... existing
  calendar: GOOGLE_CALENDAR_SCOPES,
}
```

### Step 2: Add Service Config
```typescript
// app/api/google/oauth/connect/route.ts
const GOOGLE_SERVICE_CONFIG = {
  // ... existing
  calendar: { 
    qualifiedName: "google-calendar", 
    urlEnvVar: "GOOGLE_CALENDAR_MCP_URL", 
    defaultUrl: "http://localhost:3004", 
    port: 3004 
  },
}
```

### Step 3: Create MCP Client
```typescript
// lib/mcp/googleCalendarMcpClient.ts
export class GoogleCalendarMCPClient {
  // Same pattern as GoogleDriveMCPClient and GmailMCPClient
  // Handles token-per-request execution
}
```

### Step 4: Update MCPClientManager
```typescript
// lib/mcp/mcpClientManager.ts
import { GoogleCalendarMCPClient, createGoogleCalendarClient } from "./googleCalendarMcpClient";

// In handleOAuthServer:
const isGoogleCalendarServer =
  qualifiedName === 'google-calendar' ||
  serverConfig.config?.provider === 'calendar';

if (isGoogleCalendarServer) {
  return createGoogleCalendarClient(userId, serverConfig);
}
```

### Step 5: Update UI
```typescript
// app/(app)/tools/[qualifiedName]/page.tsx
if (server.qualifiedName === 'google-calendar') {
  window.location.href = '/api/google/oauth/connect?service=calendar';
  return;
}
```

### Step 6: Add to Official Servers
```typescript
// lib/mcp/officialMcpServers.ts
{
  qualifiedName: "google-calendar",
  displayName: "Google Calendar",
  description: "Access and manage your Google Calendar events...",
  logoUrl: "https://...",
  url: process.env.GOOGLE_CALENDAR_MCP_URL || "http://localhost:3004",
  authType: "oauth",
  requiresSetup: true,
}
```

## Critical Rules

### ✅ DO:
- Always pass `?service=<serviceName>` to OAuth connect endpoint
- Use unique `qualified_name` for each service (e.g., `gmail` not `google-gmail`)
- Store `provider` in config matching the service type
- Create service-specific MCP client classes
- Use unique ports for each service (3002, 3003, 3004, etc.)
- Request only the scopes needed for that service

### ❌ DON'T:
- Share OAuth tokens between services (each needs its own)
- Default to Drive scopes (always require explicit service parameter)
- Use generic names like "google" (be specific: gmail, drive, calendar)
- Skip the `provider` field in config (needed for client selection)
- Reuse ports or URLs across services

## Troubleshooting

### Service gets wrong tools
**Symptoms**: Agent configured for Gmail but gets Drive tools

**Diagnosis**:
```bash
pnpm exec tsx scripts/check-google-servers.ts
```

**Common causes**:
1. Wrong scopes in OAuth token (check `config.tokenMetadata.scope`)
2. Wrong `provider` in config
3. Wrong URL/port
4. In-memory cache poisoning (restart dev server)

**Fix**: Delete and reconnect the service

### Adding service doesn't request new scopes
**Cause**: You already have an OAuth session with Google

**Solution**: The `prompt: "consent"` in OAuth params forces re-consent, so users will see the new scopes even if already authenticated

## Testing New Services

```bash
# 1. Check database state
pnpm exec tsx scripts/check-google-servers.ts

# 2. Test OAuth flow
open http://localhost:3000/tools/gmail

# 3. Verify scopes in database
# After connecting, check config.tokenMetadata.scope includes correct scopes

# 4. Test agent execution
# Enable service in assistant, send test message

# 5. Check logs for client type
# Should see "GmailMCPClient: Executing tool..." not "GoogleDriveMCPClient"
```

## Summary

**The fix ensures**:
- Each Google service has unique scopes, tokens, and MCP clients
- No cross-contamination between services
- Scalable architecture for adding Calendar, Docs, Sheets, etc.
- Clear error messages when service parameter is missing
- Scope validation to catch misconfigurations

**Next steps for you**:
1. Go to `/tools/gmail`
2. Click "Connect"  
3. You'll see Gmail-specific permissions requested
4. After approval, Gmail will work with proper tools


