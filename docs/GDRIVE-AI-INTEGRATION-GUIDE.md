# Google Drive MCP Server - Complete Integration Guide for AffinityBots

## Table of Contents
- Architecture Overview
- How OAuth Works in This System
- What AffinityBots Must Do
- Step-by-Step Implementation
- Code Examples
- Testing & Debugging

## Architecture Overview

System Components:

```
┌─────────────────────────────────────────────────────────────────┐
│                          AFFINITYBOTS                            │
│                         (Main Application)                       │
│                                                                  │
│  Responsibilities:                                               │
│  • User authentication & sessions                                │
│  • Google OAuth flow (authorization + token exchange)            │
│  • Token storage (database)                                      │
│  • Token refresh logic                                           │
│  • All user-facing endpoints                                     │
│  • Calling MCP server with user tokens                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTP POST to localhost:3002/mcp/execute
                         │ Payload: { tool, arguments, tokens }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GOOGLE DRIVE MCP SERVER                        │
│                      (This Service)                              │
│                                                                  │
│  Responsibilities:                                               │
│  • Receive tokens with each request                              │
│  • Create temporary GoogleDriveClient                            │
│  • Execute Google Drive operations                               │
│  • Return results to AffinityBots                                │
│  • NO token storage                                              │
│  • NO OAuth flow handling                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Authenticated Google Drive API calls
                         │
                         ▼
                  ┌──────────────────┐
                  │  Google Drive API │
                  └──────────────────┘
```

Key Principle: Separation of Concerns
- AffinityBots = Authentication Authority (owns user identity & tokens)
- MCP Server = Execution Engine (performs Drive operations with provided tokens)

## How OAuth Works in This System

Phase 1: Initial Setup (Google Cloud Console)
- Create a Google Cloud Project
- Enable Google Drive API
- Create OAuth 2.0 credentials (Web Application)
- Authorized Redirect URI: `https://your-affinitybots-domain.com/auth/google/callback`
  - This MUST point to AffinityBots, NOT the MCP server
- Save Client ID and Client Secret

Phase 2: User Authorization (First Time)
1. User clicks "Connect Google Drive" in AffinityBots
2. AffinityBots generates Google OAuth URL
3. User approves permissions on Google's consent screen
4. Google redirects back to AffinityBots with authorization code
5. AffinityBots exchanges code for tokens (access + refresh)
6. AffinityBots stores tokens in database

Phase 3: Using the MCP Server (Every Request)
1. AffinityBots retrieves user's tokens from database
2. AffinityBots calls MCP server with tokens:
   - POST `http://localhost:3002/mcp/execute`
   - Body: `{ tool, arguments, tokens }`
3. MCP server creates temporary GoogleDriveClient with tokens
4. MCP server calls Google Drive API
5. MCP server returns results to AffinityBots

## What AffinityBots Must Do

Environment variables in AffinityBots (add to .env.local):

```env
# Google MCP OAuth Credentials (from Google Cloud Console)
# These are for the MCP Drive integration - separate from user authentication
GOOGLE_MCP_CLIENT_ID=your_mcp_client_id_here.apps.googleusercontent.com
GOOGLE_MCP_CLIENT_SECRET=your_mcp_client_secret_here

# Google MCP OAuth Redirect URI (should match what's configured in Google Cloud Console)
# Optional - defaults to NEXT_PUBLIC_APP_URL + /api/google/oauth/callback
# For local development:
GOOGLE_MCP_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
# For production:
# GOOGLE_MCP_REDIRECT_URI=https://your-affinitybots-domain.com/api/google/oauth/callback

# Google Drive MCP Server URL
GOOGLE_DRIVE_MCP_URL=http://localhost:3002

# Application URL (used for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Database schema (example):

```ts
// Prisma example
model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  googleAccessToken    String?  @db.Text
  googleRefreshToken   String?  @db.Text
  googleTokenExpiry    BigInt?
  googleScopes         String?
}
```

Required OAuth scopes:

```ts
const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
];
```

Token refresh logic (AffinityBots):

```ts
import { OAuth2Client } from 'google-auth-library';

