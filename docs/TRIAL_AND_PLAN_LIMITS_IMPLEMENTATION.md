# Trial and Plan Limits Implementation

## Overview

This document describes the implementation of the trial period and plan limitation system for AgentHub. The system ensures users get appropriate access levels during and after their trial period, with automatic enforcement of plan limits.

## Plan Structure

### Trial Period
- **Duration**: 14 days (one-time only per email/user account)
- **Access Level**: PRO plan limits (regardless of selected plan)
- **Cancellation**: Users can cancel anytime during trial and keep access until day 14
- **After Cancellation**: If user cancels during trial, they retain full access until the 14th day
- **After Trial Ends**: Users MUST select and pay for a plan to continue accessing the app
- **Limits During Trial**:
  - 50 agents
  - 25 active workflows
  - $100 AI usage budget

### Starter Plan ($19.99/month)
After trial ends for Starter plan users:
- **Agents**: 10 total (first 10 created are accessible)
- **Active Workflows**: 5 maximum (first 5 activated remain active)
- **Draft Workflows**: Unlimited
- **AI Usage Budget**: $25/month

### Pro Plan ($39.99/month)
After trial ends for Pro plan users:
- **Agents**: 50 total
- **Active Workflows**: 25 maximum
- **Draft Workflows**: Unlimited
- **AI Usage Budget**: $100/month

## Key Implementation Details

### 1. Trial Period Behavior

**File**: `lib/subscription/usage.ts:65-111`

The `getUserPlanType()` function returns "pro" for any user with `status: "trialing"` and a valid `trial_end` date in the future. This ensures all trial users get PRO plan limits regardless of which plan they selected at signup.

```typescript
// During trial, all users get pro limits
if (subscription.status === "trialing" && subscription.trial_end) {
  const trialEnd = new Date(subscription.trial_end)
  if (trialEnd > new Date()) {
    return "pro" // Give them pro limits during trial
  }
}
```

### 2. Agent Accessibility

**File**: `lib/subscription/usage.ts:465-513`

Agents are made accessible based on creation order. For Starter plan users (after trial), only the first 10 agents created remain accessible.

**Key Functions**:
- `getAccessibleAgentIds(userId)` - Returns array of accessible agent IDs or null (all accessible)
- `isAgentAccessible(userId, agentId)` - Checks if a specific agent is accessible

**Database Query**:
```typescript
const { data } = await supabase
  .from("user_assistants")
  .select("assistant_id")
  .eq("user_id", userId)
  .order("created_at", { ascending: true }) // First created first
  .limit(limits.maxAgents)
```

The `user_assistants` table tracks creation order via the `created_at` timestamp, which is automatically set when an agent is created.

### 3. Workflow Activation Limits

**File**: `lib/subscription/usage.ts:515-602`

Workflows are considered "active" when they have at least one active trigger. The system tracks which workflows were activated first to enforce the "first 5 activated" rule for Starter plan users.

**Database Schema**: `supabase/migrations/20251230000000_add_workflow_activated_at.sql`

Added `activated_at` timestamp to the `workflows` table to track when a workflow was first activated.

**Key Functions**:
- `getWorkflowsToDeactivate(userId)` - Returns workflow IDs that exceed the plan limit
- `enforcePlanLimits(userId)` - Automatically deactivates excess workflows and returns lists of affected resources

**Database Trigger**:
A PostgreSQL trigger function `update_workflow_activation_status()` automatically:
1. Sets `workflows.activated_at` when a workflow gets its first active trigger
2. Sets `workflows.is_active = true` when any trigger becomes active
3. Sets `workflows.is_active = false` when the last active trigger is deactivated

### 4. Automatic Limit Enforcement

**File**: `app/api/stripe/webhook/route.ts:165-176`

When a Stripe subscription status changes from "trialing" to "active" (trial ended), the system automatically calls `enforcePlanLimits()`:

```typescript
if (wasTrialing && isNowActive) {
  const result = await enforcePlanLimits(existing.user_id)
  // Logs: deactivatedWorkflows count, inaccessibleAgents count
}
```

This ensures that:
- Workflows beyond the plan limit are automatically deactivated
- Agents beyond the plan limit become inaccessible (not deleted)
- Users are smoothly transitioned from trial to their selected plan

### 5. User Experience

**For Agents**:
- Agents beyond the limit are NOT deleted
- They are simply marked as "inaccessible" based on creation order
- Users can delete newer agents to make room for older ones if desired
- Frontend should gray out/disable inaccessible agents

**For Workflows**:
- Workflows beyond the limit are automatically deactivated (set to "paused" status)
- Users can see all their workflows (both active and inactive)
- Users can deactivate any active workflow to make room for others
- Only 5 (Starter) or 25 (Pro) workflows can be active simultaneously

## Migration Steps

To apply these changes to an existing database:

1. **Run the database migration**:
   ```bash
   # Apply the migration to add activated_at column and triggers
   supabase migration up
   ```

