# Gmail MCP Server - AI Integration Guide

## Overview
This is an HTTP-based Model Context Protocol (MCP) server that provides Gmail integration through OAuth2 authentication. It exposes Gmail operations as standardized MCP tools.

## Architecture

### Service Information
- **Service Name**: `gmail-mcp-server` (in Docker)
- **Base URL**: `http://gmail-mcp-server:3003` (internal Docker network)
- **MCP Endpoint**: `http://gmail-mcp-server:3003/mcp`
- **Protocol**: HTTP/JSON

### Key Components
1. **MCP Interface** - Standard MCP tool execution
2. **OAuth2 Flow** - Google authentication with token persistence
3. **Token Storage** - File-based token persistence in `/app/data/.gmail-tokens.json`

## MCP Endpoints

### 1. List Available Tools
```http
GET /mcp/tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "list_labels",
      "description": "List Gmail labels for the authenticated user",
      "requiresWrite": false
    },
    {
      "name": "send_message",
      "description": "Send an email via Gmail. Args: to, subject, body, cc?, bcc?",
      "requiresWrite": true
    }
    // ... more tools
  ]
}
```

### 2. Execute a Tool
```http
POST /mcp/execute
Content-Type: application/json

{
  "tool": "send_message",
  "arguments": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Message body"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"id\":\"msg123\",\"threadId\":\"thread456\"}"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Not authenticated with Gmail"
}
```

## OAuth2 Authentication Flow

### Authentication States
1. **Unauthenticated** - No tokens stored, all MCP calls will fail
2. **Authenticated** - Tokens stored, MCP calls succeed
3. **Token Expired** - Google automatically refreshes with refresh_token

### Initial Authentication Process

