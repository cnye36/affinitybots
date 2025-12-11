# Tutorial System Documentation

## Overview

The AgentHub tutorial system provides an interactive, step-by-step onboarding experience for new users. It uses a spotlight-based approach to guide users through key features of the application with tooltips, visual highlights, and progress tracking.

## Architecture

### Core Components

1. **TutorialContext** (`/contexts/TutorialContext.tsx`)
   - Provides global tutorial state management
   - Handles tutorial progression, completion tracking, and localStorage persistence
   - Exposes hooks for controlling tutorial flow

2. **Tutorial Components** (`/components/tutorial/`)
   - `Tutorial.tsx` - Main component that orchestrates the tutorial UI
   - `TutorialTooltip.tsx` - Displays tutorial content with navigation controls
   - `TutorialSpotlight.tsx` - Creates spotlight effect to highlight target elements
   - `TutorialLayout.tsx` - Wrapper component for pages with tutorials

3. **Tutorial Definitions** (`/lib/tutorials/`)
   - `dashboardTutorial.ts` - Dashboard page tutorial
   - `agentsTutorial.ts` - Agents list page tutorial
   - `agentDetailTutorial.ts` - Individual agent chat page tutorial
   - `workflowsTutorial.ts` - Workflows page tutorial

4. **Types** (`/types/tutorial.ts`)
   - TypeScript definitions for tutorial configuration and state

## How It Works

### 1. Tutorial State Management

Tutorials are tracked in localStorage under the key `agenthub-tutorials` with the following structure:

```typescript
{
  completed: {
    "dashboard": true,
    "agents-list": false,
    // ...
  },
  progress: {
    "dashboard": 8,  // Last step index
    "agents-list": 0
  },
  lastUpdated: "2025-12-10T12:00:00.000Z"
}
```

### 2. Auto-Start Behavior

Tutorials with `autoStart: true` will automatically begin when:
- The user visits the page for the first time
- The tutorial has not been completed
- The tutorial has not been skipped

A 500ms delay is added before starting to allow the page to fully render.

### 3. Tutorial Flow

1. User lands on a page (e.g., Dashboard)
2. `TutorialLayout` wraps the page with the tutorial provider
3. Tutorial context checks if the tutorial should auto-start
4. `Tutorial` component renders the spotlight and tooltip
5. User navigates through steps using Next/Back buttons
6. Progress is saved to localStorage after each step
7. Completion is tracked when user finishes or skips

### 4. Visual Design

- **Spotlight**: A darkened overlay with a cutout highlighting the target element
- **Tooltip**: A floating card with title, content, progress indicator, and navigation
- **Positioning**: Tooltips automatically adjust position to stay on screen
- **Animations**: Smooth transitions using Tailwind CSS animations

## Adding Tutorials to New Pages

### Step 1: Create Tutorial Definition

Create a new file in `/lib/tutorials/` (e.g., `myPageTutorial.ts`):

```typescript
import { Tutorial } from "@/types/tutorial"

export const myPageTutorial: Tutorial = {
  id: "my-page",
  name: "My Page Tour",
  description: "Learn about My Page features",
  autoStart: true,
  steps: [
    {
      id: "welcome",
      target: "h1",  // CSS selector
      title: "Welcome!",
      content: "This is the first step of the tutorial.",
      position: "bottom",  // "top" | "bottom" | "left" | "right"
      showSpotlight: true,
    },
    {
      id: "feature-1",
      target: "[data-tutorial='feature-1']",
      title: "Feature 1",
      content: "Learn about this important feature.",
      position: "right",
      showSpotlight: true,
    },
    // Add more steps...
  ],
}
```

### Step 2: Export Tutorial

Add your tutorial to `/lib/tutorials/index.ts`:

```typescript
export { myPageTutorial } from "./myPageTutorial"
```

### Step 3: Add Data Attributes to Target Elements

In your page components, add `data-tutorial` attributes to elements you want to highlight:

```tsx
<div data-tutorial="feature-1">
  <FeatureComponent />
</div>
```

**Best Practices for Selectors:**
- Use `data-tutorial` attributes for tutorial-specific targeting
- Avoid using dynamic IDs or classes that may change
- Target stable, semantic elements (e.g., `h1` for page title)
- Ensure elements are rendered before tutorial starts

### Step 4: Wrap Page with TutorialLayout

