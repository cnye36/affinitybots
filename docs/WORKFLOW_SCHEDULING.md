# Workflow Scheduling System

This document describes the workflow scheduling system that enables automatic execution of workflows on a cron schedule using BullMQ and Redis.

## Architecture Overview

The scheduling system consists of three main components:

### 1. **Scheduler Service** (`lib/scheduler/scheduler.ts`)
- Manages schedule registration, updates, and removal
- Uses BullMQ for reliable distributed job scheduling
- Stores schedule metadata in Supabase
- Shares Redis instance with LangGraph (namespace: `bull:scheduler:`)

### 2. **Worker Process** (`lib/scheduler/worker.ts`)
- Background process that executes scheduled workflows
- Listens to BullMQ queue for due jobs
- Calls workflow execution API endpoint
- Logs execution history and handles retries

### 3. **API Endpoints** (`app/api/scheduler/*`)
- `/api/scheduler/register` - Register/update schedules
- `/api/scheduler/unregister` - Remove schedules
- `/api/scheduler/pause` - Pause/resume schedules
- `/api/scheduler/history` - View execution history

## Database Schema

### `workflow_triggers` (extended)
```sql
- next_run_at: TIMESTAMPTZ          -- Next scheduled execution
- schedule_enabled: BOOLEAN          -- Whether schedule is active
- schedule_metadata: JSONB           -- Timezone, cron, etc.
```

### `workflow_schedule_executions` (new)
```sql
- execution_id: UUID                 -- Unique execution ID
- trigger_id: UUID                   -- FK to workflow_triggers
- workflow_id: UUID                  -- FK to workflows
- scheduled_at: TIMESTAMPTZ          -- When it was supposed to run
- executed_at: TIMESTAMPTZ           -- When it actually ran
- status: TEXT                       -- success, failed, skipped
- error: TEXT                        -- Error message if failed
- run_id: UUID                       -- FK to workflow_runs
- duration_ms: INTEGER               -- Execution duration
- metadata: JSONB                    -- Additional info
```

## Setup & Deployment

### Development Setup

1. **Ensure Redis is running:**
   ```bash
   # Option 1: Docker
   docker-compose up langgraph-redis
   
   # Option 2: Local Redis
   redis-server
   ```

2. **Run database migrations:**
   ```bash
   # Apply the scheduling migration
   # This adds new columns and tables for scheduling
   ```

3. **Start the scheduler worker:**
   ```bash
   # In a separate terminal
   pnpm run schedule:worker:dev
   ```

4. **Start your Next.js app:**
   ```bash
   pnpm run dev
   ```

### Production Deployment

#### Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up -d

# Services:
# - langgraph-redis: Redis with AOF persistence
# - langgraph-api: LangGraph Platform API
# - schedule-worker: Scheduler worker process (NEW)
```

#### Manual Deployment
```bash
# 1. Build the application
pnpm run build

# 2. Start the Next.js server
pnpm run start

# 3. Start the scheduler worker (separate process)
pnpm run schedule:worker
```

#### Environment Variables
```bash
# Required
REDIS_URL=redis://localhost:6379     # Redis connection
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Your app URL

# Optional
INTERNAL_API_SECRET=your-secret      # For secure internal API calls
```

## Usage Guide

### Creating a Scheduled Workflow

#### 1. Via UI (TriggerConfigModal)
```typescript
// User selects "Schedule" trigger type
// Enters cron expression: "0 9 * * 1-5" (weekdays at 9 AM)
// Selects timezone: "America/Los_Angeles"
// Clicks "Save"
```

#### 2. Via API
```typescript
// Register a schedule
const response = await fetch('/api/scheduler/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    triggerId: 'trigger-uuid',
    workflowId: 'workflow-uuid',
    cronExpression: '0 9 * * 1-5',
    timezone: 'America/Los_Angeles',
    enabled: true,
  }),
});
```

### Cron Expression Examples

```bash
# Every minute
* * * * *

# Every 15 minutes
*/15 * * * *

# Daily at 9 AM
0 9 * * *

# Weekdays at 4 PM
0 16 * * 1-5

# Every Thursday at 4 PM
0 16 * * 4

# First day of month at midnight
0 0 1 * *

# Every hour during business hours (9 AM - 5 PM, weekdays)
0 9-17 * * 1-5
```

Use [crontab.guru](https://crontab.guru/) for testing expressions.

### Managing Schedules

#### Pause a Schedule
```typescript
await fetch('/api/scheduler/pause', {
  method: 'POST',
  body: JSON.stringify({
    triggerId: 'trigger-uuid',
    action: 'pause',
  }),
});
```

#### Resume a Schedule
```typescript
await fetch('/api/scheduler/pause', {
  method: 'POST',
  body: JSON.stringify({
    triggerId: 'trigger-uuid',
    action: 'resume',
  }),
});
```

#### View Execution History
```typescript
const response = await fetch(
  '/api/scheduler/history?triggerId=trigger-uuid&limit=50'
);
const { executions, stats } = await response.json();

// stats: { total, successful, failed, skipped, successRate, avgDurationMs }
```

## Monitoring & Troubleshooting

### Health Check
```bash
# Check worker logs
docker-compose logs -f schedule-worker

