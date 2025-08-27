# Rate Limiting System

This document describes the rate limiting system implemented for the beta test to cap user interactions at approximately $2.00 per day based on GPT-5 pricing.

## Overview

The rate limiting system uses Redis to track user token usage and enforces a daily spending limit. Users see a progress bar that fills up as they use their "credits" without knowing the actual dollar amounts.

## Configuration

### Daily Limits
- **Daily spending limit**: $2.00 per user
- **Input token cost**: $1.25 per 1M tokens (GPT-5 pricing)
- **Output token cost**: $10.00 per 1M tokens (GPT-5 pricing)
- **Reset time**: 00:00 UTC daily (24-hour interval)

### Environment Variables
```bash
# Required
REDIS_URL=redis://localhost:6379  # Redis connection URL (uses existing LangGraph Redis)
LANGSMITH_API_KEY=your_key        # LangSmith API key
LANGGRAPH_API_URL=your_url        # LangGraph API URL

# Optional
ADMIN_API_TOKEN=your_token        # Token for admin API access
```

**Note**: The rate limiting system uses the same Redis instance as LangGraph but stores data in database 1 to avoid conflicts.

## Components

### Backend
- `lib/rateLimiting.ts` - Core rate limiting logic with Redis
- `lib/agent/reactAgent.ts` - Integration with LangGraph agent
- `app/api/rate-limit/route.ts` - API endpoint for checking usage
- `app/api/admin/rate-limit/route.ts` - Admin API for managing limits

### Frontend
- `hooks/useRateLimit.ts` - React hook for rate limiting state (listens for `rate-limit:updated` event to refresh without polling)
- `components/RateLimitProgress.tsx` - Progress bar component
- `components/layout/nav-user.tsx` - Integration in navigation

## User Experience

### Progress Bar
- Located in the lower left corner of the navigation
- Shows usage progress without revealing dollar amounts
- Color changes: Blue (normal) → Yellow (near limit) → Red (exceeded)

### Out of Credits Dialog
When users run out of credits, they see a dialog with:
1. **Wait for Reset**: Shows time until reset (PST timezone)
2. **Use Your Own API Key**: Option to add personal API key for unlimited usage

## API Endpoints

### Check Usage
```http
GET /api/rate-limit?userId=user_id
```

### Check Rate Limit
```http
POST /api/rate-limit
{
  "userId": "user_id",
  "inputTokens": 1000,
  "outputTokens": 500
}
```

### Admin Endpoints
```http
# Get all users usage
GET /api/admin/rate-limit?action=all-users

# Cleanup old records
GET /api/admin/rate-limit?action=cleanup&days=7

# Reset user usage
POST /api/admin/rate-limit
{
  "action": "reset-user",
  "userId": "user_id",
  "date": "2024-01-01" // optional
}
```

## Setup

1. **Install dependencies**:
   ```bash
   pnpm add redis ioredis
   ```

2. **Set up Redis environment** (uses existing LangGraph Redis):
   ```bash
   pnpm setup:redis
   ```

3. **Test the connection**:
   ```bash
   pnpm setup:rate-limit
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

**Note**: This setup uses your existing LangGraph Redis container. Rate limiting data is stored in database 1, while LangGraph uses database 0.

## Monitoring

### Admin Panel
Use the admin API endpoints to monitor usage:
- View all users' daily usage
- Reset user limits if needed
- Clean up old records

### Logs
The system logs usage information:
```
📊 Rate limit usage recorded for user_id: {
  inputTokens: 1000,
  outputTokens: 500,
  cost: 0.00625,
  dailyTotal: 1.25,
  remainingBudget: 0.75
}
```

## Future Enhancements

1. **API Key Integration**: Allow users to add their own OpenAI API keys
2. **Usage Analytics**: Dashboard for viewing usage patterns
3. **Tiered Limits**: Different limits for different user tiers
4. **Notifications**: Email/SMS alerts when approaching limits
5. **Billing Integration**: Connect with Stripe for paid plans

## Troubleshooting

### Redis Connection Issues
- Check `REDIS_URL` environment variable
- Ensure Redis server is running
- Test connection with `redis-cli ping`

### Rate Limiting Not Working
- Check browser console for errors
- Verify user ID is being passed correctly
- Check Redis logs for connection issues

### Performance Issues
- Monitor Redis memory usage
- Consider Redis clustering for high traffic
- Implement caching for frequently accessed data
