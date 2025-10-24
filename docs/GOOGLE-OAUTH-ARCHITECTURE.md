# Google OAuth Two-Client Architecture

## Overview

This application uses **two separate Google OAuth clients** for different purposes. This is the recommended architecture for applications that need both user authentication and service integration.

## The Two Clients

### 1. User Authentication Client (Optional)
**Environment Variables**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Purpose**: Authenticating users to your application using "Sign in with Google"

**Scopes**:
- `openid`
- `email`
- `profile`

**Use Case**: When users want to sign into AffinityBots using their Google account (instead of email/password)

**Configuration**: Standard Google OAuth for user login

---

### 2. MCP Integration Client (Required for Drive)
**Environment Variables**: `GOOGLE_MCP_CLIENT_ID`, `GOOGLE_MCP_CLIENT_SECRET`

**Purpose**: Enabling AI assistants to access user's Google Drive via MCP

**Scopes**:
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/userinfo.email`

**Use Case**: When assistants need to:
- List files in Google Drive
- Search for documents
- Read/create/update files
- Manage folders and permissions

**Configuration**: This is what we've implemented for the Drive MCP integration

## Why Two Separate Clients?

### 1. **Separation of Concerns**
- User auth is about identity verification
- MCP integration is about service access
- Different parts of your application handle each

### 2. **Different Permission Scopes**
- User login only needs basic profile info
- Drive integration needs full Drive API access
- Users understand why each set of permissions is needed

### 3. **Security Benefits**
- If one client is compromised, the other remains secure
- Can revoke one without affecting the other
- Different security policies for each use case

### 4. **Independent Management**
- Separate API quotas in Google Cloud Console
- Different audit logs for each purpose
- Can enable/disable features independently

### 5. **User Experience**
- Clear consent screens explaining what each integration does
- Users can revoke Drive access without losing login capability
- Separate "Connect Google Drive" from "Sign in with Google"

## How It Works

### User Authentication Flow (If Implemented)
```
User clicks "Sign in with Google"
  ↓
Google OAuth (GOOGLE_CLIENT_ID)
  ↓
User authenticates and grants basic permissions
  ↓
AffinityBots receives user profile
  ↓
User logged into AffinityBots
```

### MCP Drive Integration Flow
```
User enables Google Drive for an assistant
  ↓
Redirect to OAuth consent (GOOGLE_MCP_CLIENT_ID)
  ↓
User grants Drive access permissions
  ↓
AffinityBots stores tokens in database
  ↓
Assistant invokes Drive tool
  ↓
AffinityBots retrieves/refreshes tokens
  ↓
AffinityBots calls MCP server with tokens
  ↓
MCP server uses tokens to call Google Drive API
  ↓
Results returned to assistant
```

## Environment Variable Reference

```env
# ============================================
# USER AUTHENTICATION (Optional)
# Use these if you want "Sign in with Google"
# ============================================
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# ============================================
# MCP DRIVE INTEGRATION (Required)
# Use these for AI assistant Drive access
# ============================================
GOOGLE_MCP_CLIENT_ID=yyy.apps.googleusercontent.com
GOOGLE_MCP_CLIENT_SECRET=GOCSPX-yyy
GOOGLE_MCP_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback

# ============================================
# MCP SERVER
# ============================================
GOOGLE_DRIVE_MCP_URL=http://localhost:3002

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Google Cloud Console Setup

You'll need to create **two** OAuth 2.0 clients in the same or different projects:

### Client 1: User Authentication (Optional)
1. Application type: Web application
2. Name: "AffinityBots User Login"
3. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)
4. Scopes: openid, email, profile

### Client 2: MCP Drive Integration (Required)
1. Application type: Web application
2. Name: "AffinityBots Google Drive MCP"
3. Authorized redirect URIs:
   - `http://localhost:3000/api/google/oauth/callback` (development)
   - `https://your-domain.com/api/google/oauth/callback` (production)
4. Scopes: drive, drive.file, userinfo.email

## Token Storage

### User Auth Tokens (If Using)
Stored in your users table or session store:
- Used for authenticating requests to AffinityBots
- Typically session-based or JWT

### MCP Drive Tokens
Stored in `user_mcp_servers` table:
- `oauth_token`: Current access token
- `refresh_token`: Long-lived refresh token
- `expires_at`: When the access token expires
- Used for making Drive API calls on behalf of the user

## Important Notes

1. **The MCP Server Doesn't Need Credentials**
   - The MCP server running on port 3002 is stateless
   - It receives tokens with each request from AffinityBots
   - No OAuth credentials needed on the MCP server side

2. **Token Management is AffinityBots' Responsibility**
   - AffinityBots handles all OAuth flows
   - AffinityBots stores all tokens
   - AffinityBots refreshes expired tokens
   - MCP server just executes operations with provided tokens

3. **Can Use Same Client for Both (Not Recommended)**
   - You *could* use one client for both purposes
   - But separation provides better security and UX
   - Recommended: Always use separate clients

## Future Google Services

When adding Gmail, Calendar, Docs, etc., you have options:

### Option 1: Separate Client per Service (Most Secure)
```env
GOOGLE_MCP_DRIVE_CLIENT_ID=...
GOOGLE_MCP_DRIVE_CLIENT_SECRET=...
GOOGLE_MCP_GMAIL_CLIENT_ID=...
GOOGLE_MCP_GMAIL_CLIENT_SECRET=...
GOOGLE_MCP_CALENDAR_CLIENT_ID=...
GOOGLE_MCP_CALENDAR_CLIENT_SECRET=...
```

### Option 2: One MCP Client for All Services (Simpler)
```env
GOOGLE_MCP_CLIENT_ID=...  # Used for all MCP integrations
GOOGLE_MCP_CLIENT_SECRET=...
```

**Recommendation**: Start with Option 2 (one MCP client), add appropriate scopes as needed:
```typescript
const GOOGLE_MCP_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/documents',
  // ... add as needed
];
```

## Security Best Practices

1. **Never commit credentials** - Use `.env.local` (gitignored)
2. **Use HTTPS in production** - Required for OAuth
3. **Rotate secrets regularly** - Especially if exposed
4. **Monitor OAuth usage** - Check Google Cloud Console
5. **Implement proper token storage** - Encrypt at rest
6. **Set proper token expiration** - Don't keep stale tokens
7. **Use minimal scopes** - Only request what you need
8. **Audit access regularly** - Review who has access

## Troubleshooting

### "Wrong credentials being used"
- Check which variables are set: `GOOGLE_CLIENT_ID` vs `GOOGLE_MCP_CLIENT_ID`
- The code now uses `GOOGLE_MCP_*` for Drive integration
- User auth would use `GOOGLE_CLIENT_ID` (if you implement it)

### "Redirect URI mismatch"
- Ensure the redirect URI in Google Cloud Console matches exactly
- User auth: `/auth/google/callback`
- MCP Drive: `/api/google/oauth/callback`

### "Insufficient permissions"
- Check that the MCP client has Drive scopes enabled
- Verify scopes in Google Cloud Console OAuth consent screen
- User may need to re-authorize with new scopes

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Scopes](https://developers.google.com/drive/api/guides/api-specific-auth)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