# Expected output:
# ✅ Scheduler worker ready
# ✅ Schedule registered for trigger xxx
# 🚀 Executing scheduled workflow: {...}
# ✅ Workflow executed successfully
```

### Common Issues

#### 1. Worker not executing jobs
```bash
# Check if worker is running
docker-compose ps schedule-worker

# Check Redis connection
docker-compose exec langgraph-redis redis-cli ping
# Expected: PONG

# Check BullMQ queue
docker-compose exec langgraph-redis redis-cli KEYS "bull:scheduler:*"
```

#### 2. Schedules not triggering
```sql
-- Check schedule configuration in database
SELECT trigger_id, workflow_id, next_run_at, schedule_enabled, config
FROM workflow_triggers
WHERE trigger_type = 'schedule' AND is_active = true;

-- Check recent executions
SELECT * FROM workflow_schedule_executions
ORDER BY executed_at DESC
LIMIT 10;
```

#### 3. Redis memory issues
```bash
# Check Redis memory usage
docker-compose exec langgraph-redis redis-cli INFO memory

# Clean old jobs (if needed)
docker-compose exec langgraph-redis redis-cli --scan --pattern "bull:scheduler:*" | xargs redis-cli DEL
```

### Logs & Debugging

Enable detailed logging:
```bash
# Worker logs
pnpm run schedule:worker:dev  # Development mode with verbose logging

# View BullMQ job details
docker-compose exec langgraph-redis redis-cli HGETALL "bull:scheduler:workflow-schedules:1"
```

## Scaling Considerations

### Single Worker (Current)
- **Capacity:** Up to 1,000 active schedules
- **Concurrency:** 5 workflows at a time
- **Rate Limit:** 10 jobs per second
- **Suitable for:** Most use cases

### Multiple Workers (Future)
```bash
# Scale to 3 workers
docker-compose up -d --scale schedule-worker=3

# BullMQ automatically distributes jobs across workers
# No code changes needed!
```

### Performance Tuning

#### Adjust worker concurrency:
```typescript
// lib/scheduler/worker.ts
const workerOptions: WorkerOptions = {
  concurrency: 10,  // Increase from 5 to 10
  limiter: {
    max: 20,  // Increase from 10 to 20
    duration: 1000,
  },
};
```

#### Adjust job retention:
```typescript
// lib/scheduler/scheduler.ts
removeOnComplete: {
  age: 3 * 24 * 3600,  // Reduce from 7 to 3 days
  count: 500,          // Reduce from 1000 to 500
},
```

## Features

### ✅ Implemented
- Cron-based scheduling
- Timezone support
- Distributed execution via BullMQ
- Automatic retries (3 attempts with exponential backoff)
- Execution history and statistics
- Pause/resume schedules
- Graceful shutdown
- Redis persistence (AOF)

### 🔜 Coming Soon
- UI for viewing execution history
- Email notifications on failures
- Schedule templates (daily, weekly, etc.)
- Execution windows (business hours only)
- Concurrency limits per user/workflow
- Schedule validation and testing

## API Reference

### POST /api/scheduler/register
Register or update a workflow schedule.

**Request:**
```json
{
  "triggerId": "uuid",
  "workflowId": "uuid",
  "cronExpression": "0 9 * * *",
  "timezone": "America/Los_Angeles",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule registered successfully"
}
```

### POST /api/scheduler/unregister
Remove a workflow schedule.

**Request:**
```json
{
  "triggerId": "uuid"
}
```

### POST /api/scheduler/pause
Pause or resume a schedule.

**Request:**
```json
{
  "triggerId": "uuid",
  "action": "pause" // or "resume"
}
```

### GET /api/scheduler/history
Get execution history for a schedule.

**Query Parameters:**
- `triggerId` (required): UUID of the trigger
- `limit` (optional): Number of executions to return (default: 50)

**Response:**
```json
{
  "executions": [...],
  "stats": {
    "total": 100,
    "successful": 95,
    "failed": 3,
    "skipped": 2,
    "successRate": 95.0,
    "avgDurationMs": 2500
  }
}
```

## Security Considerations

1. **Authentication:** All API endpoints require user authentication
2. **Authorization:** Users can only manage schedules for their own workflows
3. **Rate Limiting:** Workflow execution respects existing rate limits
4. **Internal API:** Worker uses internal API for secure workflow execution
5. **Redis Isolation:** Scheduler uses dedicated namespace (`bull:scheduler:`)

## Best Practices

1. **Use timezone-aware schedules:** Always specify timezone to avoid DST issues
2. **Monitor execution history:** Check for failed executions regularly
3. **Set up alerts:** Configure notifications for repeated failures
4. **Test cron expressions:** Use crontab.guru before deploying
5. **Keep Redis persistent:** Enable AOF or RDB snapshots
6. **Scale workers as needed:** Monitor queue depth and latency
7. **Clean up old schedules:** Remove schedules for deleted workflows

## Support

For issues or questions:
1. Check worker logs: `docker-compose logs schedule-worker`
2. Check execution history in database
3. Verify Redis connection and BullMQ queue
4. Review this documentation

