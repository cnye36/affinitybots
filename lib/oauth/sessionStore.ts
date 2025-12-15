import { MCPOAuthClient, OAuthTokens } from "./oauthClient"
import { GitHubOAuthClient } from "./githubOauthClient"
import Redis from "ioredis"
import crypto from "crypto"

interface SerializedClientState {
	tokens?: OAuthTokens
	expiry?: string
	providerState?: any
	serverUrl: string
	callbackUrl: string
	clientType: "github" | "mcp"
}

interface OAuthStateData {
	sessionId: string
	userId: string
	serverName: string
	serverUrl: string
	expiresAt: number
}

class SessionStore {
	private redis: Redis | null = null
	private inMemoryCache = new Map<string, MCPOAuthClient | GitHubOAuthClient>()
	private redisAvailable = false

	constructor() {
		// Use OAUTH_REDIS_URL first, fall back to RATE_LIMIT_REDIS_URL, then REDIS_URL
		const redisUrl = process.env.OAUTH_REDIS_URL || process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL

		if (!redisUrl) {
			console.warn("⚠️  No Redis URL configured for OAuth session store")
			console.warn("⚠️  Using in-memory session store (NOT PRODUCTION SAFE)")
			console.warn("⚠️  Sessions will be lost on server restart/redeploy")
			console.warn("⚠️  Set OAUTH_REDIS_URL, RATE_LIMIT_REDIS_URL, or REDIS_URL to enable Redis")
		} else {
			try {
				this.redis = new Redis(redisUrl, {
					maxRetriesPerRequest: 3,
					retryStrategy: (times) => {
						if (times > 3) {
							console.error("❌ Redis connection failed after 3 retries, falling back to in-memory store")
							return null
						}
						return Math.min(times * 100, 3000)
					},
					lazyConnect: true, // Don't connect immediately
				})

				// Test connection
				this.redis.connect().then(() => {
					this.redisAvailable = true
					console.log("✅ OAuth session store connected to Redis")
				}).catch((error) => {
					console.error("❌ Failed to connect to Redis:", error)
					console.warn("⚠️  Falling back to in-memory session store")
					this.redis = null
				})

				this.redis.on("error", (error) => {
					console.error("Redis error:", error)
					this.redisAvailable = false
				})

				this.redis.on("connect", () => {
					this.redisAvailable = true
				})
			} catch (error) {
				console.error("Failed to initialize Redis:", error)
				console.warn("⚠️  Falling back to in-memory session store")
				this.redis = null
			}
		}
	}

	async setClient(sessionId: string, client: MCPOAuthClient | GitHubOAuthClient): Promise<void> {
		// Always store in memory for fast access
		this.inMemoryCache.set(sessionId, client)

		// Also persist to Redis if available
		if (this.redis && this.redisAvailable) {
			try {
				const state: SerializedClientState = {
					tokens: client.getTokens(),
					expiry: client.getTokenExpiry(),
					providerState: (client as any).getProviderState?.(),
					serverUrl: (client as any).serverUrl,
					callbackUrl: (client as any).callbackUrl,
					clientType: client instanceof GitHubOAuthClient ? "github" : "mcp",
				}

				await this.redis.setex(
					`oauth:session:${sessionId}`,
					3600, // 1 hour TTL
					JSON.stringify(state)
				)
			} catch (error) {
				console.error("Failed to store session in Redis:", error)
				// Don't throw - in-memory is still valid
			}
		}
	}

	async getClient(sessionId: string): Promise<MCPOAuthClient | GitHubOAuthClient | null> {
		// Check in-memory cache first
		if (this.inMemoryCache.has(sessionId)) {
			return this.inMemoryCache.get(sessionId)!
		}

		// Attempt Redis retrieval and rehydration
		if (this.redis && this.redisAvailable) {
			try {
				const stateJson = await this.redis.get(`oauth:session:${sessionId}`)
				if (stateJson) {
					const state: SerializedClientState = JSON.parse(stateJson)

					// Rehydrate client from state
					let client: MCPOAuthClient | GitHubOAuthClient

					if (state.clientType === "github") {
						client = new GitHubOAuthClient(state.serverUrl, state.callbackUrl, () => {})
					} else {
						client = new MCPOAuthClient(state.serverUrl, state.callbackUrl, () => {})

						// Restore provider state for MCP
						if (state.providerState && (client as any).prepareWithState) {
							(client as any).prepareWithState(state.providerState)
						}
					}

					// Restore tokens if available
					if (state.tokens) {
						await client.connectWithStoredSession({
							tokens: state.tokens,
							expiresAt: state.expiry,
							providerState: state.providerState,
						})
					}

					// Cache in memory
					this.inMemoryCache.set(sessionId, client)
					return client
				}
			} catch (error) {
				console.error("Failed to retrieve session from Redis:", error)
				// Fall through to return null
			}
		}

		return null
	}

	async removeClient(sessionId: string): Promise<void> {
		// Remove from memory
		const client = this.inMemoryCache.get(sessionId)
		if (client && "disconnect" in client) {
			try {
				client.disconnect()
			} catch (error) {
				console.error("Error disconnecting client:", error)
			}
		}
		this.inMemoryCache.delete(sessionId)

		// Remove from Redis
		if (this.redis && this.redisAvailable) {
			try {
				await this.redis.del(`oauth:session:${sessionId}`)
			} catch (error) {
				console.error("Failed to remove session from Redis:", error)
			}
		}
	}

	generateSessionId(): string {
		// Use cryptographically secure random bytes instead of Math.random()
		return crypto.randomBytes(32).toString("hex")
	}

	// CSRF state parameter management
	async setOAuthState(state: string, data: OAuthStateData): Promise<void> {
		if (this.redis && this.redisAvailable) {
			try {
				const ttl = Math.max(1, Math.ceil((data.expiresAt - Date.now()) / 1000))
				await this.redis.setex(
					`oauth:state:${state}`,
					ttl,
					JSON.stringify(data)
				)
			} catch (error) {
				console.error("Failed to store OAuth state in Redis:", error)
				throw new Error("Failed to initialize OAuth flow")
			}
		} else {
			// In-memory fallback for CSRF state (not ideal but better than nothing)
			this.inMemoryCache.set(`state:${state}`, data as any)
		}
	}

	async getOAuthState(state: string): Promise<OAuthStateData | null> {
		if (this.redis && this.redisAvailable) {
			try {
				const stateJson = await this.redis.get(`oauth:state:${state}`)
				if (stateJson) {
					return JSON.parse(stateJson)
				}
			} catch (error) {
				console.error("Failed to retrieve OAuth state from Redis:", error)
			}
		} else {
			// Check in-memory fallback
			const data = this.inMemoryCache.get(`state:${state}`)
			return data ? (data as any) : null
		}

		return null
	}

	async deleteOAuthState(state: string): Promise<void> {
		if (this.redis && this.redisAvailable) {
			try {
				await this.redis.del(`oauth:state:${state}`)
			} catch (error) {
				console.error("Failed to delete OAuth state from Redis:", error)
			}
		} else {
			this.inMemoryCache.delete(`state:${state}`)
		}
	}

	// Health check
	async isRedisAvailable(): Promise<boolean> {
		if (!this.redis) return false

		try {
			await this.redis.ping()
			return true
		} catch {
			return false
		}
	}
}

export const sessionStore = new SessionStore()