For **client components**:

```tsx
"use client"

import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { myPageTutorial } from "@/lib/tutorials"

export default function MyPage() {
  return (
    <TutorialLayout tutorials={[myPageTutorial]}>
      <div>
        <h1>My Page</h1>
        {/* Your page content */}
      </div>
    </TutorialLayout>
  )
}
```

For **server components**, create a wrapper:

```tsx
// /components/mypage/MyPageWithTutorial.tsx
"use client"

import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { myPageTutorial } from "@/lib/tutorials"

export function MyPageWithTutorial({ children }: { children: React.ReactNode }) {
  return (
    <TutorialLayout tutorials={[myPageTutorial]}>
      {children}
    </TutorialLayout>
  )
}
```

Then use in your server component:

```tsx
import { MyPageWithTutorial } from "@/components/mypage/MyPageWithTutorial"

export default async function MyPage() {
  // Server-side data fetching...

  return (
    <MyPageWithTutorial>
      <div>
        <h1>My Page</h1>
        {/* Your page content */}
      </div>
    </MyPageWithTutorial>
  )
}
```

### Step 5: Register in Settings (Optional)

Add your tutorial to the list in `/components/settings/TutorialSettings.tsx`:

```typescript
const tutorialsList = [
  // ... existing tutorials
  {
    id: "my-page",
    name: "My Page Tour",
    description: "Learn about My Page features"
  },
]
```

## Advanced Features

### Programmatic Control

Use the `useTutorial()` hook to control tutorials programmatically:

```tsx
import { useTutorial } from "@/contexts/TutorialContext"

function MyComponent() {
  const {
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    isActive,
    currentStepIndex,
  } = useTutorial()

  return (
    <button onClick={() => startTutorial("dashboard")}>
      Start Dashboard Tutorial
    </button>
  )
}
```

### Conditional Steps

Use `beforeShow` and `afterComplete` callbacks for dynamic behavior:

```typescript
{
  id: "conditional-step",
  target: "#my-element",
  title: "Conditional Step",
  content: "This step has logic attached.",
  beforeShow: async () => {
    // Execute before showing this step
    console.log("Preparing step...")
  },
  afterComplete: async () => {
    // Execute after user clicks Next
    console.log("Step completed!")
  },
}
```

### Multiple Tutorials per Page

You can provide multiple tutorials to `TutorialLayout`:

```tsx
<TutorialLayout tutorials={[tutorial1, tutorial2]}>
  {children}
</TutorialLayout>
```

The first tutorial with `autoStart: true` that hasn't been completed will run automatically.

## Tutorial Design Best Practices

### Content Guidelines

1. **Keep it Concise**: Limit step content to 2-3 sentences
2. **Action-Oriented**: Use verbs and focus on what users can do
3. **Progressive Disclosure**: Introduce one concept per step
4. **Friendly Tone**: Write conversationally, like talking to a friend

### UX Best Practices

1. **Limit Steps**: Aim for 5-8 steps per tutorial (max 10)
2. **Critical Path Only**: Focus on essential features users need to get started
3. **Allow Skipping**: Always provide a clear way to skip or close
4. **Respect Users**: Don't force tutorials on returning users
5. **Mobile-Friendly**: Test on mobile devices, tooltips auto-adjust position

### Visual Guidelines

1. **Clear Targets**: Ensure highlighted elements are obvious and unambiguous
2. **Avoid Overlaps**: Don't highlight elements that might be off-screen
3. **Consistent Positioning**: Use similar tooltip positions for similar element types
4. **Progress Indicators**: Always show "Step X of Y" so users know their progress

## File Structure

```
/home/cnye/agenthub/
├── types/
│   └── tutorial.ts                    # TypeScript types
├── contexts/
│   └── TutorialContext.tsx           # State management
├── components/
│   ├── tutorial/
│   │   ├── Tutorial.tsx              # Main component
│   │   ├── TutorialTooltip.tsx       # Tooltip UI
│   │   ├── TutorialSpotlight.tsx     # Spotlight effect
│   │   └── TutorialLayout.tsx        # Page wrapper
│   ├── dashboard/
│   │   └── DashboardWithTutorial.tsx # Dashboard wrapper
│   ├── agents/
│   │   └── AgentDetailWithTutorial.tsx # Agent detail wrapper
│   └── settings/
│       └── TutorialSettings.tsx      # Settings UI
├── lib/
│   └── tutorials/
│       ├── index.ts                  # Exports
│       ├── dashboardTutorial.ts      # Dashboard tutorial
│       ├── agentsTutorial.ts         # Agents list tutorial
│       ├── agentDetailTutorial.ts    # Agent detail tutorial
│       └── workflowsTutorial.ts      # Workflows tutorial
└── app/(app)/
    ├── dashboard/page.tsx            # Integrated
    ├── agents/page.tsx               # Integrated
    ├── agents/[id]/page.tsx          # Integrated
    ├── workflows/page.tsx            # Integrated
    └── settings/page.tsx             # Settings tab added
```

