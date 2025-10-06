# Workflow Scheduler - Quick Start Guide 🚀

Your workflow scheduling system is now set up! This guide will help you get started.

## ✅ What Was Implemented

**Core Infrastructure:**
- ✅ BullMQ-based job queue using existing Redis
- ✅ Background worker process for executing scheduled workflows
- ✅ Database tables for schedule tracking and execution history
- ✅ API endpoints for schedule management
- ✅ Docker Compose integration for production deployment
- ✅ Comprehensive error handling and retry logic

**Features:**
- ✅ Cron-based scheduling with timezone support
- ✅ Automatic retries (3 attempts with exponential backoff)
- ✅ Execution history and statistics
- ✅ Pause/resume schedules
- ✅ Graceful shutdown handling
- ✅ Redis persistence (AOF enabled)

## 🎯 Quick Start (Development)

### 1. Apply Database Migration

```bash
# Apply the new migration to add scheduling tables
# You should run this against your Supabase database
# The migration file is at: supabase/migrations/20250930000000_add_workflow_scheduling.sql
```

### 2. Start Redis (if not already running)

```bash
# Option 1: Using Docker Compose
docker-compose up langgraph-redis -d

# Option 2: Local Redis
redis-server
```

### 3. Start the Scheduler Worker

```bash
# In a new terminal window
pnpm run schedule:worker:dev
```

You should see:
```
🚀 Starting Workflow Scheduler Worker
✅ Redis connected
✅ Scheduler worker ready
🔄 Syncing schedules from database...
✅ Schedule sync complete
```

### 4. Start Your Next.js App

```bash
# In your main terminal
pnpm run dev
```

## 📝 Testing the Scheduler

### Test 1: Register a Schedule via API

```bash
# First, get your triggerId and workflowId from the database
# Then register a schedule (runs every minute for testing):

curl -X POST http://localhost:3000/api/scheduler/register \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "triggerId": "your-trigger-uuid",
    "workflowId": "your-workflow-uuid",
    "cronExpression": "* * * * *",
    "timezone": "UTC",
    "enabled": true
  }'
```

### Test 2: Create a Schedule in the UI

1. Go to Workflow Builder
2. Add a Schedule trigger
3. Configure cron expression: `*/5 * * * *` (every 5 minutes)
4. Set timezone (e.g., "America/Los_Angeles")
5. Save the trigger

The worker should automatically pick it up!

### Test 3: View Execution History

```bash
curl "http://localhost:3000/api/scheduler/history?triggerId=your-trigger-uuid"
```

## 🐳 Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and start all services (including the new schedule-worker)
docker-compose up -d

# Check worker status
docker-compose logs -f schedule-worker

# Scale workers if needed
docker-compose up -d --scale schedule-worker=3
```

### Option 2: Manual Deployment

```bash
# Terminal 1: Start your app
pnpm run build
pnpm run start

# Terminal 2: Start the scheduler worker
pnpm run schedule:worker
```

### Important: Set Environment Variables

```bash
# .env or environment variables
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Important for worker to call API
INTERNAL_API_SECRET=your-secure-random-secret  # REQUIRED: Allows worker to execute workflows

# Generate a secure secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔍 Monitoring

### Check Redis Queue

```bash
# Connect to Redis
docker-compose exec langgraph-redis redis-cli

# List all scheduler keys
KEYS "bull:scheduler:*"

# View job details
HGETALL "bull:scheduler:workflow-schedules:schedule:your-trigger-id"

# Count jobs in queue
LLEN "bull:scheduler:workflow-schedules:wait"
```

### Check Execution History in Database

```sql
-- Recent executions
SELECT 
  trigger_id,
  workflow_id,
  scheduled_at,
  executed_at,
  status,
  duration_ms,
  error
FROM workflow_schedule_executions
ORDER BY executed_at DESC
LIMIT 20;

-- Success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM workflow_schedule_executions
GROUP BY status;
```

