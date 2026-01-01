import { getRedisConnection } from "../redis"

/**
 * IP-based rate limiting for public support chat
 * Prevents abuse by limiting messages per IP address
 */

const SUPPORT_RATE_LIMIT_PREFIX = "support_rate_limit:"
const SUPPORT_RATE_WINDOW = 600 // 10 minutes in seconds
const SUPPORT_RATE_LIMIT = 10 // 10 messages per window

/**
 * Check if a support chat request from the given IP is within rate limits
 * @param ip - Client IP address
 * @returns true if allowed, false if rate limit exceeded
 */
export async function checkSupportRateLimit(ip: string): Promise<boolean> {
	const redis = getRedisConnection()

	// Ensure Redis is connected
	if (redis.status !== "ready") {
		try {
			await redis.connect()
		} catch (error) {
			console.warn("Redis not available for support rate limiting, allowing request:", error)
			return true // Fail open - allow if Redis unavailable
		}
	}

	const key = `${SUPPORT_RATE_LIMIT_PREFIX}${ip}`

	try {
		// Increment counter
		const count = await redis.incr(key)

		// Set expiry on first request
		if (count === 1) {
			await redis.expire(key, SUPPORT_RATE_WINDOW)
		}

		// Check if within limit
		return count <= SUPPORT_RATE_LIMIT
	} catch (error) {
		console.error("Support rate limit check failed:", error)
		return true // Fail open - allow on error
	}
}

/**
 * Get remaining requests for an IP
 * @param ip - Client IP address
 * @returns Object with current count and limit info
 */
export async function getSupportRateLimitInfo(ip: string): Promise<{
	current: number
	limit: number
	remaining: number
	resetIn: number | null
}> {
	const redis = getRedisConnection()

	// Ensure Redis is connected
	if (redis.status !== "ready") {
		try {
			await redis.connect()
		} catch (error) {
			console.warn("Redis not available for rate limit info:", error)
			return { current: 0, limit: SUPPORT_RATE_LIMIT, remaining: SUPPORT_RATE_LIMIT, resetIn: null }
		}
	}

	const key = `${SUPPORT_RATE_LIMIT_PREFIX}${ip}`

	try {
		const [count, ttl] = await Promise.all([
			redis.get(key),
			redis.ttl(key)
		])

		const current = count ? parseInt(count, 10) : 0
		const remaining = Math.max(0, SUPPORT_RATE_LIMIT - current)

		return {
			current,
			limit: SUPPORT_RATE_LIMIT,
			remaining,
			resetIn: ttl > 0 ? ttl : null,
		}
	} catch (error) {
		console.error("Failed to get support rate limit info:", error)
		return { current: 0, limit: SUPPORT_RATE_LIMIT, remaining: SUPPORT_RATE_LIMIT, resetIn: null }
	}
}
