# AI Usage Monitoring Implementation

## Overview
Implemented a comprehensive AI usage monitoring system with tiered warnings and credit purchase options.

## Changes Made

### 1. Removed Daily Credits from Sidebar ✅
**Files Modified:**
- `components/layout/nav-user.tsx` - Removed RateLimitProgress component and associated state

**What Changed:**
- Removed the old "Daily Credits" progress bar from the sidebar
- Cleaned up unused imports and state management code

### 2. Created New Usage Monitoring System ✅

#### New Hook: `hooks/useAIUsage.ts`
- Monitors user's monthly AI usage in real-time
- Auto-refreshes usage data every 30 seconds (configurable)
- Detects warning thresholds: 75%, 90%, and 100%
- Listens for `ai-usage:updated` events for instant updates

#### New API Route: `app/api/usage/route.ts`
- GET endpoint that returns user's current usage statistics
- Returns data in credits (user-facing) while tracking USD internally
- Includes percentage calculations and remaining budget

#### New Component: `components/AIUsageMonitor.tsx`
- Global usage monitoring component
- Shows appropriate warnings/dialogs at different thresholds
- Displays usage in user-friendly "credits" instead of dollars

#### Credit Conversion: `lib/subscription/credits.ts`
- Converts USD costs to user-facing "credits"
- Conversion rate: $1 USD = 200 credits
- Plan credit allocations:
  - Free: 1,000 credits ($5 budget)
  - Starter: 5,000 credits ($25 budget)
  - Pro: 25,000 credits ($100 budget, rounded up for marketing)

### 3. Warning System Implementation ✅

#### 75% Usage Warning
- **Trigger:** When user reaches 75-89% of monthly credits
- **Action:** Toast notification (non-blocking)
- **Message:** Shows current usage with credit count
- **Frequency:** Once per browser session

#### 90% Usage Warning
- **Trigger:** When user reaches 90-99% of monthly credits
- **Action:** Modal dialog with purchase options
- **Features:**
  - Visual progress bar showing usage
  - Credit count display
  - Two action buttons:
    - "Upgrade Plan" - Links to billing settings with upgrade action
    - "Buy Credits" - Links to billing settings with buy-credits action
  - "Continue Anyway" option
- **Frequency:** Once per browser session

#### 100% Usage Limit
- **Trigger:** When user reaches 100% of monthly credits
- **Action:** Blocking modal dialog
- **Features:**
  - Visual progress bar at 100%
  - Credit count display
  - Explanation of options:
    - Purchase additional credits
    - Upgrade to higher plan
    - Wait for monthly reset
  - Two action buttons:
    - "Upgrade Plan"
    - "Buy Credits"
  - No dismiss option (must take action)
- **Backend:** API returns 429 error when budget exceeded

### 4. Integration ✅

**App Layout:** `app/(app)/layout.tsx`
- Added `AIUsageWrapper` component to monitor usage across all pages
- Wrapper handles client-side user authentication
- Usage monitor is active on all authenticated pages

**Client Wrapper:** `components/layout/AIUsageWrapper.tsx`
- Client component that wraps the usage monitor
- Gets user ID from Supabase auth
- Passes user ID to AIUsageMonitor

### 5. Pricing Page Updates ✅

**File:** `app/pricing/page.tsx`

**Changes:**
- Updated "AI credits per day" → "AI credits per month"
- Starter: 5,000 credits per month (was 5,000/day)
- Pro: 25,000 credits per month (was 25,000/day)
- Updated active workflow limits to match actual implementation (3 for Starter, unlimited for Pro)
- Updated FAQ to reflect monthly credit system
- Added information about 90% warning and credit purchase option
- Changed credit reset timing from "daily at midnight UTC" to "monthly on the 1st"

## How It Works

### Backend Flow:
1. User makes AI request
2. Chat API checks `canMakeAIRequest()` against monthly USD budget
3. If exceeded, returns 429 error with budget details
4. If allowed, processes request and calls `recordAIUsage()` to log actual costs
5. Usage data stored in `user_usage_limits` table

### Frontend Flow:
1. `AIUsageWrapper` loads on all authenticated pages
2. `useAIUsage` hook fetches current usage from `/api/usage`
3. Hook calculates percentage and determines warning levels
4. `AIUsageMonitor` component shows appropriate UI:
   - Nothing at <75%
   - Toast at 75-89%
   - Modal at 90-99%
   - Blocking modal at 100%

### Credit Display:
1. Backend tracks costs in USD (precise)
2. API converts USD to credits for display using `usdToCredits()`
3. Frontend shows credits to users (simpler to understand)
4. Conversion: $1 = 200 credits

## User Experience

### Normal Usage (<75%)
- No interruptions
- Usage data available in dashboard (when implemented)

### Approaching Limit (75%)
- Subtle toast notification
- User can continue working
- Awareness of upcoming limit

### Near Limit (90%)
- Modal dialog appears (once per session)
- Clear call-to-action to purchase credits or upgrade
- Can dismiss and continue for now

### At Limit (100%)
- Cannot make new AI requests
- Blocking modal with clear options
- Must upgrade, purchase credits, or wait for reset

## Next Steps (Not Yet Implemented)

### 1. Credit Purchase Flow
- Create Stripe integration for one-time credit purchases
- Add API route: `/api/billing/purchase-credits`
- Create purchase dialog with credit package options
- Example: $10 for 2,000 credits, $25 for 5,000 credits, etc.

### 2. Usage Dashboard
- Display current usage statistics on dashboard
- Show credit usage over time (chart)
- Breakdown by agent
- Reset date countdown

### 3. Email Notifications
- Send email at 75% usage
- Send email at 90% usage
- Send email when limit reached
- Include purchase link in emails

### 4. Admin Overrides
- Allow admins to grant bonus credits
- View all users approaching limits
- Analytics on credit usage patterns

## Testing Checklist

- [x] Old "Daily Credits" removed from sidebar
- [x] AIUsageMonitor loads on authenticated pages
- [x] `/api/usage` endpoint returns correct data
- [x] 75% warning shows toast notification
- [x] 90% warning shows modal dialog
- [x] 100% limit shows blocking modal
- [x] Credit conversion displays correct values
- [x] Pricing page reflects monthly credit system
- [ ] Test with actual API calls hitting limits
- [ ] Verify budget checks prevent over-limit requests
- [ ] Test credit purchase flow (when implemented)
- [ ] Verify monthly reset works (requires cron job)

## Notes

- Credit conversion uses generous rounding for Pro plan (25k credits for $100 budget)
- Session-based warning prevents notification spam
- Dialogs link to billing settings with action parameters for future implementation
- Backend still tracks precise USD costs for billing accuracy
- Users see simple credit numbers, admins see actual costs