## Styling and Theming

The tutorial system uses Tailwind CSS and respects your application's theme:

- **Dark Mode**: Fully supported via Tailwind's dark mode classes
- **Colors**: Uses CSS variables for primary, background, border, etc.
- **Animations**: Uses Tailwind's built-in animation utilities
- **Responsive**: Mobile-first design with responsive breakpoints

### Custom Styling

To customize tutorial appearance, edit these components:

- **Tooltip styling**: `/components/tutorial/TutorialTooltip.tsx`
- **Spotlight styling**: `/components/tutorial/TutorialSpotlight.tsx`
- **Animation timing**: Modify `duration-*` classes in component files

## Troubleshooting

### Tutorial Not Starting

1. Check browser console for errors
2. Verify `data-tutorial` attributes exist on target elements
3. Clear localStorage and try again: `localStorage.removeItem("agenthub-tutorials")`
4. Ensure `autoStart: true` in tutorial definition

### Element Not Highlighted

1. Verify target selector matches an element: `document.querySelector(target)`
2. Check that element is rendered when tutorial starts
3. Try using a more specific selector or `data-tutorial` attribute

### Tooltip Positioned Incorrectly

1. The tooltip auto-adjusts position to stay on screen
2. Ensure target element has proper dimensions (not `display: none`)
3. Check for conflicting CSS `position` or `z-index` values

### Tutorial Stuck or Won't Progress

1. Check browser console for JavaScript errors
2. Verify `nextStep()` is being called correctly
3. Try resetting the tutorial from Settings > Tutorials

## Testing

### Manual Testing Checklist

- [ ] Tutorial starts automatically on first visit
- [ ] All steps display correctly with proper highlighting
- [ ] Navigation buttons (Next, Back, Skip) work as expected
- [ ] Progress indicator shows correct step numbers
- [ ] Tutorial completes successfully
- [ ] Completed tutorial doesn't auto-start again
- [ ] Tutorial can be reset from Settings
- [ ] Mobile view works correctly
- [ ] Dark mode displays properly
- [ ] Keyboard navigation works (tab, enter, escape)

### Resetting for Testing

```javascript
// In browser console
localStorage.removeItem("agenthub-tutorials")
location.reload()
```

Or use Settings > Tutorials > Reset All

## Performance Considerations

- Tutorials use `MutationObserver` to track DOM changes, which is performant for modern browsers
- Tooltip position calculations happen on scroll/resize with efficient event handlers
- Tutorial state is persisted to localStorage to minimize re-computation
- Components are lazy-loaded and only render when tutorial is active

## Accessibility

The tutorial system follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All controls accessible via keyboard
- **Screen Readers**: ARIA labels on interactive elements
- **Focus Management**: Focus is properly managed during tutorial
- **Color Contrast**: Text meets 4.5:1 contrast ratio
- **Skip Option**: Users can always skip or close tutorials

## Future Enhancements

Potential improvements to consider:

1. **Analytics**: Track tutorial completion rates and drop-off points
2. **A/B Testing**: Test different tutorial flows and content
3. **Video Tutorials**: Embed video walkthroughs in tooltip content
4. **Interactive Elements**: Allow users to interact with highlighted elements
5. **Multi-language**: Support for internationalization
6. **Tour Recording**: Let admins record custom tutorials
7. **Conditional Triggers**: Show tutorials based on user behavior
8. **Tooltips on Hover**: Show hints when hovering over elements

## Support

For questions or issues with the tutorial system:

1. Check this documentation
2. Review the TypeScript types in `/types/tutorial.ts`
3. Examine existing tutorials in `/lib/tutorials/` for examples
4. Test in incognito mode to rule out localStorage issues