## 🎨 Next Steps: UI Integration

The backend is complete! Now you can enhance the UI to show:

### In TriggerConfigModal:
- ⏭️ Show next scheduled run time
- 📊 Display execution history chart
- ⏸️ Add pause/resume buttons
- 🔔 Show status badges (active, paused, failed)

### In Workflow Builder:
- 📅 Show schedule status on trigger nodes
- 🕐 Display "Next run: 2 hours from now"
- 📈 Quick stats: "95% success rate, 100 executions"

### Example UI Enhancement:

```typescript
// components/workflows/triggers/TriggerConfigModal.tsx

// Add state for schedule info
const [scheduleInfo, setScheduleInfo] = useState(null);

// Fetch schedule info when modal opens
useEffect(() => {
  if (type === 'schedule' && triggerId) {
    fetch(`/api/scheduler/history?triggerId=${triggerId}&limit=10`)
      .then(res => res.json())
      .then(data => setScheduleInfo(data));
  }
}, [type, triggerId]);

// Display in UI
{scheduleInfo && (
  <div className="schedule-info">
    <p>Success Rate: {scheduleInfo.stats.successRate}%</p>
    <p>Total Executions: {scheduleInfo.stats.total}</p>
    <p>Avg Duration: {scheduleInfo.stats.avgDurationMs}ms</p>
  </div>
)}
```

## 🐛 Troubleshooting

### Worker not starting?

```bash
# Check Redis connection
docker-compose ps langgraph-redis

# Check worker logs
docker-compose logs schedule-worker

# Restart worker
docker-compose restart schedule-worker
```

### Schedules not executing?

```bash
# 1. Check if worker is processing jobs
docker-compose logs -f schedule-worker

# 2. Verify schedule is registered
docker-compose exec langgraph-redis redis-cli KEYS "bull:scheduler:*"

# 3. Check trigger is active in database
# SQL: SELECT * FROM workflow_triggers WHERE trigger_type = 'schedule' AND is_active = true;

# 4. Manually sync schedules from database
# The worker does this on startup, but you can trigger it via API if needed
```

### Redis running out of memory?

```bash
# Check memory usage
docker-compose exec langgraph-redis redis-cli INFO memory

# Clean old completed jobs (they auto-clean after 7 days)
# Or adjust retention in lib/scheduler/scheduler.ts:
removeOnComplete: {
  age: 3 * 24 * 3600,  # Keep for 3 days instead of 7
  count: 500,          # Keep last 500 instead of 1000
}
```

## 📚 Documentation

For detailed documentation, see:
- `docs/WORKFLOW_SCHEDULING.md` - Complete system documentation
- `lib/scheduler/scheduler.ts` - Scheduler API reference
- `lib/scheduler/worker.ts` - Worker implementation details

## 🎯 Architecture Summary

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Redis     │◀────│ Worker Process  │
│  (UI + API)     │     │   (BullMQ)   │     │  (Executes      │
│                 │     │              │     │   Workflows)    │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                             │
         │                                             │
         ▼                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  - workflow_triggers (schedule config)                      │
│  - workflow_schedule_executions (history)                   │
│  - workflow_runs (execution results)                        │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Key Benefits

1. **Reliable:** BullMQ ensures jobs aren't lost, even if worker crashes
2. **Scalable:** Add more workers without code changes
3. **Observable:** Full execution history and statistics
4. **Resilient:** Auto-retry with exponential backoff
5. **Efficient:** Shares Redis with LangGraph (no extra infrastructure)
6. **Production-Ready:** Graceful shutdown, error handling, persistence

## 🚀 Ready to Go!

Your workflow scheduling system is now fully operational. Users can create scheduled workflows, and they'll execute automatically via the background worker.

**Next Priority:** Enhance the UI to show schedule status and execution history in the TriggerConfigModal and WorkflowBuilder.

Questions? Check `docs/WORKFLOW_SCHEDULING.md` or the inline code comments!

