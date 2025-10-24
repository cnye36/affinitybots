# Google Drive MCP Server Integration Setup

This guide explains how to set up and configure the Google Drive MCP server integration with AffinityBots.

## Overview

The Google Drive MCP server is a custom implementation that allows AI assistants to interact with Google Drive. Unlike standard MCP servers, this server expects OAuth tokens to be managed by AffinityBots and passed with each request.

## Prerequisites

1. **Google Drive MCP Server** - Already running on port 3002
2. **Google Cloud Console Project** - With OAuth 2.0 credentials
3. **AffinityBots** - This application

## Step 1: Configure Google Cloud Console

### Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "AffinityBots Google Drive Integration"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google/oauth/callback` (for development)
     - `https://your-production-domain.com/api/google/oauth/callback` (for production)
   - Click "Create"

5. Save your **Client ID** and **Client Secret**

### Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: "AffinityBots"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (if in testing mode)
6. Click "Save and Continue"

## Step 2: Configure AffinityBots Environment Variables

Create or update your `.env.local` file in the AffinityBots root directory:

```env
# Google MCP OAuth Credentials (for Drive integration)
# These are SEPARATE from your user authentication credentials
GOOGLE_MCP_CLIENT_ID=your_mcp_client_id_here.apps.googleusercontent.com
GOOGLE_MCP_CLIENT_SECRET=your_mcp_client_secret_here

# OAuth Redirect URI (must match Google Cloud Console configuration)
# Optional - defaults to NEXT_PUBLIC_APP_URL + /api/google/oauth/callback
GOOGLE_MCP_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback

# Google Drive MCP Server URL
GOOGLE_DRIVE_MCP_URL=http://localhost:3002

# Application URL (used for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: User authentication Google OAuth (if different from MCP)
# GOOGLE_CLIENT_ID=your_user_auth_client_id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your_user_auth_client_secret
```

### Production Configuration

For production, update the environment variables:

```env
GOOGLE_MCP_CLIENT_ID=your_production_mcp_client_id.apps.googleusercontent.com
GOOGLE_MCP_CLIENT_SECRET=your_production_mcp_client_secret
GOOGLE_MCP_REDIRECT_URI=https://your-domain.com/api/google/oauth/callback
GOOGLE_DRIVE_MCP_URL=http://google-drive-mcp-server:3002  # or your production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Step 3: Start the Services

### 1. Start Google Drive MCP Server

The Google Drive MCP server should already be running on port 3002. Verify it's running:

```bash
curl http://localhost:3002/health
```

You should see a successful health check response.

### 2. Start AffinityBots

```bash
cd /home/cnye/agenthub
pnpm dev
```

## Step 4: Connect Google Drive to an Assistant

### Via UI

1. Navigate to http://localhost:3000/tools
2. Find "Google Drive" in the official MCP servers section
3. Click "Connect"
4. You'll be redirected to Google's OAuth consent screen
5. Grant the requested permissions
6. You'll be redirected back to AffinityBots with a success message

### Via Assistant Configuration

1. Create or edit an assistant
2. Go to the "Tools" section
3. Enable "Google Drive" from the available MCP servers
4. If not already connected, you'll be prompted to connect your Google account

## Step 5: Verify the Integration

### Test with Health Check

```bash
curl http://localhost:3002/health
```

### Test OAuth Connection

1. Go to http://localhost:3000/tools/configured
2. You should see "Google Drive" listed as a configured tool
3. Check the connection status

### Test with an Assistant

1. Create or open an assistant
2. Enable Google Drive tools
3. Ask the assistant to perform a Google Drive operation, such as:
   - "List my recent files in Google Drive"
   - "Search for documents with 'project' in the name"
   - "Show me my folders"

## Troubleshooting

### OAuth Errors

**Error: "redirect_uri_mismatch"**
- Ensure `GOOGLE_REDIRECT_URI` in `.env.local` matches exactly what's configured in Google Cloud Console
- Check for trailing slashes and http vs https

**Error: "access_denied"**
- User declined the OAuth consent
- Try reconnecting via /tools page

**Error: "invalid_client"**
- Check that `GOOGLE_MCP_CLIENT_ID` and `GOOGLE_MCP_CLIENT_SECRET` are correct
- Ensure credentials are for a "Web application" type
- Verify you're using the MCP credentials, not the user auth credentials

### MCP Server Errors

**Error: "Connection refused"**
- Verify the Google Drive MCP server is running on port 3002
- Check `GOOGLE_DRIVE_MCP_URL` is set correctly

**Error: "Authentication failed"**
- Tokens may have expired
- Reconnect your Google account via /tools page
- Check that refresh tokens are being stored correctly

**Error: "Token refresh failed"**
- Ensure the Google OAuth app has "offline" access_type
- Check that refresh_token is being saved to the database
- Verify the OAuth client has the correct scopes

### Database Issues

**Error: "No tokens found"**
- User hasn't connected Google Drive yet
- Check the `user_mcp_servers` table for the user's Google Drive entry
- Ensure `oauth_token` and `refresh_token` columns are populated

**Error: "Session not found"**
- OAuth session may have been cleared
- User needs to reconnect via /tools page

## Architecture

### Data Flow

```
User → AffinityBots UI
  ↓