#### Step 1: Get OAuth URL
```http
GET /oauth/url?readOnly=false
```

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=..."
}
```

**Query Parameters:**
- `readOnly` (optional, default: `true`)
  - `true`: Request read-only Gmail access
  - `false`: Request full read/write access

#### Step 2: User Authorization
- Direct the user to the returned URL
- User logs into Google and grants permissions
- Google redirects back to the callback URL with a `code`

#### Step 3: OAuth Callback (Automatic)
```http
GET /oauth/callback?code=4/0AeanE...
```

This endpoint:
1. Exchanges the code for access/refresh tokens
2. Stores tokens in `/app/data/.gmail-tokens.json`
3. Returns success message to user

**Storage Format:**
```json
{
  "me": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//0g...",
    "scope": "https://www.googleapis.com/auth/gmail.modify ...",
    "token_type": "Bearer",
    "expiry_date": 1234567890000
  }
}
```

### Token Management
- **User ID**: Always `"me"` (could support multiple users)
- **Persistence**: Tokens survive server restarts via volume mount
- **Refresh**: Google Auth Library handles automatic token refresh
- **Expiry**: Access tokens expire after ~1 hour, refresh tokens are long-lived

## Available MCP Tools

### Read-Only Tools (READ_ONLY=true)

#### `list_labels`
Lists all Gmail labels for the authenticated user.
```json
{
  "tool": "list_labels",
  "arguments": {}
}
```

#### `list_messages`
Lists Gmail messages with optional filters.
```json
{
  "tool": "list_messages",
  "arguments": {
    "q": "from:user@example.com",
    "labelIds": ["INBOX"],
    "maxResults": 10,
    "pageToken": "optional_token"
  }
}
```

#### `get_message`
Gets a specific message by ID.
```json
{
  "tool": "get_message",
  "arguments": {
    "id": "message_id",
    "format": "full"
  }
}
```

#### `get_thread`
Gets an entire email thread.
```json
{
  "tool": "get_thread",
  "arguments": {
    "id": "thread_id"
  }
}
```

#### `get_profile`
Gets the Gmail profile of the authenticated user.
```json
{
  "tool": "get_profile",
  "arguments": {}
}
```

### Write Tools (Requires READ_ONLY=false)

#### `send_message`
Sends an email.
```json
{
  "tool": "send_message",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Email subject",
    "body": "Email body",
    "cc": "cc@example.com",
    "bcc": "bcc@example.com"
  }
}
```

#### `create_draft`
Creates a draft email.
```json
{
  "tool": "create_draft",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Draft subject",
    "body": "Draft body"
  }
}
```

#### `modify_message_labels`
Adds or removes labels from a message.
```json
{
  "tool": "modify_message_labels",
  "arguments": {
    "id": "message_id",
    "addLabelIds": ["INBOX", "IMPORTANT"],
    "removeLabelIds": ["SPAM"]
  }
}
```

#### `trash_message`
Moves a message to trash.
```json
{
  "tool": "trash_message",
  "arguments": {
    "id": "message_id"
  }
}
```

#### `untrash_message`
Restores a message from trash.
```json
{
  "tool": "untrash_message",
  "arguments": {
    "id": "message_id"
  }
}
```

#### `delete_message`
Permanently deletes a message.
```json
{
  "tool": "delete_message",
  "arguments": {
    "id": "message_id"
  }
}
```

## Error Handling

### Common Errors

#### Not Authenticated
```json
{
  "error": "Not authenticated with Gmail"
}
```
**Solution**: Complete OAuth flow first.

#### Read-Only Mode
```json
{
  "error": "Tool \"send_message\" requires write access but server is in read-only mode"
}
```
**Solution**: Set `READ_ONLY=false` in environment and re-authenticate with write permissions.

#### Invalid Tool
```json
{
  "error": "Unknown tool: invalid_tool_name"
}
```
**Solution**: Check `/mcp/tools` for valid tool names.

## Configuration

### Environment Variables
```bash
PORT=3003                    # Server port
READ_ONLY=false             # true = read-only, false = full access
GOOGLE_CLIENT_ID=...        # Google OAuth Client ID
GOOGLE_CLIENT_SECRET=...    # Google OAuth Client Secret
GOOGLE_REDIRECT_URI=...     # OAuth callback URL
```

### Read-Only vs Write Mode
- **Read-Only (`READ_ONLY=true`)**:
  - Only requests `gmail.readonly` scope
  - Write tools return error even if attempted
  - Safer for assistants that should only read

- **Write Mode (`READ_ONLY=false`)**:
  - Requests `gmail.modify` and `gmail.send` scopes
  - Full access to send, modify, delete
  - Requires explicit user consent

## Integration Workflow

### For AI Assistants

1. **Check Authentication Status**
   ```javascript
   // Try to execute a simple read tool
   const response = await fetch('http://gmail-mcp-server:3003/mcp/execute', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ tool: 'get_profile', arguments: {} })
   });
   
   if (response.status === 500) {
     // Likely not authenticated - initiate OAuth flow
   }
   ```

2. **Initiate OAuth (if needed)**
   ```javascript
   // Get OAuth URL
   const { url } = await fetch('http://gmail-mcp-server:3003/oauth/url?readOnly=false')
     .then(r => r.json());
   
   // Present URL to user for authentication
   console.log('Please authenticate: ' + url);
   ```

3. **Execute Tools**
   ```javascript
   // Once authenticated, execute any tool
   const result = await fetch('http://gmail-mcp-server:3003/mcp/execute', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       tool: 'list_messages',
       arguments: { maxResults: 5 }
     })
   });
   ```

### Security Considerations

1. **Token Storage**: Tokens are stored in a Docker volume - ensure volume is backed up and secure
2. **OAuth Callback**: Must match the redirect URI configured in Google Cloud Console
3. **Network Isolation**: Keep the MCP server on an internal Docker network
4. **Read-Only Default**: The server defaults to read-only mode for safety
5. **HTTPS**: For production, use HTTPS and update redirect URIs accordingly

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "gmail-mcp",
  "readOnly": true
}
```

Use this endpoint for Docker health checks and service discovery.

## Troubleshooting

### Tool execution fails with authentication error
- Verify tokens exist in `/app/data/.gmail-tokens.json`
- Re-run OAuth flow if tokens are corrupted
- Check Google Cloud Console for OAuth credentials

### Write operations fail
- Verify `READ_ONLY=false` in environment
- Verify user granted write permissions during OAuth
- Check that `readOnly=false` was passed to `/oauth/url`

### OAuth callback fails
- Verify `GOOGLE_REDIRECT_URI` matches Google Cloud Console
- Check that redirect URI is accessible from user's browser
- Ensure OAuth credentials are valid

## Example: Complete Integration

```javascript
// 1. Check if authenticated
async function isAuthenticated() {
  try {
    const res = await fetch('http://gmail-mcp-server:3003/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'get_profile', arguments: {} })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 2. Get OAuth URL if not authenticated
async function getAuthUrl() {
  const res = await fetch('http://gmail-mcp-server:3003/oauth/url?readOnly=false');
  const { url } = await res.json();
  return url;
}

// 3. Execute MCP tool
async function executeTool(toolName, args) {
  const res = await fetch('http://gmail-mcp-server:3003/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: toolName, arguments: args })
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Tool execution failed');
  }
  
  // Parse the text content from MCP response
  return JSON.parse(data.content[0].text);
}

// Usage
if (!await isAuthenticated()) {
  console.log('Please authenticate:', await getAuthUrl());
} else {
  const messages = await executeTool('list_messages', { maxResults: 10 });
  console.log(messages);
}
```