const isTokenExpired = (expiryDate?: number | null) => {
  if (!expiryDate) return true;
  const bufferMs = 5 * 60 * 1000; // 5 min buffer
  return Date.now() >= Number(expiryDate) - bufferMs;
};

export async function getValidTokens(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) throw new Error('User not connected to Google Drive');

  if (!isTokenExpired(user.googleTokenExpiry)) {
    return {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken || undefined,
      expiry_date: user.googleTokenExpiry ? Number(user.googleTokenExpiry) : undefined,
    };
  }

  const oauth2 = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({ refresh_token: user.googleRefreshToken || undefined });
  const { credentials } = await oauth2.refreshAccessToken();

  await db.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: credentials.access_token,
      googleTokenExpiry: credentials.expiry_date ? BigInt(credentials.expiry_date) : null,
    },
  });

  return credentials;
}
```

## Step-by-Step Implementation

1) Install dependency in AffinityBots:

```bash
pnpm add google-auth-library
```

2) OAuth service in AffinityBots (`services/googleOAuth.ts`):

```ts
import { OAuth2Client } from 'google-auth-library';

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getAuthorizationUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}
```

3) OAuth routes (`routes/auth/google.ts`):

```ts
import { Router } from 'express';
import { getAuthorizationUrl, getTokensFromCode } from '../../services/googleOAuth';

const router = Router();

router.get('/auth/google', (_req, res) => {
  res.redirect(getAuthorizationUrl());
});

router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Authorization code missing');
  try {
    const tokens = await getTokensFromCode(code as string);
    await db.user.update({
      where: { id: req.user.id },
      data: {
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null,
        googleTokenExpiry: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        googleScopes: tokens.scope || null,
      },
    });
    res.redirect('/dashboard?google=connected');
  } catch (e) {
    console.error('Google OAuth callback error', e);
    res.redirect('/dashboard?google=error');
  }
});

export default router;
```

4) MCP client service in AffinityBots (`services/googleDriveMCP.ts`):

```ts
interface MCPExecuteRequest {
  tool: string;
  arguments?: Record<string, any>;
  tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  };
}

const MCP_SERVER_URL = process.env.GOOGLE_DRIVE_MCP_URL || 'http://localhost:3002';

export async function executeGoogleDriveTool(
  userId: string,
  tool: string,
  args?: Record<string, any>
) {
  const tokens = await getValidTokens(userId);

  const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool,
      arguments: args || {},
      tokens: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
    } satisfies MCPExecuteRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `MCP server error (${response.status})`);
  }

  return response.json();
}
```

5) Example user routes in AffinityBots (`routes/api/drive.ts`):

```ts
import { Router } from 'express';
import { executeGoogleDriveTool } from '../../services/googleDriveMCP';
import { requireAuth } from '../../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/api/drive/files', async (req, res) => {
  try {
    const { pageSize = 10, folderId } = req.query;
    const result = await executeGoogleDriveTool(
      req.user.id,
      'list_files',
      { pageSize: Number(pageSize), folderId }
    );
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/api/drive/search', async (req, res) => {
  try {
    const { query, pageSize = 10 } = req.query;
    const result = await executeGoogleDriveTool(
      req.user.id,
      'search_files',
      { query, pageSize: Number(pageSize) }
    );
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/api/drive/files', async (req, res) => {
  try {
    const { name, content, mimeType, parentId } = req.body;
    const result = await executeGoogleDriveTool(
      req.user.id,
      'create_file',
      { name, content, mimeType, parentId }
    );
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

## Testing & Debugging

- MCP server health:
```bash
curl http://localhost:3002/health
```
- Verify OAuth: ensure tokens are stored after callback
- Common errors:
  - 401 from MCP: provide tokens in request body
  - Invalid/expired token: refresh using refresh_token
  - Connection refused: ensure MCP running on port 3002

## Summary for AI (AffinityBots IDE)
- AffinityBots handles all OAuth and token storage
- MCP server is stateless; requires tokens per request
- Call MCP at `http://localhost:3002/mcp/execute`
- Body must include: `tool`, optional `arguments`, and `tokens`
- Implement token refresh in AffinityBots before calling MCP