2. **Existing data handling**:
   - Existing active workflows will have their `activated_at` set to `COALESCE(last_run_at, created_at)`
   - This preserves approximate activation order for existing workflows

3. **No immediate user impact**:
   - Trial users continue to have PRO limits
   - Active paid users are unaffected
   - Limits only enforce when trial ends or user downgrades

## Frontend Integration Points

To fully implement this system, the frontend needs to:

1. **Agent List** (`app/(app)/agents/page.tsx`):
   - Call `getAccessibleAgentIds(userId)` to get accessible agents
   - Gray out/disable agents not in the accessible list
   - Show upgrade prompt for inaccessible agents
   - Display "X of Y agents used" with plan limits

2. **Workflow List** (`app/(app)/workflows/page.tsx`):
   - Display active workflow count vs limit
   - Show which workflows are active/paused
   - Prevent activation if limit reached (show upgrade prompt)
   - Allow deactivation of any active workflow

3. **Agent Detail Pages**:
   - Check `isAgentAccessible(userId, agentId)` before allowing usage
   - Show "Upgrade to access this agent" message for inaccessible agents

4. **Settings/Billing Page**:
   - Display current plan limits
   - Show trial end date if applicable
   - Show usage statistics (agents, workflows, AI budget)

## Trial Cancellation and Access Control

### How Trial Cancellation Works

**File**: `supabase/middleware.ts:122-157`

When a user cancels their subscription during the trial period:

1. **Stripe Behavior**:
   - Sets `cancel_at_period_end = true` in the subscription
   - Keeps `status = "trialing"` until `trial_end` date
   - Fires `customer.subscription.deleted` webhook when trial expires

2. **Our System**:
   - Middleware checks: `status === 'trialing' && trial_end > now()`
   - User retains full PRO access until day 14
   - On day 14, when Stripe sends the deletion event, status changes to "canceled"
   - Middleware then blocks access and redirects to `/pricing`

3. **User Experience**:
   - Cancel anytime → keep using until day 14
   - Day 14 arrives → access blocked
   - Must choose a paid plan to regain access

### Duplicate Trial Prevention

**File**: `supabase/migrations/20251230000001_add_trial_tracking.sql`
**File**: `app/api/subscriptions/checkout/route.ts:43-59`

The system tracks whether a user has ever had a trial using the `had_trial` boolean column:

1. **New User Signup**:
   - Trigger `initialize_user_subscription()` creates subscription with `had_trial = true`
   - User gets 14-day trial automatically

2. **Checkout Flow**:
   - Checks `subscriptions.had_trial` for the user
   - If `had_trial = true`: creates Stripe checkout with `trialPeriodDays = 0` (no trial)
   - If `had_trial = false`: creates checkout with `trialPeriodDays = 14`

3. **Email Re-signup Protection**:
   - User IDs are tied to email addresses in Supabase Auth
   - Same email = same user_id = same subscription record
   - `had_trial` flag prevents multiple trials

### Access Blocking Middleware

**File**: `supabase/middleware.ts:122-157`

The middleware enforces subscription requirements on all app routes:

**Allowed Without Subscription**:
- Public routes: `/`, `/pricing`, `/features`, `/blog`, etc.
- Auth routes: `/auth/*`
- API routes: `/api/*` (handle their own auth)
- Payment routes: `/payment/*`
- Admin users (always allowed)

**Blocked Without Active Subscription**:
- Any app route (`/agents`, `/workflows`, `/dashboard`, etc.)
- Users with `status = "canceled"` or expired trials
- Redirects to `/pricing?reason=subscription_required`

**Access Granted For**:
- `status = "trialing"` with `trial_end > now()`
- `status = "active"` (paid subscription)
- `status = "past_due"` (payment failed but still allowed with warning)

## Testing Checklist

**Trial Behavior**:
- [ ] New user signs up → gets automatic 14-day trial with PRO limits
- [ ] User signs up for Starter plan → gets PRO limits during trial
- [ ] User signs up for Pro plan → gets PRO limits during trial
- [ ] User can access all app features during trial period

**Trial Cancellation**:
- [ ] User cancels on day 3 → still has access through day 14
- [ ] User cancels on day 10 → still has access through day 14
- [ ] Trial ends (day 14) → user immediately loses access
- [ ] User redirected to `/pricing` when trying to access app after trial
- [ ] User must select a paid plan to regain access

**Duplicate Trial Prevention**:
- [ ] User completes first trial → `had_trial = true` in database
- [ ] Same user tries to checkout again → gets no trial option
- [ ] User tries to sign up with same email → gets same subscription record
- [ ] User cannot get multiple free trials with same email

**Plan Limits Enforcement**:
- [ ] Trial ends for Starter user with 15 agents → only first 10 accessible
- [ ] Trial ends for Starter user with 8 active workflows → only first 5 stay active
- [ ] Trial ends for Pro user → no limits enforced (within Pro limits)
- [ ] User can deactivate/activate workflows within their limit

