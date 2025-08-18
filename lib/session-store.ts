import { MCPOAuthClient } from "./oauth-client";
import { GitHubOAuthClient } from "./github-oauth-client";

// Simple in-memory session store for demo purposes
// In production, use Redis, database, or proper session management
class SessionStore {
  private clients = new Map<string, MCPOAuthClient | GitHubOAuthClient>();

  setClient(sessionId: string, client: MCPOAuthClient | GitHubOAuthClient) {
    this.clients.set(sessionId, client);
  }

  getClient(sessionId: string): MCPOAuthClient | GitHubOAuthClient | null {
    return this.clients.get(sessionId) || null;
  }

  removeClient(sessionId: string) {
    const client = this.clients.get(sessionId);
    if (client) {
      if ('disconnect' in client) {
        client.disconnect();
      }
      this.clients.delete(sessionId);
    }
  }

  generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const sessionStore = new SessionStore();