Connect Google Drive
  ↓
OAuth Flow (handled by AffinityBots)
  ↓
Tokens stored in database (user_mcp_servers table)
  ↓
Assistant invokes tool
  ↓
AffinityBots retrieves tokens from database
  ↓
AffinityBots refreshes tokens if expired
  ↓
AffinityBots calls MCP server with tokens
  ↓
MCP server executes Google Drive API call
  ↓
Result returned to assistant
```

### Key Components

- **OAuth Routes**: `/api/google/oauth/connect` and `/api/google/oauth/callback`
- **Google OAuth Client**: `lib/oauth/googleOAuthClient.ts`
- **Google Drive MCP Client**: `lib/mcp/googleDriveMcpClient.ts`
- **MCP Client Manager**: `lib/mcp/mcpClientManager.ts`
- **Official Servers Registry**: `lib/mcp/officialMcpServers.ts`

## Security Considerations

1. **Token Storage**: OAuth tokens are stored encrypted in the database
2. **Token Refresh**: Tokens are automatically refreshed when expired
3. **Scope Limitation**: Only request necessary Google Drive scopes
4. **HTTPS in Production**: Always use HTTPS for OAuth redirects in production
5. **Client Secret**: Never expose `GOOGLE_CLIENT_SECRET` in client-side code

## Maintenance

### Monitoring

- Check MCP server health endpoint regularly: `http://localhost:3002/health`
- Monitor OAuth token expiration and refresh rates
- Track failed authentication attempts

### Updates

When updating the Google Drive MCP server:
1. Stop the MCP server
2. Deploy the new version
3. Verify the `/health` and `/mcp/execute` endpoints are working
4. Test with a sample assistant

### Scaling

For production deployments:
- Run the MCP server as a separate service/container
- Use a production-grade database for token storage
- Implement rate limiting on OAuth endpoints
- Monitor API quota usage in Google Cloud Console

## Additional Google Services

This same pattern can be used for other Google services:
- **Gmail**: For email operations
- **Google Calendar**: For calendar management
- **Google Docs**: For document editing
- **Google Sheets**: For spreadsheet operations

Each service will need:
1. Its own MCP server implementation
2. Appropriate OAuth scopes
3. Configuration in `officialMcpServers.ts`
4. Similar OAuth client implementation

## Support

For issues related to:
- **AffinityBots integration**: Check the application logs
- **Google Drive MCP server**: Check the MCP server logs on port 3002
- **Google OAuth**: Refer to [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
- **Google Drive API**: Refer to [Google Drive API documentation](https://developers.google.com/drive)

