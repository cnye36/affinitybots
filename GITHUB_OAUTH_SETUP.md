# GitHub OAuth Setup for MCP Server

To use the GitHub MCP server with OAuth authentication, you need to configure your GitHub OAuth app credentials.

## 1. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `AffinityBots MCP Client` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/mcp/auth/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# GitHub OAuth for MCP Server
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## 3. OAuth Scopes

The GitHub OAuth app will request these scopes:
- `repo` - Full control of private repositories
- `read:org` - Read organization data
- `read:user` - Read user profile data

## 4. Production Setup

For production, update the OAuth app settings:
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/api/mcp/auth/callback`

And update the environment variables accordingly.

## 5. Testing

1. Restart your development server
2. Go to the Tools page
3. Click "Connect" on the GitHub card
4. You should be redirected to GitHub for authorization
5. After authorizing, you'll be redirected back and the server will be configured

## Troubleshooting

- **"GitHub OAuth credentials not configured"**: Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in your environment
- **"Incompatible auth server"**: This error should be resolved with the new GitHub-specific OAuth client
- **Callback URL mismatch**: Ensure the callback URL in your GitHub OAuth app matches exactly