**Webhook Integration**:
- [ ] Webhook properly calls `enforcePlanLimits` when trial ends
- [ ] Database trigger correctly sets `activated_at` on first activation
- [ ] `getUserPlanType` returns "pro" during trial, actual plan after
- [ ] Stripe subscription update sets `had_trial = true`

**Access Control**:
- [ ] Middleware blocks users with expired trials from accessing `/agents`
- [ ] Middleware blocks users with expired trials from accessing `/workflows`
- [ ] Middleware allows access to `/pricing` for expired trial users
- [ ] Middleware allows admins to access everything regardless of subscription

## Code References

**Core Files**:
- `lib/subscription/limits.ts` - Plan limits configuration
- `lib/subscription/usage.ts` - Usage tracking and enforcement logic
- `app/api/stripe/webhook/route.ts` - Stripe webhook handler with trial end enforcement
- `supabase/middleware.ts` - Access control middleware
- `app/api/subscriptions/checkout/route.ts` - Checkout with duplicate trial prevention
- `supabase/migrations/20251230000000_add_workflow_activated_at.sql` - Workflow activation tracking
- `supabase/migrations/20251230000001_add_trial_tracking.sql` - Trial usage tracking

## Summary

This implementation provides a complete trial and subscription management system:

### ✅ What's Implemented:

1. **14-Day Free Trial**:
   - All new users get automatic 14-day trial with PRO limits
   - One trial per email/user account (enforced via `had_trial` flag)
   - Users can cancel anytime and keep access until day 14

2. **Trial Cancellation Handling**:
   - User cancels during trial → keeps full access until trial ends
   - Trial ends → immediate access revocation
   - User must pay to regain access
   - No data is deleted, just access is blocked

3. **Duplicate Trial Prevention**:
   - `subscriptions.had_trial` boolean tracks trial usage
   - Checkout flow checks `had_trial` before offering trial
   - Same email cannot get multiple trials
   - Automatic tracking via database trigger

4. **Access Control**:
   - Middleware blocks access to app routes for expired trials
   - Public routes (/, /pricing, /blog) remain accessible
   - Redirects to `/pricing?reason=subscription_required`
   - Admins bypass all subscription checks

5. **Plan Limits Enforcement**:
   - Trial users get PRO limits (50 agents, 25 workflows)
   - Starter users (after trial) get 10 agents, 5 workflows
   - Pro users get 50 agents, 25 workflows
   - Limits automatically enforced when trial ends via webhook

6. **Agent Accessibility**:
   - Based on creation order (first N created)
   - Agents not deleted, just marked inaccessible
   - Users can delete newer agents to access older ones

7. **Workflow Activation**:
   - Tracked via `activated_at` timestamp
   - First N activated workflows stay active
   - Others automatically deactivated when trial ends
   - Users can swap active/inactive workflows

### 🔄 User Flow Examples:

**Happy Path (Paid User)**:
1. User signs up → gets 14-day trial with PRO limits
2. Day 7: User creates 20 agents, 10 workflows
3. Day 14: Trial ends, user subscribed to Pro plan
4. User keeps all 20 agents and 10 workflows (within Pro limits)

**Trial Cancellation**:
1. User signs up → gets 14-day trial
2. Day 5: User cancels subscription in Stripe
3. Days 5-14: User continues to have full access
4. Day 14: Access blocked, redirected to pricing page
5. User must select a paid plan to continue

**Starter Plan Downgrade**:
1. User signs up for Starter plan → gets PRO trial
2. Day 10: User has 15 agents and 8 active workflows
3. Day 14: Trial ends, Stripe charges for Starter plan
4. System automatically:
   - Deactivates 3 workflows (keeps first 5 activated)
   - Makes 5 agents inaccessible (keeps first 10 created)
5. User can still access 10 agents and manage 5 active workflows

**Duplicate Trial Attempt**:
1. User completes 14-day trial, decides not to pay
2. User tries to sign up again with same email
3. System recognizes `had_trial = true`
4. Checkout creates subscription with NO trial
5. User must pay immediately to get access

**Key Functions**:
- `getUserPlanType(userId)` - Returns effective plan type (pro during trial)
- `getAccessibleAgentIds(userId)` - Returns accessible agent IDs based on plan
- `getWorkflowsToDeactivate(userId)` - Returns workflows to deactivate
- `enforcePlanLimits(userId)` - Enforces all plan limits, returns affected resources
- `isAgentAccessible(userId, agentId)` - Checks if specific agent is accessible

## Future Enhancements

Potential improvements to consider:

1. **User Notifications**:
   - Email when trial is about to end
   - In-app notification about deactivated workflows
   - Warning when approaching agent/workflow limits

2. **Grace Period**:
   - Optional 3-day grace period after trial ends
   - Soft warnings before hard enforcement

3. **Agent Priority**:
   - Allow users to manually set which agents should be accessible
   - "Pin" important agents to keep them accessible

4. **Workflow Priority**:
   - Allow users to choose which workflows stay active
   - Manual ordering instead of just first-activated

5. **Analytics**:
   - Track which agents/workflows are actually used
   - Suggest which ones to deactivate based on usage
